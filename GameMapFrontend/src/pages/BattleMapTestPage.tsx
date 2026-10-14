import { useEffect, useState, type CSSProperties } from 'react'
import ActiveMap from '../components/ActiveMap'
import { getApiMap, postApiGameSession } from '../api'
import { MapSummaryDto, ParticipantDto } from '../model'

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
      <div style={containerStyle}>
        <div
          style={{
            color: '#e0a96d',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          Connecting to backend...
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* --- TOP CONTROL BAR --- */}
      <header style={controlBarStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontWeight: 'bold',
              color: '#e0a96d',
              fontSize: '14px',
            }}
          >
            ⚔️ VTT Test Harness
          </span>

          {/* Map Selector */}
          <label style={labelStyle}>
            Map:

            <select
              value={selectedMapId}
              onChange={(event) => {
                setSelectedMapId(event.target.value)
                addLog(
                  `Switched map to ID: ${event.target.value}`,
                )
              }}
              style={selectStyle}
            >
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.title ||
                    `Map (${map.id!.substring(0, 8)}...)`}
                </option>
              ))}
            </select>
          </label>

          {/* DM / Player Role Switcher */}
          <button
            type="button"
            onClick={() => {
              setIsDungeonMaster((prev) => !prev)

              addLog(
                `Role changed to: ${
                  !isDungeonMaster
                    ? 'Dungeon Master'
                    : 'Player'
                }`,
              )
            }}
            style={{
              ...buttonStyle,
              background: isDungeonMaster
                ? '#7c2d12'
                : '#1e3a8a',
              borderColor: isDungeonMaster
                ? '#b45309'
                : '#3b82f6',
            }}
          >
            Role:{' '}
            {isDungeonMaster
              ? '👑 DM (TokenBox visible)'
              : '🛡️ Player (TokenBox hidden)'}
          </button>
        </div>

        {/* Session Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {sessionId ? (
            <span
              style={{
                fontSize: '12px',
                color: '#86efac',
                fontFamily: 'monospace',
              }}
            >
              Active Session: {sessionId.substring(0, 8)}...
            </span>
          ) : (
            <span
              style={{
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              Standalone (No Session)
            </span>
          )}

          <button
            type="button"
            onClick={handleCreateTestSession}
            style={{
              ...buttonStyle,
              background: '#15803d',
              borderColor: '#22c55e',
            }}
          >
            {sessionId
              ? 'New Session'
              : '+ Create Test Session'}
          </button>

          {sessionId && (
            <button
              type="button"
              onClick={() => {
                setSessionId('')
                addLog(
                  'Cleared session. Operating in standalone mode.',
                )
              }}
              style={{
                ...buttonStyle,
                background: '#334155',
              }}
            >
              Leave Session
            </button>
          )}
        </div>
      </header>

      {/* --- ACTIVE BATTLE MAP --- */}
      {selectedMapId ? (
        <ActiveMap
          key={`${selectedMapId}-${sessionId}`}
          mapId={selectedMapId}
          sessionId={sessionId}
          currentParticipant={currentParticipant}
        />
      ) : (
        <div style={emptyStateStyle}>
          <h2>No Battle Maps Found</h2>

          <p
            style={{
              color: '#94a3b8',
              maxWidth: '420px',
              textAlign: 'center',
            }}
          >
            Upload a map image using your backend API at{' '}
            <code>POST /api/Map</code> (or Swagger UI at{' '}
            <a
              href="http://localhost:5089/swagger"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#e0a96d' }}
            >
              http://localhost:5089/swagger
            </a>
            ) to test rendering.
          </p>
        </div>
      )}

      {/* --- FLOATING EVENT CONSOLE (Bottom-Left) --- */}
      <aside style={logConsoleStyle}>
        <div
          style={{
            fontWeight: 'bold',
            marginBottom: '6px',
            color: '#cbd5e1',
          }}
        >
          Event Logs:
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: '#64748b' }}>
              No events recorded yet.
            </span>
          ) : (
            logs.map((log, index) => (
              <span
                key={index}
                style={{
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {log}
              </span>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}

// --- Inline Styles ---

const containerStyle: CSSProperties = {
  width: '100vw',
  height: '100vh',
  background: '#090a0f',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const controlBarStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '50px',
  background: 'rgba(18, 18, 24, 0.92)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  zIndex: 100,
  boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  fontSize: '12px',
  color: '#cbd5e1',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const selectStyle: CSSProperties = {
  background: '#1e293b',
  color: '#f8fafc',
  border: '1px solid #475569',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
}

const buttonStyle: CSSProperties = {
  color: '#ffffff',
  border: '1px solid #475569',
  padding: '5px 10px',
  borderRadius: '4px',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: '500',
}

const emptyStateStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#090a0f',
  color: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const logConsoleStyle: CSSProperties = {
  position: 'absolute',
  bottom: '16px',
  left: '16px',
  maxWidth: '420px',
  maxHeight: '130px',
  background: 'rgba(15, 23, 42, 0.88)',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '11px',
  fontFamily: 'monospace',
  overflowY: 'auto',
  zIndex: 100,
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
}
