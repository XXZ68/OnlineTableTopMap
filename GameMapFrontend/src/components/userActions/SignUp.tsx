import { useState, type FormEvent } from 'react'
import Button from '../atoms/Button'
import Modal from '../atoms/Modal'
import TextInput from '../atoms/TextInput'
import { postApiAuthRegister } from '../../api'
import { AuthResponseDto } from '../../model'

type SignUpProps = {
  onClose: () => void
  isOpen: boolean
  onRegisterSuccess?: (user: AuthResponseDto) => void
}


function SignUp({
  onClose,
  isOpen,
  onRegisterSuccess,
}: SignUpProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim() || !password || !confirmPassword) {
      setError('Bitte fülle alle Felder aus.')
      return
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)


    const response = await postApiAuthRegister({
      username: username.trim(),
      password,
    })

    const user = response.data

    setPassword('')
    setConfirmPassword('')

    onRegisterSuccess?.(user)
    onClose()
  }

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <h2>Sign up as a new member</h2>

      <form
        className="flex flex-col justify-center"
        onSubmit={handleSubmit}
      >
        <TextInput
          placeholder="Display Name"
          className="w-full px-3 py-3 mt-4"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <TextInput
          type="password"
          placeholder="Password"
          className="w-full px-3 py-3 mt-4"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <TextInput
          type="password"
          placeholder="Confirm Password"
          className="w-full px-3 py-3 mt-4"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {error && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-3 text-sm text-green-600" role="status">
            {success}
          </p>
        )}

        <div className="flex flex-row gap-5 justify-center mt-4">
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Submit'}
          </Button>

          <Button
            variant="danger"
            size="sm"
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

export default SignUp