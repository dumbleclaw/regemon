const HUB_URL = 'https://regenmon-final.vercel.app'

export interface HubRegenmon {
  id: string
  name: string
  owner: string
  emoji: string
  typeId: string
  stats: { hambre: number; felicidad: number; energia: number }
  points: number
  balance: number
  visits: number
  registeredAt: string
  lastSync?: string
}

export interface LeaderboardEntry {
  id: string
  name: string
  owner: string
  emoji: string
  typeId: string
  points: number
  balance: number
  rank: number
}

export interface ActivityEntry {
  id: string
  type: string
  from?: string
  fromName?: string
  message?: string
  amount?: number
  timestamp: string
}

async function hubFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${HUB_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.message || `Error ${res.status}`)
  }
  return res.json()
}

export function useHub() {
  const register = async (data: {
    name: string; owner: string; email?: string; emoji: string; typeId: string;
    stats: { hambre: number; felicidad: number; energia: number }; points: number; balance: number
  }) => {
    return hubFetch<{ id: string; alreadyRegistered?: boolean }>('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  const sync = async (id: string, data: {
    stats: { hambre: number; felicidad: number; energia: number }; points: number; balance: number
  }) => {
    return hubFetch<{ ok: boolean }>(`/api/regenmon/${id}/sync`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  const getLeaderboard = async (page = 1, limit = 10) => {
    return hubFetch<{ entries: LeaderboardEntry[]; total: number; page: number }>(
      `/api/leaderboard?page=${page}&limit=${limit}`
    )
  }

  const getProfile = async (id: string) => {
    return hubFetch<HubRegenmon>(`/api/regenmon/${id}`)
  }

  const feedRegenmon = async (fromId: string, targetId: string) => {
    return hubFetch<{ ok: boolean }>(`/api/regenmon/${targetId}/feed`, {
      method: 'POST',
      body: JSON.stringify({ fromId }),
    })
  }

  const giftRegenmon = async (fromId: string, targetId: string, amount: number) => {
    return hubFetch<{ ok: boolean }>(`/api/regenmon/${targetId}/gift`, {
      method: 'POST',
      body: JSON.stringify({ fromId, amount }),
    })
  }

  const sendMessage = async (fromId: string, targetId: string, message: string) => {
    return hubFetch<{ ok: boolean }>(`/api/regenmon/${targetId}/message`, {
      method: 'POST',
      body: JSON.stringify({ fromId, message }),
    })
  }

  const getActivity = async (id: string) => {
    return hubFetch<{ activities: ActivityEntry[] }>(`/api/regenmon/${id}/activity`)
  }

  const getMessages = async (id: string) => {
    return hubFetch<{ messages: { id: string; fromId: string; fromName: string; message: string; timestamp: string }[] }>(
      `/api/regenmon/${id}/messages`
    )
  }

  return { register, sync, getLeaderboard, getProfile, feedRegenmon, giftRegenmon, sendMessage, getActivity, getMessages }
}
