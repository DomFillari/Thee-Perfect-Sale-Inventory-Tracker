import React, { useState } from 'react';
import { UserIcon, SpinnerIcon } from './icons';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = username.trim() && password.trim() && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      setIsLoading(true);
      setError(null);
      try {
        await onLogin(username.trim(), password);
        // On success, the App component will automatically unmount this component
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome!</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Please sign in to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
           {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                <p>{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white sm:text-sm transition"
              placeholder="e.g., Val"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white sm:text-sm transition"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-all duration-300"
          >
            {isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Sign In'}
          </button>
        </form>
      </div>
      <footer className="text-center mt-8 text-xs text-slate-500 dark:text-slate-400">
        <p>Powered by PureHome.io</p>
      </footer>
    </main>
  );
};

export default Login;
