import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Item, UserSession } from './types';
import Dashboard from './components/Dashboard';
import ItemForm from './components/AddItem';
import Header from './components/Header';
import Login from './components/Login';
import ImageViewer from './components/ImageViewer';
import { getInventory, addItem, deleteItem, updateItem } from './services/airtableService';

type View = 'dashboard' | 'itemForm';

const App: React.FC = () => {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [imageViewerState, setImageViewerState] = useState<{ images: string[], startIndex: number, name: string } | null>(null);
  
  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      setUserSession(JSON.parse(savedSession));
    } else {
      setIsLoading(false); // Not logged in, no need to show loading spinner
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    if (!userSession) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await getInventory();
      setInventory(items);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching inventory.');
    } finally {
      setIsLoading(false);
    }
  }, [userSession]);

  useEffect(() => {
    if (userSession) {
      fetchInventory();
    }
  }, [userSession, fetchInventory]);
  
  const handleLogin = async (username: string, password: string) => {
    // --- MOCK AUTHENTICATION ---
    // In a real application, this would be a secure API call to a backend server.
    // For demonstration purposes, we are using hardcoded credentials.
    // DO NOT use this approach in production.
    const validUsers = [
      { username: 'Val', password: 'TPSInventory' },
      { username: 'Cort', password: 'TPSInventory' },
    ];
    
    const foundUser = validUsers.find(
      (user) => user.username.toLowerCase() === username.toLowerCase() && user.password === password
    );

    if (foundUser) {
      const session: UserSession = { username: foundUser.username }; // Use correct casing for display
      localStorage.setItem('userSession', JSON.stringify(session));
      setUserSession(session);
    } else {
      // Simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error('Invalid username or password.');
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUserSession(null);
    setInventory([]); // Clear inventory on logout
  }

  const handleAddItem = async (item: Item) => {
    if (!userSession) {
        setError("You must be logged in to add an item.");
        return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const newItem = await addItem(item);
      setInventory(prev => [...prev, newItem]);
      setCurrentView('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async (item: Item) => {
    if (!userSession) {
        setError("You must be logged in to update an item.");
        return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const updatedItem = await updateItem(item);
      setInventory(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
      setCurrentView('dashboard');
      setEditingItem(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = inventory.find(item => item.id === id);
    if (itemToDelete && itemToDelete.airtableId && window.confirm('Are you sure you want to delete this item?')) {
      const originalInventory = inventory;
      try {
        const newInventory = inventory.filter(item => item.id !== id);
        setInventory(newInventory);
        await deleteItem(itemToDelete.airtableId);
      } catch (err: any) {
        setInventory(originalInventory); // Revert optimistic update
        setError(err.message || "Failed to delete item. Please try again.");
      }
    } else if (itemToDelete && !itemToDelete.airtableId) {
      setError("Cannot delete item: missing Airtable record ID.");
    }
  };
  
  const retryFetch = () => {
     fetchInventory();
  }
  
  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setCurrentView('itemForm');
  }
  
  const handleCancelForm = () => {
    setCurrentView('dashboard');
    setEditingItem(null);
    setError(null); // Clear errors when cancelling
  }
  
  const handleViewItemImages = (item: Item, startIndex: number = 0) => {
    if (item.images && item.images.length > 0) {
      setImageViewerState({ images: item.images, startIndex, name: item.name });
    }
  };

  const handleCloseImageViewer = () => {
    setImageViewerState(null);
  };
  
  const filteredItems = useMemo(() => {
    if (!inventory) return [];
    
    // 1. Filter by the active category/flag
    let categoryFilteredItems = inventory;
    if (activeFilter === 'Flagged') {
        categoryFilteredItems = inventory.filter(item => item.flagged);
    } else if (activeFilter !== 'All') {
        categoryFilteredItems = inventory.filter(item => item.category === activeFilter);
    }

    // 2. Then, filter by the search term
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return categoryFilteredItems;

    return categoryFilteredItems.filter(item => {
      const searchableStrings = [
        item.name,
        item.maker,
        item.description,
        item.category,
        item.consignee,
        item.condition,
        item.flaws,
        item.size,
        item.sku,
      ].filter(Boolean); // Filter out null/undefined/empty strings

      if (searchableStrings.some(s => s.toLowerCase().includes(lowercasedFilter))) {
        return true;
      }
      
      const searchableNumbers = [item.price, item.weight].filter(n => n !== null && n !== undefined);
      if (searchableNumbers.some(n => n.toString().includes(lowercasedFilter))) {
        return true;
      }
      
      if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter))) {
        return true;
      }
      
      return false;
    });
  }, [inventory, searchTerm, activeFilter]);
  
  if (!userSession) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 flex flex-col items-center justify-between">
      <div className="w-full space-y-8 flex flex-col items-center">
        <Header 
          session={userSession}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        {currentView === 'dashboard' && (
          <Dashboard 
            items={filteredItems} 
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditClick}
            onAddItem={() => { setEditingItem(null); setCurrentView('itemForm'); setError(null); }}
            onViewItemImages={handleViewItemImages}
            isLoading={isLoading}
            error={error}
            onRetry={retryFetch}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchTerm={searchTerm}
            totalItemCount={inventory.length}
          />
        )}

        {currentView === 'itemForm' && (
          <ItemForm
            itemToEdit={editingItem}
            onItemSaved={handleAddItem}
            onItemUpdated={handleUpdateItem}
            onCancel={handleCancelForm}
            isSaving={isSaving}
            error={error}
          />
        )}
      </div>
       {imageViewerState && (
        <ImageViewer 
          images={imageViewerState.images}
          startIndex={imageViewerState.startIndex}
          itemName={imageViewerState.name}
          onClose={handleCloseImageViewer}
        />
      )}
      <footer className="text-center pt-10 text-xs text-slate-500 dark:text-slate-400">
        <p>Powered by PureHome.io</p>
      </footer>
    </div>
  );
};

export default App;
