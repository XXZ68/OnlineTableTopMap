import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import LayoutGame from '../components/layoutComponents/LayoutGame'

function Main() {
  return (
    <LayoutGame>
      {/* Main Game Board specific to this page */}
      <SimpleSectionCard>
        <h2 className="text-xl font-bold mb-4">
          Hier wird das Main GameBoard geladen
        </h2>

        <p className="text-gray-300 leading-relaxed">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Libero
          soluta quaerat fugiat quo, perferendis ratione perspiciatis optio
          ad ut explicabo nobis quos voluptatem...
        </p>
      </SimpleSectionCard>
    </LayoutGame>
  )
}

export default Main
