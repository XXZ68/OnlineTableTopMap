import {
  useState,
  type FormEvent,
} from 'react'
import Modal from '../atoms/Modal'
import TextInput from '../atoms/TextInput'
import Button from '../atoms/Button'
import { useGetApiMap } from '../../api'
import { MapSummaryDto } from '../../model'

type GameSession = {
  id: string
  joinCode: string
}

type SelectedMap = MapSummaryDto & {
  isStarting: boolean
}

type CreateCampaignProps = {
  isOpen: boolean
  onClose: () => void
}

export default function CreateCampaign({
  isOpen,
  onClose,
}: CreateCampaignProps) {
  const [campaignName, setCampaignName] = useState('')
  const [addMap, setAddMap] = useState(false)

  const [selectedMaps, setSelectedMaps] = useState<
    SelectedMap[]
  >([])

  const [showMapSearchPool, setShowMapSearchPool] =
    useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const {
    data: mapsData,
    isLoading: isLoadingMaps,
    error: mapsError,
  } = useGetApiMap()

  const availableMaps: MapSummaryDto[] =
    Array.isArray(mapsData)
      ? mapsData.filter(
          (map): map is MapSummaryDto =>
            map !== undefined,
        )
      : []

  const handleOpenSearchPool = () => {
    setShowMapSearchPool(true)
  }

  const handleSelectMap = (map: MapSummaryDto) => {
    if (
      !selectedMaps.some(
        (selectedMap) => selectedMap.id === map.id,
      )
    ) {
      setSelectedMaps([
        ...selectedMaps,
        {
          ...map,
          isStarting: selectedMaps.length === 0,
        },
      ])
    }

    setShowMapSearchPool(false)
  }

  const toggleStartingMap = (mapId?: string) => {
    setSelectedMaps(
      selectedMaps.map((map) => ({
        ...map,
        isStarting: map.id === mapId,
      })),
    )
  }

  const handleRemoveMap = (mapId?: string) => {
    setSelectedMaps((currentMaps) => {
      const remainingMaps = currentMaps.filter(
        (map) => map.id !== mapId,
      )

      // Wenn die Starting Map entfernt wurde,
      // wird die erste verbleibende Map zur neuen Starting Map.
      if (
        remainingMaps.length > 0 &&
        !remainingMaps.some((map) => map.isStarting)
      ) {
        remainingMaps[0] = {
          ...remainingMaps[0],
          isStarting: true,
        }
      }

      return remainingMaps
    })
  }

  const handleLaunchLobby = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const startingMap =
      selectedMaps.find((map) => map.isStarting) ??
      selectedMaps[0]

    const payload = {
      sessionName: campaignName,
      initialMapId: startingMap?.id ?? null,
    }

    try {
      const response = await fetch('/api/GameSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const gameSession: GameSession =
          await response.json()

        const auxiliaryMaps = selectedMaps.filter(
          (map) => map.id !== startingMap?.id,
        )

        for (const auxMap of auxiliaryMaps) {
          await fetch(
            `/api/GameSession/${gameSession.id}/add-map/${auxMap.id}`,
            {
              method: 'POST',
            },
          )
        }

        alert(
          `Lobby created! Room Code: ${gameSession.joinCode}`,
        )

        onClose()
      } else {
        alert('Failed to create game session.')
      }
    } catch (error: unknown) {
      console.error('Error starting lobby:', error)
    }
  }

  const filteredMaps = availableMaps.filter((map) =>
    map.title
      ? map.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : false,
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">
        Create New Campaign
      </h2>

      <form
        className="space-y-4"
        onSubmit={handleLaunchLobby}
      >
        {/* Campaign Name Input */}
        <div>
          <p className="block text-sm font-medium">
            Campaign Name
          </p>

          <TextInput
            type="text"
            className="mt-1 block w-full rounded-md shadow-sm p-2"
            placeholder="Campaign Name"
            value={campaignName}
            onChange={(event) =>
              setCampaignName(event.target.value)
            }
            required
          />
        </div>

        {/* Map selection section */}
        <div>
          <p className="block text-sm font-medium text-gray-700">
            Fill your Campaign with Maps
          </p>

          <div className="mt-1">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setAddMap(!addMap)}
            >
              {addMap
                ? 'Hide Map Options'
                : 'Add Map'}
            </Button>
          </div>

          {addMap && (
            <div className="flex gap-5 justify-center mt-3">
              <Button
                variant="secondary"
                type="button"
              >
                Upload Map
              </Button>

              <Button
                variant="secondary"
                type="button"
                onClick={handleOpenSearchPool}
              >
                Search Map
              </Button>
            </div>
          )}

          {showMapSearchPool && (
            <div className="border p-3 rounded-md mt-3 space-y-2 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">
                  Select Database Map
                </span>

                <button
                  type="button"
                  className="text-xs text-red-500 hover:underline"
                  onClick={() =>
                    setShowMapSearchPool(false)
                  }
                >
                  Close
                </button>
              </div>

              <TextInput
                type="text"
                placeholder="Search map titles..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                className="w-full text-xs p-1"
              />

              {isLoadingMaps ? (
                <p className="text-xs text-gray-500">
                  Querying campaign assets...
                </p>
              ) : mapsError ? (
                <p className="text-xs text-red-500">
                  Error: {mapsError instanceof Error
                    ? mapsError.message
                    : 'Failed to retrieve maps.'}
                </p>
              ) : filteredMaps.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No matching maps found.
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredMaps.map((map) => (
                    <li
                      key={map.id}
                      className="text-xs flex justify-between items-center border-b py-1"
                    >
                      <span>
                        {map.title || 'Unnamed Map'}
                      </span>

                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() =>
                          handleSelectMap(map)
                        }
                      >
                        Select
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* List of currently selected maps */}
          <ul className="m-2 space-y-2">
            {selectedMaps.map((map) => (
              <li
                key={map.id}
                className="flex items-center gap-2 justify-between border-b pb-1"
              >
                <span className="text-sm font-medium">
                  {map.title || 'Unnamed Map'}
                </span>

                <div className="flex gap-2">
                  <Button
                    variant={
                      map.isStarting
                        ? 'primary'
                        : 'secondary'
                    }
                    type="button"
                    onClick={() =>
                      toggleStartingMap(map.id)
                    }
                  >
                    {map.isStarting
                      ? '★ Starting Map'
                      : 'Set Starting'}
                  </Button>

                  <Button
                    variant="danger"
                    type="button"
                    onClick={() =>
                      handleRemoveMap(map.id)
                    }
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Form actions */}
        <div className="flex flex-row gap-4 justify-center pt-4">
          <Button
            variant="primary"
            type="submit"
          >
            Launch Lobby
          </Button>

          <Button
            variant="danger"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}