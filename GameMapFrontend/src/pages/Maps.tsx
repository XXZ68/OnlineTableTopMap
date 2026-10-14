import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NavBar from '../components/layoutComponents/NavBar'
import LayoutDM from '../layouts/LayoutDM'

export default function Maps() {
  return (
    <>
     <NavBar />
      <SimpleSectionCard>
        <div>
          Hier könnten alle upgeloadeten/gespielten Karten aufgelistet werden
        </div>
      </SimpleSectionCard>
    </>
  )
}
