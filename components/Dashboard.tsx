import React, { useState, useMemo } from 'react';
import type { Item } from '../types';
import InventoryItemCard from './InventoryItemCard';
import { SearchIcon, PlusIcon, RefreshIcon, InfoIcon } from './icons';

interface DashboardProps {
  items: Item[];
  onDeleteItem: (id: string) => void;
  onEditItem: (item: Item) => void;
  onAddItem: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, onDeleteItem, onEditItem, onAddItem, isLoading, error, onRetry }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(lowercasedFilter) ||
      item.description.toLowerCase().includes(lowercasedFilter) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter))
    );
  }, [items, searchTerm]);
  
  if (isLoading) {
      return (
          <div className="w-full text-center py-16">
              <div role="status" className="flex flex-col items-center justify-center">
                <svg aria-hidden="true" className="w-10 h-10 text-slate-200 animate-spin dark:text-slate-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
                <p className="mt-4 text-slate-500 dark:text-slate-400">Loading inventory...</p>
              </div>
          </div>
      )
  }

  if (error) {
    return (
        <div className="w-full text-center py-16 border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
            <InfoIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-xl font-semibold text-red-800 dark:text-red-200">Failed to Load Inventory</h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300 max-w-md mx-auto">{error}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">There was an issue loading your data. Please try again.</p>
            <button
              onClick={onRetry}
              className="mt-6 flex items-center mx-auto justify-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 transition-all duration-300"
            >
              <RefreshIcon className="w-5 h-5" />
              Try Again
            </button>
        </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="search"
          placeholder="Search by name, description, or tag..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-slate-300 bg-white dark:bg-slate-700 py-3 pl-10 pr-3 text-base placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:text-white"
        />
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <InventoryItemCard key={item.id} item={item} onDelete={onDeleteItem} onEdit={onEditItem} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No Items Found</h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {searchTerm ? 'Try adjusting your search.' : 'Get started by adding a new item to your inventory.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onAddItem}
              className="mt-6 flex items-center mx-auto justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Add Your First Item
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
