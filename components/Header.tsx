
import React from 'react';
import { LogoutIcon, SearchIcon, UserIcon } from './icons';
import type { UserSession } from '../types';

interface HeaderProps {
  userSession: UserSession;
  onLogout: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    userSession, 
    onLogout, 
    searchTerm, 
    onSearchChange,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
             <div className="bg-black text-white p-1.5 rounded">
                <span className="font-serif font-bold text-lg leading-none">TPS</span>
             </div>
             <div className="flex flex-col">
                 <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">Inventory</h1>
                 <span className="text-[10px] text-gray-500 font-medium">Internal Manager</span>
             </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-auto hidden sm:block">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-black focus:border-black sm:text-sm transition-all"
                    placeholder="Search items by name, maker, category or SKU..."
                />
            </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                <UserIcon className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-900">{userSession.username}</span>
            </div>
            
            <button 
                onClick={onLogout}
                className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                title="Sign Out"
            >
                <LogoutIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      {/* Mobile Search Bar (visible only on small screens) */}
      <div className="sm:hidden px-4 pb-3">
         <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
             </div>
             <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-black text-sm"
                placeholder="Search..."
             />
         </div>
      </div>
    </header>
  );
};

export default Header;
