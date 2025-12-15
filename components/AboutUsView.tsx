
import React from 'react';
import Footer from './Footer';
import Testimonials from './Testimonials';
import { DocumentIcon } from './icons';

interface AboutUsViewProps {
    onAdminLogin: () => void;
    showAdminLink: boolean;
}

const AboutUsView: React.FC<AboutUsViewProps> = ({ onAdminLogin, showAdminLink }) => {
  return (
    <div className="w-full bg-white animate-fade-in">
        
        {/* HERO SECTION */}
        <div className="relative w-full h-[500px] overflow-hidden">
            {/* Background Image: Vinyl Records / Vintage Shop Vibe */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603048588665-791ca8aea616?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-black/40"></div>
            
            <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center text-white">
                <h1 className="text-5xl sm:text-7xl font-serif uppercase tracking-widest mb-4">ABOUT US</h1>
                <div className="w-24 h-1 bg-white/50 mb-6"></div>
                <p className="text-xl sm:text-2xl font-light tracking-wide">
                    How our story started - and why
                </p>
            </div>
        </div>

        {/* STORY CONTENT SECTION */}
        <section className="max-w-4xl mx-auto px-4 py-20 text-gray-600 font-light leading-relaxed text-sm sm:text-base space-y-6 text-center sm:text-left">
            <p>
                Ever found yourself wandering through an estate sale, captivated by the exquisite objects and the whispers of stories they hold? Perhaps a vintage Chanel handbag, a first edition Hemingway, or a breathtaking piece of art deco furniture? That's the allure of estate sales – a glimpse into a life well-lived, a chance to acquire something truly unique and special. And that's precisely what ignited the passion behind Thee Perfect Sale.
            </p>
            
            <p>
                Our founder, Cortney, has always been drawn to the curated beauty and hidden gems found within estate sales. More than just acquiring beautiful things, she was fascinated by the stories they told and the legacies they represented. After years of working in the corporate world of creative & marketing, she realized something was missing. She wanted to do something more meaningful, something that combined her love of estate sales with her passion for helping people. She knew there was a way to elevate the estate sale experience, Cortney envisioned a company that not only curated exceptional estates but infused the industry with compassion and sophistication.
            </p>
            
            <p>
                And that's how Thee Perfect Sale was born! Back in 2019, Cortney took a leap of faith and started her own company. With over 10 years of experience in retail and marketing, Cortney knows how to make a sale a success. But what sets Thee Perfect Sale apart is our commitment to making the whole experience as smooth and stress-free as possible. We get it – dealing with an estate sale can be emotional, and we're here to support you every step of the way.
            </p>
            
            <p>
                We're not your typical estate sale company. We're all about bringing a fresh perspective to the industry and making sure both our clients and customers are happy. At Thee Perfect Sale, we believe in creating an experience that is both refined and approachable. Whether you're seeking to downsize your collection, relocate to a new chapter, or handle the estate of a loved one, we're here to guide you with grace, expertise, and a commitment to preserving legacies.
            </p>
            
            <p>
                Step into a world where cherished memories meet modern sophistication.
            </p>
            
            <p className="font-bold text-gray-900 text-lg pt-4">
                Welcome to Thee Perfect Sale.
            </p>

            <div className="pt-8">
                <button className="bg-[#333] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 mx-auto sm:mx-0">
                    <DocumentIcon className="w-4 h-4" /> Schedule a Consultation!
                </button>
            </div>
        </section>

        {/* TESTIMONIALS */}
        <Testimonials />

        <Footer onAdminLogin={onAdminLogin} showAdminLink={showAdminLink} />
    </div>
  );
};

export default AboutUsView;
