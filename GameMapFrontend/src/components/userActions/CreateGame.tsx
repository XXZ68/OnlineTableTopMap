import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../atoms/TextInput'
import Modal from '../atoms/Modal'
import Button from '../atoms/Button'

type CurrentUser = {
  userId: string
  username: string
}

type MapSummary = {
  id: string
  title: string
  widthInPixels: number
  heightInPixels: number
}

type GameSession = {
  id: string
  joinCode: string
  sessionName: string
  dungeonMasterId: string | null
  dungeonMasterName: string
  initialMapId: string | null
}

type CreateGameProps = {
  isOpen: boolean
  onClose: () => void
  currentUser?: CurrentUser | null
}

export default function CreateGame({
  isOpen,
  onClose,
  currentUser,
}: CreateGameProps) {
  const navigate = useNavigate()

  // Form input states
  const [sessionName, setSessionName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [selectedMapId, setSelectedMapId] = useState('')
  const [selectedMapTitle, setSelectedMapTitle] = useState('')

  // Map picker state
  const [availableMaps, setAvailableMaps] = useState<MapSummary[]>([])
  const [isLoadingMaps, setIsLoadingMaps] = useState(false)
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)

  // Request status states
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch uploaded maps when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchMaps = async () => {
      try {
        setIsLoadingMaps(true)

        const response = await fetch('/api/Map')

        if (response.ok) {
          const maps: MapSummary[] = await response.json()
          setAvailableMaps(maps)
        }
      } catch (error) {
        console.error('Failed to load battlemaps:', error)
      } finally {
        setIsLoadingMaps(false)
      }
    }

    fetchMaps()
  }, [isOpen])

  const handleSelectMap = (map: MapSummary | null) => {
    if (map) {
      setSelectedMapId(map.id)
      setSelectedMapTitle(map.title)
    } else {
      setSelectedMapId('')
      setSelectedMapTitle('')
    }

    setIsMapPickerOpen(false)
  }

  const handleLaunchLobby = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsLoading(true)
    setErrorMessage('')

    try {
      const payload = {
        sessionName: sessionName.trim(),
        dungeonMasterId: currentUser?.userId ?? null,
        dungeonMasterName: currentUser?.username ?? 'Dungeon Master',
        initialMapId: selectedMapId || null,
      }

      const response = await fetch('/api/GameSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to create session (HTTP ${response.status})`,
        )
      }

      const createdSession: GameSession = await response.json()

      const roomCode = createdSession.joinCode

      setJoinCode(roomCode)

      onClose()

      navigate(`/api/game/${roomCode}`, {
        state: {
          session: createdSession,
          sessionId: createdSession.id,
          joinCode: roomCode,
        },
      })
    } catch (error: unknown) {
      console.error('Error creating game session:', error)

      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(
          'Failed to create game session. Please try again.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">
        Create New Game Session
      </h2>

      {errorMessage && (
        <div className="mb-4 p-2 text-sm text-red-700 bg-red-100 rounded border border-red-300">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLaunchLobby} className="space-y-4">
        {/* Session / Lobby Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Session Name
          </label>

          <TextInput
            type="text"
            className="mt-1 block w-full rounded-md shadow-sm p-2"
            placeholder="e.g., Curse of Strahd - Session 1"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {/* Generated Join Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Room Code (Join Code)
          </label>

          <TextInput
            type="text"
            className="mt-1 block w-full rounded-md shadow-sm p-2 cursor-not-allowed font-mono tracking-wider"
            placeholder={
              isLoading
                ? 'Generating 6-character code...'
                : 'Generated automatically on launch'
            }
            disabled
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />

          <p className="mt-1 text-xs text-gray-500">
            Players can join using this 6-character code via{' '}
            <code>/api/GameSession/join</code>.
          </p>
        </div>

        {/* Initial Battlemap Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Initial Battlemap
          </label>

          <div className="flex gap-2 mt-1">
            <TextInput
              type="text"
              className="block w-full rounded-md shadow-sm p-2 cursor-not-allowed"
              placeholder="No map selected (optional)"
              disabled
              value={selectedMapTitle}
              readOnly
            />

            {selectedMapId && (
              <Button
                variant="secondary"
                type="button"
                disabled={isLoading}
                onClick={() => handleSelectMap(null)}
                title="Clear selected map"
              >
                ✕
              </Button>
            )}

            <Button
              variant="secondary"
              type="button"
              disabled={isLoading || isLoadingMaps}
              onClick={() => setIsMapPickerOpen(!isMapPickerOpen)}
            >
              {isLoadingMaps
                ? 'Loading...'
                : isMapPickerOpen
                  ? 'Close'
                  : 'Browse Maps'}
            </Button>
          </div>

          {/* Map Picker */}
          {isMapPickerOpen && (
            <div className="mt-2 p-2 border rounded-md bg-white shadow-lg max-h-48 overflow-y-auto space-y-1">
              {availableMaps.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">
                  No uploaded maps found.
                </p>
              ) : (
                availableMaps.map((map) => (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => handleSelectMap(map)}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 flex items-center justify-between ${
                      selectedMapId === map.id
                        ? 'bg-blue-100 font-semibold'
                        : ''
                    }`}
                  >
                    <span>{map.title}</span>

                    <span className="text-xs text-gray-400">
                      {map.widthInPixels}×{map.heightInPixels}px
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-4 justify-center pt-2">
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Room...' : 'Launch Lobby'}
          </Button>

          <Button
            variant="danger"
            type="button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}