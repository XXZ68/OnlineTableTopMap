import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { HubConnectionBuilder, HubConnectionState, type HubConnection } from '@microsoft/signalr'
import ActiveMap from '../components/ActiveMap'
import { getApiMap, getApiMapId, getApiGameSessionId, patchApiGameSessionIdActiveMap } from '../api'
import type { GameSessionDto, MapSummaryDto, ParticipantDto } from '../model'
import GameNavBar from '../components/gameComponents/GameNavBar'
import GameEventLog from '../components/gameComponents/GameEventLog'

export default function Game() {
  const { sessionId: routeSessionId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const lobbyState = state as {
    session?: GameSessionDto
    sessionId?: string
    playerId?: string
    currentUser?: { userId: string; username: string }
  } | null
  const sessionId = routeSessionId ?? lobbyState?.sessionId ?? ''
  const [session, setSession] = useState<GameSessionDto | null>(null)
  const [maps, setMaps] = useState<MapSummaryDto[]>([])
  const [selectedMapId, setSelectedMapId] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isChangingMap, setIsChangingMap] = useState(false)
  const [connection, setConnection] = useState<HubConnection | null>(null)

  const addLog = (message: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 19),
    ])
  }

  // 1. Fetch available maps from backend on mount
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setErrorMessage('')

    async function loadMaps() {
      try {
        const [res, sessionResponse] = await Promise.all([
          getApiMap({ signal: controller.signal }),
          sessionId
            ? getApiGameSessionId(sessionId, { signal: controller.signal })
            : Promise.resolve(null),
        ])

        const data: MapSummaryDto[] = res.data

        if (controller.signal.aborted) return

        setMaps(data)
        const loadedSession = sessionResponse?.data ?? null
        setSession(loadedSession)

        if (loadedSession) {
          setSelectedMapId(loadedSession.activeMapId ?? '')
          addLog(`Joined "${loadedSession.sessionName}". Room code: ${loadedSession.joinCode}`)
        } else if (data.length > 0 && data[0].id) {
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
          setErrorMessage(err.message)
          addLog(`Failed to fetch maps: ${err.message}`)
        } else {
          setErrorMessage('Failed to load the game session.')
          addLog('Failed to fetch maps.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadMaps()

    return () => {
      controller.abort()
    }
  }, [sessionId])

  useEffect(() => {
    if (!selectedMapId || maps.some((map) => map.id === selectedMapId)) return

    const controller = new AbortController()
    const loadSessionMap = async () => {
      try {
        const response = await getApiMapId(selectedMapId, { signal: controller.signal })
        if (controller.signal.aborted) return

        const map = response.data
        setMaps((current) => current.some((existing) => existing.id === map.id)
          ? current
          : [...current, { ...map, title: `${map.title ?? 'Map'} (Session)` }])
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setActionError(error instanceof Error ? error.message : 'Failed to load the session map.')
        }
      }
    }

    void loadSessionMap()
    return () => controller.abort()
  }, [selectedMapId, maps])

  const playerId = lobbyState?.playerId ?? lobbyState?.currentUser?.userId
  const participant = session?.participants?.find(
    (member) => member.playerId === playerId,
  )
  const isDungeonMaster = participant?.isDungeonMaster === true
    && lobbyState?.currentUser?.userId === session?.dungeonMasterId
    && participant.playerId === session?.dungeonMasterId
  const currentParticipant: ParticipantDto | null = participant
    ? { ...participant, isDungeonMaster }
    : null

  const participantId = currentParticipant?.playerId
  const participantName = currentParticipant?.playerName

  useEffect(() => {
    if (!sessionId || !participantId || !participantName) return

    let disposed = false
    let mapRevision = 0
    const controller = new AbortController()
    const hub = new HubConnectionBuilder()
      .withUrl('/hubs/map', { withCredentials: true })
      .withAutomaticReconnect()
      .build()

    setConnection(hub)

    hub.on('MapChanged', (mapId: string) => {
      mapRevision += 1
      setSelectedMapId(mapId)
      setSession((current) => current ? { ...current, activeMapId: mapId } : current)
      addLog(`Switched map to ID: ${mapId}`)
    })

    const joinSession = async () => {
      await hub.invoke('JoinSession', sessionId, participantId, participantName)
      const revision = mapRevision
      const response = await getApiGameSessionId(sessionId, { signal: controller.signal })
      if (!disposed && revision === mapRevision) {
        setSelectedMapId(response.data.activeMapId ?? '')
        setSession(response.data)
        setActionError('')
      }
    }

    hub.onreconnected(async () => {
      try {
        await joinSession()
      } catch (error: unknown) {
        if (!disposed) setActionError(error instanceof Error ? error.message : 'Failed to rejoin the game.')
      }
    })

    const startTimer = setTimeout(() => {
      void hub.start().then(async () => {
        if (disposed) {
          await hub.stop()
          return
        }
        await joinSession()
      }).catch((error: unknown) => {
        if (!disposed) setActionError(error instanceof Error ? error.message : 'Failed to connect to the game.')
      })
    }, 50)

    return () => {
      disposed = true
      clearTimeout(startTimer)
      controller.abort()
      const leaveSession = async () => {
        try {
          if (hub.state === HubConnectionState.Connected) {
            await hub.invoke('LeaveSession', sessionId, participantId)
          }
        } finally {
          await hub.stop()
        }
      }
      void leaveSession().catch(console.error)
    }
  }, [sessionId, participantId, participantName])

  const handleMapChange = async (mapId: string) => {
    if (!isDungeonMaster || !sessionId || !mapId || isChangingMap) return

    setIsChangingMap(true)
    setActionError('')
    try {
      await patchApiGameSessionIdActiveMap(sessionId, { newMapId: mapId })
      const response = await getApiGameSessionId(sessionId)
      setSession(response.data)
      setSelectedMapId(response.data.activeMapId ?? '')
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'Failed to change the map.')
    } finally {
      setIsChangingMap(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-primary-bg text-primary-text">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span
            aria-hidden="true"
            className="size-5 animate-spin rounded-full border-2 border-accent-special/25 border-t-accent-special"
          />
          {' '}
          Connecting to game server...
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary-bg p-6 text-primary-text">
        <div className="w-full max-w-lg rounded-lg border border-secondary-bg bg-secondary-bg p-6 text-left shadow-custom">
          <p className="mb-2 text-sm font-semibold uppercase text-red-500">Connection error</p>
          <p role="alert" className="text-sm text-secondary-text">
            Failed to load game: {errorMessage}
          </p>
        </div>
      </main>
    )
  }

  if (!currentParticipant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary-bg p-6 text-primary-text">
        <div className="w-full max-w-lg rounded-lg border border-secondary-bg bg-secondary-bg p-6 text-left shadow-custom">
          <p className="mb-2 text-sm font-semibold uppercase text-accent-special">Access needed</p>
          <p role="alert" className="text-sm text-secondary-text">
            Join this game with its room code or sign in as its Dungeon Master.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#090a0f]">
      <GameNavBar
        maps={maps}
        selectedMapId={selectedMapId}
        isDungeonMaster={isDungeonMaster}
        isChangingMap={isChangingMap}
        sessionId={sessionId}
        joinCode={session?.joinCode ?? ''}
        onMapChange={(mapId) => {
          void handleMapChange(mapId)
        }}
        onCreateSession={() => {
          void navigate('/main', { state: lobbyState?.currentUser })
        }}
        onLeaveSession={() => {
          void navigate(lobbyState?.currentUser ? '/main' : '/', { state: lobbyState?.currentUser })
        }}
      />

      {actionError && (
        <p role="alert" className="absolute top-24 left-4 right-4 z-[110] rounded-md border border-red-500 bg-primary-bg p-3 text-sm text-red-500 shadow-custom">
          {actionError}
        </p>
      )}

      {/* --- ACTIVE BATTLE MAP --- */}
      {selectedMapId ? (
        <ActiveMap
          key={`${selectedMapId}-${sessionId}`}
          mapId={selectedMapId}
          sessionId={sessionId}
          currentParticipant={currentParticipant}
          connection={connection}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-primary-bg px-6 pb-24 pt-28 text-center text-primary-text">
          <div className="mb-6 grid size-16 place-items-center rounded-lg border border-accent-special/25 bg-accent-special/10 text-3xl text-accent-special shadow-custom" aria-hidden="true">
            ⚔
          </div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-special">
            Map library
          </p>
          <h1 className="mb-3 text-3xl font-semibold text-primary-text sm:text-4xl">
            {session ? 'No map selected' : 'No battle maps yet'}
          </h1>
          <p className="max-w-[440px] text-sm leading-6 text-secondary-text">
            Add a map image through <code className="rounded border border-secondary-bg bg-secondary-bg px-1.5 py-0.5 font-mono text-accent-special">POST /api/Map</code> or open the backend tools to upload one.
          </p>
          <a
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-accent-special px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-complementary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-special"
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

