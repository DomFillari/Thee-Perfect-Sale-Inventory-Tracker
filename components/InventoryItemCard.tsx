import React from 'react';
import type { Item } from '../types';
import { TrashIcon, PencilIcon, FlagIcon } from './icons';

interface InventoryItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onDelete, onEdit }) => {
  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'No price';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
      <div className="relative">
        <img src={item.images[0]} alt={item.name} className="w-full h-40 object-cover" />
        {item.consigned && (
            <div 
                className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shadow-lg"
                title="Consignment Item"
            >
                C
            </div>
        )}
        {item.flagged && (
            <div className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
                <FlagIcon className="w-4 h-4" />
            </div>
        )}
      </div>
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={item.name}>{item.name}</h3>
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2 py-1 rounded-full whitespace-nowrap">{item.condition}</span>
        </div>
        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatPrice(item.price)}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono break-all mt-1">{item.sku}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs font-medium px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
             <span className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs font-medium px-2 py-1 rounded-full">
              +{item.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 flex justify-end items-center gap-2">
        <button
          onClick={() => onEdit(item)}
          className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          aria-label={`Edit ${item.name}`}
        >
          <PencilIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          aria-label={`Delete ${item.name}`}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InventoryItemCard;