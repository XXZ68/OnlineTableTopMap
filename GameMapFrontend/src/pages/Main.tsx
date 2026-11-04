import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NavBar from '../components/layoutComponents/NavBar'
import Button from '../components/atoms/Button'
import CreateCampaign from '../components/userActions/CreateCampaign'
import CreateGame from '../components/userActions/CreateGame'
import AddMap from '../components/userActions/addMap'

function Main() {

  const { state } = useLocation()

  const userId = state?.userId
  const username = state?.username
  console.log(userId, username)
  const [addMap, setAddMap] = useState(false)
  const [createGame, setCreateGame] = useState(false)

  return (
    <>
    <NavBar />
    <div className="flex justify-evenly baseline mt-5">

      <SimpleSectionCard>
        <Button variant='primary' onClick={() => setCreateGame(true)}>
          Create Game
        </Button>
      </SimpleSectionCard>


      <SimpleSectionCard>
        <Button variant='secondary' onClick={() => setAddMap(true)}>
          Add Map
        </Button>
      </SimpleSectionCard>
    </div>

    {createGame && <CreateGame onClose={() => setCreateGame(false)} isOpen={createGame} currentUser={userId ? { userId, username } : null} />}
    {addMap && <AddMap onClose={() => setAddMap(false)} isOpen={addMap} />}
    
    </>
  )
}

export default Main
