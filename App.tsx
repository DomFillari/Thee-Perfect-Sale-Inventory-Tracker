import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Item, UserSession } from './types';
import Dashboard from './components/Dashboard';
import ItemForm from './components/AddItem';
import Header from './components/Header';
import Login from './components/Login';
import ImageViewer from './components/ImageViewer';
import { getInventory, addItem, deleteItem, updateItem } from './services/airtableService';
import { InfoIcon } from './components/icons';

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
  
  // API Key State
  const [apiKeyVerified, setApiKeyVerified] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  
  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
        // 1. Check if process.env.API_KEY is already populated (e.g. build time or previous selection)
        if (process.env.API_KEY) {
            setApiKeyVerified(true);
            setCheckingKey(false);
            return;
        }

        // 2. Check via AI Studio environment if available
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            setApiKeyVerified(hasKey);
        } else {
             // If we are not in the AI Studio environment and process.env is missing, 
             // we assume the user is handling env vars manually or it will fail later.
             // We default to true here to avoid blocking local dev that might not have window.aistudio.
             setApiKeyVerified(true);
        }
        setCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
      if ((window as any).aistudio) {
          try {
            await (window as any).aistudio.openSelectKey();
            // Assume success after closing dialog to handle race conditions
            setApiKeyVerified(true);
          } catch (e) {
              console.error("Failed to select key", e);
          }
      }
  };

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
    const validUsers = [
      { username: 'Val', password: 'TPSInventory' },
      { username: 'Cort', password: 'TPSInventory' },
    ];
    
    const foundUser = validUsers.find(
      (user) => user.username.toLowerCase() === username.toLowerCase() && user.password === password
    );

    if (foundUser) {
      const session: UserSession = { username: foundUser.username };
      localStorage.setItem('userSession', JSON.stringify(session));
      setUserSession(session);
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error('Invalid username or password.');
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUserSession(null);
    setInventory([]);
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
        setInventory(originalInventory);
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
    setError(null);
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
    
    let categoryFilteredItems = inventory;
    if (activeFilter === 'Flagged') {
        categoryFilteredItems = inventory.filter(item => item.flagged);
    } else if (activeFilter !== 'All') {
        categoryFilteredItems = inventory.filter(item => item.category === activeFilter);
    }

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
      ].filter(Boolean);

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
  
  // RENDER LOADING FOR API KEY
  if (checkingKey) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
  }

  // RENDER API KEY SELECTION SCREEN
  if (!apiKeyVerified && (window as any).aistudio) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center">
                    <InfoIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">API Key Required</h2>
                <p className="text-slate-600 dark:text-slate-300">
                    To use the advanced Visual Search and AI features, you must select a Google Cloud API Key with billing enabled.
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    <p>Please refer to the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">billing documentation</a> for details.</p>
                </div>
                <button
                    onClick={handleSelectKey}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
                >
                    Connect API Key
                </button>
            </div>
        </div>
      );
  }

  // RENDER LOGIN
  if (!userSession) {
      return <Login onLogin={handleLogin} />;
  }

  // RENDER MAIN APP
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