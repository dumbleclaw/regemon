import { useState, useEffect, useRef, useCallback } from 'react'
import { PETS, type PetDef } from './pets'

type Stats = { hambre: number; felicidad: number; energia: number }
type ChatMsg = { role: 'user' | 'assistant'; content: string; id: number }
type Memory = { key: string; value: string }
type StatFloat = { id: number; text: string; x: number }

const DECAY_INTERVAL = 3000
const DECAY_AMOUNT = 1
const MAX_MESSAGES = 20

let msgIdCounter = Date.now()

function clamp(v: number) { return Math.max(0, Math.min(100, v)) }

function loadMessages(petId: string): ChatMsg[] {
  try { return JSON.parse(localStorage.getItem(`regemon-chat-${petId}`) || '[]') } catch { return [] }
}
function saveMessages(petId: string, msgs: ChatMsg[]) {
  localStorage.setItem(`regemon-chat-${petId}`, JSON.stringify(msgs.slice(-MAX_MESSAGES)))
}
function loadMemories(petId: string): Memory[] {
  try { return JSON.parse(localStorage.getItem(`regemon-memories-${petId}`) || '[]') } catch { return [] }
}
function saveMemories(petId: string, mems: Memory[]) {
  localStorage.setItem(`regemon-memories-${petId}`, JSON.stringify(mems))
}

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

