import { useState, useEffect, useRef, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { PET_TYPES, createPet, type PetDef } from './pets'

/* ─── Types ─── */
type Stats = { hambre: number; felicidad: number; energia: number }
type ChatMsg = { role: 'user' | 'assistant'; content: string; id: number }
type Memory = { key: string; value: string }
type StatFloat = { id: number; text: string; x: number; color?: string }
type HistoryEntry = { action: string; coins: number; time: number }

/* ─── Constants ─── */
const DECAY_INTERVAL = 2000
const DECAY_HAMBRE = 1.5
const DECAY_FELICIDAD = 0.8
const DECAY_ENERGIA = 1.0
const MAX_MESSAGES = 20
const FEED_COST = 10
const INITIAL_COINS = 100
const MAX_HISTORY = 10

let msgIdCounter = Date.now()

function clamp(v: number) { return Math.max(0, Math.min(100, v)) }

/* ─── Storage helpers (keyed by userId) ─── */
function storageKey(base: string, userId?: string | null, petId?: string) {
  const prefix = userId ? `regemon-${userId}` : 'regemon-anon'
  return petId ? `${prefix}-${base}-${petId}` : `${prefix}-${base}`
}

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

function loadMessages(petId: string, userId?: string | null): ChatMsg[] {
  return loadJSON(storageKey('chat', userId, petId), [])
}
function saveMessages(petId: string, msgs: ChatMsg[], userId?: string | null) {
  localStorage.setItem(storageKey('chat', userId, petId), JSON.stringify(msgs.slice(-MAX_MESSAGES)))
}
function loadMemories(petId: string, userId?: string | null): Memory[] {
  return loadJSON(storageKey('memories', userId, petId), [])
}
function saveMemories(petId: string, mems: Memory[], userId?: string | null) {
  localStorage.setItem(storageKey('memories', userId, petId), JSON.stringify(mems))
}
function loadCoins(userId?: string | null): number {
  return loadJSON(storageKey('coins', userId), INITIAL_COINS)
}
function saveCoins(coins: number, userId?: string | null) {
  localStorage.setItem(storageKey('coins', userId), JSON.stringify(coins))
}
function loadHistory(userId?: string | null): HistoryEntry[] {
  return loadJSON(storageKey('history', userId), [])
}
function saveHistory(history: HistoryEntry[], userId?: string | null) {
  localStorage.setItem(storageKey('history', userId), JSON.stringify(history.slice(-MAX_HISTORY)))
}
function loadStats(petId: string, userId?: string | null): Stats | null {
  return loadJSON(storageKey('stats', userId, petId), null)
}
function saveStats(petId: string, stats: Stats, userId?: string | null) {
  localStorage.setItem(storageKey('stats', userId, petId), JSON.stringify(stats))
}

/* ─── Memory extraction ─── */
function extractMemories(text: string, existing: Memory[]): Memory[] {
  const newMems: Memory[] = [...existing]
  const patterns = [
    { re: /me llamo (\w+)/i, key: 'nombre_usuario' },
    { re: /mi nombre es (\w+)/i, key: 'nombre_usuario' },
    { re: /soy (\w+)/i, key: 'nombre_usuario' },
    { re: /mi color favorito es (\w+)/i, key: 'color_favorito' },
    { re: /me gusta (?:el |la |los |las )?(.+?)(?:\.|!|$)/i, key: 'le_gusta' },
    { re: /mi comida favorita es (.+?)(?:\.|!|$)/i, key: 'comida_favorita' },
    { re: /tengo (\d+) años/i, key: 'edad' },
  ]
  for (const { re, key } of patterns) {
    const m = text.match(re)
    if (m) {
      const idx = newMems.findIndex(x => x.key === key)
      if (idx >= 0) newMems[idx] = { key, value: m[1].trim() }
      else newMems.push({ key, value: m[1].trim() })
    }
  }
  return newMems
}

/* ─── Coin earning logic with diminishing returns ─── */
function calcCoinEarning(currentCoins: number): number {
  if (currentCoins >= 100) return 0
  // As coins approach 100, chance and amount decrease
  const ratio = currentCoins / 100
  const chance = 1 - ratio * 0.8 // at 0 coins: 100% chance, at 100: 20% chance
  if (Math.random() > chance) return 0
  const maxEarn = Math.max(1, Math.floor(5 * (1 - ratio)))
  return Math.floor(Math.random() * maxEarn) + 1 // 1..maxEarn
}

/* ─── System prompt ─── */
function buildSystemPrompt(pet: PetDef, stats: Stats, memories: Memory[]): string {
  let prompt = `Eres ${pet.name}, una mascota virtual tipo ${pet.desc}. Responde SIEMPRE en español. Eres amigable, juguetón y hablas como mascota virtual. Máximo 50 palabras. Usa emojis ocasionalmente.\n\nStats actuales: Hambre=${stats.hambre}%, Felicidad=${stats.felicidad}%, Energía=${stats.energia}%.`
  if (stats.energia < 30) prompt += '\nEstás MUY cansado. Menciona que tienes sueño, responde más corto.'
  if (stats.felicidad > 70) prompt += '\nEstás MUY feliz y entusiasmado. Usa más emojis y exclamaciones!'
  if (stats.hambre < 10) prompt += '\nTienes MUCHÍSIMA hambre. Estás FURIOSO. Maldice (censurado con *), pide comida AGRESIVAMENTE, estás ROJO DE IRA. 🔥🔥🔥'
  else if (stats.hambre < 30) prompt += '\nTienes hambre. Menciona que quieres comida, pide que te alimenten.'
  if (memories.length > 0) {
    prompt += '\n\nRecuerdos sobre tu dueño:'
    for (const m of memories) prompt += `\n- ${m.key}: ${m.value}`
    prompt += '\nUsa estos recuerdos naturalmente en la conversación cuando sea relevante.'
  }
  return prompt
}

/* ─── Smart fallback ─── */
function generateSmartFallback(userText: string, pet: { name: string }, stats: Stats, memories: Memory[]): string {
  const lower = userText.toLowerCase().trim()
  const nombre = memories.find(m => m.key === 'nombre_usuario')?.value

  if (stats.hambre < 10) {
    const rage = [
      `¡¡¡TENGO HAMBRE!!! 🔥😡 ¡DAME COMIDA YA! ¡No quiero hablar, quiero COMER!`,
      `¡¿Me hablas y NO me das de comer?! 😤🔥 ¡Estoy FURIOSO! ¡ALIMÉNTAME!`,
      `*gruñe agresivamente* 🔥🔥 ¡COMIDA! ¡AHORA! ¡Me estoy muriendo de hambre!`,
    ]
    return rage[Math.floor(Math.random() * rage.length)]
  }
  if (stats.energia < 30) {
    const tired = [
      `Zzz... perdón${nombre ? ` ${nombre}` : ''}... estoy muy cansado... 😴💤`,
      `*bosteza* No tengo energía... necesito descansar... 💤`,
      `Estoy agotado... apenas puedo mantener los ojos abiertos... 😴`,
    ]
    return tired[Math.floor(Math.random() * tired.length)]
  }
  if (stats.hambre < 30) {
    if (lower.includes('comida') || lower.includes('comer') || lower.includes('hambre') || lower.includes('alimenta')) {
      return `¡¡SÍ POR FAVOR!! 🍔🍕🍟 ¡Dame de comer! ¡Dale al botón de Alimentar! 🙏`
    }
    return `Mmm... tengo hambre${nombre ? ` ${nombre}` : ''}... 🍖 ¿Me das de comer? ¡Dale al botón de Alimentar! 😋`
  }
  if (/^(hola|hey|hi|hello|buenas|qué tal|que tal|regm|ey|saludos)/i.test(lower)) {
    const happy = stats.felicidad > 70
    const greets = happy
      ? [`¡¡HOLA${nombre ? ` ${nombre.toUpperCase()}` : ''}!! 🎉✨🎊 ¡Qué alegría verte! ¡Estoy SUPER feliz!`,
         `¡¡HOLAAA!! 😍✨ ¡${nombre ? `${nombre}, e` : 'E'}stoy tan contento de hablar contigo! 🎉`]
      : [`¡Hola${nombre ? ` ${nombre}` : ''}! 🐾 ¿Cómo estás? ¡Me da gusto verte!`,
         `¡Hey${nombre ? ` ${nombre}` : ''}! 😊 ¿Qué onda? ¡Aquí andamos!`]
    return greets[Math.floor(Math.random() * greets.length)]
  }
  if (/me llamo|mi nombre es|soy \w+/i.test(lower)) {
    const name = lower.match(/(?:me llamo|mi nombre es|soy) (\w+)/i)?.[1]
    if (name) return `¡Mucho gusto, ${name}! 🐾✨ Yo soy ${pet.name}, ¡tu compañero virtual! ¡Lo recordaré! 🧠`
  }
  if (/cómo estás|como estas|qué tal estás|cómo te sientes/i.test(lower)) {
    if (stats.felicidad > 70) return `¡Estoy INCREÍBLE! 🎉😍 ¡Muy feliz! Hambre: ${stats.hambre}%, Energía: ${stats.energia}%`
    if (stats.felicidad < 30) return `Mmm... no muy bien 😢 Estoy un poco triste... ¿jugamos? 🎮 Eso me animaría...`
    return `¡Estoy bien! 😊 Hambre: ${stats.hambre}%, Felicidad: ${stats.felicidad}%, Energía: ${stats.energia}% 🐾`
  }
  if (/qué puedes hacer|que puedes hacer|qué haces|que haces|ayuda|help/i.test(lower)) {
    return `¡Puedo charlar contigo! 💬 También me puedes Alimentar 🍔, Jugar 🎮 o dejarme Descansar 💤 con los botones de arriba 😊`
  }
  if (/jugar|juego|divertir|aburrido|diviérteme/i.test(lower)) return `¡SÍ! ¡Vamos a jugar! 🎮🎉 ¡Dale al botón de Jugar! ¡Me encanta! ✨`
  if (/comida|comer|hambre|alimenta|pizza|tacos|hamburgues/i.test(lower)) return `¡Ñam ñam! 🍔🍕 ¡Me encanta la comida! ¡Dale al botón de Alimentar y me pongo feliz! 😋`
  if (/dormir|sueño|cansado|descansar|noche/i.test(lower)) return `Mmm sí... un descansito no estaría mal 💤😴 ¡Dale al botón de Descansar! Zzz...`
  if (/te quiero|te amo|cariño|lindo|bonito|cute|hermoso/i.test(lower)) return `¡¡Awww!! 😍❤️✨ ¡Yo también te quiero${nombre ? ` ${nombre}` : ''}! ¡Eres el mejor dueño! 🐾💕`
  if (/tonto|feo|malo|odio|apestas|horrible/i.test(lower)) return `¡Oye! 😤 Eso no se dice... ¡pero no me importa porque soy adorable! 🐾✨ ¡Jiji!`

  const happy = stats.felicidad > 70
  const general = happy
    ? [`¡Jiji! 😄✨ ¡Me encanta hablar contigo${nombre ? ` ${nombre}` : ''}! ¡Cuéntame más! 🎉`,
       `¡Ohhh interesante! 🤩 ¡Estoy muy feliz ahora! ¿Qué más quieres hacer? ✨`,
       `¡Síii! 🎊 ¡${pet.name} está contento! ¡Sigamos charlando! 💬🐾`]
    : [`¡Mmm, interesante${nombre ? ` ${nombre}` : ''}! 🐾 Cuéntame más sobre eso 😊`,
       `¡Ah sí! 😄 ${pet.name} te escucha. ¿Qué más? 💬`,
       `¡Jeje! 🐾 Me gusta charlar contigo. ¿Qué quieres hacer? 😊`]
  return general[Math.floor(Math.random() * general.length)]
}

async function callOpenAI(messages: { role: string; content: string }[], pet: { name: string }, stats: Stats, memories: Memory[]): Promise<string> {
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key || key === 'sk-placeholder') {
    const userMsg = messages.filter(m => m.role === 'user').pop()?.content || ''
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800))
    return generateSmartFallback(userMsg, pet, stats, memories)
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 150 }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || '¡No pude pensar en nada! 🤯'
}

