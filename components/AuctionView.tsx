
import React, { useState, useEffect } from 'react';
import type { Item } from '../types';
import Footer from './Footer';
import { LockIcon, GavelIcon } from './icons';

interface AuctionViewProps {
  items: Item[];
  isAuthenticated: boolean;
  onBid: (itemId: string, newAmount: number) => Promise<void>;
  onAuthTrigger: () => void;
  onViewItemImages: (item: Item, startIndex: number) => void;
  isLoading: boolean;
  onAdminLogin: () => void;
  showAdminLink?: boolean;
}

const AuctionView: React.FC<AuctionViewProps> = ({ items, isAuthenticated, onBid, onAuthTrigger, onViewItemImages, isLoading, onAdminLogin, showAdminLink = true }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Mock Event Start Date (e.g., 2 days from now)
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2); // 2 Days out
    targetDate.setHours(18, 0, 0, 0); // 6 PM

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            clearInterval(timer);
            return;
        }

        setTimeLeft({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter 3 Teaser Items
  const teaserItems = items.slice(0, 3);

  if (isLoading) {
    return (
        <div className="w-full h-screen flex justify-center items-center bg-white">
            <div className="flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                 <p className="text-xs uppercase tracking-widest text-gray-500">Loading Event...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full bg-white animate-fade-in flex flex-col min-h-screen">
      
      {/* 1. HERO SECTION - Consistent with EstateSalesView */}
      <div className="relative w-full h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595268491334-738b81373574?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center text-white">
             <div className="flex flex-col items-center justify-center bg-white text-black rounded-full w-20 h-20 mb-8 shadow-2xl">
                <div className="border border-black/10 rounded-full w-16 h-16 flex items-center justify-center">
                    <GavelIcon className="w-8 h-8" />
                </div>
             </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif uppercase tracking-widest mb-6 leading-none">
                Upcoming Collections
            </h1>
            <div className="w-24 h-1 bg-white/60 mb-8"></div>
            
            <p className="text-lg sm:text-xl font-light tracking-wide max-w-2xl uppercase">
                The Moorestown Estate
            </p>

            {/* Countdown */}
            <div className="mt-12 flex flex-wrap justify-center gap-4 sm:gap-8 text-white">
                 <div className="flex flex-col items-center">
                     <span className="text-4xl sm:text-5xl font-serif font-bold">{timeLeft.days}</span>
                     <span className="text-[10px] uppercase tracking-widest text-gray-300 mt-2">Days</span>
                 </div>
                 <div className="text-4xl sm:text-5xl font-serif opacity-50">:</div>
                 <div className="flex flex-col items-center">
                     <span className="text-4xl sm:text-5xl font-serif font-bold">{timeLeft.hours}</span>
                     <span className="text-[10px] uppercase tracking-widest text-gray-300 mt-2">Hours</span>
                 </div>
                 <div className="text-4xl sm:text-5xl font-serif opacity-50">:</div>
                 <div className="flex flex-col items-center">
                     <span className="text-4xl sm:text-5xl font-serif font-bold">{timeLeft.minutes}</span>
                     <span className="text-[10px] uppercase tracking-widest text-gray-300 mt-2">Mins</span>
                 </div>
            </div>
        </div>
      </div>

      {/* 2. DESCRIPTION */}
      <section className="bg-[#EFEBE6] py-20 text-center px-4">
          <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-serif text-gray-900 mb-6">A Curated Selection of Fine Goods</h2>
              <p className="text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
                  We are currently cataloging a prestigious estate in Moorestown, NJ. 
                  This collection features mid-century modern furniture, a curated library of first editions, 
                  and significant pieces of American fine art. 
                  Bidding will open exclusively to registered members.
              </p>
          </div>
      </section>

      {/* 3. TEASER INVENTORY (Shielded) */}
      <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Sneak Peek</h3>
              <h2 className="text-3xl font-serif text-gray-900">Preview The Collection</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {teaserItems.map((item) => (
                  <div key={item.id} className="group cursor-default">
                      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 mb-6">
                          {item.images && item.images[0] ? (
                              <img 
                                src={item.images[0]} 
                                alt={item.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                              />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">No Preview</div>
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      <div className="text-center">
                          <h4 className="font-serif text-lg text-gray-900 mb-2">{item.name}</h4>
                          <p className="text-xs text-gray-500 uppercase tracking-widest">{item.maker || 'Unknown Maker'}</p>
                          <div className="mt-4 inline-block border border-gray-300 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Estimates Available Soon
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          {/* 4. THE VAULT (Locked Content) */}
          <div className="relative w-full h-64 bg-gray-100 overflow-hidden flex items-center justify-center">
                {/* Blurred Background of items */}
                <div className="absolute inset-0 grid grid-cols-4 gap-2 opacity-20 blur-sm pointer-events-none">
                     {[...Array(8)].map((_, i) => (
                         <div key={i} className="bg-gray-400 w-full h-full"></div>
                     ))}
                </div>
                
                <div className="relative z-10 bg-white p-8 md:p-12 text-center shadow-2xl max-w-lg mx-4">
                    <LockIcon className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-serif text-gray-900 mb-2">35+ Additional Lots Locked</h3>
                    <p className="text-gray-500 font-light text-sm mb-6">
                        The full catalog is currently being finalized and appraised. Register now to be notified the moment bidding opens.
                    </p>
                    <button 
                        onClick={onAuthTrigger}
                        className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                        Notify Me When Live
                    </button>
                </div>
          </div>
      </section>

      <Footer onAdminLogin={onAdminLogin} showAdminLink={showAdminLink} />
    </div>
  );
};

export default AuctionView;
