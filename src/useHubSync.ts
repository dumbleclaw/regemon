import { useEffect, useRef } from 'react'
import { useHub } from './useHub'

const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useHubSync(
  hubId: string | null,
  stats: { hambre: number; felicidad: number; energia: number },
  points: number,
  balance: number
) {
  const hub = useHub()
  const lastSync = useRef(0)

  useEffect(() => {
    if (!hubId) return

    const doSync = async () => {
      try {
        await hub.sync(hubId, { stats, points, balance })
        lastSync.current = Date.now()
      } catch {
        // silent fail
      }
    }

    // Sync on mount
    doSync()

    const id = setInterval(doSync, SYNC_INTERVAL)
    return () => clearInterval(id)
  }, [hubId, stats.hambre, stats.felicidad, stats.energia, points, balance])
}
