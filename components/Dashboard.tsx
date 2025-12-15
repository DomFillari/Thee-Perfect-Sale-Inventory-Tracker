import React from 'react';
import type { Item } from '../types';
import InventoryItemCard from './InventoryItemCard';
import { PlusIcon, RefreshIcon, InfoIcon, FlagIcon } from './icons';

interface DashboardProps {
  items: Item[];
  onDeleteItem: (id: string) => void;
  onEditItem: (item: Item) => void;
  onAddItem: () => void;
  onViewItemImages: (item: Item, startIndex: number) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchTerm: string;
  totalItemCount: number;
}

const CATEGORIES = ['Apparel', 'Home Goods', 'Electronics', 'Collectibles', 'Other'];
const FILTERS = ['All', ...CATEGORIES, 'Flagged'];

const Dashboard: React.FC<DashboardProps> = ({ 
    items, 
    onDeleteItem, 
    onEditItem, 
    onAddItem, 
    onViewItemImages,
    isLoading, 
    error, 
    onRetry,
    activeFilter,
    onFilterChange,
    searchTerm,
    totalItemCount,
}) => {
  
  if (isLoading) {
      return (
          <div className="w-full text-center py-20">
              <div role="status" className="flex flex-col items-center justify-center">
                 <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                 <p className="text-gray-500 text-sm tracking-wide">Loading Inventory...</p>
              </div>
          </div>
      )
  }

  if (error) {
    return (
        <div className="w-full text-center py-16 border border-red-200 rounded-lg bg-red-50">
            <InfoIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-xl font-serif text-red-800">Failed to Load Inventory</h3>
            <p className="mt-2 text-sm text-red-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={onRetry}
              className="mt-6 flex items-center mx-auto justify-center gap-2 bg-black text-white text-sm font-bold uppercase tracking-wider py-2.5 px-5 hover:bg-gray-800 transition-all"
            >
              <RefreshIcon className="w-4 h-4" />
              Try Again
            </button>
        </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-gray-900">Inventory Dashboard</h2>
        <div className="text-sm text-gray-500">{items.length} Items</div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            return (
                <button
                    key={filter}
                    onClick={() => onFilterChange(filter)}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors duration-200 ${
                        isActive
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {filter === 'Flagged' && <FlagIcon className="w-3 h-3" />}
                    {filter}
                </button>
            )
        })}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map(item => (
            <InventoryItemCard key={item.id} item={item} onDelete={onDeleteItem} onEdit={onEditItem} onViewImages={onViewItemImages} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <h3 className="text-xl font-serif text-gray-900">No Items Found</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            {searchTerm 
              ? `No results for "${searchTerm}" in the "${activeFilter}" category.`
              : activeFilter !== 'All' 
              ? `There are no items in the "${activeFilter}" category.`
              : 'Your inventory is currently empty.'
            }
          </p>
          {totalItemCount === 0 && !searchTerm && (
            <div className="mt-8">
               <button
                onClick={onAddItem}
                className="flex items-center justify-center gap-2 bg-black text-white font-bold text-sm uppercase tracking-wider py-3 px-6 hover:bg-gray-800 transition-all shadow-lg"
              >
                <PlusIcon className="w-4 h-4" />
                Add Your First Item
              </button>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={onAddItem}
        className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-transform transform hover:scale-110 z-20 border-2 border-white"
        aria-label="Add new item"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard;