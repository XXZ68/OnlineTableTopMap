import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../atoms/Button'
import ThemeToggle from '../ThemeToggle'
import CreateCampaign from '../userActions/CreateCampaign'

export default function NavBar() {

  const [createCampaign, setCreateCampaign] = useState(false)

  const { state } = useLocation()

  const userId = state?.userId
  const username = state?.username
  console.log(userId, username)
  return (
    <nav className="flex items-center justify-between px-8 py-4 shadow-md">
      {/* Logo */}
      <a
        href="/"
        className="text-xl font-bold tracking-wide hover:text-gray-300 transition-colors"
      >
        Hi {username}
      </a>

      {/* Navigation Links */}
      <ul className="flex items-center gap-6 m-0 p-0 list-none">     

        <li>
          <Button variant='primary' onClick={() => setCreateCampaign(true)}>
            Create Campaign
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

      {createCampaign && (<CreateCampaign onClose={() => setCreateCampaign(false)} isOpen={createCampaign} />)}
    </nav>
  )
}