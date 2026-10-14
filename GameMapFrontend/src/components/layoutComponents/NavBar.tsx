import ThemeToggle from '../ThemeToggle'

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 shadow-md">
      {/* Logo */}
      <a
        href="/"
        className="text-xl font-bold tracking-wide hover:text-gray-300 transition-colors"
      >
        OTTM
      </a>

      {/* Navigation Links */}
      <ul className="flex items-center gap-6 m-0 p-0 list-none">    
        
        <li>
          <a
            href="/profile"
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            Profile Managment
          </a>
        </li>

        <li>
          <a
            href="/"
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            Leave
          </a>
        </li>
      </ul>

      <div>
        <ThemeToggle />
      </div>
    </nav>
  )
}