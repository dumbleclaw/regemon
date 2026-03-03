import React from 'react'

function UnicornioPet() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="uni-glow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#e879f9" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#e879f9" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="uni-mane" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="30%" stopColor="#f0abfc"/>
          <stop offset="60%" stopColor="#67e8f9"/>
          <stop offset="100%" stopColor="#a78bfa"/>
        </linearGradient>
        <linearGradient id="uni-horn" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#fef3c7"/>
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="52" rx="22" ry="6" fill="url(#uni-glow)"/>
      {/* Tail — rainbow */}
      <path d="M46,44 Q56,38 54,28 Q52,22 48,26" fill="none" stroke="url(#uni-mane)" strokeWidth="4" strokeLinecap="round"/>
      <path d="M47,46 Q58,40 56,30" fill="none" stroke="#f0abfc" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      {/* Body */}
      <ellipse cx="32" cy="46" rx="14" ry="10" fill="#fff" stroke="#e8e0f0" strokeWidth="0.5"/>
      <ellipse cx="32" cy="48" rx="11" ry="7" fill="#fdf4ff"/>
      {/* Legs */}
      <rect x="21" y="50" width="4" height="8" rx="2" fill="#fff" stroke="#d4bfea" strokeWidth="0.5"/>
      <rect x="27" y="51" width="4" height="8" rx="2" fill="#fff" stroke="#d4bfea" strokeWidth="0.5"/>
      <rect x="33" y="51" width="4" height="8" rx="2" fill="#fff" stroke="#d4bfea" strokeWidth="0.5"/>
      <rect x="39" y="50" width="4" height="8" rx="2" fill="#fff" stroke="#d4bfea" strokeWidth="0.5"/>
      {/* Hooves */}
      <ellipse cx="23" cy="58" rx="2.5" ry="1.5" fill="#e879f9"/>
      <ellipse cx="29" cy="59" rx="2.5" ry="1.5" fill="#c084fc"/>
      <ellipse cx="35" cy="59" rx="2.5" ry="1.5" fill="#67e8f9"/>
      <ellipse cx="41" cy="58" rx="2.5" ry="1.5" fill="#f0abfc"/>
      {/* Head */}
      <ellipse cx="30" cy="26" rx="14" ry="12" fill="#fff" stroke="#e8e0f0" strokeWidth="0.5"/>
      {/* Horn */}
      <polygon points="30,6 27,16 33,16" fill="url(#uni-horn)" stroke="#f59e0b" strokeWidth="0.5"/>
      <line x1="28" y1="13" x2="32" y2="12" stroke="#fbbf24" strokeWidth="0.4" opacity="0.6"/>
      <line x1="28.5" y1="10.5" x2="31.5" y2="10" stroke="#fbbf24" strokeWidth="0.4" opacity="0.6"/>
      {/* Ear */}
      <polygon points="18,18 20,10 24,17" fill="#fff" stroke="#d4bfea" strokeWidth="0.5"/>
      <polygon points="20,17 21,12 23,17" fill="#fce7f3"/>
      {/* Mane */}
      <path d="M20,16 Q14,22 16,30" fill="none" stroke="#c084fc" strokeWidth="3" strokeLinecap="round"/>
      <path d="M22,14 Q15,20 17,28" fill="none" stroke="#f0abfc" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M19,18 Q12,24 15,32" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round"/>
      {/* Eye — big anime */}
      <ellipse cx="26" cy="25" rx="4.5" ry="5.5" fill="#fff"/>
      <ellipse cx="27" cy="26" rx="3.2" ry="4" fill="#c084fc"/>
      <ellipse cx="27.5" cy="27" rx="2" ry="2.5" fill="#9333ea"/>
      <circle cx="25" cy="24" r="1.5" fill="#fff"/>
      <circle cx="28" cy="27.5" r="0.8" fill="#fff" opacity="0.7"/>
      {/* Small second eye (3/4 view) */}
      <ellipse cx="37" cy="25.5" rx="3" ry="4.5" fill="#fff"/>
      <ellipse cx="37.5" cy="26.5" rx="2.2" ry="3.2" fill="#c084fc"/>
      <ellipse cx="37.8" cy="27" rx="1.4" ry="2" fill="#9333ea"/>
      <circle cx="36.5" cy="25" r="1" fill="#fff"/>
      {/* Nose */}
      <ellipse cx="35" cy="30" rx="1.2" ry="0.8" fill="#f9a8d4"/>
      {/* Mouth */}
      <path d="M33,32 Q35,33.5 37,32" fill="none" stroke="#e4a0c8" strokeWidth="0.6"/>
      {/* Blush */}
      <ellipse cx="22" cy="30" rx="3" ry="1.5" fill="#f9a8d4" opacity="0.3"/>
      <ellipse cx="38" cy="29.5" rx="2.5" ry="1.5" fill="#f9a8d4" opacity="0.3"/>
      {/* Sparkles */}
      <text x="6" y="10" fontSize="4" opacity="0.6">✨</text>
      <text x="50" y="16" fontSize="3" opacity="0.5">⭐</text>
      <text x="48" y="38" fontSize="3" opacity="0.4">💫</text>
      <text x="8" y="44" fontSize="3" opacity="0.4">🌸</text>
    </svg>
  )
}

