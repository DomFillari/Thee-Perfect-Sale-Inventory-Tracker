
import React from 'react';
import Footer from './Footer';
import Testimonials from './Testimonials';
import MarketingIcons from './MarketingIcons';
import { DocumentIcon } from './icons';

interface EstateSalesViewProps {
    onAdminLogin: () => void;
    showAdminLink: boolean;
}

const EstateSalesView: React.FC<EstateSalesViewProps> = ({ onAdminLogin, showAdminLink }) => {
  return (
    <div className="w-full bg-white animate-fade-in">
        
        {/* HERO SECTION */}
        <div className="relative w-full h-[500px] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555596899-d634eb1a42da?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-black/40"></div>
            
            <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center text-white">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif uppercase tracking-widest mb-4 leading-tight">The Perfect Sale</h1>
                <div className="w-24 h-1 bg-white/50 mb-6"></div>
                <p className="text-lg sm:text-xl md:text-2xl font-light max-w-2xl px-4 uppercase tracking-wide">
                    Estate Liquidations & Appraisals
                </p>
                <p className="mt-4 text-sm sm:text-base font-light opacity-90 max-w-xl">
                    Transitioning Doesn’t Have to Be Stressful. Let Us Handle it!
                </p>
            </div>
        </div>

        {/* INTRO TEXT SECTION */}
        <section className="max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 leading-snug">Our services are tailored to meet each client’s personal circumstances.</h2>
            <div className="space-y-6 text-gray-600 font-light leading-relaxed max-w-3xl mx-auto text-sm md:text-base">
                <p>
                    We are dedicated to guiding clients with compassion and professionalism through challenging transitions with a tailored estate sale strategy.
                </p>
                <p>
                    Downsizing can feel overwhelming, but you don’t have to face it alone. Our caring team is here to guide you every step of the way. We’ve created a streamlined process to ease your stress while helping you get the best value for your no-longer-needed items. From start to finish, we handle it all—set up, pricing, and marketing—with one clear purpose: to deliver outstanding results for you.
                </p>
            </div>
            <div className="mt-12">
                <button className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors w-full sm:w-auto">
                    Schedule a Consultation!
                </button>
            </div>
        </section>

        {/* FREEDOM SECTION (Split) */}
        <section className="max-w-6xl mx-auto px-4 pb-20 flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
                <img 
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1932&auto=format&fit=crop" 
                    alt="Dining Room" 
                    className="w-full h-auto shadow-sm"
                />
            </div>
            <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-serif text-gray-900">Estate Sales Are About Freedom</h2>
                <div className="w-12 h-0.5 bg-gray-300 mx-auto md:mx-0"></div>
                <p className="text-gray-600 font-light leading-relaxed text-sm md:text-base">
                    The freedom to just walk away and leave your burden to us. Our expert team provides an easy, stress-free, simplified process that frees you from the things you no longer need. With help from our team, you can focus on building your new life and leave the rest to us.
                </p>
            </div>
        </section>

        {/* MAP SECTION - Responsive Fix */}
        <section className="relative w-full md:h-[500px] bg-gray-100 flex flex-col md:block">
             {/* Background Image: Absolute on Desktop, Relative height on Mobile */}
             <div className="relative md:absolute inset-0 h-[250px] md:h-full bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1774&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale"></div>
             
             {/* Overlay Card: Static on Mobile, Absolute on Desktop */}
             <div className="relative md:absolute md:top-1/2 md:left-8 lg:left-20 md:-translate-y-1/2 bg-white md:bg-white/90 md:backdrop-blur-sm p-8 md:p-12 max-w-none md:max-w-md shadow-none md:shadow-xl border-t md:border border-gray-200">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-300 pb-2">
                      <span className="font-bold uppercase tracking-widest text-xs">Map</span>
                      <span className="font-bold uppercase tracking-widest text-xs text-gray-400">Satellite</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif text-gray-900 mb-4">Areas of Service</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Our team has handled significant sales of all shapes and sizes across Southern New Jersey and Philadelphia.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                      We proudly serve areas of Camden County, Burlington County, Gloucester County, and parts of Atlantic County.
                  </p>
                  <p className="text-xs text-gray-500 mt-4 italic">
                      If you don't see your area listed, feel free to reach out — we may be able to help on a case-by-case basis.
                  </p>
             </div>
        </section>

        {/* WHY US SECTION (Dark) */}
        <section className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 bg-[#333333] text-white p-12 md:p-24 flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl font-serif mb-6">WHY US?</h2>
                <div className="space-y-6 text-gray-300 font-light leading-relaxed text-sm md:text-base">
                    <p>
                        We believe professionalism and personal touch are the heart of a great estate sale experience. Our goal is to make this transition as smooth and stress-free as possible while maximizing the value of your items.
                    </p>
                    <p>
                        With our expertise and dedication, we'll work closely with you to ensure a successful and positive outcome.
                    </p>
                </div>
                <div className="mt-10">
                    <button className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors w-full md:w-auto">
                       <DocumentIcon className="w-4 h-4" /> Let's Discuss Your Needs
                   </button>
                </div>
            </div>
            <div className="w-full md:w-1/2 h-[300px] md:h-auto">
                <img 
                    src="https://images.unsplash.com/photo-1600210492493-0946911123ea?q=80&w=1974&auto=format&fit=crop" 
                    alt="Hallway Interior" 
                    className="w-full h-full object-cover"
                />
            </div>
        </section>

        {/* ICONS BAR */}
        <MarketingIcons />

        {/* PROVEN PROCESS */}
        <section className="py-24 bg-white text-center px-4">
            <h3 className="text-2xl font-serif text-gray-900 mb-2">Proven Hands-Off, Stress-Free Process</h3>
            <p className="text-gray-500 font-light mb-8">Learn more about our optimized and detailed process, from start to finish.</p>
            <button className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors w-full sm:w-auto">
                Learn About Our Process
            </button>
        </section>

        {/* TESTIMONIALS */}
        <Testimonials />

        <Footer onAdminLogin={onAdminLogin} showAdminLink={showAdminLink} />
    </div>
  );
};

export default EstateSalesView;
