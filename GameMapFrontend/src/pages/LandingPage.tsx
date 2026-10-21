import { useState } from 'react'
import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import ThemeToggle from '../components/ThemeToggle'
import LogIn from '../components/userActions/LogIn'
import CreateGame from '../components/userActions/JoinGame'
import Button from '../components/atoms/Button'
import { useNavigate } from 'react-router-dom'
import { AuthResponseDto } from '../model'


export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isJoinGame, setIsJoinGame] = useState(false)

  const navigate = useNavigate()

  function handleAuthSuccess(user: AuthResponseDto) {
    navigate('/profile', {
      state: {
        userId: user.userId,
        username: user.username,
      },
    })
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <SimpleSectionCard className="flex flex-row gap-4 w-full">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsJoinGame(true)}
        >
          Join Game
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => setIsLoginOpen(true)}
        >
          Log In
        </Button>
      </SimpleSectionCard>

      {/* Render Modals */}
      <CreateGame
        isOpen={isJoinGame}
        onClose={() => setIsJoinGame(false)}
      />

      <LogIn
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleAuthSuccess}
      />
    </div>
  )
}
