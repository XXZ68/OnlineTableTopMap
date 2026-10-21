type GameEventLogProps = Readonly<{
  logs: string[]
}>

export default function GameEventLog({ logs }: GameEventLogProps) {
  return (
    <aside
      aria-label="Game event log"
      className="absolute bottom-4 left-4 z-[100] flex max-h-[180px] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0f172a]/90 p-3 font-mono text-[11px] text-[#d6e0e6] shadow-[0_8px_28px_rgba(0,0,0,0.38)] backdrop-blur-md"
    >
      <div className="mb-2 flex shrink-0 items-center justify-between border-b border-white/10 pb-2">
        <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.12em] text-[#d2dbe2]">
          <span className="size-1.5 rounded-full bg-[#f2c078] shadow-[0_0_8px_rgba(242,192,120,0.65)]" aria-hidden="true" />
          {' '}
          Event log
        </span>
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#94a3b8]">
          {logs.length}
        </span>
      </div>

      <div
        role="log"
        aria-label="Activity entries"
        aria-live="polite"
        aria-relevant="additions text"
        className="flex min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain pr-1 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#f2c078]"
      >
        {logs.length === 0 ? (
          <span className="py-1 italic text-[#7f8c98]">
            No events recorded yet.
          </span>
        ) : (
          logs.map((log) => (
            <span key={log} className="break-words border-l border-[#d2a35f]/40 py-0.5 pl-2 leading-[1.45] text-[#aebdca]">
              {log}
            </span>
          ))
        )}
      </div>
    </aside>
  )
}
