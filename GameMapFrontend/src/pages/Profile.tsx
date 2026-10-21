import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NavBar from '../components/layoutComponents/NavBar'
import { useLocation } from 'react-router-dom'

export default function Profile() {

  const { state } = useLocation()

  const userId = state?.userId
  const username = state?.username
  console.log(userId, username)
  return (
    <>
     <NavBar />

      <SimpleSectionCard>
        <div>Change Username</div>
        <div>Change Passwort</div>
      </SimpleSectionCard>
    </>
  )
}
