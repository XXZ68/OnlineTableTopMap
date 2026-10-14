import { useState } from 'react'
import ActionBar from '../components/gameComponents/ActionBar'
import { SimpleSectionCard } from '../components/atoms/SimpleSectionCard'
import NotesForm from '../components/gameComponents/NotesForm'
import Inventory from '../components/gameComponents/Inventory'
import Actions from '../components/gameComponents/Actions'
import NavBar from '../components/layoutComponents/NavBar'

type PanelName = 'notes' | 'inventory' | 'spells'

function Main() {
  const [activePanel, setActivePanel] = useState<PanelName | null>(null)

  const togglePanel = (panelName: PanelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName))
  }

  return (
    <>
     <NavBar />
      {/* Content wrapper: Simplified classes to prevent escaping containment */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl w-full mx-auto p-6">

        {/* Left Side: Main Game Board */}
        <div className="flex-1 min-w-0">
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
        </div>

        {/* Right Side: Toggle Panel */}
        {activePanel && (
          <div className="w-full lg:w-66 shrink-0 transition-all duration-300">
            <SimpleSectionCard>
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-lg capitalize">
                  {activePanel}
                </h3>

                <button
                  onClick={() => setActivePanel(null)}
                  className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Render content based on what is active */}
              <div className="mt-2">
                {activePanel === 'notes' && <NotesForm />}
                {activePanel === 'inventory' && <Inventory />}
                {activePanel === 'spells' && <Actions />}
              </div>
            </SimpleSectionCard>
          </div>
        )}
      </div>

      {/* State control on ActionBar */}
      <ActionBar
        activePanel={activePanel}
        onTogglePanel={togglePanel}
      />
    </>
  )
}

export default Main
