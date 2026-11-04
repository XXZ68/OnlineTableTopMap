import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetApiMap } from '../../api'
import type { GameSessionDto, MapSummaryDto } from '../../model'
import TextInput from '../atoms/TextInput'
import Modal from '../atoms/Modal'
import Button from '../atoms/Button'

type CurrentUser = {
  userId: string
  username: string
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
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const {
    data: mapsData,
    isLoading: isLoadingMaps,
    error: mapsError,
  } = useGetApiMap({ query: { enabled: isOpen } })

  const availableMaps = mapsData?.data ?? []
  const filteredMaps = availableMaps.filter((map) =>
    (map.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Request status states
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const mapPickerLabel = isMapPickerOpen ? 'Close' : 'Browse Maps'

  const handleSelectMap = (map: MapSummaryDto | null) => {
    if (map) {
      setSelectedMapId(map.id ?? '')
      setSelectedMapTitle(map.title || 'Unnamed Map')
    } else {
      setSelectedMapId('')
      setSelectedMapTitle('')
    }

    setIsMapPickerOpen(false)
  }

  const handleLaunchLobby = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!currentUser?.userId) {
      setErrorMessage('Please sign in before creating a game session.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const payload = {
        sessionName: sessionName.trim(),
        dungeonMasterId: currentUser.userId,
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
        const details = await response.text()
        throw new Error(
          `Failed to create session (HTTP ${response.status})${details ? `: ${details}` : ''}`,
        )
      }

      const createdSession: GameSessionDto = await response.json()

      const roomCode = createdSession.joinCode ?? ''

      setJoinCode(roomCode)

      onClose()

      navigate(`/game/${createdSession.id}`, {
        state: {
          session: createdSession,
          sessionId: createdSession.id,
          joinCode: roomCode,
          currentUser,
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

  let mapPickerContent: ReactNode

  if (isLoadingMaps) {
    mapPickerContent = (
      <p className="text-xs p-2">
        Loading maps...
      </p>
    )
  } else if (mapsError) {
    const message = mapsError instanceof Error
      ? mapsError.message
      : 'Failed to retrieve maps.'

    mapPickerContent = (
      <p role="alert" className="text-xs text-red-500 p-2">
        {message}
      </p>
    )
  } else if (filteredMaps.length === 0) {
    const message = availableMaps.length === 0
      ? 'No uploaded maps found.'
      : 'No matching maps found.'

    mapPickerContent = (
      <p className="text-xs p-2">
        {message}
      </p>
    )
  } else {
    mapPickerContent = filteredMaps.map((map) => (
      <button
        key={map.id}
        type="button"
        disabled={isLoading || !map.id}
        onClick={() => handleSelectMap(map)}
        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-900 flex items-center justify-between ${
          selectedMapId === map.id
            ? 'bg-blue-100 font-semibold'
            : ''
        }`}
      >
        <span>{map.title || 'Unnamed Map'}</span>

        <span className="text-xs text-gray-400">
          {map.widthInPixels}×{map.heightInPixels}px
        </span>
      </button>
    ))
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

          <div className="flex flex-nowrap items-center gap-2 mt-1 [&>div]:min-w-0 [&>div]:flex-1">
            <TextInput
              type="text"
              className="block h-10 w-full rounded-md shadow-sm p-2 cursor-not-allowed"
              placeholder="No map selected (optional)"
              disabled
              value={selectedMapTitle}
              readOnly
            />

            {selectedMapId && (
              <Button
                variant="secondary"
                size="sm"
                className="h-10 shrink-0"
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
              size="sm"
              className="h-10 shrink-0 whitespace-nowrap"
              type="button"
              disabled={isLoading}
              onClick={() => setIsMapPickerOpen(!isMapPickerOpen)}
            >
              {isLoadingMaps ? 'Loading...' : mapPickerLabel}
            </Button>
          </div>

          {/* Map Picker */}
          {isMapPickerOpen && (
            <div className="mt-2 p-2 border baseline rounded-md shadow-lg max-h-48 overflow-y-auto space-y-1">
              <TextInput
                type="text"
                aria-label="Search saved maps"
                placeholder="Search map titles..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full text-sm p-2"
              />

              {mapPickerContent}
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