import { useState, useEffect, useRef, useCallback } from 'react'
import { PETS, type PetDef } from './pets'

type Stats = { hambre: number; felicidad: number; energia: number }

const DECAY_INTERVAL = 3000 // ms
const DECAY_AMOUNT = 1

function clamp(v: number) { return Math.max(0, Math.min(100, v)) }

function StatBar({ label, value, color, emoji }: { label: string; value: number; color: string; emoji: string }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.55rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{emoji} {label}</span>
        <span>{value}%</span>
      </div>
      <div style={{
        background: '#0a0a1a',
        border: '3px solid #333',
        height: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s',
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
    </div>
  )
}

function ActionButton({ label, emoji, color, onClick, disabled }: {
  label: string; emoji: string; color: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '0.6rem',
        padding: '0.7rem 1rem',
        background: disabled ? '#333' : color,
        color: disabled ? '#666' : '#fff',
        border: '3px solid',
        borderColor: disabled ? '#444' : `${color}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `4px 4px 0 rgba(0,0,0,0.5), 0 0 12px ${color}40`,
        textShadow: disabled ? 'none' : '1px 1px 0 rgba(0,0,0,0.5)',
        transition: 'transform 0.1s',
        flex: 1,
      }}
      onMouseDown={e => { if (!disabled) (e.target as HTMLElement).style.transform = 'scale(0.95)' }}
      onMouseUp={e => (e.target as HTMLElement).style.transform = ''}
      onMouseLeave={e => (e.target as HTMLElement).style.transform = ''}
    >
      {emoji}<br />{label}
    </button>
  )
}

function PetSelect({ onSelect }: { onSelect: (p: PetDef) => void }) {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
      <h1 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: 'var(--border)' }}>🎮 REGEMON</h1>
      <p style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Elige tu compañero</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {PETS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="pixel-border"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '0.5rem',
              padding: '1rem',
              background: 'var(--bg-card)',
              color: p.color,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              borderColor: p.color,
            }}
          >
            <pre style={{ fontSize: '0.45rem', lineHeight: 1.3, margin: 0 }}>
              {p.art.join('\n')}
            </pre>
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

function PetView({ pet, onReset }: { pet: PetDef; onReset: () => void }) {
  const [stats, setStats] = useState<Stats>({ hambre: 80, felicidad: 80, energia: 80 })
  const [reacting, setReacting] = useState(false)
  const [message, setMessage] = useState('')
  const msgTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Decay
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
    setMessage(m)
    setReacting(true)
    if (msgTimeout.current) clearTimeout(msgTimeout.current)
    msgTimeout.current = setTimeout(() => { setMessage(''); setReacting(false) }, 1200)
  }, [])

  const feed = () => {
    setStats(s => ({ ...s, hambre: clamp(s.hambre + 20), energia: clamp(s.energia + 5) }))
    showMsg('¡Ñam ñam! 🍔')
  }
  const play = () => {
    setStats(s => ({ ...s, felicidad: clamp(s.felicidad + 20), hambre: clamp(s.hambre - 5), energia: clamp(s.energia - 10) }))
    showMsg('¡Yujuu! 🎉')
  }
  const rest = () => {
    setStats(s => ({ ...s, energia: clamp(s.energia + 25), felicidad: clamp(s.felicidad + 5) }))
    showMsg('Zzz... 💤')
  }

  const isDead = stats.hambre === 0 && stats.felicidad === 0 && stats.energia === 0

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h1 style={{ fontSize: '0.8rem', color: pet.color }}> 🎮 REGEMON</h1>
        <button
          onClick={onReset}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '0.4rem',
            padding: '0.4rem 0.6rem',
            background: 'transparent',
            color: 'var(--text-dim)',
            border: '2px solid #444',
            cursor: 'pointer',
          }}
        >↩ Cambiar</button>
      </div>

      {/* Pet display */}
      <div className="pixel-border" style={{
        background: 'var(--bg-card)',
        padding: '1.5rem 1rem',
        marginBottom: '1rem',
        borderColor: pet.color,
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ fontSize: '0.6rem', marginBottom: '0.5rem', color: pet.color }}>
          {pet.name}
        </div>
        {isDead ? (
          <div style={{ fontSize: '0.55rem', color: '#888' }}>
            <p>💀 {pet.name} se desmayó...</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.4rem' }}>¡Reinicia para intentarlo de nuevo!</p>
          </div>
        ) : (
          <pre
            className={reacting ? 'animate-happy' : 'animate-idle'}
            style={{
              fontSize: '0.55rem',
              lineHeight: 1.4,
              margin: 0,
              color: pet.color,
              filter: stats.energia < 20 ? 'brightness(0.5)' : 'none',
            }}
          >
            {pet.art.join('\n')}
          </pre>
        )}
        {message && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            fontSize: '0.5rem',
            color: '#fff',
            background: 'rgba(0,0,0,0.7)',
            padding: '0.3rem 0.6rem',
            borderRadius: '2px',
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="pixel-border" style={{ background: 'var(--bg-card)', padding: '1rem', marginBottom: '1rem', borderColor: '#333' }}>
        <StatBar label="Hambre" value={stats.hambre} color="var(--hunger)" emoji="🍖" />
        <StatBar label="Felicidad" value={stats.felicidad} color="var(--happy)" emoji="😊" />
        <StatBar label="Energía" value={stats.energia} color="var(--energy)" emoji="⚡" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ActionButton label="Alimentar" emoji="🍔" color="var(--btn-feed)" onClick={feed} disabled={isDead} />
        <ActionButton label="Jugar" emoji="🎮" color="#c5a200" onClick={play} disabled={isDead} />
        <ActionButton label="Descansar" emoji="💤" color="var(--btn-rest)" onClick={rest} disabled={isDead} />
      </div>

      {/* Footer */}
      <p style={{ fontSize: '0.35rem', color: '#555', marginTop: '1rem' }}>
        Frutero Club — VibeCoding Bootcamp S1
      </p>
    </div>
  )
}

export default function App() {
  const [pet, setPet] = useState<PetDef | null>(null)
  return pet ? <PetView pet={pet} onReset={() => setPet(null)} /> : <PetSelect onSelect={setPet} />
}
