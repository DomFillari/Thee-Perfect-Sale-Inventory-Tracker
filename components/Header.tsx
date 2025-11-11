import React from 'react';
import { PlusIcon, LogoutIcon } from './icons';

interface HeaderProps {
  username: string;
  onAddItem: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, onAddItem, onLogout }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md rounded-2xl w-full sticky top-4 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Welcome, <span className="font-bold text-blue-600 dark:text-blue-400">{username}</span>!
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onAddItem}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 transform hover:scale-105 text-sm"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-bold py-2 px-3 sm:px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all duration-300 text-sm"
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
