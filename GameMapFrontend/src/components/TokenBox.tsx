import {
  useEffect,
  useState,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
} from 'react'

const BACKEND_URL = 'http://localhost:5089'

export type Token = {
  id: string
  name: string
  gridX: number
  gridY: number
  sizeInCells?: number
  currentHp: number
  maxHp: number
}

export type Monster = {
  index: string
  name: string
  challengeRating: string | number
  size: string
  armorClass: number
  hitPoints: number
  tokenImageUrl?: string | null
}

export type Character = {
  id: string
  name: string
  level: number
  currentHp: number
  maxHp: number
  armorClass: number
}

type TokenInspectorProps = {
  token: Token
  sessionId: string | null
  onClose: () => void
  onHpChanged?: (id: string, newHp: number) => void
  onTokenDeleted?: (id: string) => void
}

export type TokenBoxProps = {
  sessionId: string | null
  selectedToken: Token | null
  onCloseInspector: () => void
  onHpChanged: (id: string, newHp: number) => void
  onTokenDeleted: (id: string) => void
}

// ---------------------------------------------------------------------------
// 1. SUBCOMPONENT: Token Inspector
// Using key={selectedToken.id} resets local state with NO useEffect needed
// ---------------------------------------------------------------------------
function TokenInspector({
  token,
  sessionId,
  onClose,
  onHpChanged,
  onTokenDeleted,
}: TokenInspectorProps) {
  const [hp, setHp] = useState(String(token.currentHp))
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveHp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const url = new URL(`${BACKEND_URL}/api/Token/${token.id}/hp`)
      if (sessionId) {
        url.searchParams.append('sessionId', sessionId)
      }

      const newHp = Number(hp)
      const res = await fetch(url.toString(), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newHp,
        }),
      })

      if (res.ok) {
        onHpChanged?.(token.id, newHp)
      }
    } catch (err: unknown) {
      console.error('Failed to update HP:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const url = new URL(`${BACKEND_URL}/api/Token/${token.id}`)
      if (sessionId) {
        url.searchParams.append('sessionId', sessionId)
      }

      const res = await fetch(url.toString(), {
        method: 'DELETE',
      })

      if (res.ok) {
        onTokenDeleted?.(token.id)
        onClose()
      }
    } catch (err: unknown) {
      console.error('Failed to remove token:', err)
    }
  }

  return (
    <div
      style={{
        padding: '14px',
        borderTop: '1px solid #333',
        background: '#141414',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <strong
          style={{
            color: '#e0a96d',
            fontSize: '14px',
          }}
        >
          {token.name}
        </strong>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#888',
          margin: '4px 0 10px 0',
        }}
      >
        Pos: ({token.gridX}, {token.gridY}) | Size:{' '}
        {token.sizeInCells || 1}x{token.sizeInCells || 1}
      </div>

      <form
        onSubmit={handleSaveHp}
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            color: '#aaa',
            fontSize: '12px',
          }}
        >
          HP:
        </span>

        <input
          type="number"
          value={hp}
          onChange={(event) => setHp(event.target.value)}
          style={{
            width: '60px',
            padding: '4px 6px',
            background: '#111',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
          }}
        />

        <span
          style={{
            color: '#666',
            fontSize: '12px',
          }}
        >
          / {token.maxHp}
        </span>

        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: '5px 10px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {isSaving ? '...' : 'Save'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        style={{
          width: '100%',
          marginTop: '8px',
          padding: '6px',
          background: '#7f1d1d',
          color: '#fca5a5',
          border: '1px solid #991b1b',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        Remove from Board
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. SUBCOMPONENT: Custom Monster Form
// ---------------------------------------------------------------------------
function CustomMonsterForm({
  onAddMonster,
}: {
  onAddMonster: (monster: Monster) => void
}) {
  const [name, setName] = useState('')
  const [hp, setHp] = useState('10')
  const [ac, setAc] = useState('10')
  const [size, setSize] = useState('Medium')
  const [imageUrl, setImageUrl] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return

    onAddMonster({
      index: `custom-${Date.now()}`,
      name: name.trim(),
      hitPoints: Number(hp) || 10,
      armorClass: Number(ac) || 10,
      size,
      challengeRating: 'Custom',
      tokenImageUrl: imageUrl.trim() || null,
    })

    setName('')
    setImageUrl('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px',
        background: '#222',
        border: '1px solid #3a3a3a',
        borderRadius: '4px',
        marginBottom: '12px',
      }}
    >
      <input
        type="text"
        placeholder="Name (e.g. Bandit Captain)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={formInputStyle}
      />

      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="number"
          placeholder="HP"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          style={{ ...formInputStyle, width: '50%' }}
        />
        <input
          type="number"
          placeholder="AC"
          value={ac}
          onChange={(e) => setAc(e.target.value)}
          style={{ ...formInputStyle, width: '50%' }}
        />
      </div>

      <select
        value={size}
        onChange={(e) => setSize(e.target.value)}
        style={{ ...formInputStyle, cursor: 'pointer' }}
      >
        <option value="Tiny">Tiny (1/2 cell)</option>
        <option value="Small">Small (1 cell)</option>
        <option value="Medium">Medium (1 cell)</option>
        <option value="Large">Large (2x2 cells)</option>
        <option value="Huge">Huge (3x3 cells)</option>
        <option value="Gargantuan">Gargantuan (4x4 cells)</option>
      </select>

      <input
        type="url"
        placeholder="Token Image URL (optional)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        style={formInputStyle}
      />

      <button
        type="submit"
        style={{
          marginTop: '4px',
          padding: '6px',
          background: '#b45309',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        Save Custom Token
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// 3. MAIN COMPONENT: TokenBox Drawer
// ---------------------------------------------------------------------------
export default function TokenBox({
  sessionId,
  selectedToken,
  onCloseInspector,
  onHpChanged,
  onTokenDeleted,
}: TokenBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'monsters' | 'custom' | 'characters'>('monsters')
  const [searchQuery, setSearchQuery] = useState('')
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [customMonsters, setCustomMonsters] = useState<Monster[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)

  // 1. SRD Monsters search
  useEffect(() => {
    if (activeTab !== 'monsters') return

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/Compendium/monsters?query=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        )

        if (!res.ok) throw new Error('Failed to fetch monsters')
        const data: Monster[] = await res.json()
        setMonsters(data)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [searchQuery, activeTab])

  // 2. Fetch Characters (queued asynchronously to avoid cascading renders)
  useEffect(() => {
    if (activeTab !== 'characters' || !sessionId) return

    const controller = new AbortController()

    async function loadCharacters() {
      setLoading(true)
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/Character/session/${sessionId}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error('Failed to fetch session characters')
        const data: Character[] = await res.json()
        setCharacters(data)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const id = setTimeout(loadCharacters, 0)
    return () => {
      clearTimeout(id)
      controller.abort()
    }
  }, [sessionId, activeTab])

  // 3. Drag handlers
  const handleDragMonsterStart = (
    event: DragEvent<HTMLDivElement>,
    monster: Monster
  ) => {
    event.dataTransfer.setData(
      'application/vtt-spawn-monster',
      JSON.stringify({
        monsterIndex: monster.index,
        name: monster.name,
      })
    )
    event.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragCharacterStart = (
    event: DragEvent<HTMLDivElement>,
    character: Character
  ) => {
    event.dataTransfer.setData(
      'application/vtt-place-character',
      JSON.stringify({
        characterId: character.id,
      })
    )
    event.dataTransfer.effectAllowed = 'copy'
  }

  const isDrawerOpen = isOpen || Boolean(selectedToken)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '320px',
        height: '100%',
        background: '#1a1a1a',
        borderLeft: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.6)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
      }}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          left: '-36px',
          top: '20px',
          width: '36px',
          height: '42px',
          background: '#1a1a1a',
          color: '#e0a96d',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
        title="Toggle TokenBox"
      >
        {isDrawerOpen ? '▶' : '🧰'}
      </button>

      {/* Header & Mode Tabs */}
      <div style={{ padding: '14px', borderBottom: '1px solid #333' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#f5f5f5', fontSize: '15px' }}>
          GM TokenBox
        </h3>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('monsters')}
            style={activeTab === 'monsters' ? activeTabStyle : inactiveTabStyle}
          >
            SRD
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            style={activeTab === 'custom' ? activeTabStyle : inactiveTabStyle}
          >
            Custom
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            style={activeTab === 'characters' ? activeTabStyle : inactiveTabStyle}
          >
            Party
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* TAB 1: SRD Monsters */}
        {activeTab === 'monsters' && (
          <>
            <input
              type="text"
              placeholder="Search monsters (e.g. Goblin, Dragon)..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={inputStyle}
            />

            {loading && <div style={subtextStyle}>Searching SRD...</div>}

            {!loading && monsters.length === 0 && (
              <div style={subtextStyle}>No monsters found.</div>
            )}

            {monsters.map((monster) => (
              <div
                key={monster.index}
                draggable
                onDragStart={(event) => handleDragMonsterStart(event, monster)}
                style={itemCardStyle}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#fff' }}>{monster.name}</strong>
                  <span style={badgeStyle}>CR {monster.challengeRating}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                  Size: {monster.size} | AC: {monster.armorClass} | HP: {monster.hitPoints}
                </div>
              </div>
            ))}
          </>
        )}

        {/* TAB 2: Custom Monsters */}
        {activeTab === 'custom' && (
          <div>
            <CustomMonsterForm
              onAddMonster={(m) => setCustomMonsters((prev) => [m, ...prev])}
            />

            {customMonsters.length === 0 ? (
              <div style={subtextStyle}>No custom monsters created yet.</div>
            ) : (
              customMonsters.map((monster) => (
                <div
                  key={monster.index}
                  draggable
                  onDragStart={(event) => handleDragMonsterStart(event, monster)}
                  style={{ ...itemCardStyle, borderColor: '#78350f' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#fcd34d' }}>{monster.name}</strong>
                    <span style={{ ...badgeStyle, background: '#78350f', color: '#fef08a' }}>
                      Custom
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                    Size: {monster.size} | AC: {monster.armorClass} | HP: {monster.hitPoints}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Session Characters */}
        {activeTab === 'characters' && (
          <>
            {characters.length === 0 ? (
              <div style={subtextStyle}>No characters registered in session.</div>
            ) : (
              characters.map((character) => (
                <div
                  key={character.id}
                  draggable
                  onDragStart={(event) => handleDragCharacterStart(event, character)}
                  style={itemCardStyle}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#fff' }}>{character.name}</strong>
                    <span style={badgeStyle}>Lvl {character.level}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                    HP: {character.currentHp}/{character.maxHp} | AC: {character.armorClass}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Inspector Drawer Footer */}
      {selectedToken && (
        <TokenInspector
          key={selectedToken.id}
          token={selectedToken}
          sessionId={sessionId}
          onClose={onCloseInspector}
          onHpChanged={onHpChanged}
          onTokenDeleted={onTokenDeleted}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const activeTabStyle: CSSProperties = {
  flex: 1,
  padding: '6px 4px',
  background: '#e0a96d',
  color: '#1a1a1a',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 'bold',
  fontSize: '11px',
  cursor: 'pointer',
}

const inactiveTabStyle: CSSProperties = {
  flex: 1,
  padding: '6px 4px',
  background: '#2b2b2b',
  color: '#aaa',
  border: '1px solid #444',
  borderRadius: '4px',
  fontSize: '11px',
  cursor: 'pointer',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  background: '#111',
  border: '1px solid #444',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '12px',
  marginBottom: '10px',
  boxSizing: 'border-box',
}

const formInputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#111',
  border: '1px solid #444',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '11px',
  boxSizing: 'border-box',
}

const itemCardStyle: CSSProperties = {
  padding: '8px 10px',
  marginBottom: '8px',
  background: '#252525',
  border: '1px solid #383838',
  borderRadius: '4px',
  cursor: 'grab',
  userSelect: 'none',
}

const badgeStyle: CSSProperties = {
  fontSize: '10px',
  background: '#333',
  color: '#e0a96d',
  padding: '2px 5px',
  borderRadius: '3px',
}

const subtextStyle: CSSProperties = {
  fontSize: '12px',
  color: '#666',
  textAlign: 'center',
  padding: '20px 0',
}