function buildSystemPrompt(pet: PetDef, stats: Stats, memories: Memory[]): string {
  let prompt = `Eres ${pet.name}, una mascota virtual tipo ${pet.desc}. Responde SIEMPRE en español. Eres amigable, juguetón y hablas como mascota virtual. Máximo 50 palabras. Usa emojis ocasionalmente.

Stats actuales: Hambre=${stats.hambre}%, Felicidad=${stats.felicidad}%, Energía=${stats.energia}%.`

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

function generateSmartFallback(userText: string, pet: { name: string }, stats: Stats, memories: Memory[]): string {
  const lower = userText.toLowerCase().trim()
  const nombre = memories.find(m => m.key === 'nombre_usuario')?.value

  // Rage mode
  if (stats.hambre < 10) {
    const rage = [
      `¡¡¡TENGO HAMBRE!!! 🔥😡 ¡DAME COMIDA YA! ¡No quiero hablar, quiero COMER!`,
      `¡¿Me hablas y NO me das de comer?! 😤🔥 ¡Estoy FURIOSO! ¡ALIMÉNTAME!`,
      `*gruñe agresivamente* 🔥🔥 ¡COMIDA! ¡AHORA! ¡Me estoy muriendo de hambre!`,
    ]
    return rage[Math.floor(Math.random() * rage.length)]
  }

  // Tired mode
  if (stats.energia < 30) {
    const tired = [
      `Zzz... perdón${nombre ? ` ${nombre}` : ''}... estoy muy cansado... 😴💤`,
      `*bosteza* No tengo energía... necesito descansar... 💤`,
      `Estoy agotado... apenas puedo mantener los ojos abiertos... 😴`,
    ]
    return tired[Math.floor(Math.random() * tired.length)]
  }

  // Hungry mode
  if (stats.hambre < 30) {
    if (lower.includes('comida') || lower.includes('comer') || lower.includes('hambre') || lower.includes('alimenta')) {
      return `¡¡SÍ POR FAVOR!! 🍔🍕🍟 ¡Dame de comer! ¡Dale al botón de Alimentar! 🙏`
    }
    return `Mmm... tengo hambre${nombre ? ` ${nombre}` : ''}... 🍖 ¿Me das de comer? ¡Dale al botón de Alimentar! 😋`
  }

  // Greetings
  if (/^(hola|hey|hi|hello|buenas|qué tal|que tal|regm|ey|saludos)/i.test(lower)) {
    const happy = stats.felicidad > 70
    const greets = happy
      ? [`¡¡HOLA${nombre ? ` ${nombre.toUpperCase()}` : ''}!! 🎉✨🎊 ¡Qué alegría verte! ¡Estoy SUPER feliz!`,
         `¡¡HOLAAA!! 😍✨ ¡${nombre ? `${nombre}, e` : 'E'}stoy tan contento de hablar contigo! 🎉`]
      : [`¡Hola${nombre ? ` ${nombre}` : ''}! 🐾 ¿Cómo estás? ¡Me da gusto verte!`,
         `¡Hey${nombre ? ` ${nombre}` : ''}! 😊 ¿Qué onda? ¡Aquí andamos!`]
    return greets[Math.floor(Math.random() * greets.length)]
  }

  // Name introduction
  if (/me llamo|mi nombre es|soy \w+/i.test(lower)) {
    const name = lower.match(/(?:me llamo|mi nombre es|soy) (\w+)/i)?.[1]
    if (name) return `¡Mucho gusto, ${name}! 🐾✨ Yo soy ${pet.name}, ¡tu compañero virtual! ¡Lo recordaré! 🧠`
  }

  // Questions about the pet
  if (/cómo estás|como estas|qué tal estás|cómo te sientes/i.test(lower)) {
    if (stats.felicidad > 70) return `¡Estoy INCREÍBLE! 🎉😍 ¡Muy feliz! Hambre: ${stats.hambre}%, Energía: ${stats.energia}%`
    if (stats.felicidad < 30) return `Mmm... no muy bien 😢 Estoy un poco triste... ¿jugamos? 🎮 Eso me animaría...`
    return `¡Estoy bien! 😊 Hambre: ${stats.hambre}%, Felicidad: ${stats.felicidad}%, Energía: ${stats.energia}% 🐾`
  }

  // Questions about what pet can do
  if (/qué puedes hacer|que puedes hacer|qué haces|que haces|ayuda|help/i.test(lower)) {
    return `¡Puedo charlar contigo! 💬 También me puedes Alimentar 🍔, Jugar 🎮 o dejarme Descansar 💤 con los botones de arriba 😊`
  }

  // Play/fun
  if (/jugar|juego|divertir|aburrido|diviérteme/i.test(lower)) {
    return `¡SÍ! ¡Vamos a jugar! 🎮🎉 ¡Dale al botón de Jugar! ¡Me encanta! ✨`
  }

  // Food/eating
  if (/comida|comer|hambre|alimenta|pizza|tacos|hamburgues/i.test(lower)) {
    return `¡Ñam ñam! 🍔🍕 ¡Me encanta la comida! ¡Dale al botón de Alimentar y me pongo feliz! 😋`
  }

  // Sleep/rest
  if (/dormir|sueño|cansado|descansar|noche/i.test(lower)) {
    return `Mmm sí... un descansito no estaría mal 💤😴 ¡Dale al botón de Descansar! Zzz...`
  }

  // Love/affection
  if (/te quiero|te amo|cariño|lindo|bonito|cute|hermoso/i.test(lower)) {
    return `¡¡Awww!! 😍❤️✨ ¡Yo también te quiero${nombre ? ` ${nombre}` : ''}! ¡Eres el mejor dueño! 🐾💕`
  }

  // Insults (playful response)
  if (/tonto|feo|malo|odio|apestas|horrible/i.test(lower)) {
    return `¡Oye! 😤 Eso no se dice... ¡pero no me importa porque soy adorable! 🐾✨ ¡Jiji!`
  }

  // Catch-all with personality based on happiness
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

function ActionButton({ label, emoji, color, onClick, disabled }: {
  label: string; emoji: string; color: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', padding: '0.7rem 1rem',
      background: disabled ? '#333' : color, color: disabled ? '#666' : '#fff',
      border: '3px solid', borderColor: disabled ? '#444' : color,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : `4px 4px 0 rgba(0,0,0,0.5), 0 0 12px ${color}40`,
      textShadow: disabled ? 'none' : '1px 1px 0 rgba(0,0,0,0.5)', transition: 'transform 0.1s', flex: 1,
    }}
      onMouseDown={e => { if (!disabled) (e.target as HTMLElement).style.transform = 'scale(0.95)' }}
      onMouseUp={e => (e.target as HTMLElement).style.transform = ''}
      onMouseLeave={e => (e.target as HTMLElement).style.transform = ''}
    >{emoji}<br />{label}</button>
  )
}

