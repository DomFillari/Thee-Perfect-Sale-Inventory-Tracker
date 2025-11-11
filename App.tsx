
import React, { useState, useEffect, useCallback } from 'react';
import type { Item, UserSession } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ItemForm from './components/AddItem';
import Header from './components/Header';
import { getInventory, addItem, deleteItem, updateItem } from './services/airtableService';

type View = 'dashboard' | 'itemForm';

const APP_STORAGE_KEY = 'warehouseUserSession';

const App: React.FC = () => {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem(APP_STORAGE_KEY);
      if (storedSession) {
        setUserSession(JSON.parse(storedSession));
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Failed to parse user session from localStorage", e);
      setIsLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async (session: UserSession) => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getInventory(session.username);
      setInventory(items);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while fetching inventory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userSession) {
      fetchInventory(userSession);
    }
  }, [userSession, fetchInventory]);

  const handleLogin = (session: UserSession) => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(session));
    setUserSession(session);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem(APP_STORAGE_KEY);
    setUserSession(null);
    setInventory([]);
  };

  const handleAddItem = async (item: Item) => {
    if (!userSession) return;
    setIsSaving(true);
    setError(null);
    try {
      const newItem = await addItem(item, userSession.username);
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
    setError(null);
    try {
      const updatedItem = await updateItem(item, userSession.username);
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
    if (!userSession) return;
    const itemToDelete = inventory.find(item => item.id === id);
    if (itemToDelete && itemToDelete.airtableId && window.confirm('Are you sure you want to delete this item?')) {
      const originalInventory = inventory;
      try {
        const newInventory = inventory.filter(item => item.id !== id);
        setInventory(newInventory);
        await deleteItem(itemToDelete.airtableId, userSession.username);
      } catch (err: any) {
        setInventory(originalInventory); // Revert optimistic update
        alert(err.message || "Failed to delete item. Please try again.");
      }
    } else if (itemToDelete && !itemToDelete.airtableId) {
      alert("Cannot delete item: missing Airtable record ID.");
    }
  };
  
  const retryFetch = () => {
      if (userSession) {
         fetchInventory(userSession);
      }
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

  if (!userSession) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col items-center">
      <Header 
        username={userSession.username}
        onAddItem={() => { setEditingItem(null); setCurrentView('itemForm'); setError(null); }}
        onLogout={handleLogout} 
      />
      
      {currentView === 'dashboard' && (
        <Dashboard 
          items={inventory} 
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditClick}
          onAddItem={() => setCurrentView('itemForm')}
          isLoading={isLoading}
          error={error}
          onRetry={retryFetch}
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
  );
};

export default App;
