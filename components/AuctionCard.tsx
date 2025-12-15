
import React, { useState, useEffect } from 'react';
import type { Item } from '../types';
import { ClockIcon, HeartIcon } from './icons';

interface AuctionCardProps {
  item: Item;
  isAuthenticated: boolean;
  onBid: (itemId: string, newAmount: number) => Promise<void>;
  onAuthTrigger: () => void;
  onViewImages: (item: Item, startIndex: number) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

const AuctionCard: React.FC<AuctionCardProps> = ({ item, isAuthenticated, onBid, onAuthTrigger, onViewImages }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [localBidState, setLocalBidState] = useState<'idle' | 'bidding' | 'winning' | 'outbid'>('idle');
  const [optimisticBid, setOptimisticBid] = useState<number>(item.currentBid || 0);
  const [isWatched, setIsWatched] = useState(false);

  // Sync optimistic bid with real data
  useEffect(() => {
    if (item.currentBid && item.currentBid > optimisticBid) {
      setOptimisticBid(item.currentBid);
      setLocalBidState('outbid');
    }
  }, [item.currentBid]);
  
  useEffect(() => {
      if (item.isWinning === false && localBidState === 'winning') {
          setLocalBidState('outbid');
      }
  }, [item.isWinning]);

  // Countdown Logic
  useEffect(() => {
    if (!item.auctionEndTime) return;
    const tick = () => {
      const now = Date.now();
      const diff = item.auctionEndTime! - now;
      if (diff <= 0) {
        setTimeLeft('CLOSED');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 24) {
        setTimeLeft(`${Math.floor(hours / 24)}d ${hours % 24}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000); // Update every second for "Live" feel
    return () => clearInterval(interval);
  }, [item.auctionEndTime]);

  const nextBid = optimisticBid + (optimisticBid < 100 ? 5 : 25);

  const handleBidClick = async () => {
    if (!isAuthenticated) {
        onAuthTrigger();
        return;
    }
    setLocalBidState('bidding');
    const newAmount = nextBid;
    setOptimisticBid(newAmount);
    setLocalBidState('winning'); 
    try {
        await onBid(item.id, newAmount);
    } catch (e) {
        setLocalBidState('idle'); 
        setOptimisticBid(item.currentBid || 0);
        alert("Bid failed. Please try again.");
    }
  };

  const isLive = timeLeft !== 'CLOSED';

  return (
    <div className="group flex flex-col bg-white border border-transparent hover:border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {item.images && item.images.length > 0 ? (
           <img 
            src={item.images[0]} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
            onClick={() => onViewImages(item, 0)}
           />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-gray-300 font-serif italic">No Image</div>
        )}
        
        {/* Watch Button */}
        <button 
            onClick={(e) => { e.stopPropagation(); setIsWatched(!isWatched); }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm z-10"
        >
            <HeartIcon className="w-5 h-5" filled={isWatched} />
        </button>

        {/* Timer Badge */}
        <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm py-2 px-3 flex justify-between items-center border-t border-gray-100">
           <div className="flex items-center gap-2">
                {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                <span className={`text-xs font-bold tracking-wider uppercase ${isLive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {timeLeft}
                </span>
           </div>
           <span className="text-[10px] uppercase text-gray-400 font-medium">
               {item.bidCount || 0} Bids
           </span>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-grow p-5 text-center">
        <h3 className="font-serif text-lg text-gray-900 leading-tight mb-2 group-hover:text-gray-600 transition-colors line-clamp-2 min-h-[3.5rem]">
            {item.name}
        </h3>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">{item.maker || 'Unknown Maker'}</p>
        
        <div className="mt-auto space-y-4">
            <div className="flex flex-col items-center justify-center border-y border-gray-50 py-3">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Current Bid</span>
                <span className="text-2xl font-serif text-gray-900">{formatCurrency(optimisticBid)}</span>
            </div>

            <button
                onClick={handleBidClick}
                disabled={localBidState === 'winning' || !isLive}
                className={`w-full py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    !isLive 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : localBidState === 'winning' 
                    ? 'bg-[#C5A059] text-white cursor-default shadow-md' // Gold
                    : 'bg-black text-white hover:bg-[#333] shadow-lg hover:shadow-xl'
                }`}
            >
                {localBidState === 'winning' ? 'You are highest bidder' : `Bid ${formatCurrency(nextBid)}`}
            </button>
            
            {localBidState === 'outbid' && isLive && (
                <p className="text-xs text-red-600 font-bold uppercase tracking-wide animate-pulse">
                    You have been outbid!
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
