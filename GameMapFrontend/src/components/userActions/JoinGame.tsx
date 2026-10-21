import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../atoms/TextInput'
import Modal from '../atoms/Modal'
import Button from '../atoms/Button'
import { usePostApiGameSessionJoin } from '../../api'

type JoinGameProps = {
  isOpen: boolean
  onClose: () => void
}

export default function JoinGame({
  isOpen,
  onClose,
}: JoinGameProps) {
  const navigate = useNavigate()

  const [gameId, setGameId] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const joinSession = usePostApiGameSessionJoin({
    mutation: {
      onSuccess: (response) => {
        const session = response.data

        onClose()

        navigate(`/game/${session.id}`, {
          state: { username },
        })
      },
      onError: () => {
        setError(
          'Session konnte nicht beigetreten werden. Bitte überprüfe den Game-Code.',
        )
      },
    },
  })

  const handleJoinGame = (
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

    joinSession.mutate({
      data: {
        joinCode: normalizedGameId,
        playerName: normalizedUsername
      },
    })
  }

  return (
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
  )
}