
import React from 'react';
import { GavelIcon } from './icons';

interface FooterProps {
  onAdminLogin: () => void;
  showAdminLink?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onAdminLogin, showAdminLink = true }) => {
  return (
    <footer className="bg-[#E8E4DD] pt-20 pb-12">
        {/* Newsletter Section */}
         <div className="max-w-3xl mx-auto px-4 text-center mb-20">
            <h3 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-2">Join the treasure hunt.</h3>
            <div className="w-16 h-px bg-gray-400 mx-auto my-6"></div>
            
            <form className="max-w-md mx-auto space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="First Name" 
                        className="w-full bg-transparent border border-gray-400 py-3 px-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-black transition-colors"
                    />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className="w-full bg-transparent border border-gray-400 py-3 px-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-black transition-colors"
                    />
                </div>
                <div className="pt-6">
                    <button className="bg-black text-white px-10 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors w-full sm:w-auto">
                        Subscribe
                    </button>
                </div>
            </form>
         </div>

         {/* Bottom Brand Section (Black) */}
         <div className="bg-white/0 border-t border-gray-300 pt-12">
            <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
                 <div className="flex flex-col items-center justify-center bg-black text-white rounded-full w-14 h-14 mb-6 shadow-lg">
                    <div className="border border-white/30 rounded-full w-12 h-12 flex items-center justify-center">
                       <GavelIcon className="w-6 h-6 text-white" />
                    </div>
                 </div>
                 
                 <div className="flex justify-center gap-8 text-xs text-gray-900 font-bold uppercase tracking-widest mb-8">
                    <span className="cursor-pointer hover:text-gray-600">Services</span>
                    <span className="cursor-pointer hover:text-gray-600">About Us</span>
                    <span className="cursor-pointer hover:text-gray-600">Contact</span>
                 </div>

                 <div className="flex flex-col items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
                    <p>© 2024 The Perfect Sale, LLC. All rights reserved.</p>
                    {showAdminLink && (
                        <button 
                            onClick={onAdminLogin}
                            className="hover:text-black transition-colors mt-2"
                        >
                            Staff Login
                        </button>
                    )}
                 </div>
            </div>
         </div>
      </footer>
  );
};

export default Footer;
