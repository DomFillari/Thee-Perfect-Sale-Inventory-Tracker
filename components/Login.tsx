import React, { useState } from 'react';
import type { UserSession } from '../types';
import { UserIcon } from './icons';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const canSubmit = username.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onLogin({ username: username.trim() });
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Welcome!</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Please enter a username to begin.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white sm:text-sm transition"
              placeholder="e.g., WarehouseManager"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-all duration-300"
          >
            Sign In
          </button>
        </form>
      </div>
      <footer className="text-center mt-8 text-xs text-slate-500 dark:text-slate-400">
        <p>Powered by React, Tailwind CSS, and Gemini API</p>
      </footer>
    </main>
  );
};

export default Login;
