
import React from 'react';
import Footer from './Footer';
import Testimonials from './Testimonials';

interface CleanOutViewProps {
    onAdminLogin: () => void;
    showAdminLink: boolean;
}

const CleanOutView: React.FC<CleanOutViewProps> = ({ onAdminLogin, showAdminLink }) => {
  return (
    <div className="w-full bg-white animate-fade-in">
        
        {/* HERO SECTION */}
        <div className="relative w-full h-[500px] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-black/40"></div>
            
            {/* "For Sale" Sign Decoration (Optional simulation of the screenshot) */}
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-30 hidden md:block pointer-events-none">
                 <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
            </div>

            <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center text-white">
                <h1 className="text-5xl sm:text-7xl font-serif uppercase tracking-widest mb-4">CLEAN-OUTS</h1>
                <div className="w-24 h-1 bg-white/50 mb-6"></div>
                <p className="text-xl sm:text-2xl font-light max-w-2xl">
                    Leaving you an empty house and <br/> funds for your next chapter.
                </p>
            </div>
        </div>

        {/* CONTENT SECTION */}
        <section className="max-w-6xl mx-auto px-4 py-20">
            <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
                
                {/* Left Column */}
                <div className="w-full md:w-5/12 space-y-8">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        We provide clean-out services for when you need an entire home cleared out—whether it’s after an estate sale or to get it ready to hit the market.
                    </h2>
                    
                    <button className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors w-full md:w-auto">
                        Schedule a Consultation!
                    </button>

                    <div className="pt-4 space-y-4">
                        <p className="text-sm font-bold text-gray-900">
                            We can also help prepare a home for sale to yield the best price, including:
                        </p>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                            <li>Realtor Referral</li>
                            <li>Staging: depersonalizing & de-cluttering</li>
                        </ul>
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-full md:w-7/12 space-y-6 text-gray-600 font-light leading-relaxed text-sm lg:text-base">
                    <p>
                        Another way we offer a stress-free service for our clients. The last thing you need is the overwhelming task of cleaning out a home. That’s where we come in. We provide a range of clean-out solutions tailored to your needs, handling everything from start to finish. In just a few short days, we can clear out an entire home, leaving it broom-swept, vacuumed, and move-in ready.
                    </p>
                    <p>
                        After an estate sale, 90% of our clients opt for our clean-out service to take care of the items that didn’t sell. We donate and dispose of what’s left, so you don’t have to worry about a thing. You simply take what you want to keep, and we handle the rest—taking the stress off your plate and giving you peace of mind.
                    </p>
                </div>
            </div>
        </section>

        {/* IMAGE SECTION */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
            <img 
                src="https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?q=80&w=2080&auto=format&fit=crop" 
                alt="Cleaned out dining room with table" 
                className="w-full h-auto shadow-sm"
            />
        </section>

        {/* BOTTOM CTA */}
        <section className="max-w-4xl mx-auto px-4 pb-24 text-center">
            <h3 className="text-xl md:text-2xl font-serif text-gray-900 mb-8 leading-normal">
                Don't let the junk hold you back any longer. Contact us today to learn more about our estate cleanout services and discover how we can help you reclaim your space with care and efficiency.
            </h3>
            <button className="bg-black text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                Contact Us Now!
            </button>
        </section>

        {/* TESTIMONIALS */}
        <Testimonials />

        <Footer onAdminLogin={onAdminLogin} showAdminLink={showAdminLink} />
    </div>
  );
};

export default CleanOutView;
