import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../atoms/TextInput'
import Modal from '../atoms/Modal'
import Button from '../atoms/Button'

type JoinGameProps = {
  isOpen: boolean
  onClose: () => void
}

export default function JoinGame({
  isOpen,
  onClose,
}: JoinGameProps) {
  const navigate = useNavigate()
  const [lobbyName, setLobbyName] = useState('')

  const handleLaunchLobby = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    console.log(`Launching lobby "${lobbyName}"`)

    onClose()
    navigate('/game')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">
        Join Game
      </h2>

      <form
        onSubmit={handleLaunchLobby}
        className="space-y-4"
      >
        <TextInput
          type="text"
          className="mt-1 block w-full rounded-md shadow-sm p-2"
          placeholder="Game ID"
          value={lobbyName}
          onChange={(event) =>
            setLobbyName(event.target.value)
          }
        />

        <div className="flex flex-row gap-4 justify-center">
          <Button
            variant="primary"
            type="submit"
          >
            Join Lobby
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