function DragonPet() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="drag-glow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#f87171" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="drag-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444"/>
          <stop offset="100%" stopColor="#dc2626"/>
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="52" rx="22" ry="6" fill="url(#drag-glow)"/>
      {/* Tail */}
      <path d="M44,48 Q56,44 58,36 Q60,30 56,32" fill="none" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round"/>
      <polygon points="54,30 58,26 56,33" fill="#fbbf24"/>
      {/* Wings */}
      <path d="M20,34 Q6,20 10,12 L16,18 Q8,16 12,10 L18,16 Q12,12 16,8 L22,20 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" opacity="0.85"/>
      <path d="M44,34 Q58,20 54,12 L48,18 Q56,16 52,10 L46,16 Q52,12 48,8 L42,20 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" opacity="0.85"/>
      {/* Wing membrane */}
      <path d="M20,34 L16,18 L22,20" fill="#fca5a5" opacity="0.3"/>
      <path d="M44,34 L48,18 L42,20" fill="#fca5a5" opacity="0.3"/>
      {/* Body */}
      <ellipse cx="32" cy="46" rx="13" ry="10" fill="url(#drag-body)"/>
      <ellipse cx="32" cy="48" rx="10" ry="7" fill="#fecaca"/>
      {/* Belly scales */}
      <ellipse cx="32" cy="46" rx="6" ry="4" fill="#fecaca" opacity="0.5"/>
      {/* Legs */}
      <ellipse cx="24" cy="54" rx="4.5" ry="3" fill="#dc2626" stroke="#b91c1c" strokeWidth="0.5"/>
      <ellipse cx="40" cy="54" rx="4.5" ry="3" fill="#dc2626" stroke="#b91c1c" strokeWidth="0.5"/>
      {/* Claws */}
      <circle cx="21" cy="55" r="0.8" fill="#fbbf24"/><circle cx="24" cy="56" r="0.8" fill="#fbbf24"/><circle cx="27" cy="55" r="0.8" fill="#fbbf24"/>
      <circle cx="37" cy="55" r="0.8" fill="#fbbf24"/><circle cx="40" cy="56" r="0.8" fill="#fbbf24"/><circle cx="43" cy="55" r="0.8" fill="#fbbf24"/>
      {/* Head */}
      <ellipse cx="32" cy="26" rx="14" ry="12" fill="url(#drag-body)"/>
      {/* Horns */}
      <polygon points="18,16 15,6 22,14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5"/>
      <polygon points="46,16 49,6 42,14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5"/>
      {/* Snout */}
      <ellipse cx="32" cy="30" rx="8" ry="5" fill="#ef4444"/>
      <ellipse cx="32" cy="31" rx="6" ry="3.5" fill="#fca5a5"/>
      {/* Nostrils — smoke */}
      <circle cx="29" cy="29" r="1" fill="#991b1b"/>
      <circle cx="35" cy="29" r="1" fill="#991b1b"/>
      <circle cx="27" cy="27" r="1.5" fill="#9ca3af" opacity="0.3"/>
      <circle cx="37" cy="26" r="1.2" fill="#9ca3af" opacity="0.25"/>
      {/* Eyes — fierce but cute */}
      <ellipse cx="24" cy="22" rx="4.5" ry="4.5" fill="#fff"/>
      <ellipse cx="40" cy="22" rx="4.5" ry="4.5" fill="#fff"/>
      <ellipse cx="25" cy="23" rx="3" ry="3.5" fill="#f59e0b"/>
      <ellipse cx="41" cy="23" rx="3" ry="3.5" fill="#f59e0b"/>
      {/* Slit pupils */}
      <ellipse cx="25.5" cy="23" rx="1" ry="3" fill="#1a1a1a"/>
      <ellipse cx="41.5" cy="23" rx="1" ry="3" fill="#1a1a1a"/>
      <circle cx="23.5" cy="21.5" r="1.3" fill="#fff"/>
      <circle cx="39.5" cy="21.5" r="1.3" fill="#fff"/>
      {/* Mouth */}
      <path d="M26,33 Q32,36 38,33" fill="none" stroke="#991b1b" strokeWidth="0.8"/>
      {/* Tiny fang */}
      <polygon points="28,33 29,35.5 30,33" fill="#fff"/>
      <polygon points="34,33 35,35.5 36,33" fill="#fff"/>
      {/* Back spines */}
      <polygon points="28,36 30,32 32,36" fill="#fbbf24" opacity="0.7"/>
      <polygon points="31,35 33,30 35,35" fill="#fbbf24" opacity="0.7"/>
      <polygon points="34,36 36,32 38,36" fill="#fbbf24" opacity="0.7"/>
      {/* Fire sparkles */}
      <text x="4" y="8" fontSize="4" opacity="0.6">🔥</text>
      <text x="52" y="10" fontSize="3" opacity="0.5">⭐</text>
      <text x="6" y="50" fontSize="3" opacity="0.4">✨</text>
    </svg>
  )
}

