import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NavBar from '../components/layoutComponents/NavBar'
import CreateCampaign from '../components/userActions/CreateCampaign'
import CreateGame from '../components/userActions/CreateGame'
import LayoutDM from '../layouts/LayoutDM'

export default function Profile() {
  return (
    <>
     <NavBar />
      <SimpleSectionCard>
        <div>Hier kommen Kacheln für CreateCampaign and Game</div>
      </SimpleSectionCard>
    </>
  )
}
