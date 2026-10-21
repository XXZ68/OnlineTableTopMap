import { useState } from 'react'
import Button from '../atoms/Button'
import ThemeToggle from '../ThemeToggle'
import CreateGame from '../userActions/CreateGame'
import CreateCampaign from '../userActions/CreateCampaign'

export default function NavBar() {

  const [createGame, setCreateGame] = useState(false)
  const [createCampaign, setCreateCampaign] = useState(false)

  return (
    <nav className="flex items-center justify-between px-8 py-4 shadow-md">
      {/* Logo */}
      <a
        href="/"
        className="text-xl font-bold tracking-wide hover:text-gray-300 transition-colors"
      >
        OTTM
      </a>

      {/* Navigation Links */}
      <ul className="flex items-center gap-6 m-0 p-0 list-none">    
        
        <li>
          <a
            href="/profile"
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            Profile Managment
          </a>
        </li>  

        <li>
          <Button variant='primary' onClick={() => setCreateCampaign(true)}>
            Create Campaign
          </Button>
        </li>        
        <li>
          <Button variant='primary' onClick={() => setCreateGame(true)}>
            Create Game
          </Button>
        </li>

        <li>
          <a
            href="/"
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            Leave
          </a>
        </li>
      </ul>

      <div>
        <ThemeToggle />
      </div>

      {createGame && (<CreateGame onClose={() => setCreateGame(false)} isOpen={createGame} />)}
      {createCampaign && (<CreateCampaign onClose={() => setCreateCampaign(false)} isOpen={createCampaign} />)}
    </nav>
  )
}