import { useState } from 'react'
import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NavBar from '../components/layoutComponents/NavBar'
import CreateCampaign from '../components/userActions/CreateCampaign'
import CreateGame from '../components/userActions/CreateGame'
import LayoutDM from '../layouts/LayoutDM'

export default function Profile() {

  const [createCampaign, setCreateCampaign] = useState(false);
  const [createGame, setCreateGame] = useState(false);
  return (
    <>
     <NavBar />
      <SimpleSectionCard>
        <div><button onClick={() => setCreateCampaign(true)}>Create Campaign</button></div>
        <div><button onClick={() => setCreateGame(true)}>Create Game</button></div>
      </SimpleSectionCard>

      <SimpleSectionCard>
        <div>Change Username</div>
        <div>Change Passwort</div>
      </SimpleSectionCard>

      <CreateCampaign onClose={() => setCreateCampaign(false) } isOpen={createCampaign} />
      <CreateGame onClose={() => setCreateGame(false)} isOpen={createGame} />
    </>
  )
}
