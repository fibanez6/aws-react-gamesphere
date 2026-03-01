import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useTheme } from '../../context/ThemeContext';

export default function Header() {
  // const { user, logout } = useAuth();
  const { user } = useAuthenticator();
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // TODO remove user2 and use real user data from context once implemented
  const user2 = {
    ...user,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer123",
    level: 42,
  }

  return (
    <header className="h-16 bg-dark-900/50 backdrop-blur-sm border-b border-dark-800 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search games, players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 bg-dark-800/50"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-ghost p-2 rounded-lg"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="btn-ghost p-2 rounded-lg relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800/50 transition-colors"
          >
            <img
              src={user2?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={user2?.username}
              className="w-8 h-8 rounded-full ring-2 ring-primary-500"
            />
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium">{user2?.username}</p>
              <p className="text-xs text-dark-400">Level {user2?.level}</p>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-dark-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
              <a
                href="/profile"
                className="block px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700/50"
              >
                My Profile
              </a>
              <a
                href="/settings"
                className="block px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700/50"
              >
                Settings
              </a>
              <hr className="my-2 border-dark-700" />
              <button
                // onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-700/50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Icon Components
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
