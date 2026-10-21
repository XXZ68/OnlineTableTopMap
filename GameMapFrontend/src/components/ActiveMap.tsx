import {
  useState,
  useEffect,
  useRef,
  type CSSProperties,
  type DragEvent,
} from 'react';
import * as signalR from '@microsoft/signalr';
import {
  TransformWrapper,
  TransformComponent,
} from 'react-zoom-pan-pinch';
import TokenBox from './TokenBox';
import { getApiMapId, postApiTokenMapMapIdPlaceCharacter, postApiTokenMapMapIdSpawnMonster } from '../api';
import { ActiveSpellDto, GridDto, MapDetailDto, MapTokenDto, ParticipantDto, SpellCastEventDto } from '../model';

type ActiveMapProps = {
  sessionId: string;
  mapId: string;
  currentParticipant: ParticipantDto;
};

// Generates a stable hue from the token name so similar tokens share a distinct theme
function getTokenBackgroundColor(name = 'Token'): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `radial-gradient(circle at 35% 35%, hsl(${hue}, 55%, 35%), hsl(${hue}, 65%, 15%))`;
}

// Extracts 1-2 character initials (e.g. "Goblin Boss" -> "GB", "Dragon" -> "DR")
function getTokenInitials(name = 'T'): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ActiveMap({
  sessionId,
  mapId,
  currentParticipant,
}: ActiveMapProps) {
  // --- 1. STATE ---
  const [mapData, setMapData] = useState<MapDetailDto>();
  const [tokens, setTokens] = useState<MapTokenDto[]>([]);
  const [grid, setGrid] = useState<GridDto>();
  const [activeSpells, setActiveSpells] = useState<ActiveSpellDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<MapTokenDto>();

  // References
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Derived loading state
  const isLoading = !mapData || mapData.id !== mapId;

  // --- 2. FETCH INITIAL MAP DATA ---
  useEffect(() => {
    let isMounted = true;

    const loadMap = async () => {
      try {
        const response = await getApiMapId(mapId);
        const data = response.data as MapDetailDto;
        console.log(data)
        if (!isMounted) return;

        setMapData(data);
        setGrid(data.grid);
        setTokens(data.tokens || []);
        setActiveSpells(data.activeSpells || []);
        setError(null);
      } catch (err: unknown) {
        if (!isMounted) return;

        console.error('Failed to load map:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load map.',
        );
      }
    };

    void loadMap();

    return () => {
      isMounted = false;
    };
  }, [mapId]);
  // --- 3. SIGNALR REAL-TIME SYNC ---
  useEffect(() => {
    if (!sessionId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/map`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    connection.on(
      'TokenMoved',
      (tokenId: string, newGridX: number, newGridY: number) => {
        setTokens((prev) =>
          prev.map((token) =>
            token.id === tokenId
              ? { ...token, gridX: newGridX, gridY: newGridY }
              : token,
          ),
        );

        setSelectedToken((prev) =>
          prev && prev.id === tokenId
            ? { ...prev, gridX: newGridX, gridY: newGridY }
            : prev,
        );
      },
    );

    connection.on('TokenSpawned', (newToken: MapTokenDto) => {
      setTokens((prev) =>
        prev.some((t) => t.id === newToken.id) ? prev : [...prev, newToken],
      );
    });

    connection.on('TokenHpChanged', (tokenId: string, newHp: number) => {
      setTokens((prev) =>
        prev.map((token) =>
          token.id === tokenId ? { ...token, currentHp: newHp } : token,
        ),
      );

      setSelectedToken((prev) =>
        prev && prev.id === tokenId ? { ...prev, currentHp: newHp } : prev,
      );
    });

    connection.on('TokenRemoved', (tokenId: string) => {
      setTokens((prev) => prev.filter((token) => token.id !== tokenId));
      setSelectedToken((prev) => (prev && prev.id === tokenId ? undefined : prev));
    });

    connection.on('GridUpdated', (updatedGrid: GridDto) => {
      setGrid(updatedGrid);
    });

    connection.on('SpellCasted', (spellEvent: SpellCastEventDto) => {
      setActiveSpells((prev) => [...prev, spellEvent]);
    });

    connection.on('SpellDismissed', (spellId: string) => {
      setActiveSpells((prev) =>
        prev.filter(
          (spell) => spell.id !== spellId,
        ),
      );
    });

    connection
      .start()
      .then(async () => {
        await connection.invoke(
          'JoinSession',
          sessionId,
          currentParticipant.playerId,
          currentParticipant.playerName,
        );
      })
      .catch((err: unknown) => {
        console.error('SignalR error:', err);
      });

    hubConnectionRef.current = connection;

    return () => {
      if (hubConnectionRef.current) {
        hubConnectionRef.current
          .invoke('LeaveSession', sessionId, currentParticipant.playerId)
          .catch(() => {})
          .finally(() => {
            hubConnectionRef.current?.stop();
          });
      }
    };
  }, [sessionId, currentParticipant.playerId, currentParticipant.playerName]);

  // --- 4. TOKEN DRAG & DROP WITH GEOMETRIC PROJECTION ---
  const canMoveToken = (token: MapTokenDto) => {
    if (currentParticipant?.isDungeonMaster) return true;
    if (token.isLocked) return false;
    return token.characterId === currentParticipant?.selectedCharacterId;
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, token: MapTokenDto) => {
    if (!canMoveToken(token)) {
      event.preventDefault();
      return;
    }
    if (token.id) {
      event.dataTransfer.setData('text/plain', token.id);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!grid || !mapContainerRef.current || !mapData || !mapData.widthInPixels || !mapData.heightInPixels) return;

    // 1. Get real-time post-transform bounding rectangle
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    // 2. Exact unscaled canvas coordinates
      const canvasX = ((event.clientX - rect.left) / rect.width) * mapData.widthInPixels;
      const canvasY = ((event.clientY - rect.top) / rect.height) * mapData.heightInPixels;

    const cellSize = grid.cellSizeInPixels || 50;

    // 3. Offset by half cell so the center aligns with release point
    const tokenRadius = cellSize / 2;
    const dropCenterX = canvasX - tokenRadius;
    const dropCenterY = canvasY - tokenRadius;

    // 4. Snap to nearest grid index
    const targetGridX = Math.round((dropCenterX - (grid.offsetX || 0)) / cellSize);
    const targetGridY = Math.round((dropCenterY - (grid.offsetY || 0)) / cellSize);

    // --- CASE A: Spawning a Monster from TokenBox ---
    const monsterSpawnData = event.dataTransfer.getData('application/vtt-spawn-monster');
    if (monsterSpawnData) {
      const monster = JSON.parse(monsterSpawnData) as {
        monsterIndex: string | number;
        name: string;
      };
      try {
        const res = await postApiTokenMapMapIdSpawnMonster(
          mapId,
          {
            monsterIndex: String(monster.monsterIndex),
            gameSessionId: sessionId || undefined,
            gridX: targetGridX,
            gridY: targetGridY,
            customName: monster.name,
          },
          sessionId ? { sessionId } : undefined,
        );
        // Add token to board immediately (and prevent duplicate when SignalR event arrives)
        setTokens((prev) =>
          prev.some((t) => t.id === res.data.id) ? prev : [...prev, res.data],
        );
      } catch (err: unknown) {
        console.error('Failed to spawn monster:', err);
      }
      return;
    }


    // --- CASE B: Placing a Character from TokenBox ---
    const characterPlaceData = event.dataTransfer.getData('application/vtt-place-character');
    if (characterPlaceData && sessionId) {
      const character = JSON.parse(characterPlaceData) as { characterId: string };

      try {
        await postApiTokenMapMapIdPlaceCharacter(
          mapId,
          {
            characterId: character.characterId,
            gameSessionId: sessionId,
            gridX: targetGridX,
            gridY: targetGridY,
          },
          { sessionId },
        );
      } catch (err: unknown) {
        console.error('Failed to place character:', err);
      }
      return;
    }

    // --- CASE C: Moving an Existing Board Token ---
    const tokenId = event.dataTransfer.getData('text/plain');
    if (tokenId) {
      setTokens((prev) =>
        prev.map((token) =>
          token.id === tokenId
            ? { ...token, gridX: targetGridX, gridY: targetGridY }
            : token,
        ),
      );

      if (hubConnectionRef.current) {
        try {
          await hubConnectionRef.current.invoke(
            'MoveToken',
            sessionId,
            tokenId,
            targetGridX,
            targetGridY,
          );
        } catch (err: unknown) {
          console.error('Failed to sync token move:', err);
        }
      }
    }
  };

  // --- 5. RENDER ---
  if (error) {
    return <div style={{ color: '#ff6b6b', padding: '20px' }}>Error: {error}</div>;
  }

  if (isLoading) {
    return <div style={{ color: '#fff', padding: '20px' }}>Loading Battle Map...</div>;
  }

  const cellSize = grid?.cellSizeInPixels || 50;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#121212',
      }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.2}
        maxScale={4}
        centerOnInit={true}
        wheel={{
          step: 0.001,
        }}
        panning={{
          excluded: ['vtt-token'],
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* FLOATING ZOOM CONTROLS */}
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 100,
                display: 'flex',
                gap: '8px',
                background: 'rgba(20, 20, 20, 0.85)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <button
                type="button"
                onClick={() => zoomIn()}
                style={buttonStyle}
                title="Zoom In"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => zoomOut()}
                style={buttonStyle}
                title="Zoom Out"
              >
                -
              </button>

              <button
                type="button"
                onClick={() => resetTransform()}
                style={{
                  ...buttonStyle,
                  width: 'auto',
                  padding: '0 10px',
                  fontSize: '12px',
                }}
                title="Reset View"
              >
                Reset
              </button>
            </div>

            {/* PAN & ZOOM CANVAS */}
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <div
                ref={mapContainerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  position: 'relative',
                  width: mapData.widthInPixels,
                  height: mapData.heightInPixels,
                  backgroundImage: `url(${mapData.imageUrl})`,
                  backgroundSize: 'cover',
                  userSelect: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  overflow: 'visible',
                }}
              >
                {/* SVG GRID OVERLAY */}
                {grid && (
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                  >
                    <defs>
                      <pattern
                        id="gridPattern"
                        width={cellSize}
                        height={cellSize}
                        patternUnits="userSpaceOnUse"
                        x={grid.offsetX || 0}
                        y={grid.offsetY || 0}
                      >
                        <path
                          d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                          fill="none"
                          stroke={grid.lineColor || '#ffffff'}
                          strokeWidth="1"
                          strokeOpacity={grid.lineOpacity ?? 0.3}
                        />
                      </pattern>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#gridPattern)" />

                    {/* Spell Templates */}
                    {activeSpells.map((spell) => {
                      const originX =
                        (grid.offsetX || 0) +
                        (spell.originGridX ?? 0) * cellSize +
                        cellSize / 2;

                      const originY =
                        (grid.offsetY || 0) +
                        (spell.originGridY ?? 0) * cellSize +
                        cellSize / 2;

                      const radiusPx = (spell.radiusInCells || 1) * cellSize;

                      return (
                        <circle
                          key={spell.id}
                          cx={originX}
                          cy={originY}
                          r={radiusPx}
                          fill={spell.colorHex || '#ff0055'}
                          fillOpacity={0.3}
                          stroke={spell.colorHex || '#ff0055'}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </svg>
                )}

                {/* TOKENS LAYER */}
                {tokens.map((token) => {
                  if (!token.isVisibleToPlayers && !currentParticipant?.isDungeonMaster) {
                    return null;
                  }

                  const size = (token.sizeInCells || 1) * cellSize;
                  const left = (grid?.offsetX || 0) + token.gridX! * cellSize;
                  const top = (grid?.offsetY || 0) + token.gridY! * cellSize;
                  const draggable = canMoveToken(token);
                  const isSelected = selectedToken?.id === token.id;
                  const hasImage = false;
                  const tokenName = token.name || 'Token';

                  return (
                    <div
                      key={token.id}
                      className="vtt-token"
                      draggable={draggable}
                      onDragStart={(event) => handleDragStart(event, token)}
                      onClick={() => {
                        if (currentParticipant?.isDungeonMaster) {
                          setSelectedToken(token);
                        }
                      }}
                      title={`${tokenName} (${token.currentHp}/${token.maxHp} HP)`}
                      style={{
                        position: 'absolute',
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: '50%',
                        background: hasImage
                          ? `url(${token.tokenImageUrl}) center/cover no-repeat`
                          : getTokenBackgroundColor(tokenName),
                        border: isSelected
                          ? '3px solid #f59e0b'
                          : draggable
                          ? '2px solid #52b788'
                          : '2px solid #444',
                        boxShadow: isSelected
                          ? '0 0 12px #f59e0b, inset 0 0 10px rgba(0,0,0,0.8)'
                          : '0 3px 8px rgba(0,0,0,0.7), inset 0 0 8px rgba(0,0,0,0.7)',
                        cursor: draggable ? 'grab' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        userSelect: 'none',
                      }}
                    >
                      {/* Initials Placeholder when token has no image */}
                      {!hasImage && (
                        <span
                          style={{
                            marginTop: 'auto',
                            marginBottom: 'auto',
                            fontSize: `${Math.max(12, size * 0.35)}px`,
                            fontWeight: '900',
                            color: '#f8fafc',
                            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 2px #000',
                            letterSpacing: '0.5px',
                            pointerEvents: 'none',
                          }}
                        >
                          {getTokenInitials(tokenName)}
                        </span>
                      )}

                      {/* Readable name banner when token has no image */}
                      {!hasImage && (
                        <div
                          style={{
                            width: '92%',
                            textAlign: 'center',
                            fontSize: `${Math.max(9, Math.min(12, size * 0.18))}px`,
                            fontWeight: '600',
                            color: '#ffffff',
                            textShadow: '0 1px 2px #000, 0 0 4px #000',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            background: 'rgba(0, 0, 0, 0.65)',
                            borderRadius: '3px',
                            padding: '1px 3px',
                            marginBottom: '2px',
                            pointerEvents: 'none',
                          }}
                        >
                          {tokenName}
                        </div>
                      )}

                      {/* Health Bar */}
                      <div
                        style={{
                          width: '80%',
                          height: '4px',
                          background: 'rgba(0,0,0,0.8)',
                          borderRadius: '2px',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.8)',
                          marginTop: hasImage ? 'auto' : '0',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, (token.currentHp! / token.maxHp!) * 100),
                            )}%`,
                            height: '100%',
                            background:
                              token.currentHp! / token.maxHp! > 0.3
                                ? '#2dc653'
                                : '#d90429',
                            transition: 'width 0.2s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* GM TOKENBOX DRAWER */}
      {currentParticipant?.isDungeonMaster && (
        <TokenBox
          sessionId={sessionId}
          selectedToken={selectedToken}
          onCloseInspector={() => setSelectedToken(undefined)}
          onHpChanged={(id: string, newHp: number) => {
            setTokens((prev) =>
              prev.map((token) =>
                token.id === id ? { ...token, currentHp: newHp } : token,
              ),
            );
          }}
          onTokenDeleted={(id: string) => {
            setTokens((prev) => prev.filter((token) => token.id !== id));
            setSelectedToken(undefined);
          }}
        />
      )}
    </div>
  );
}

const buttonStyle: CSSProperties = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#2b2b2b',
  color: '#ffffff',
  border: '1px solid #444',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
};
