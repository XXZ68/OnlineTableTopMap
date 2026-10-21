import { useState, type FormEvent } from 'react'
import Modal from '../atoms/Modal'
import TextInput from '../atoms/TextInput'
import SignUp from './SignUp'
import Button from '../atoms/Button'
import { postApiAuthLogin } from '../../api'
import { AuthResponseDto } from '../../model'
import { useNavigate } from 'react-router-dom'

type LogInProps = {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: (user: AuthResponseDto) => void
}

function LogIn({
  isOpen,
  onClose,
  onLoginSuccess,
}: LogInProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  function handleAuthSuccess(user: AuthResponseDto) {
    navigate('/profile', {
      state: {
        userId: user.userId,
        username: user.username,
      },
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Bitte gib Benutzername und Passwort ein.')
      return
    }

    setLoading(true)

    try {
      const response = await postApiAuthLogin({
        username: username.trim(),
        password,
      })

      const user = response.data

      // User-Daten an die übergeordnete Komponente weitergeben
      onLoginSuccess?.(user)

      setPassword('')
      onClose()
    } catch (err: unknown) {
      setError(
        'Anmeldung fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.',
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <>
      <Modal onClose={onClose} isOpen={isOpen}>
        <h2>Log in</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <TextInput
              placeholder="Name"
              className="w-full px-3 py-3"
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
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <Button
            variant="primary"
            className="mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Submit'}
          </Button>
        </form>

        <hr className="m-4" />

        <div className="mb-4">
          You don't have an account yet?
        </div>

        <Button
          variant="secondary"
          onClick={() => setIsSignUp(true)}
        >
          Sign up
        </Button>
      </Modal>

      <SignUp
        isOpen={isSignUp}
        onClose={() => setIsSignUp(false)}
        onRegisterSuccess={() => {handleAuthSuccess}}
      />
    </>
  )
}

export default LogIn