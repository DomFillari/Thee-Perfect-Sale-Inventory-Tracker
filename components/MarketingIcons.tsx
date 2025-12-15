
import React from 'react';
import { DocumentIcon, SearchIcon, HandshakeIcon } from './icons';

const MarketingIcons: React.FC = () => {
  return (
      <section className="border-y border-gray-100 py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 text-center">
              <div className="flex items-center gap-4">
                  <DocumentIcon className="w-10 h-10 text-gray-400" />
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-700">No Hidden Fees</span>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
              <div className="flex items-center gap-4">
                  <SearchIcon className="w-10 h-10 text-gray-400" />
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-700">Unlocking Value</span>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
              <div className="flex items-center gap-4">
                  <HandshakeIcon className="w-10 h-10 text-gray-400" />
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-700">Bonded & Insured</span>
              </div>
          </div>
      </section>
  );
};

export default MarketingIcons;
