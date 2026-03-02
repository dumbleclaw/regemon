export interface PetDef {
  id: string
  name: string
  desc: string
  art: string[]  // ASCII art lines
  color: string
}

export const PETS: PetDef[] = [
  {
    id: 'flameko',
    name: 'Flameko',
    desc: '🔥 Tipo fuego — travieso y hambriento',
    color: '#e94560',
    art: [
      '    \\\\  //',
      '   (  💥  )',
      '   / 👁👁 \\',
      '  |  \\_/  |',
      '   \\     /',
      '    ╰───╯',
      '   /|   |\\',
      '    🔥🔥🔥',
    ],
  },
  {
    id: 'leafito',
    name: 'Leafito',
    desc: '🌿 Tipo planta — tranquilo y tierno',
    color: '#53d769',
    art: [
      '    🌱🌱🌱',
      '   (      )',
      '   | ◕  ◕ |',
      '   |  ▽   |',
      '   \\  ~  /',
      '    ╰───╯',
      '   /|   |\\',
      '    🍃🍃🍃',
    ],
  },
  {
    id: 'droppy',
    name: 'Droppy',
    desc: '💧 Tipo agua — juguetón y veloz',
    color: '#4fc3f7',
    art: [
      '     💧💧',
      '   (      )',
      '   | ●  ● |',
      '   |  ◡   |',
      '   \\  ∿  /',
      '    ╰───╯',
      '   /|   |\\',
      '    🌊🌊🌊',
    ],
  },
]
