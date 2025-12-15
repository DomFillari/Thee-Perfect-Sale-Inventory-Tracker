
import React, { useState } from 'react';
import Footer from './Footer';
import { PlusIcon } from './icons';

interface FAQViewProps {
    onAdminLogin: () => void;
    showAdminLink: boolean;
}

const FAQItem: React.FC<{ question: string; answer?: string; isOpen: boolean; onClick: () => void }> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-300">
            <button 
                onClick={onClick}
                className="w-full py-8 flex justify-between items-center text-left hover:text-gray-600 transition-colors group"
            >
                <span className="font-serif font-bold text-lg md:text-xl text-gray-900 pr-8 group-hover:text-gray-600 transition-colors">
                    {question}
                </span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <PlusIcon className="w-6 h-6 text-gray-400 font-light" />
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed max-w-4xl">
                    {answer || "Content coming soon."}
                </p>
            </div>
        </div>
    );
};

const FAQView: React.FC<FAQViewProps> = ({ onAdminLogin, showAdminLink }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Open first by default like screenshot

  const toggleFAQ = (index: number) => {
      setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
      { 
          question: "What do I do to prepare for a sale?", 
          answer: "We ask you to focus on removing personal items, financial documents, family photos and things you'd like to keep, and then leave the rest for us to handle. If any personal items are left, such as family photos or financial documents, our team will collect these items and box them up for you before the sale. We ask you not to pack or organize items that are to be sold – our staff will stage the sale, and empty all cabinets and drawers. It is also best not to donate items before the sale, we will help with donations after the sale has concluded since most items will sell." 
      },
      { 
          question: "I have items I don't think you'll want to sell – what should i do with them?",
          answer: "Don't throw anything away! One person's trash is another's treasure. Let our experts decide what is sellable. We often sell items that homeowners planned to donate or discard."
      },
      { 
          question: "How far in advance do I have to book a sale at my home?",
          answer: "We recommend booking as soon as you have a date in mind. Our calendar fills up quickly, especially during peak seasons. Typically, a 4-6 week lead time is ideal."
      },
      { 
          question: "How do you market your estate sales?",
          answer: "We utilize a multi-channel marketing strategy including our large email subscriber list, listing on major estate sale websites (EstateSales.net, etc.), social media promotion, and professional signage in the local area."
      },
      { 
          question: "I am a real estate agent with a client that needs to have an estate sale. What should I do?",
          answer: "Contact us directly! We love working with realtors. We can coordinate with your listing schedule to clear the home before closing or photos."
      },
      { 
          question: "What happens post-sale?",
          answer: "After the sale, you have options. We can leave the remaining items for you, or facilitate a complete clean-out service where items are donated or disposed of, leaving the home broom-swept and ready for closing."
      },
      { 
          question: "When will I be paid?",
          answer: "You will receive your proceeds and a detailed settlement sheet typically within 10-14 business days after the conclusion of the sale."
      },
      { 
          question: "Do you sell fine jewelry and silver?",
          answer: "Yes, absolutely. We have specific security protocols for high-value items, including jewelry cases and additional staff if necessary."
      },
      { 
          question: "How do you price items?",
          answer: "Our team has years of experience and researches current market values. For unique or high-value items, we may consult with specialized appraisers to ensure fair market value."
      },
      { 
          question: "What areas do you service?",
          answer: "We proudly serve Southern New Jersey and the Greater Philadelphia area, specifically Camden, Burlington, and Gloucester counties."
      }
  ];

  return (
    <div className="w-full bg-white animate-fade-in">
        
        {/* HERO SECTION */}
        <div className="relative w-full h-[400px] overflow-hidden">
            {/* Background Image: Stack of China Plates */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=2080&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-black/20"></div>
            
            <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center text-white">
                <div className="flex flex-col items-center justify-center bg-black text-white rounded-full w-20 h-20 mb-6 shadow-lg border-2 border-white">
                    <div className="border border-white/30 rounded-full w-16 h-16 flex items-center justify-center">
                       {/* Reusing logo concept or icon */}
                       <span className="font-serif text-2xl font-bold">TPS</span>
                    </div>
                 </div>
                <h1 className="text-4xl sm:text-6xl font-serif text-white mb-4 drop-shadow-md">Frequently Asked Questions</h1>
                <div className="w-48 h-1 bg-dotted mx-auto opacity-80"></div>
            </div>
        </div>

        {/* FAQ LIST SECTION */}
        <section className="max-w-5xl mx-auto px-4 py-24">
             <div className="border-t border-gray-300">
                 {faqs.map((faq, index) => (
                     <FAQItem 
                        key={index} 
                        question={faq.question} 
                        answer={faq.answer}
                        isOpen={openIndex === index}
                        onClick={() => toggleFAQ(index)}
                     />
                 ))}
             </div>
        </section>

        <Footer onAdminLogin={onAdminLogin} showAdminLink={showAdminLink} />
    </div>
  );
};

export default FAQView;
