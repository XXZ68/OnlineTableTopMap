import { useLocation } from 'react-router-dom'
import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NavBar from '../components/layoutComponents/NavBar'

function Main() {

  const { state } = useLocation()

  const userId = state?.userId
  const username = state?.username
  console.log(userId, username)
  return (
    <>
    <NavBar />
    <SimpleSectionCard>
      Hier werden Campaigns gelistet
    </SimpleSectionCard>
    </>
  )
}

export default Main
