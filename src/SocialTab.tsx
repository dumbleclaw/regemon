import { useState, useEffect, useCallback } from 'react'
import { useHub, type LeaderboardEntry, type HubRegenmon, type ActivityEntry } from './useHub'
import { useHubSync } from './useHubSync'
import { PET_TYPES, type PetDef } from './pets'

type SocialView = 'main' | 'register' | 'leaderboard' | 'profile' | 'messages' | 'activity'

function getSpriteUrl(emoji: string) {
  const codePoints = [...emoji].map(c => c.codePointAt(0)!.toString(16)).join('-')
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codePoints}.png`
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function storageKey(base: string, userId?: string | null) {
  const prefix = userId ? `regemon-${userId}` : 'regemon-anon'
  return `${prefix}-${base}`
}

function StatBarMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.35rem', color: '#aaa', marginBottom: '0.2rem' }}>
        <span>{label}</span><span style={{ color }}>{value}%</span>
      </div>
      <div style={{ height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
    </div>
  )
}

export default function SocialTab({ pet, stats, coins, setCoins, userId }: {
  pet: PetDef
  stats: { hambre: number; felicidad: number; energia: number }
  coins: number
  setCoins: React.Dispatch<React.SetStateAction<number>>
  userId: string | null
}) {
  const hub = useHub()
  const [view, setView] = useState<SocialView>('main')
  const [hubId, setHubId] = useState<string | null>(() => {
    try { return localStorage.getItem(storageKey('hubRegenmonId', userId)) } catch { return null }
  })
  const [isRegistered, setIsRegistered] = useState(() => {
    try { return localStorage.getItem(storageKey('isRegisteredInHub', userId)) === 'true' } catch { return false }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbPage, setLbPage] = useState(1)
  const [_lbTotal, setLbTotal] = useState(0)

  // Profile state
  const [profile, setProfile] = useState<HubRegenmon | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)

  // Activity state
  const [activities, setActivities] = useState<ActivityEntry[]>([])

  // Messages state
  const [messages, setMessages] = useState<{ id: string; fromId: string; fromName: string; message: string; timestamp: string }[]>([])
  const [msgText, setMsgText] = useState('')

  // Gift state
  const [giftAmount, setGiftAmount] = useState<number | null>(null)

  // Training data for points
  const trainingData = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey('training', userId)) || '{}') } catch { return {} }
  })()
  const totalPoints = trainingData.totalPoints || 0

  // Auto-sync
  useHubSync(hubId, stats, totalPoints, coins)

  const petEmoji = PET_TYPES.find(t => t.id === pet.typeId)?.emoji || '🐾'

  const clearError = () => setError('')

  // Register
  const handleRegister = async () => {
    setLoading(true)
    clearError()
    try {
      const result = await hub.register({
        name: pet.name,
        owner: userId || 'anon',
        email: email.trim() || undefined,
        emoji: petEmoji,
        typeId: pet.typeId,
        stats,
        points: totalPoints,
        balance: coins,
      })
      localStorage.setItem(storageKey('hubRegenmonId', userId), result.id)
      localStorage.setItem(storageKey('isRegisteredInHub', userId), 'true')
      setHubId(result.id)
      setIsRegistered(true)
      setView('main')
    } catch (e: any) {
      if (e.message?.includes('already') || e.message?.includes('Already')) {
        setError('¡Ya estás registrado! Recargando datos...')
        // Try to find existing registration
        localStorage.setItem(storageKey('isRegisteredInHub', userId), 'true')
        setIsRegistered(true)
      } else {
        setError(e.message || '¡Ups! No se pudo registrar. Intenta de nuevo.')
      }
    }
    setLoading(false)
  }

  // Leaderboard
  const loadLeaderboard = useCallback(async (page = 1) => {
    setLoading(true)
    clearError()
    try {
      const data = await hub.getLeaderboard(page)
      setLeaderboard(data.entries || [])
      setLbTotal(data.total || 0)
      setLbPage(page)
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar el leaderboard')
    }
    setLoading(false)
  }, [])

  // Profile
  const loadProfile = useCallback(async (id: string) => {
    setLoading(true)
    clearError()
    setViewingId(id)
    try {
      const data = await hub.getProfile(id)
      setProfile(data)
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar el perfil')
    }
    setLoading(false)
  }, [])

  // Activity
  const loadActivity = useCallback(async () => {
    if (!hubId) return
    setLoading(true)
    clearError()
    try {
      const data = await hub.getActivity(hubId)
      setActivities(data.activities || [])
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar la actividad')
    }
    setLoading(false)
  }, [hubId])

  // Messages
  const loadMessages = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const data = await hub.getMessages(id)
      setMessages(data.messages || [])
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  // Social actions
  const handleFeed = async (targetId: string) => {
    if (!hubId || coins < 10) { setError('Necesitas 10 🍊 para alimentar'); return }
    setLoading(true)
    try {
      await hub.feedRegenmon(hubId, targetId)
      setCoins(c => { const nc = c - 10; localStorage.setItem(storageKey('coins', userId), JSON.stringify(nc)); return nc })
      setError('')
      alert('🍔 ¡Alimentaste a este Regenmon! -10 🍊')
    } catch (e: any) { setError(e.message || 'No se pudo alimentar') }
    setLoading(false)
  }

  const handleGift = async (targetId: string, amount: number) => {
    if (!hubId || coins < amount) { setError(`Necesitas ${amount} 🍊`); return }
    setLoading(true)
    try {
      await hub.giftRegenmon(hubId, targetId, amount)
      setCoins(c => { const nc = c - amount; localStorage.setItem(storageKey('coins', userId), JSON.stringify(nc)); return nc })
      setGiftAmount(null)
      alert(`🎁 ¡Enviaste ${amount} 🍊 de regalo!`)
    } catch (e: any) { setError(e.message || 'No se pudo enviar regalo') }
    setLoading(false)
  }

  const handleSendMessage = async (targetId: string) => {
    if (!hubId || !msgText.trim()) return
    setLoading(true)
    try {
      await hub.sendMessage(hubId, targetId, msgText.trim())
      setMsgText('')
      alert('💌 ¡Mensaje enviado!')
      await loadMessages(targetId)
    } catch (e: any) { setError(e.message || 'No se pudo enviar mensaje') }
    setLoading(false)
  }

  // Navigate
  const goTo = (v: SocialView) => { clearError(); setView(v) }

  const backBtn = (target: SocialView = 'main') => (
    <button onClick={() => goTo(target)} style={btnStyle('#555', false)}>
      ← Volver
    </button>
  )

  const btnStyle = (color: string, disabled = false): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem', padding: '0.6rem 0.8rem',
    background: disabled ? '#333' : color, color: disabled ? '#666' : '#fff',
    border: `2px solid ${disabled ? '#444' : color}`, borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', marginBottom: '0.5rem',
  })

  const errorBox = error ? (
    <div style={{ background: '#e9456020', border: '2px solid #e94560', borderRadius: '8px', padding: '0.5rem', marginBottom: '0.75rem', fontSize: '0.4rem', color: '#e94560' }}>
      ⚠️ {error}
    </div>
  ) : null

  const loadingBox = loading ? (
    <div style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.5rem', color: '#f5c842' }}>
      ⏳ Cargando...
    </div>
  ) : null

  // REGISTRATION VIEW
  if (!isRegistered || view === 'register') {
    return (
      <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
        <div className="pixel-border" style={{ background: 'var(--bg-card)', padding: '1rem', borderColor: '#4fc3f7' }}>
          <div style={{ fontSize: '0.55rem', color: '#4fc3f7', marginBottom: '1rem', textAlign: 'center' }}>
            🌐 Conectar al Hub Social
          </div>

          {/* Pet preview */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img src={getSpriteUrl(petEmoji)} alt={pet.name} style={{ width: '64px', height: '64px', imageRendering: 'pixelated' }} />
            <div style={{ fontSize: '0.5rem', color: pet.color, marginTop: '0.3rem' }}>{pet.name}</div>
            <div style={{ fontSize: '0.35rem', color: '#888' }}>{petEmoji} {PET_TYPES.find(t => t.id === pet.typeId)?.label}</div>
            <div style={{ fontSize: '0.35rem', color: '#888', marginTop: '0.2rem' }}>
              Dueño: {userId || 'anon'} | {totalPoints} pts | {coins} 🍊
            </div>
          </div>

          {/* Email field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.4rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>
              📧 Email (opcional)
            </label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
              style={{
                width: '100%', fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem',
                padding: '0.5rem', background: 'rgba(10,10,26,0.8)', color: '#fff',
                border: '2px solid rgba(79,195,247,0.3)', borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {errorBox}

          <button onClick={handleRegister} disabled={loading} style={btnStyle('#4fc3f7', loading)}>
            {loading ? '⏳ Registrando...' : '🚀 ¡Unirme al Hub!'}
          </button>
        </div>
      </div>
    )
  }

  // LEADERBOARD VIEW
  if (view === 'leaderboard') {
    useEffect(() => { loadLeaderboard(1) }, [])
    const medals = ['🥇', '🥈', '🥉']
    return (
      <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
        {backBtn()}
        <div style={{ fontSize: '0.55rem', color: '#f5c842', textAlign: 'center', marginBottom: '0.75rem' }}>
          🏆 Leaderboard
        </div>
        {errorBox}
        {loading ? loadingBox : (
          <>
            {leaderboard.map((entry, i) => {
              const rank = (lbPage - 1) * 10 + i + 1
              return (
                <div key={entry.id} onClick={() => { setViewingId(entry.id); goTo('profile'); loadProfile(entry.id) }}
                  className="pixel-border" style={{
                    background: 'var(--bg-card)', padding: '0.6rem', marginBottom: '0.4rem',
                    borderColor: rank <= 3 ? '#f5c842' : '#333', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                  <span style={{ fontSize: '0.6rem', minWidth: '1.5rem', textAlign: 'center' }}>
                    {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                  </span>
                  <img src={getSpriteUrl(entry.emoji || '🐾')} alt="" style={{ width: '28px', height: '28px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.4rem', color: '#fff' }}>{entry.name}</div>
                    <div style={{ fontSize: '0.3rem', color: '#888' }}>{entry.owner}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.4rem', color: '#f5c842' }}>⭐ {entry.points}</div>
                    <div style={{ fontSize: '0.3rem', color: '#53d769' }}>🍊 {entry.balance}</div>
                  </div>
                </div>
              )
            })}
            {leaderboard.length === 0 && <div style={{ textAlign: 'center', fontSize: '0.4rem', color: '#888', padding: '2rem 0' }}>No hay participantes aún</div>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => loadLeaderboard(lbPage - 1)} disabled={lbPage <= 1} style={{ ...btnStyle('#555', lbPage <= 1), flex: 1 }}>← Anterior</button>
              <button onClick={() => loadLeaderboard(lbPage + 1)} disabled={leaderboard.length < 10} style={{ ...btnStyle('#555', leaderboard.length < 10), flex: 1 }}>Siguiente →</button>
            </div>
          </>
        )}
      </div>
    )
  }

  // PROFILE VIEW
  if (view === 'profile') {
    useEffect(() => { if (viewingId) loadProfile(viewingId) }, [viewingId])
    const isMyProfile = viewingId === hubId
    return (
      <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
        {backBtn('leaderboard')}
        {errorBox}
        {loading && !profile ? loadingBox : profile ? (
          <div className="pixel-border" style={{ background: 'var(--bg-card)', padding: '1rem', borderColor: '#c084fc' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <img src={getSpriteUrl(profile.emoji || '🐾')} alt="" style={{ width: '64px', height: '64px' }} />
              <div style={{ fontSize: '0.6rem', color: '#c084fc', marginTop: '0.3rem' }}>{profile.name}</div>
              <div style={{ fontSize: '0.35rem', color: '#888' }}>Dueño: {profile.owner}</div>
              <div style={{ fontSize: '0.35rem', color: '#888' }}>
                Registrado: {new Date(profile.registeredAt).toLocaleDateString('es-MX')}
                {profile.visits != null && ` | Visitas: ${profile.visits}`}
              </div>
            </div>

            <StatBarMini label="🍖 Hambre" value={profile.stats?.hambre || 0} color="var(--hunger, #53d769)" />
            <StatBarMini label="😊 Felicidad" value={profile.stats?.felicidad || 0} color="var(--happy, #f5c842)" />
            <StatBarMini label="⚡ Energía" value={profile.stats?.energia || 0} color="var(--energy, #4fc3f7)" />

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.75rem', fontSize: '0.45rem' }}>
              <span style={{ color: '#f5c842' }}>⭐ {profile.points} pts</span>
              <span style={{ color: '#53d769' }}>🍊 {profile.balance} $FRUTA</span>
            </div>

            {!isMyProfile && viewingId && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.45rem', color: '#aaa', marginBottom: '0.5rem' }}>🎮 Acciones sociales</div>

                <button onClick={() => handleFeed(viewingId)} disabled={loading || coins < 10} style={btnStyle('#53d769', loading || coins < 10)}>
                  🍔 Alimentar (-10 🍊)
                </button>

                {/* Gift */}
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
                  {[5, 10, 25].map(amt => (
                    <button key={amt} onClick={() => handleGift(viewingId, amt)} disabled={loading || coins < amt}
                      style={{ ...btnStyle(giftAmount === amt ? '#e879f9' : '#7c3aed', loading || coins < amt), flex: 1 }}>
                      🎁 {amt}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input value={msgText} onChange={e => setMsgText(e.target.value.slice(0, 140))}
                    placeholder="Mensaje (140 chars)..."
                    style={{
                      flex: 1, fontFamily: "'Press Start 2P', monospace", fontSize: '0.35rem', padding: '0.5rem',
                      background: 'rgba(10,10,26,0.8)', color: '#fff', border: '2px solid #555', borderRadius: '6px', outline: 'none',
                    }}
                  />
                  <button onClick={() => handleSendMessage(viewingId)} disabled={loading || !msgText.trim()}
                    style={{ ...btnStyle('#e91e63', loading || !msgText.trim()), width: 'auto', padding: '0.5rem 0.8rem' }}>
                    💌
                  </button>
                </div>
                <div style={{ fontSize: '0.3rem', color: '#666', textAlign: 'right' }}>{msgText.length}/140</div>

                {/* Messages list */}
                <button onClick={() => { goTo('messages'); loadMessages(viewingId) }} style={{ ...btnStyle('#555'), marginTop: '0.5rem' }}>
                  💬 Ver mensajes
                </button>
              </div>
            )}

            {isMyProfile && (
              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.4rem', color: '#53d769' }}>
                ✅ Este es tu perfil
              </div>
            )}
          </div>
        ) : null}
      </div>
    )
  }

  // MESSAGES VIEW
  if (view === 'messages') {
    return (
      <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
        {backBtn('profile')}
        <div style={{ fontSize: '0.5rem', color: '#e91e63', textAlign: 'center', marginBottom: '0.75rem' }}>💬 Mensajes</div>
        {loading ? loadingBox : (
          messages.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: '0.4rem', color: '#888', padding: '2rem 0' }}>No hay mensajes aún</div>
          ) : messages.map(msg => (
            <div key={msg.id} className="pixel-border" style={{ background: 'var(--bg-card)', padding: '0.6rem', marginBottom: '0.4rem', borderColor: '#555' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.35rem', color: '#c084fc' }}>{msg.fromName}</span>
                <span style={{ fontSize: '0.3rem', color: '#666' }}>{timeAgo(msg.timestamp)}</span>
              </div>
              <div style={{ fontSize: '0.4rem', color: '#ddd', lineHeight: 1.6 }}>{msg.message}</div>
            </div>
          ))
        )}
      </div>
    )
  }

  // ACTIVITY VIEW
  if (view === 'activity') {
    useEffect(() => { loadActivity() }, [])
    const activityEmoji: Record<string, string> = { feed: '🍔', gift: '🎁', message: '💌', visit: '👀', register: '🆕' }
    return (
      <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
        {backBtn()}
        <div style={{ fontSize: '0.5rem', color: '#4fc3f7', textAlign: 'center', marginBottom: '0.75rem' }}>📋 Actividad</div>
        {errorBox}
        {loading ? loadingBox : (
          activities.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: '0.4rem', color: '#888', padding: '2rem 0' }}>Sin actividad reciente</div>
          ) : activities.map(act => (
            <div key={act.id} className="pixel-border" style={{ background: 'var(--bg-card)', padding: '0.5rem', marginBottom: '0.3rem', borderColor: '#333' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.4rem', color: '#ddd' }}>
                  {activityEmoji[act.type] || '📌'} {act.fromName && `${act.fromName} `}
                  {act.type === 'feed' ? 'te alimentó' :
                   act.type === 'gift' ? `te regaló ${act.amount} 🍊` :
                   act.type === 'message' ? 'te envió un mensaje' :
                   act.type === 'visit' ? 'visitó tu perfil' : act.type}
                </span>
                <span style={{ fontSize: '0.3rem', color: '#666' }}>{timeAgo(act.timestamp)}</span>
              </div>
              {act.message && <div style={{ fontSize: '0.35rem', color: '#aaa', marginTop: '0.2rem' }}>"{act.message}"</div>}
            </div>
          ))
        )}
      </div>
    )
  }

  // MAIN SOCIAL PANEL
  return (
    <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
      {/* Hub Member Badge */}
      <div className="pixel-border" style={{
        background: 'linear-gradient(135deg, #4fc3f720, #c084fc20)', padding: '1rem',
        borderColor: '#4fc3f7', textAlign: 'center', marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.6rem', marginBottom: '0.3rem' }}>🌐</div>
        <div style={{ fontSize: '0.5rem', color: '#4fc3f7' }}>HUB MEMBER</div>
        <div style={{ fontSize: '0.35rem', color: '#888', marginTop: '0.3rem' }}>
          {pet.name} — {petEmoji} {PET_TYPES.find(t => t.id === pet.typeId)?.label}
        </div>
        {hubId && <div style={{ fontSize: '0.3rem', color: '#555', marginTop: '0.2rem' }}>ID: {hubId.slice(0, 8)}...</div>}
      </div>

      {errorBox}

      {/* Navigation buttons */}
      <button onClick={() => { goTo('leaderboard'); loadLeaderboard(1) }} style={btnStyle('#f5c842')}>
        🏆 Leaderboard
      </button>

      <button onClick={() => { if (hubId) { setViewingId(hubId); goTo('profile'); loadProfile(hubId) } }} disabled={!hubId}
        style={btnStyle('#c084fc', !hubId)}>
        👤 Mi Perfil
      </button>

      <button onClick={() => { goTo('activity'); loadActivity() }} style={btnStyle('#4fc3f7')}>
        📋 Actividad
      </button>

      <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.35rem', color: '#888' }}>
        🔄 Auto-sync cada 5 min | 🍊 {coins} $FRUTA
      </div>
    </div>
  )
}
