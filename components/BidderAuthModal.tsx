
import React, { useState } from 'react';
import { UserIcon, SpinnerIcon, CloseIcon } from './icons';

interface BidderAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (phone: string, name: string) => void;
  pendingBidAmount?: number;
}

const BidderAuthModal: React.FC<BidderAuthModalProps> = ({ isOpen, onClose, onLogin, pendingBidAmount }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify'>('phone');

  if (!isOpen) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call to check user or send SMS
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    setStep('verify');
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate verifying code and logging in
    await new Promise(resolve => setTimeout(resolve, 800));
    onLogin(phone, name || 'Guest Bidder');
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">Place Your Bid</h2>
          {pendingBidAmount && (
            <p className="text-blue-100 mt-1">
              Identify yourself to secure your <span className="font-bold text-white">${pendingBidAmount}</span> bid.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-8">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full text-lg px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">We use this to notify you if you are outbid.</p>
              </div>
              <button 
                type="submit" 
                disabled={phone.length < 10 || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6 animate-fade-in">
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full text-lg px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  required
                  autoFocus
                />
              </div>
              <div>
                 {/* In a real app, this would be an SMS code input */}
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification (Simulated)</label>
                <div className="p-3 bg-green-50 text-green-800 text-sm rounded-lg border border-green-200">
                   ✅ Device Verified automatically.
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!name || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Confirm Bid'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-slate-500 hover:text-slate-800">
                  Back
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-4 text-center text-xs text-slate-500">
            Secure payments processed by Stripe.
        </div>
      </div>
    </div>
  );
};

export default BidderAuthModal;
