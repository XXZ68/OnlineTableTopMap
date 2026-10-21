import type { MapSummaryDto } from '../../model'

type GameNavBarProps = Readonly<{
  maps: MapSummaryDto[]
  selectedMapId: string
  isDungeonMaster: boolean
  sessionId: string
  onMapChange: (mapId: string) => void
  onToggleRole: () => void
  onCreateSession: () => Promise<void>
  onLeaveSession: () => void
}>

export default function GameNavBar({
  maps,
  selectedMapId,
  isDungeonMaster,
  sessionId,
  onMapChange,
  onToggleRole,
  onCreateSession,
  onLeaveSession,
}: GameNavBarProps) {
  return (
    <header className="absolute left-0 top-0 z-[100] flex min-h-[58px] w-full flex-wrap items-center justify-between gap-x-[14px] gap-y-[10px] border-b border-white/15 bg-[#0e141c]/95 px-[18px] py-[9px] text-[13px] leading-[1.2] text-[#edf2f7] shadow-[0_8px_24px_rgba(0,0,0,0.24)] backdrop-blur-[14px] [font-family:'Segoe_UI',sans-serif] min-[901px]:flex-nowrap max-[600px]:justify-start max-[600px]:px-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3 min-[901px]:flex-nowrap max-[600px]:w-full max-[600px]:gap-2">
        <span className="mr-auto inline-flex items-center gap-2 whitespace-nowrap text-sm font-bold text-[#f2c078] min-[601px]:mr-0">
          <span aria-hidden="true" className="grid size-[30px] place-items-center rounded-md border border-[#f2c078]/40 bg-[#f2c078]/10 text-[17px]">⚔</span>
          {' '}
          VTT Test Harness
        </span>

        <label className="flex items-center gap-[7px] text-[11px] font-bold uppercase tracking-[0.06em] text-[#aebdca]">
          <span>Map</span>

          <select
            className="min-h-[34px] max-w-[220px] rounded-md border border-[#3a4b5a] bg-[#202d38] py-0 pl-[10px] pr-[30px] text-xs text-[#f2f5f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2c078] max-[600px]:max-w-[42vw]"
            value={selectedMapId}
            onChange={(event) => onMapChange(event.target.value)}
          >
            {maps.map((map) => (
              <option key={map.id} value={map.id}>
                {map.title ||
                  `Map (${map.id!.substring(0, 8)}...)`}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onToggleRole}
          className={`min-h-[34px] whitespace-nowrap rounded-md border px-[11px] font-semibold text-[#f5f7f8] transition-[background-color,border-color,transform] duration-[140ms] hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2c078] ${isDungeonMaster ? 'border-[#a65f28] bg-[#65391f] hover:bg-[#784626]' : 'border-[#3d7580] bg-[#234b50] hover:bg-[#2c5d62]'}`}
        >
          <span className="mr-[5px] text-[10px] uppercase text-white/70">Role</span>
          {isDungeonMaster
            ? '👑 Dungeon Master'
            : '🛡️ Player'}
        </button>
      </div>

      <a className="ml-[2px] whitespace-nowrap text-xs text-[#b9c4cd] no-underline hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2c078] min-[601px]:ml-0" href="/">Leave game</a>

      <div className="flex min-w-0 flex-wrap items-center gap-3 min-[901px]:flex-nowrap max-[600px]:w-full max-[600px]:gap-2">
        {sessionId ? (
          <span className="inline-flex items-center gap-[7px] whitespace-nowrap font-mono text-[11px] text-[#c7e9d4]">
            <span className="size-[7px] rounded-full bg-[#63c98b] shadow-[0_0_9px_rgba(99,201,139,0.65)]" aria-hidden="true" />
            Session {sessionId.substring(0, 8)}...
          </span>
        ) : (
          <span className="whitespace-nowrap text-[11px] text-[#aebdca]">
            Standalone
          </span>
        )}

        <button
          type="button"
          onClick={onCreateSession}
          className="min-h-[34px] whitespace-nowrap rounded-md border border-[#34885a] bg-[#246841] px-[11px] font-semibold text-[#f5f7f8] transition-[background-color,border-color,transform] duration-[140ms] hover:-translate-y-px hover:bg-[#2d7b4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2c078]"
        >
          {sessionId
            ? 'New Session'
            : '+ Create Session'}
        </button>

        {sessionId && (
          <button
            type="button"
            onClick={onLeaveSession}
            className="min-h-[34px] whitespace-nowrap rounded-md border border-[#40515d] bg-[#303e49] px-[11px] font-semibold text-[#f5f7f8] transition-[background-color,border-color,transform] duration-[140ms] hover:-translate-y-px hover:bg-[#40515d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2c078]"
          >
            Leave Session
          </button>
        )}
      </div>
    </header>
  )
}
