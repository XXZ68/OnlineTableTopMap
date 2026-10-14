import { useState, ReactNode } from 'react'
import NavBar from "./NavBar"
import ActionBar from "../gameComponents/ActionBar"
import { SimpleSectionCard } from "../atoms/SimpleSectionCard"
import NotesForm from "../gameComponents/NotesForm"
import Inventory from "../gameComponents/Inventory"
import Actions from "../gameComponents/Actions"

type PanelName = 'notes' | 'inventory' | 'spells'

interface LayoutGameProps {
  children: ReactNode
}

export default function LayoutGame({ children }: LayoutGameProps) {
  const [activePanel, setActivePanel] = useState<PanelName | null>(null)

  const togglePanel = (panelName: PanelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName))
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Persistent Navigation */}
      <NavBar />

      {/* Main Responsive Wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-7xl w-full mx-auto p-6 pb-24">
        
        {/* Page Content Area (dynamically injected here) */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Persistent Shared Right Drawer Panel */}
        {activePanel && (
          <aside className="w-full lg:w-80 shrink-0 transition-all duration-300">
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

              {/* Dynamic Panel Content */}
              <div className="mt-2">
                {activePanel === 'notes' && <NotesForm />}
                {activePanel === 'inventory' && <Inventory />}
                {activePanel === 'spells' && <Actions />}
              </div>
            </SimpleSectionCard>
          </aside>
        )}
      </div>

      {/* Persistent Bottom Action Bar */}
      <ActionBar
        activePanel={activePanel}
        onTogglePanel={togglePanel}
      />
    </div>
  )
}