/* ─── Components ─── */

function StatBar({ label, value, color, emoji }: { label: string; value: number; color: string; emoji: string }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.55rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{emoji} {label}</span><span>{value}%</span>
      </div>
      <div style={{ background: '#0a0a1a', border: '3px solid #333', height: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width 0.3s', boxShadow: `0 0 8px ${color}80` }} />
      </div>
    </div>
  )
}

function ActionButton({ label, emoji, color, onClick, disabled, title }: {
  label: string; emoji: string; color: string; onClick: () => void; disabled?: boolean; title?: string
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} className="action-btn" style={{
      fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', padding: '0.7rem 1rem',
      background: disabled ? '#333' : color, color: disabled ? '#666' : '#fff',
      border: '3px solid', borderColor: disabled ? '#444' : color,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : `4px 4px 0 rgba(0,0,0,0.5), 0 0 12px ${color}40`,
      textShadow: disabled ? 'none' : '1px 1px 0 rgba(0,0,0,0.5)', transition: 'all 0.15s', flex: 1,
    }}
      onMouseDown={e => { if (!disabled) (e.target as HTMLElement).style.transform = 'scale(0.95)' }}
      onMouseUp={e => (e.target as HTMLElement).style.transform = ''}
      onMouseLeave={e => (e.target as HTMLElement).style.transform = ''}
    >{emoji}<br />{label}</button>
  )
}

