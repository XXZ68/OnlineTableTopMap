type GameEventLogProps = Readonly<{
  logs: string[]
}>

export default function GameEventLog({ logs }: GameEventLogProps) {
  return (
    <aside
      aria-label="Game event log"
      className="absolute bottom-4 left-4 z-[100] flex max-h-[180px] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-secondary-bg bg-primary-bg/90 p-3 font-mono text-[11px] text-primary-text shadow-custom backdrop-blur-md"
    >
      <div className="mb-2 flex shrink-0 items-center justify-between border-b border-secondary-bg pb-2">
        <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.12em] text-primary-text">
          <span className="size-1.5 rounded-full bg-accent-special" aria-hidden="true" />
          {' '}
          Event log
        </span>
        <span className="rounded bg-secondary-bg px-1.5 py-0.5 text-[10px] text-secondary-text">
          {logs.length}
        </span>
      </div>

      <div
        role="log"
        aria-label="Activity entries"
        aria-live="polite"
        aria-relevant="additions text"
        className="flex min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain pr-1 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-special"
      >
        {logs.length === 0 ? (
          <span className="py-1 italic text-secondary-text">
            No events recorded yet.
          </span>
        ) : (
          logs.map((log) => (
            <span key={log} className="break-words border-l border-accent-special/40 py-0.5 pl-2 leading-[1.45] text-secondary-text">
              {log}
            </span>
          ))
        )}
      </div>
    </aside>
  )
}
