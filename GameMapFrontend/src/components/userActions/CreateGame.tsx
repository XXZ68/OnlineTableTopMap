import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { postApiGameSession, useGetApiMap } from '../../api'
import type { MapSummaryDto } from '../../model'
import TextInput from '../atoms/TextInput'
import Modal from '../atoms/Modal'
import Button from '../atoms/Button'
import { getImageUrl } from '../../utils/imageUrl'

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
  const [previewMapId, setPreviewMapId] = useState('')
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
  const previewMap = availableMaps.find((map) => map.id === previewMapId)

  // Request status states
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const mapPickerLabel = 'Browse Maps'

  const handleOpenMapPicker = () => {
    setPreviewMapId(selectedMapId || availableMaps[0]?.id || '')
    setIsMapPickerOpen(true)
  }

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

      const response = await postApiGameSession(payload)
      const createdSession = response.data

      if (!createdSession.id) {
        throw new Error('The created session has no ID.')
      }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName={isMapPickerOpen ? 'max-w-6xl max-h-[calc(100dvh-2rem)] overflow-y-auto' : undefined}
    >
      {isMapPickerOpen ? (
        <div className="text-left">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase text-accent-special">
                Map library
              </p>
              <h2 className="text-xl font-bold text-primary-text">
                Browse Maps
              </h2>
            </div>
            <span className="text-sm text-secondary-text">
              {filteredMaps.length} {filteredMaps.length === 1 ? 'map' : 'maps'}
            </span>
          </div>

          <TextInput
            type="search"
            aria-label="Search saved maps"
            placeholder="Search map titles..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="mb-4 w-full p-2"
          />

          <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="min-w-0">
              {isLoadingMaps ? (
                <p className="py-4 text-sm text-secondary-text">Loading maps...</p>
              ) : mapsError ? (
                <p role="alert" className="py-4 text-sm text-red-500">
                  {mapsError instanceof Error
                    ? mapsError.message
                    : 'Failed to retrieve maps.'}
                </p>
              ) : filteredMaps.length === 0 ? (
                <p className="py-4 text-sm text-secondary-text">
                  {availableMaps.length === 0
                    ? 'No uploaded maps found.'
                    : 'No matching maps found.'}
                </p>
              ) : (
                <ul className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                  {filteredMaps.map((map) => {
                    const mapId = map.id
                    if (!mapId) return null

                    const isPreviewed = previewMapId === mapId

                    return (
                      <li key={mapId}>
                        <button
                          type="button"
                          onClick={() => setPreviewMapId(mapId)}
                          className={`w-full rounded-md border p-3 text-left transition-colors ${
                            isPreviewed
                              ? 'border-accent-special bg-accent-special/10'
                              : 'border-secondary-bg hover:bg-secondary-bg'
                          }`}
                        >
                          <span className="block truncate font-semibold text-primary-text">
                            {map.title || 'Unnamed Map'}
                          </span>
                          <span className="mt-1 block text-xs text-secondary-text">
                            {map.widthInPixels}×{map.heightInPixels}px
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="truncate font-semibold text-primary-text">
                  {previewMap?.title || 'Map preview'}
                </h3>
                {previewMap && (
                  <span className="shrink-0 text-xs text-secondary-text">
                    {previewMap.widthInPixels}×{previewMap.heightInPixels}px
                  </span>
                )}
              </div>
              <div className="grid aspect-video place-items-center overflow-hidden rounded-md border border-secondary-bg bg-primary-bg">
                {previewMap?.imageUrl ? (
                  <img
                    src={getImageUrl(previewMap.imageUrl)}
                    alt={previewMap.title || 'Selected battle map'}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="px-4 text-center text-sm text-secondary-text">
                    {previewMap ? 'Preview unavailable for this map.' : 'Select a map to preview it.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-secondary-bg pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsMapPickerOpen(false)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={!previewMap}
              onClick={() => handleSelectMap(previewMap ?? null)}
            >
              Use map
            </Button>
          </div>
        </div>
      ) : (
        <>
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
              onClick={handleOpenMapPicker}
            >
              {isLoadingMaps ? 'Loading...' : mapPickerLabel}
            </Button>
          </div>
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
        </>
      )}
    </Modal>
  )
}