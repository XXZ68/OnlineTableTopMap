import { useEffect, useState } from 'react'
import ActiveMap from '../components/ActiveMap'
import { getApiMap, postApiGameSession } from '../api'
import { MapSummaryDto, ParticipantDto } from '../model'
import GameNavBar from '../components/gameComponents/GameNavBar'
import GameEventLog from '../components/gameComponents/GameEventLog'

export default function BattleMapTestPage() {
  const [maps, setMaps] = useState<MapSummaryDto[]>([])
  const [selectedMapId, setSelectedMapId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [isDungeonMaster, setIsDungeonMaster] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const addLog = (message: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 19),
    ])
  }

  // 1. Fetch available maps from backend on mount
  useEffect(() => {
    const controller = new AbortController()

    async function loadMaps() {
      try {
        const res = await getApiMap({
          signal: controller.signal,
        })

        const data: MapSummaryDto[] = res.data

        if (controller.signal.aborted) return

        setMaps(data)

        if (data.length > 0 && data[0].id) {
          setSelectedMapId(data[0].id)

          addLog(
            `Loaded ${data.length} maps. Selected: "${
              data[0].title || data[0].id
            }"`,
          )
        } else {
          addLog(
            'No maps found. Upload a map via POST /api/Map first.',
          )
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return

        if (err instanceof Error) {
          addLog(`Failed to fetch maps: ${err.message}`)
        } else {
          addLog('Failed to fetch maps.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadMaps()

    return () => {
      controller.abort()
    }
  }, [])
  // 2. Quick session generator to test real-time multiplayer features
  const handleCreateTestSession = async () => {
    try {
      const res = await postApiGameSession({
        sessionName: `Test Session ${Math.floor(
          Math.random() * 1000,
        )}`,
        dungeonMasterId: 'dm-test-id-001',
        dungeonMasterName: 'Dungeon Master',
        initialMapId: selectedMapId || null,
      })

      const newSession = res.data
      if (newSession && newSession.id) {
        setSessionId(newSession.id)
      }

      addLog(
        `Session created! Code: ${
          newSession.joinCode || 'N/A'
        } (ID: ${newSession.id})`,
      )
    } catch (err: unknown) {
      if (err instanceof Error) {
        addLog(`Session creation error: ${err.message}`)
      } else {
        addLog('Session creation error.')
      }
    }
  }

  // Mock Current User object matching ActiveMap's expectations
  const currentParticipant: ParticipantDto = {
    playerId: isDungeonMaster
      ? 'dm-test-id-001'
      : 'player-test-id-002',
    playerName: isDungeonMaster
      ? 'Dungeon Master'
      : 'Player One',
    isDungeonMaster,
    selectedCharacterId: null,
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[#090a0f] text-[#edf2f7]">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-wide">
          <span
            aria-hidden="true"
            className="size-5 animate-spin rounded-full border-2 border-[#f2c078]/25 border-t-[#f2c078]"
          />
          {' '}
          Connecting to game server...
        </div>
      </div>
    )
  }

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#090a0f]">
      <GameNavBar
        maps={maps}
        selectedMapId={selectedMapId}
        isDungeonMaster={isDungeonMaster}
        sessionId={sessionId}
        onMapChange={(mapId) => {
          setSelectedMapId(mapId)
          addLog(`Switched map to ID: ${mapId}`)
        }}
        onToggleRole={() => {
          setIsDungeonMaster((prev) => !prev)
          addLog(
            `Role changed to: ${
              !isDungeonMaster ? 'Dungeon Master' : 'Player'
            }`,
          )
        }}
        onCreateSession={handleCreateTestSession}
        onLeaveSession={() => {
          setSessionId('')
          addLog('Cleared session. Operating in standalone mode.')
        }}
      />

      {/* --- ACTIVE BATTLE MAP --- */}
      {selectedMapId ? (
        <ActiveMap
          key={`${selectedMapId}-${sessionId}`}
          mapId={selectedMapId}
          sessionId={sessionId}
          currentParticipant={currentParticipant}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_center,_rgba(33,47,55,0.72)_0%,_#090a0f_68%)] px-6 pb-24 pt-28 text-center text-[#f8fafc]">
          <div className="mb-6 grid size-16 place-items-center rounded-xl border border-[#f2c078]/25 bg-[#f2c078]/[0.07] text-3xl text-[#f2c078] shadow-[0_12px_36px_rgba(0,0,0,0.24)]" aria-hidden="true">
            ⚔
          </div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f2c078]">
            Map library
          </p>
          <h1 className="mb-3 text-3xl font-semibold text-[#f8fafc] sm:text-4xl">
            No battle maps yet
          </h1>
          <p className="max-w-[440px] text-sm leading-6 text-[#aebdca]">
            Add a map image through <code className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[#e3c18f]">POST /api/Map</code> or open the backend tools to upload one.
          </p>
          <a
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md border border-[#a87338] bg-[#654626] px-4 text-sm font-semibold text-[#fff4e2] transition-colors hover:bg-[#79552e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2c078]"
            href="http://localhost:5089/swagger"
            target="_blank"
            rel="noreferrer"
          >
            Open Swagger UI{' '}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}

      <GameEventLog logs={logs} />
    </main>
  )
}

