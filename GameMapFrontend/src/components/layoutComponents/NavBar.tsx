import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

export default function NavBar() {
  const { state } = useLocation()
  const username = state?.username

  return (
    <nav className="border-b border-secondary-bg bg-primary-bg shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-special text-sm font-bold text-white">
            GM
          </span>
          <span className="truncate text-base font-bold text-primary-text">
            Game Map Tool
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {username && (
            <span className="hidden max-w-48 truncate text-sm text-secondary-text sm:block">
              Hi, {username}
            </span>
          )}
        <ThemeToggle />
          <Link
            to="/"
            className="rounded-md border border-secondary-bg px-3 py-2 text-sm font-medium text-secondary-text transition-colors hover:border-accent-special hover:text-accent-special"
          >
            Leave
          </Link>
        </div>
      </div>
    </nav>
  )
}