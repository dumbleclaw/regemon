export interface PetType {
  id: string
  label: string
  emoji: string
  color: string
  desc: string
  art: string[]
}

export interface PetDef {
  id: string
  name: string
  desc: string
  art: string[]
  color: string
  typeId: string
}

export const PET_TYPES: PetType[] = [
  {
    id: 'semilla',
    label: 'Semilla',
    emoji: '🌱',
    color: '#53d769',
    desc: 'Tipo planta — tranquilo y tierno',
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
    id: 'gota',
    label: 'Gota',
    emoji: '💧',
    color: '#4fc3f7',
    desc: 'Tipo agua — juguetón y veloz',
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
  {
    id: 'chispa',
    label: 'Chispa',
    emoji: '✨',
    color: '#f5c842',
    desc: 'Tipo eléctrico — brillante y enérgico',
    art: [
      '    ⚡✨⚡',
      '   (      )',
      '   | ★  ★ |',
      '   |  ▿   |',
      '   \\ ⚡⚡ /',
      '    ╰───╯',
      '   /|   |\\',
      '    ✨✨✨',
    ],
  },
]

export function createPet(name: string, typeId: string): PetDef {
  const petType = PET_TYPES.find(t => t.id === typeId)!
  return {
    id: `${typeId}-${name.toLowerCase()}`,
    name,
    desc: `${petType.emoji} ${petType.desc}`,
    art: petType.art,
    color: petType.color,
    typeId,
  }
}
