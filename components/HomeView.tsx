
import React from 'react';
import Footer from './Footer';
import { GavelIcon, DocumentIcon, SearchIcon, ArrowRightIcon } from './icons';

interface HomeViewProps {
  onNavigate: (page: string) => void;
  onAdminLogin: () => void;
  showAdminLink: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onAdminLogin, showAdminLink }) => {
  return (
    <div className="w-full bg-white animate-fade-in">
      
      {/* 1. BRAND HERO */}
      <div className="relative w-full h-[85vh] overflow-hidden">
         {/* Background: Estate Sale Vibe (Vintage/Antiques/Library) */}
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556020685-ae41abfc9365?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-[10s] hover:scale-105"></div>
         {/* Increased darker fade */}
         <div className="absolute inset-0 bg-black/60"></div>
         
         <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-center text-center text-white">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold uppercase tracking-widest mb-6 drop-shadow-lg">
                The Perfect Sale
            </h1>
            <div className="w-32 h-1 bg-white mb-8"></div>
            <p className="text-xl sm:text-2xl font-light tracking-wide max-w-3xl drop-shadow-md">
                Premier Estate Liquidations & Online Auctions serving Southern New Jersey and Philadelphia.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-6">
                <button 
                    onClick={() => onNavigate('estateSales')}
                    className="bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors min-w-[200px]"
                >
                    Estate Sales
                </button>
                <button 
                    onClick={() => onNavigate('liveAuction')}
                    className="bg-transparent border-2 border-white text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors min-w-[200px]"
                >
                    Live Auctions
                </button>
            </div>
         </div>
      </div>

      {/* 2. CHOOSE YOUR EXPERIENCE (Split Section) */}
      <section className="flex flex-col md:flex-row min-h-[600px]">
          
          {/* Left: Estate Sales */}
          <div className="group relative w-full md:w-1/2 overflow-hidden cursor-pointer" onClick={() => onNavigate('estateSales')}>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"></div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500"></div>
              
              <div className="relative h-full flex flex-col justify-center items-center text-center p-12 text-white">
                  <DocumentIcon className="w-12 h-12 mb-6 opacity-80" />
                  <h2 className="text-3xl md:text-4xl font-serif uppercase tracking-widest mb-4">In-Home Sales</h2>
                  <p className="text-sm font-light max-w-sm mb-8 opacity-90 leading-relaxed">
                      Traditional estate sales conducted within the home. We handle staging, pricing, and hosting to maximize value.
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-white pb-1 group-hover:gap-4 transition-all">
                      Browse Sales <ArrowRightIcon className="w-4 h-4" />
                  </span>
              </div>
          </div>

          {/* Right: Auctions */}
          <div className="group relative w-full md:w-1/2 overflow-hidden cursor-pointer" onClick={() => onNavigate('liveAuction')}>
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521484358791-8c85ff0ae7ac?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"></div>
               <div className="absolute inset-0 bg-[#C5A059]/80 md:bg-[#C5A059]/90 mix-blend-multiply transition-colors duration-500"></div>
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>

               <div className="relative h-full flex flex-col justify-center items-center text-center p-12 text-white">
                  <GavelIcon className="w-12 h-12 mb-6 opacity-80" />
                  <h2 className="text-3xl md:text-4xl font-serif uppercase tracking-widest mb-4">Live Auctions</h2>
                  <p className="text-sm font-light max-w-sm mb-8 opacity-90 leading-relaxed">
                      Curated online bidding events for high-value collections, art, and jewelry. Reach a global audience.
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-white pb-1 group-hover:gap-4 transition-all">
                      Enter Auction House <ArrowRightIcon className="w-4 h-4" />
                  </span>
              </div>
          </div>
      </section>

      {/* 3. INTRO / BRAND STATEMENT */}
      <section className="bg-[#EFEBE6] py-24 px-4 text-center">
          <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500 mb-6">Established 2019</h3>
              <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 leading-tight mb-8">
                  "Transitioning doesn’t have to be stressful. <br className="hidden md:block" /> Let us handle the details."
              </h2>
              <div className="w-20 h-px bg-gray-400 mx-auto mb-8"></div>
              <p className="text-gray-600 font-light leading-relaxed max-w-2xl mx-auto mb-10">
                  Whether you are downsizing, relocating, or managing a loved one's estate, The Perfect Sale provides a comprehensive, compassionate, and professional approach to liquidation. We tailor our strategy to your unique needs, ensuring the highest return with the least amount of stress.
              </p>
              <button 
                onClick={() => onNavigate('about')}
                className="text-black border-b border-black text-xs font-bold uppercase tracking-widest hover:text-gray-600 hover:border-gray-600 pb-1 transition-colors"
              >
                  Read Our Story
              </button>
          </div>
      </section>

      {/* 4. SERVICES GRID */}
      <section className="py-24 max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-serif text-gray-900 mb-4">Our Expertise</h2>
              <p className="text-gray-500 font-light">Comprehensive solutions for every stage of the process.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Service 1 */}
              <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => onNavigate('ourProcess')}>
                  <div className="w-full h-64 overflow-hidden mb-6 bg-gray-100">
                      <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop" alt="Staging" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <h3 className="text-xl font-serif text-gray-900 mb-2">Staging & Pricing</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed px-4">
                      We transform homes into retail experiences. Our experts research and price every item to ensure maximum profitability.
                  </p>
              </div>

              {/* Service 2 */}
              <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => onNavigate('cleanOut')}>
                  <div className="w-full h-64 overflow-hidden mb-6 bg-gray-100">
                      <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" alt="Clean Out" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <h3 className="text-xl font-serif text-gray-900 mb-2">Total Clean-Outs</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed px-4">
                      Post-sale or pre-listing, we clear the property completely. Donation coordination and broom-swept service included.
                  </p>
              </div>

              {/* Service 3 */}
              <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => onNavigate('liveAuction')}>
                  <div className="w-full h-64 overflow-hidden mb-6 bg-gray-100">
                      <img src="https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=2080&auto=format&fit=crop" alt="Appraisals" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <h3 className="text-xl font-serif text-gray-900 mb-2">Appraisals</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed px-4">
                      Accurate valuation for rare antiques, fine art, and jewelry. We identify the hidden gems in your collection.
                  </p>
              </div>
          </div>
      </section>

      <Footer onAdminLogin={onAdminLogin} showAdminLink={showAdminLink} />
    </div>
  );
};

export default HomeView;
