
import React from 'react';
import { QuoteIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

const Testimonials: React.FC = () => {
  return (
      <section className="bg-[#EFEBE6] py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 mb-8 flex items-center justify-center gap-4">
                  <span className="h-px w-12 bg-gray-400"></span>
                  Testimonials
                  <span className="h-px w-12 bg-gray-400"></span>
              </h3>
              
              <div className="mb-8">
                  <QuoteIcon className="w-8 h-8 text-gray-300 mx-auto mb-6" />
                  <p className="font-serif text-2xl italic text-gray-600 leading-relaxed mb-6">
                      "Cortney handled the sale of my parent's estate. She took care of everything and the sale was successful. This was important for my peace of mind as I live in another state. However everything was handled very professionally."
                  </p>
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Susan M. Haddonfield, NJ</p>
                  <div className="flex justify-center gap-1 mt-2">
                       {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-3 h-3 text-gray-400" />)}
                  </div>
              </div>
              
              <div className="flex justify-center gap-12 mt-12 text-gray-400">
                   <ChevronLeftIcon className="w-8 h-8 cursor-pointer hover:text-black transition" />
                   <ChevronRightIcon className="w-8 h-8 cursor-pointer hover:text-black transition" />
              </div>
              
              <div className="mt-8">
                   <a href="#" className="text-xs underline text-gray-500 hover:text-black">Rated 4.9 out of 66 Google Reviews</a>
              </div>
          </div>
          
           {/* Logos Section */}
          <div className="max-w-7xl mx-auto px-4 mt-16 pt-16 border-t border-gray-300/50">
                <div className="flex justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="h-16 w-32 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500">ASEL</div>
                    <div className="h-16 w-32 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500">NESA</div>
                </div>
          </div>
      </section>
  );
};

export default Testimonials;
