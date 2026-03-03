export interface PetType {
  id: string
  label: string
  emoji: string
  color: string
  glow: string
  desc: string
  art: string[]
}

export interface PetDef {
  id: string
  name: string
  desc: string
  art: string[]
  color: string
  glow: string
  typeId: string
}

export const PET_TYPES: PetType[] = [
  {
    id: 'unicornio',
    label: 'Unicornio',
    emoji: '🦄',
    color: '#e879f9',
    glow: 'rgba(232, 121, 249, 0.3)',
    desc: 'Mágico y puro — sanador de corazones',
    art: [],
  },
  {
    id: 'dragon',
    label: 'Dragón',
    emoji: '🐉',
    color: '#f87171',
    glow: 'rgba(248, 113, 113, 0.3)',
    desc: 'Feroz y leal — guardián de fuego',
    art: [],
  },
  {
    id: 'alebrije',
    label: 'Alebrije',
    emoji: '🎭',
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.3)',
    desc: 'Espíritu guía — colores del alma',
    art: [],
  },
]

export function createPet(name: string, typeId: string): PetDef {
  const petType = PET_TYPES.find(t => t.id === typeId)!
  return {
    id: `${typeId}-${name.toLowerCase()}`,
    name,
    desc: `${petType.emoji} ${petType.desc}`,
    art: [],
    color: petType.color,
    glow: petType.glow,
    typeId,
  }
}