function AlebrijePet() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="ale-glow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="ale-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399"/>
          <stop offset="50%" stopColor="#2dd4bf"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="52" rx="22" ry="6" fill="url(#ale-glow)"/>
      {/* Tail — feathered serpent */}
      <path d="M46,46 Q56,40 58,30 Q59,24 55,28" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round"/>
      <path d="M47,44 Q58,38 59,28" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <circle cx="55" cy="27" r="2" fill="#f472b6"/>
      <circle cx="58" cy="29" r="1.5" fill="#fbbf24"/>
      {/* Wings — butterfly/feathered */}
      <path d="M18,34 Q4,22 8,12 Q12,8 18,16 Q14,14 18,22 Z" fill="#f472b6" stroke="#ec4899" strokeWidth="0.5" opacity="0.8"/>
      <path d="M46,34 Q60,22 56,12 Q52,8 46,16 Q50,14 46,22 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" opacity="0.8"/>
      {/* Wing patterns */}
      <circle cx="12" cy="18" r="3" fill="#fbbf24" opacity="0.4"/>
      <circle cx="52" cy="18" r="3" fill="#f472b6" opacity="0.4"/>
      <circle cx="14" cy="24" r="2" fill="#67e8f9" opacity="0.3"/>
      <circle cx="50" cy="24" r="2" fill="#a78bfa" opacity="0.3"/>
      {/* Body */}
      <ellipse cx="32" cy="46" rx="14" ry="10" fill="url(#ale-body)"/>
      {/* Body patterns — swirls */}
      <path d="M26,42 Q28,40 30,42 Q32,44 34,42" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.6"/>
      <path d="M28,46 Q30,44 32,46 Q34,48 36,46" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0.6"/>
      <circle cx="25" cy="46" r="1.5" fill="#fbbf24" opacity="0.4"/>
      <circle cx="39" cy="44" r="1.5" fill="#f472b6" opacity="0.4"/>
      <circle cx="32" cy="50" r="1" fill="#a78bfa" opacity="0.4"/>
      {/* Belly */}
      <ellipse cx="32" cy="48" rx="10" ry="6" fill="#a7f3d0" opacity="0.6"/>
      {/* Legs */}
      <ellipse cx="24" cy="54" rx="4.5" ry="3" fill="#2dd4bf" stroke="#14b8a6" strokeWidth="0.5"/>
      <ellipse cx="40" cy="54" rx="4.5" ry="3" fill="#2dd4bf" stroke="#14b8a6" strokeWidth="0.5"/>
      {/* Head */}
      <ellipse cx="32" cy="26" rx="14" ry="12" fill="url(#ale-body)"/>
      {/* Horns — deer antlers with flowers */}
      <path d="M20,16 L16,6 L14,10" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16,6 L18,4" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M44,16 L48,6 L50,10" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M48,6 L46,4" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Flowers on antlers */}
      <circle cx="14" cy="10" r="2" fill="#f472b6"/><circle cx="14" cy="10" r="1" fill="#fce7f3"/>
      <circle cx="18" cy="4" r="1.5" fill="#fbbf24"/><circle cx="18" cy="4" r="0.7" fill="#fef3c7"/>
      <circle cx="50" cy="10" r="2" fill="#fbbf24"/><circle cx="50" cy="10" r="1" fill="#fef3c7"/>
      <circle cx="46" cy="4" r="1.5" fill="#a78bfa"/><circle cx="46" cy="4" r="0.7" fill="#ede9fe"/>
      {/* Face patterns */}
      <path d="M22,20 Q24,18 26,20" fill="none" stroke="#fbbf24" strokeWidth="0.8" opacity="0.5"/>
      <path d="M38,20 Q40,18 42,20" fill="none" stroke="#f472b6" strokeWidth="0.8" opacity="0.5"/>
      {/* Eyes — magical heterochromia */}
      <ellipse cx="25" cy="25" rx="4.5" ry="5.5" fill="#fff"/>
      <ellipse cx="39" cy="25" rx="4.5" ry="5.5" fill="#fff"/>
      <ellipse cx="26" cy="26" rx="3.2" ry="4" fill="#f472b6"/>
      <ellipse cx="40" cy="26" rx="3.2" ry="4" fill="#fbbf24"/>
      <ellipse cx="26.5" cy="27" rx="2" ry="2.5" fill="#be185d"/>
      <ellipse cx="40.5" cy="27" rx="2" ry="2.5" fill="#b45309"/>
      <circle cx="24.5" cy="24.5" r="1.5" fill="#fff"/>
      <circle cx="38.5" cy="24.5" r="1.5" fill="#fff"/>
      <circle cx="27" cy="27.5" r="0.8" fill="#fff" opacity="0.7"/>
      <circle cx="41" cy="27.5" r="0.8" fill="#fff" opacity="0.7"/>
      {/* Nose */}
      <ellipse cx="32" cy="30.5" rx="1.5" ry="1" fill="#0d9488"/>
      {/* Mouth — happy */}
      <path d="M29,33 Q32,35.5 35,33" fill="none" stroke="#0d9488" strokeWidth="0.8"/>
      {/* Tongue */}
      <ellipse cx="32" cy="34.5" rx="1.5" ry="1" fill="#f472b6" opacity="0.6"/>
      {/* Cheek patterns */}
      <ellipse cx="20" cy="30" rx="3" ry="2" fill="#fbbf24" opacity="0.25"/>
      <ellipse cx="44" cy="30" rx="3" ry="2" fill="#f472b6" opacity="0.25"/>
      {/* Spirit sparkles */}
      <text x="4" y="14" fontSize="4" opacity="0.5">🌺</text>
      <text x="52" y="8" fontSize="3" opacity="0.5">✨</text>
      <text x="6" y="48" fontSize="3" opacity="0.4">💜</text>
      <text x="54" y="44" fontSize="3" opacity="0.4">🌿</text>
    </svg>
  )
}

const PET_COMPONENTS: Record<string, () => React.ReactElement> = {
  unicornio: UnicornioPet,
  dragon: DragonPet,
  alebrije: AlebrijePet,
}

export default function PixelPet({ typeId, size = 160, dead = false, dim = false }: {
  typeId: string; size?: number; dead?: boolean; dim?: boolean
}) {
  const Component = PET_COMPONENTS[typeId] || UnicornioPet

  return (
    <div style={{
      width: size,
      height: size,
      filter: dim ? 'brightness(0.35) saturate(0.5)' : dead ? 'grayscale(0.9) brightness(0.3)' : 'drop-shadow(0 0 10px rgba(255,255,255,0.15))',
      transition: 'filter 0.5s',
    }}>
      <Component />
    </div>
  )
}