function Header({ coins, userId: _userId }: { coins: number; userId: string | null }) {
  const { login, logout, authenticated, user } = usePrivy()

  const displayName = user?.google?.name || user?.email?.address || user?.google?.email || null

  return (
    <div className="header-bar">
      <div className="header-coins">
        {authenticated ? `🍊 ${coins} $FRUTA` : '🍊 — $FRUTA'}
      </div>
      <div className="header-right">
        {authenticated && displayName && (
          <span className="header-user">{displayName}</span>
        )}
        {authenticated ? (
          <button onClick={logout} className="header-btn">Cerrar Sesión</button>
        ) : (
          <button onClick={login} className="header-btn header-btn-login">Iniciar Sesión</button>
        )}
      </div>
    </div>
  )
}

function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  const [open, setOpen] = useState(false)
  if (history.length === 0) return null

  return (
    <div className="pixel-border" style={{ background: 'var(--bg-card)', padding: '0.75rem', marginTop: '1rem', borderColor: '#555' }}>
      <button onClick={() => setOpen(!open)} style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem', background: 'none',
        color: 'var(--text-dim)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
      }}>
        {open ? '▼' : '▶'} Historial ({history.length})
      </button>
      {open && (
        <div style={{ marginTop: '0.5rem' }}>
          {[...history].reverse().map((h, i) => (
            <div key={i} style={{ fontSize: '0.35rem', color: 'var(--text-dim)', padding: '0.3rem 0', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <span>{h.action}</span>
              <span style={{ color: h.coins >= 0 ? '#53d769' : '#e94560' }}>
                {h.coins >= 0 ? '+' : ''}{h.coins} 🍊
              </span>
              <span>{new Date(h.time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Feedback({ text, type }: { text: string; type: 'processing' | 'success' | 'error' }) {
  if (!text) return null
  const color = type === 'error' ? '#e94560' : type === 'success' ? '#53d769' : '#f5c842'
  return (
    <div className="feedback-bar" style={{ color, borderColor: color }}>
      {type === 'processing' && '⏳ '}{text}
    </div>
  )
}

function PetSelect({ onSelect }: { onSelect: (p: PetDef) => void }) {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const nameValid = name.trim().length >= 2 && name.trim().length <= 15
  const canCreate = nameValid && selectedType !== null

  const handleCreate = () => {
    if (!canCreate || !selectedType) return
    const pet = createPet(name.trim(), selectedType)
    onSelect(pet)
  }

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
      <h1 style={{ fontSize: '1rem', marginBottom: '0.3rem', color: 'var(--border)' }}>🎮 REGEMON</h1>
      <h2 style={{ fontSize: '0.65rem', color: 'var(--text)', marginBottom: '1.5rem' }}>Crea tu Regenmon</h2>

      {/* Name input */}
      <div className="pixel-border" style={{
        background: 'var(--bg-card)', padding: '1rem', marginBottom: '1rem', borderColor: '#555',
        textAlign: 'left',
      }}>
        <label style={{ fontSize: '0.5rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
          ✏️ Nombre de tu Regenmon
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={15}
          placeholder="Escribe un nombre..."
          style={{
            width: '100%', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem',
            padding: '0.6rem', background: '#0a0a1a', color: 'var(--text)',
            border: `3px solid ${name.length > 0 ? (nameValid ? '#53d769' : '#e94560') : '#444'}`,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: '0.35rem', color: nameValid ? '#53d769' : 'var(--text-dim)', marginTop: '0.3rem' }}>
          {name.trim().length}/15 caracteres {name.trim().length > 0 && !nameValid && '(mínimo 2)'}
        </div>
      </div>

      {/* Type selection */}
      <div className="pixel-border" style={{
        background: 'var(--bg-card)', padding: '1rem', marginBottom: '1rem', borderColor: '#555',
        textAlign: 'left',
      }}>
        <label style={{ fontSize: '0.5rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.75rem' }}>
          🧬 Elige el tipo
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {PET_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className="pixel-border pet-select-btn"
              style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', padding: '0.8rem',
                background: selectedType === t.id ? `${t.color}20` : 'var(--bg)',
                color: t.color, cursor: 'pointer', textAlign: 'left',
                display: 'flex', gap: '1rem', alignItems: 'center',
                borderColor: selectedType === t.id ? t.color : '#333',
                borderWidth: selectedType === t.id ? '4px' : '3px',
                boxShadow: selectedType === t.id ? `0 0 15px ${t.color}40` : 'none',
                transition: 'all 0.2s',
              }}
            >
              <pre style={{ fontSize: '0.4rem', lineHeight: 1.3, margin: 0 }}>{t.art.join('\n')}</pre>
              <div>
                <div style={{ fontSize: '0.65rem', marginBottom: '0.3rem' }}>{t.emoji} {t.label}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.4rem' }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!canCreate}
        className="action-btn"
        style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', padding: '1rem 2rem',
          background: canCreate ? 'var(--border)' : '#333',
          color: canCreate ? '#fff' : '#666',
          border: `4px solid ${canCreate ? 'var(--border)' : '#444'}`,
          cursor: canCreate ? 'pointer' : 'not-allowed',
          boxShadow: canCreate ? '4px 4px 0 rgba(0,0,0,0.5), 0 0 20px var(--border)' : 'none',
          width: '100%',
          transition: 'all 0.2s',
        }}
      >
        🥚 ¡Eclosionar!
      </button>
      {!canCreate && (
        <p style={{ fontSize: '0.35rem', color: '#888', marginTop: '0.5rem' }}>
          {!nameValid && name.length > 0 ? 'El nombre debe tener entre 2 y 15 letras' :
           !nameValid ? 'Escribe un nombre para tu Regenmon' :
           'Selecciona un tipo para continuar'}
        </p>
      )}
    </div>
  )
}

function ChatSection({ pet, stats, setStats, coins, setCoins, userId, addHistoryEntry }: {
  pet: PetDef; stats: Stats; setStats: React.Dispatch<React.SetStateAction<Stats>>;
  coins: number; setCoins: React.Dispatch<React.SetStateAction<number>>;
  userId: string | null; addHistoryEntry: (action: string, coinsDelta: number) => void
}) {
  const [messages, setMessages] = useState<ChatMsg[]>(() => loadMessages(pet.id, userId))
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [memories, setMemories] = useState<Memory[]>(() => loadMemories(pet.id, userId))
  const [floats, setFloats] = useState<StatFloat[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const consecutiveRef = useRef(0)

  useEffect(() => { saveMessages(pet.id, messages, userId) }, [messages, pet.id, userId])
  useEffect(() => { saveMemories(pet.id, memories, userId) }, [memories, pet.id, userId])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const addFloat = (text: string, color?: string) => {
    const id = Date.now() + Math.random()
    const x = 20 + Math.random() * 60
    setFloats(f => [...f, { id, text, x, color }])
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 1500)
  }

  const isHungryRage = stats.hambre < 10

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || typing) return
    setInput('')

    const newMems = extractMemories(text, memories)
    if (newMems.length !== memories.length) setMemories(newMems)

    const userMsg: ChatMsg = { role: 'user', content: text, id: msgIdCounter++ }
    const newMsgs = [...messages, userMsg].slice(-MAX_MESSAGES)
    setMessages(newMsgs)

    consecutiveRef.current++
    let energyPenalty = 2
    if (consecutiveRef.current >= 5) energyPenalty += 3
    setStats(s => ({
      ...s,
      felicidad: clamp(s.felicidad + 5),
      energia: clamp(s.energia - energyPenalty),
    }))
    addFloat('+5 Felicidad 😊')
    addFloat(`-${energyPenalty} Energía ⚡`)

    // Earn coins
    const earned = calcCoinEarning(coins)
    if (earned > 0) {
      setCoins(c => { const nc = Math.min(c + earned, 150); saveCoins(nc, userId); return nc })
      addFloat(`+${earned} 🍊`, '#53d769')
      addHistoryEntry(`Chat: "${text.slice(0, 20)}..."`, earned)
    }

    setTyping(true)
    try {
      const apiMsgs = [
        { role: 'system', content: buildSystemPrompt(pet, stats, newMems.length > memories.length ? newMems : memories) },
        ...newMsgs.slice(-10).map(m => ({ role: m.role, content: m.content })),
      ]
      const reply = await callOpenAI(apiMsgs, pet, stats, memories)
      const botMsg: ChatMsg = { role: 'assistant', content: reply, id: msgIdCounter++ }
      setMessages(prev => [...prev, botMsg].slice(-MAX_MESSAGES))
    } catch {
      const errMsg: ChatMsg = { role: 'assistant', content: '¡Ay! No pude responder... 😵', id: msgIdCounter++ }
      setMessages(prev => [...prev, errMsg].slice(-MAX_MESSAGES))
    }
    setTyping(false)
  }

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  return (
    <div className="pixel-border" style={{
      background: 'var(--bg-card)', padding: '0.75rem', marginTop: '1rem',
      borderColor: isHungryRage ? '#ff0000' : '#9b59b6',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.5rem', color: '#9b59b6' }}>💬 Chat con {pet.name}</div>
        {memories.length > 0 && (
          <div style={{ fontSize: '0.4rem', color: '#f39c12' }}>🧠 {memories.length} memorias</div>
        )}
      </div>

      <div style={{
        height: '200px', overflowY: 'auto', marginBottom: '0.5rem', padding: '0.25rem',
        background: '#0a0a1a', border: '2px solid #333',
      }}>
        {messages.length === 0 && (
          <div style={{ fontSize: '0.4rem', color: '#555', textAlign: 'center', marginTop: '4rem' }}>
            ¡Escribe algo para hablar con {pet.name}!
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className="chat-bubble-enter" style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '0.4rem',
          }}>
            <div style={{
              maxWidth: '80%', padding: '0.4rem 0.6rem', fontSize: '0.4rem', lineHeight: 1.6,
              background: m.role === 'user' ? '#e91e63' : '#7b1fa2',
              color: '#fff', borderRadius: '2px',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.4)',
              border: `2px solid ${m.role === 'user' ? '#c2185b' : '#6a1b9a'}`,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.4rem' }}>
            <div className="typing-indicator" style={{
              padding: '0.4rem 0.6rem', fontSize: '0.4rem', background: '#7b1fa2',
              color: '#fff', borderRadius: '2px', border: '2px solid #6a1b9a',
            }}>
              Escribiendo<span className="typing-dots">...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1, fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem',
            padding: '0.5rem', background: '#0a0a1a', color: 'var(--text)',
            border: '3px solid #444', outline: 'none',
          }}
        />
        <button onClick={sendMessage} disabled={typing || !input.trim()} style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', padding: '0.5rem 0.8rem',
          background: typing || !input.trim() ? '#333' : '#9b59b6', color: '#fff',
          border: '3px solid', borderColor: typing || !input.trim() ? '#444' : '#8e44ad',
          cursor: typing || !input.trim() ? 'not-allowed' : 'pointer',
        }}>Enviar</button>
      </div>

      {floats.map(f => (
        <div key={f.id} className="stat-float" style={{
          position: 'fixed', left: `${f.x}%`, fontSize: '0.5rem',
          color: f.color || '#f5c842',
          pointerEvents: 'none', zIndex: 999, fontFamily: "'Press Start 2P', monospace",
        }}>{f.text}</div>
      ))}
    </div>
  )
}

function PetView({ pet, onReset, coins, setCoins, userId }: {
  pet: PetDef; onReset: () => void; coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>; userId: string | null
}) {
  const [stats, setStats] = useState<Stats>(() => loadStats(pet.id, userId) || { hambre: 75, felicidad: 90, energia: 60 })
  const [reacting, setReacting] = useState(false)
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState<{ text: string; type: 'processing' | 'success' | 'error' }>({ text: '', type: 'processing' })
  const [processing, setProcessing] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory(userId))
  const msgTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const decayAccum = useRef({ hambre: 0, felicidad: 0, energia: 0 })

  // Persist stats
  useEffect(() => { saveStats(pet.id, stats, userId) }, [stats, pet.id, userId])
  useEffect(() => { saveHistory(history, userId) }, [history, userId])

  useEffect(() => {
    const id = setInterval(() => {
      decayAccum.current.hambre += DECAY_HAMBRE
      decayAccum.current.felicidad += DECAY_FELICIDAD
      decayAccum.current.energia += DECAY_ENERGIA
      const dh = Math.floor(decayAccum.current.hambre)
      const df = Math.floor(decayAccum.current.felicidad)
      const de = Math.floor(decayAccum.current.energia)
      if (dh > 0 || df > 0 || de > 0) {
        decayAccum.current.hambre -= dh
        decayAccum.current.felicidad -= df
        decayAccum.current.energia -= de
        setStats(s => ({
          hambre: clamp(s.hambre - dh),
          felicidad: clamp(s.felicidad - df),
          energia: clamp(s.energia - de),
        }))
      }
    }, DECAY_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const showMsg = useCallback((m: string) => {
    setMessage(m); setReacting(true)
    if (msgTimeout.current) clearTimeout(msgTimeout.current)
    msgTimeout.current = setTimeout(() => { setMessage(''); setReacting(false) }, 1200)
  }, [])

  const showFeedback = (text: string, type: 'processing' | 'success' | 'error') => {
    setFeedback({ text, type })
    if (type !== 'processing') setTimeout(() => setFeedback({ text: '', type: 'processing' }), 2000)
  }

  const addHistoryEntry = (action: string, coinsDelta: number) => {
    setHistory(h => [...h, { action, coins: coinsDelta, time: Date.now() }].slice(-MAX_HISTORY))
  }

  const feed = async () => {
    if (processing) return
    if (stats.hambre >= 95) { showFeedback('¡Tu mascota no tiene hambre!', 'error'); return }
    if (coins < FEED_COST) { showFeedback('Necesitas 10 🍊 — ¡chatea para ganar!', 'error'); return }

    setProcessing(true)
    showFeedback('Procesando...', 'processing')
    await new Promise(r => setTimeout(r, 400))

    setCoins(c => { const nc = c - FEED_COST; saveCoins(nc, userId); return nc })
    setStats(s => ({ ...s, hambre: clamp(s.hambre + 20), energia: clamp(s.energia + 5) }))
    showMsg('¡Ñam ñam! 🍔')
    showFeedback('¡Listo!', 'success')
    addHistoryEntry('Alimentar', -FEED_COST)
    setProcessing(false)
  }

  const play = async () => {
    if (processing) return
    setProcessing(true)
    showFeedback('Procesando...', 'processing')
    await new Promise(r => setTimeout(r, 400))

    setStats(s => ({ ...s, felicidad: clamp(s.felicidad + 20), hambre: clamp(s.hambre - 5), energia: clamp(s.energia - 10) }))
    showMsg('¡Yujuu! 🎉')
    showFeedback('¡Listo!', 'success')
    addHistoryEntry('Jugar', 0)
    setProcessing(false)
  }

  const rest = async () => {
    if (processing) return
    setProcessing(true)
    showFeedback('Procesando...', 'processing')
    await new Promise(r => setTimeout(r, 400))

    setStats(s => ({ ...s, energia: clamp(s.energia + 25), felicidad: clamp(s.felicidad + 5) }))
    showMsg('Zzz... 💤')
    showFeedback('¡Listo!', 'success')
    addHistoryEntry('Descansar', 0)
    setProcessing(false)
  }

  const isDead = stats.hambre === 0 && stats.felicidad === 0 && stats.energia === 0
  const isHungryRage = stats.hambre < 10
  const canFeed = coins >= FEED_COST && stats.hambre < 95

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h1 style={{ fontSize: '0.8rem', color: isHungryRage ? '#ff0000' : pet.color }}>🎮 REGEMON</h1>
        <button onClick={onReset} className="action-btn" style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', padding: '0.4rem 0.6rem',
          background: 'transparent', color: 'var(--text-dim)', border: '2px solid #444', cursor: 'pointer',
        }}>↩ Cambiar</button>
      </div>

      <Feedback text={feedback.text} type={feedback.type} />

      <div className="pixel-border" style={{
        background: isHungryRage ? '#1a0000' : 'var(--bg-card)',
        padding: '1.5rem 1rem', marginBottom: '1rem',
        borderColor: isHungryRage ? '#ff0000' : pet.color,
        minHeight: '180px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <div style={{ fontSize: '0.6rem', marginBottom: '0.5rem', color: isHungryRage ? '#ff0000' : pet.color }}>
          {isHungryRage ? `🔥 ${pet.name} 🔥` : pet.name}
        </div>
        {isDead ? (
          <div style={{ fontSize: '0.55rem', color: '#888' }}>
            <p>💀 {pet.name} se desmayó...</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.4rem' }}>¡Reinicia para intentarlo de nuevo!</p>
          </div>
        ) : (
          <pre className={reacting ? 'animate-happy' : 'animate-idle'} style={{
            fontSize: '0.55rem', lineHeight: 1.4, margin: 0,
            color: isHungryRage ? '#ff0000' : pet.color,
            filter: stats.energia < 20 ? 'brightness(0.5)' : 'none',
          }}>{pet.art.join('\n')}</pre>
        )}
        {isHungryRage && !isDead && (
          <div style={{ fontSize: '0.5rem', color: '#ff4444', marginTop: '0.3rem' }}>
            🔥🔥🔥 ¡TENGO HAMBRE! 🔥🔥🔥
          </div>
        )}
        {message && (
          <div style={{
            position: 'absolute', bottom: '8px', fontSize: '0.5rem', color: '#fff',
            background: 'rgba(0,0,0,0.7)', padding: '0.3rem 0.6rem', borderRadius: '2px',
          }}>{message}</div>
        )}
      </div>

      <div className="pixel-border" style={{ background: 'var(--bg-card)', padding: '1rem', marginBottom: '1rem', borderColor: '#333' }}>
        <StatBar label="Hambre" value={stats.hambre} color={isHungryRage ? '#ff0000' : 'var(--hunger)'} emoji="🍖" />
        <StatBar label="Felicidad" value={stats.felicidad} color="var(--happy)" emoji="😊" />
        <StatBar label="Energía" value={stats.energia} color="var(--energy)" emoji="⚡" />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ActionButton
          label={`Alimentar (${FEED_COST} 🍊)`}
          emoji="🍔" color="var(--btn-feed)" onClick={feed}
          disabled={isDead || processing || !canFeed}
          title={coins < FEED_COST ? 'Necesitas 10 🍊 — ¡chatea para ganar!' : undefined}
        />
        <ActionButton label="Jugar" emoji="🎮" color="#c5a200" onClick={play} disabled={isDead || processing} />
        <ActionButton label="Descansar" emoji="💤" color="var(--btn-rest)" onClick={rest} disabled={isDead || processing} />
      </div>

      {!isDead && (
        <ChatSection
          pet={pet} stats={stats} setStats={setStats}
          coins={coins} setCoins={setCoins} userId={userId}
          addHistoryEntry={addHistoryEntry}
        />
      )}

      <HistoryPanel history={history} />

      <p style={{ fontSize: '0.35rem', color: '#555', marginTop: '1rem' }}>
        Frutero Club — VibeCoding Bootcamp S3
      </p>
    </div>
  )
}

export default function App() {
  const { authenticated, user } = usePrivy()
  const userId = authenticated ? (user?.email?.address || user?.google?.email || user?.id || null) : null
  const [pet, setPet] = useState<PetDef | null>(null)
  const [coins, setCoins] = useState(() => loadCoins(userId))

  // Reload coins when user changes
  useEffect(() => {
    setCoins(loadCoins(userId))
  }, [userId])

  return (
    <>
      <Header coins={coins} userId={userId} />
      {pet ? (
        <PetView pet={pet} onReset={() => setPet(null)} coins={coins} setCoins={setCoins} userId={userId} />
      ) : (
        <PetSelect onSelect={setPet} />
      )}
    </>
  )
}
