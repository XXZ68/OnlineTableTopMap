
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import TextInput from '../atoms/TextInput'
import Modal from '../atoms/Modal'
import Button from '../atoms/Button'

import {
  usePostApiGameSessionJoin,
  useGetApiCharacterSessionSessionId,
} from '../../api'

import type { CharacterDto } from '../../model'
import CreateCharacterForm from './CreateCharacterForm'

type JoinGameProps = {
  isOpen: boolean
  onClose: () => void
}

export default function JoinGame({
  isOpen,
  onClose,
}: JoinGameProps) {
  const navigate = useNavigate()

  const joinSession = usePostApiGameSessionJoin()

  type Session = Awaited<
    ReturnType<typeof joinSession.mutateAsync>
  >['data']

  // Join-Formular
  const [gameId, setGameId] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [playerId] = useState(() => `guest:${crypto.randomUUID()}`)

  // Session und Spieler
  const [session, setSession] = useState<Session | null>(null)
  const [player, setPlayer] = useState<{
    id: string
    name: string
  } | null>(null)

  const [joinedCode, setJoinedCode] = useState('')

  // Charakter-Auswahl
  const [showCharacterDialog, setShowCharacterDialog] =
    useState(false)

  const [selectingCharacter, setSelectingCharacter] =
    useState(false)

  const [characterError, setCharacterError] = useState('')

  // Session-ID für den GET-Request
  const sessionId = session?.id ?? ''

  // Charaktere automatisch laden, sobald eine Session vorhanden ist
  const charactersQuery = useGetApiCharacterSessionSessionId(
    sessionId,
    {
      query: {
        enabled: !!sessionId,
      },
    },
  )

  const characters: CharacterDto[] =
    charactersQuery.data?.data ?? []

  // GameSession beitreten
  const handleJoinGame = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    const normalizedGameId = gameId.trim().toUpperCase()
    const normalizedUsername = username.trim()

    if (!normalizedGameId || !normalizedUsername) {
      setError('Bitte Game-Code und Username eingeben.')
      return
    }

    try {
      const response = await joinSession.mutateAsync({
        data: {
          joinCode: normalizedGameId,
          playerName: normalizedUsername,
          playerId,
        },
      })

      const joinedSession = response.data

      setSession(joinedSession)
      setJoinedCode(normalizedGameId)

      setPlayer({
        id: playerId,
        name: normalizedUsername,
      })

      // Join-Dialog schließen
      onClose()

      // Charakter-Auswahl öffnen
      setShowCharacterDialog(true)

    } catch {
      setError(
        'Session konnte nicht beigetreten werden. Bitte überprüfe den Game-Code.',
      )
    }
  }

  // Charakter auswählen
  const handleSelectCharacter = async (
    characterId: string,
  ) => {
    if (!session?.id || !player) return

    setSelectingCharacter(true)
    setCharacterError('')

    try {
      // Bestehenden SessionParticipant aktualisieren
      const response = await joinSession.mutateAsync({
        data: {
          joinCode: joinedCode,
          playerId: player.id,
          playerName: player.name,
          characterId,
        },
      })

      setShowCharacterDialog(false)

      navigate(`/game/${session.id}`, {
        state: {
          session: response.data,
          sessionId: session.id,
          playerId: player.id,
        },
      })

    } catch {
      setCharacterError(
        'Charakter konnte nicht ausgewählt werden.',
      )
    } finally {
      setSelectingCharacter(false)
    }
  }

  return (
    <>
      {/* Join Game Dialog */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <h2 className="mb-4 text-xl font-bold">
          Join Game
        </h2>

        <form
          onSubmit={handleJoinGame}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="gameId"
              className="block text-sm font-medium mb-1"
            >
              Game-Code
            </label>

            <TextInput
              id="gameId"
              type="text"
              className="mt-1 block w-full rounded-md shadow-sm p-2"
              placeholder="z. B. A1B2C3"
              value={gameId}
              onChange={(event) =>
                setGameId(event.target.value)
              }
              required
              maxLength={6}
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
            >
              Dein Username
            </label>

            <TextInput
              id="username"
              type="text"
              className="mt-1 block w-full rounded-md shadow-sm p-2"
              placeholder="Wie möchtest du heißen?"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
              maxLength={24}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-row gap-4 justify-center">
            <Button
              variant="primary"
              type="submit"
              disabled={joinSession.isPending}
            >
              {joinSession.isPending
                ? 'Beitreten...'
                : 'Join Lobby'}
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

      {/* Charakter-Auswahl Dialog */}
      <Modal
        isOpen={showCharacterDialog}
        onClose={() => setShowCharacterDialog(false)}
      >
        <div className="w-full max-w-2xl space-y-6">

          <h2 className="text-xl font-bold">
            Wähle deinen Charakter
          </h2>

          {/* Vorhandene Charaktere */}
          <div>
            <h3 className="font-semibold mb-3">
              Vorhandene Charaktere
            </h3>

            {charactersQuery.isLoading && (
              <p>Charaktere werden geladen...</p>
            )}

            {charactersQuery.isError && (
              <div className="space-y-2">
                <p className="text-sm text-red-500">
                  Charaktere konnten nicht geladen werden.
                </p>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => charactersQuery.refetch()}
                >
                  Erneut laden
                </Button>
              </div>
            )}

            {!charactersQuery.isLoading &&
              !charactersQuery.isError &&
              characters.length === 0 && (
                <p className="text-gray-500">
                  Noch keine Charaktere vorhanden.
                </p>
              )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map((character) => {
                const characterId = character.id

                if (!characterId) return null

                return (
                  <button
                    key={characterId}
                    type="button"
                    disabled={selectingCharacter}
                    onClick={() =>
                      handleSelectCharacter(characterId)
                    }
                    className="flex items-center gap-3 border rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    {character.tokenImageUrl && (
                      <img
                        src={character.tokenImageUrl}
                        alt={character.name ?? 'Charakter'}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    )}

                    <div>
                      <p className="font-semibold">
                        {character.name ?? 'Unbenannter Charakter'}
                      </p>

                      <p className="text-sm text-gray-500">
                        Level {character.level}
                      </p>

                      <p className="text-xs text-gray-500">
                        {character.classIndex} / {character.raceIndex}
                      </p>

                      <p className="text-xs text-gray-500">
                        HP: {character.currentHp}/{character.maxHp}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Neuen Charakter erstellen */}
          {session?.id && player && (
            <CreateCharacterForm
              sessionId={session.id}
              playerId={player.id}
              onCreated={async () => {
                await charactersQuery.refetch()
              }}
            />
          )}

          {characterError && (
            <p className="text-sm text-red-500" role="alert">
              {characterError}
            </p>
          )}

          {selectingCharacter && (
            <p className="text-sm text-gray-500">
              Charakter wird ausgewählt...
            </p>
          )}

        </div>
      </Modal>
    </>
  )
}
