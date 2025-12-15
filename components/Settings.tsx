
import React, { useState, useEffect } from 'react';
import { CloseIcon, LockIcon } from './icons';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('TPS_API_KEY');
      if (storedKey) setApiKey(storedKey);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('TPS_API_KEY', apiKey.trim());
      setSaved(true);
      setTimeout(() => {
          onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('TPS_API_KEY');
    setApiKey('');
    setSaved(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-serif text-lg font-bold text-gray-900">App Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3">
            <LockIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-bold mb-1">API Key Configuration</p>
              <p>Since this app is running client-side, you need to provide your own Google Gemini API Key. It will be saved securely in your browser's local storage.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="block w-full rounded border-gray-300 shadow-sm focus:border-black focus:ring-1 focus:ring-black sm:text-sm py-2.5"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
                <button 
                    type="submit" 
                    className={`flex-1 py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider text-white transition-all ${
                        saved ? 'bg-green-600' : 'bg-black hover:bg-gray-800'
                    }`}
                >
                    {saved ? 'Saved!' : 'Save Key'}
                </button>
                {apiKey && (
                    <button 
                        type="button"
                        onClick={handleClear} 
                        className="px-4 py-2.5 rounded border border-gray-200 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50"
                    >
                        Clear
                    </button>
                )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
