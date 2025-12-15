
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Item, UserSession } from './types';
import Dashboard from './components/Dashboard';
import ItemForm from './components/AddItem';
import Header from './components/Header';
import Login from './components/Login';
import ImageViewer from './components/ImageViewer';
import { getInventory, addItem, deleteItem, updateItem } from './services/airtableService';
import { generateRandomItems } from './services/mockDataService';

type View = 'dashboard' | 'itemForm';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [userSession, setUserSession] = useState<UserSession | null>(null); 

  // --- APP STATE ---
  const [inventory, setInventory] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [imageViewerState, setImageViewerState] = useState<{ images: string[], startIndex: number, name: string } | null>(null);
  
  // --- ROUTING ---
  
  // Handle Browser Back/Forward Buttons for internal app navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove '#'
      if (hash === 'add') {
          setCurrentView('itemForm');
      } else {
          setCurrentView('dashboard');
      }
    };

    // Check hash on initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL when View Changes
  useEffect(() => {
    const hash = currentView === 'itemForm' ? 'add' : 'dashboard';
    const currentHash = window.location.hash.slice(1);
    
    if (currentHash !== hash) {
       window.location.hash = hash;
    }
    
    window.scrollTo(0, 0);
  }, [currentView]);

  // --- LOAD DATA ---
  useEffect(() => {
    const savedAdmin = localStorage.getItem('userSession');
    if (savedAdmin) {
      try {
        setUserSession(JSON.parse(savedAdmin));
      } catch (e) {
        console.error("Failed to parse userSession", e);
        localStorage.removeItem('userSession');
      }
    }
    fetchInventory(); 
  }, []);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getInventory();
      
      if (items.length === 0) {
           const mockItems = generateRandomItems(8);
           setInventory(mockItems);
      } else {
           setInventory(items);
      }
    } catch (err: any) {
      console.warn("Falling back to mock data due to error:", err);
      const mockItems = generateRandomItems(12);
      setInventory(mockItems);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // --- AUTH HANDLERS ---
  const handleAdminLogin = async (username: string, password: string) => {
    const validUsers = [
      { username: 'Val', password: 'TPSInventory' },
      { username: 'Cort', password: 'TPSInventory' },
    ];
    
    const foundUser = validUsers.find(
      (user) => user.username.toLowerCase() === username.toLowerCase() && user.password === password
    );

    if (foundUser) {
      const session: UserSession = { username: foundUser.username, role: 'admin' };
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
  }

  // --- CRUD HANDLERS ---
  const handleAddItem = async (item: Item) => {
    if (!userSession) return;
    setIsSaving(true);
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
    if (!userSession) return;
    setIsSaving(true);
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
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    const itemToDelete = inventory.find(item => item.id === id);
    if (itemToDelete && itemToDelete.airtableId) {
        setInventory(prev => prev.filter(i => i.id !== id));
        try {
            await deleteItem(itemToDelete.airtableId);
        } catch (e) {
            fetchInventory();
            alert("Failed to delete item from server.");
        }
    }
  };
  
  const handleViewItemImages = (item: Item, startIndex: number = 0) => {
    if (item.images && item.images.length > 0) {
      setImageViewerState({ images: item.images, startIndex, name: item.name });
    }
  };

  const filteredItems = useMemo(() => {
    if (!inventory) return [];
    
    let baseItems = inventory;
    
    if (activeFilter === 'Flagged') {
        baseItems = inventory.filter(item => item.flagged);
    } else if (activeFilter !== 'All') {
        baseItems = inventory.filter(item => item.category === activeFilter);
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return baseItems;

    return baseItems.filter(item => {
      const searchableStrings = [item.name, item.maker, item.description, item.category, item.sku].filter(Boolean);
      return searchableStrings.some(s => s.toLowerCase().includes(lowercasedFilter));
    });
  }, [inventory, searchTerm, activeFilter]);
  
  // --- MAIN RENDER ---

  if (!userSession) {
      return <Login onLogin={handleAdminLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      <Header 
        userSession={userSession}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'dashboard' && (
              <Dashboard 
                items={filteredItems} 
                onDeleteItem={handleDeleteItem}
                onEditItem={(item) => { setEditingItem(item); setCurrentView('itemForm'); }}
                onAddItem={() => { setEditingItem(null); setCurrentView('itemForm'); setError(null); }}
                onViewItemImages={handleViewItemImages}
                isLoading={isLoading}
                error={error}
                onRetry={fetchInventory}
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
                onCancel={() => { setCurrentView('dashboard'); setEditingItem(null); }}
                isSaving={isSaving}
                error={error}
              />
            )}
      </main>

       {imageViewerState && (
        <ImageViewer 
          images={imageViewerState.images}
          startIndex={imageViewerState.startIndex}
          itemName={imageViewerState.name}
          onClose={() => setImageViewerState(null)}
        />
      )}
      
    </div>
  );
};

export default App;
