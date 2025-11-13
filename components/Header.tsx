import React from 'react';
import { LogoutIcon, SearchIcon } from './icons';
import type { UserSession } from '../types';

interface HeaderProps {
  session: UserSession;
  onLogout: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ session, onLogout, searchTerm, onSearchChange }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-md rounded-2xl w-full sticky top-4 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="search"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="block w-full rounded-lg border-transparent bg-slate-100 dark:bg-slate-700 py-3 pl-11 pr-4 text-base placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 dark:text-white transition"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-medium py-2.5 px-3 sm:px-4 rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all duration-300 text-sm"
              aria-label="Logout"
            >
              <LogoutIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;