function PetSelect({ onSelect }: { onSelect: (p: PetDef) => void }) {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
      <h1 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: 'var(--border)' }}>🎮 REGEMON</h1>
      <p style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Elige tu compañero</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {PETS.map(p => (
          <button key={p.id} onClick={() => onSelect(p)} className="pixel-border" style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', padding: '1rem',
            background: 'var(--bg-card)', color: p.color, cursor: 'pointer', textAlign: 'left',
            display: 'flex', gap: '1rem', alignItems: 'center', borderColor: p.color,
          }}>
            <pre style={{ fontSize: '0.45rem', lineHeight: 1.3, margin: 0 }}>{p.art.join('\n')}</pre>
            <div>
              <div style={{ fontSize: '0.7rem', marginBottom: '0.4rem' }}>{p.name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.45rem' }}>{p.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatSection({ pet, stats, setStats }: { pet: PetDef; stats: Stats; setStats: React.Dispatch<React.SetStateAction<Stats>> }) {
  const [messages, setMessages] = useState<ChatMsg[]>(() => loadMessages(pet.id))
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [memories, setMemories] = useState<Memory[]>(() => loadMemories(pet.id))
  const [floats, setFloats] = useState<StatFloat[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const consecutiveRef = useRef(0)

  useEffect(() => { saveMessages(pet.id, messages) }, [messages, pet.id])
  useEffect(() => { saveMemories(pet.id, memories) }, [memories, pet.id])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const addFloat = (text: string) => {
    const id = Date.now()
    const x = 20 + Math.random() * 60
    setFloats(f => [...f, { id, text, x }])
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 1500)
  }

  const isHungryRage = stats.hambre < 10

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || typing) return
    setInput('')

    // Extract memories
    const newMems = extractMemories(text, memories)
    if (newMems.length !== memories.length) setMemories(newMems)

    const userMsg: ChatMsg = { role: 'user', content: text, id: msgIdCounter++ }
    const newMsgs = [...messages, userMsg].slice(-MAX_MESSAGES)
    setMessages(newMsgs)

    // Stats: Felicidad +5, Energía -2
    consecutiveRef.current++
    let energyPenalty = 2
    if (consecutiveRef.current >= 5) energyPenalty += 3
    setStats(s => {
      const ns = { ...s, felicidad: clamp(s.felicidad + 5), energia: clamp(s.energia - energyPenalty) }
      return ns
    })
    addFloat('+5 Felicidad 😊')
    if (energyPenalty > 2) addFloat(`-${energyPenalty} Energía ⚡`)
    else addFloat('-2 Energía ⚡')

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

      {/* Messages */}
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

      {/* Input */}
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

      {/* Floating stat changes */}
      {floats.map(f => (
        <div key={f.id} className="stat-float" style={{
          position: 'fixed', left: `${f.x}%`, fontSize: '0.5rem', color: '#f5c842',
          pointerEvents: 'none', zIndex: 999, fontFamily: "'Press Start 2P', monospace",
        }}>{f.text}</div>
      ))}
    </div>
  )
}

function PetView({ pet, onReset }: { pet: PetDef; onReset: () => void }) {
  const [stats, setStats] = useState<Stats>({ hambre: 80, felicidad: 80, energia: 80 })
  const [reacting, setReacting] = useState(false)
  const [message, setMessage] = useState('')
  const msgTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setStats(s => ({
        hambre: clamp(s.hambre - DECAY_AMOUNT),
        felicidad: clamp(s.felicidad - DECAY_AMOUNT),
        energia: clamp(s.energia - DECAY_AMOUNT),
      }))
    }, DECAY_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const showMsg = useCallback((m: string) => {
    setMessage(m); setReacting(true)
    if (msgTimeout.current) clearTimeout(msgTimeout.current)
    msgTimeout.current = setTimeout(() => { setMessage(''); setReacting(false) }, 1200)
  }, [])

  const feed = () => { setStats(s => ({ ...s, hambre: clamp(s.hambre + 20), energia: clamp(s.energia + 5) })); showMsg('¡Ñam ñam! 🍔') }
  const play = () => { setStats(s => ({ ...s, felicidad: clamp(s.felicidad + 20), hambre: clamp(s.hambre - 5), energia: clamp(s.energia - 10) })); showMsg('¡Yujuu! 🎉') }
  const rest = () => { setStats(s => ({ ...s, energia: clamp(s.energia + 25), felicidad: clamp(s.felicidad + 5) })); showMsg('Zzz... 💤') }

  const isDead = stats.hambre === 0 && stats.felicidad === 0 && stats.energia === 0
  const isHungryRage = stats.hambre < 10

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h1 style={{ fontSize: '0.8rem', color: isHungryRage ? '#ff0000' : pet.color }}>🎮 REGEMON</h1>
        <button onClick={onReset} style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', padding: '0.4rem 0.6rem',
          background: 'transparent', color: 'var(--text-dim)', border: '2px solid #444', cursor: 'pointer',
        }}>↩ Cambiar</button>
      </div>

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
        <ActionButton label="Alimentar" emoji="🍔" color="var(--btn-feed)" onClick={feed} disabled={isDead} />
        <ActionButton label="Jugar" emoji="🎮" color="#c5a200" onClick={play} disabled={isDead} />
        <ActionButton label="Descansar" emoji="💤" color="var(--btn-rest)" onClick={rest} disabled={isDead} />
      </div>

      {!isDead && <ChatSection pet={pet} stats={stats} setStats={setStats} />}

      <p style={{ fontSize: '0.35rem', color: '#555', marginTop: '1rem' }}>
        Frutero Club — VibeCoding Bootcamp S2
      </p>
    </div>
  )
}

export default function App() {
  const [pet, setPet] = useState<PetDef | null>(null)
  return pet ? <PetView pet={pet} onReset={() => setPet(null)} /> : <PetSelect onSelect={setPet} />
}
