
import React, { useState } from 'react';
import Footer from './Footer';
import { PlusIcon, GavelIcon, DocumentIcon } from './icons';

interface OurProcessViewProps {
    onAdminLogin: () => void;
    showAdminLink: boolean;
}

// --- SUB-COMPONENTS ---

const ProcessStep: React.FC<{ 
    number: number; 
    title: string; 
    description: string; 
    image: string; 
    isReversed?: boolean;
}> = ({ number, title, description, image, isReversed }) => {
    return (
        <div className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center py-16`}>
            {/* Image Side */}
            <div className="w-full md:w-1/2">
                <img 
                    src={image} 
                    alt={title} 
                    className="w-full h-auto shadow-sm"
                />
            </div>
            
            {/* Text Side */}
            <div className="w-full md:w-1/2 space-y-4">
                <div className="flex items-baseline gap-3">
                    <span className="font-serif italic text-gray-500 text-lg">Step {number}</span>
                    <h3 className="font-serif text-2xl font-bold text-gray-900">{title}</h3>
                </div>
                <p className="text-gray-600 font-light leading-relaxed text-sm">
                    {description}
                </p>
            </div>
        </div>
    );
};

const FAQItem: React.FC<{ question: string; answer?: string; isOpen: boolean; onClick: () => void }> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-200">
            <button 
                onClick={onClick}
                className="w-full py-6 flex justify-between items-center text-left hover:text-gray-600 transition-colors"
            >
                <span className="font-bold text-sm text-gray-900 pr-8">{question}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <PlusIcon className="w-5 h-5 text-gray-400" />
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                    {answer || "This is a placeholder answer for the demonstration. In the real application, specific content for each question would be placed here."}
                </p>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const OurProcessView: React.FC<OurProcessViewProps> = ({ onAdminLogin, showAdminLink }) => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0); // First one open by default

  const toggleFAQ = (index: number) => {
      setOpenFAQ(openFAQ === index ? null : index);
  };

  const steps = [
      {
          title: "The Consultation",
          description: "The free consultation consists of a detailed tour of the home. We will discuss your unique needs and the pricing of our services, answer any questions you have, and develop a personalized strategy that meets your needs and exceeds your expectations. Our goal is to set you up for success and provide you with expert material and advice exclusive to our process. We are dedicated to providing the guidance and support you need through this process.",
          image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2070&auto=format&fit=crop" // Older couple consulting
      },
      {
          title: "Staging, Organizing & Advertising",
          description: "This step is essential for aesthetic, customer appeal, and advertising of your estate sale. Our expert team of stagers utilizes interior design techniques to merchandise your home and create the ultimate shopping experience. Pairing that with photography and a tailored advertising strategy ensures your items will be irresistible and seen by many.",
          image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop" // Dishes/Staging
      },
      {
          title: "Pricing & Research",
          description: "To obtain the perfect price for every item we combine detailed research with a team of experienced evaluators to ensure each item is valued properly for the market. In this step of our process, we have 2 main goals: to ensure all items are at a desirable price point - to produce maximum sale profits - and to sell as many items as possible.",
          image: "https://images.unsplash.com/photo-1576504677634-06b2130bd1f3?q=80&w=2070&auto=format&fit=crop" // Art/Frames
      },
      {
          title: "Hosting the Estate Sale/Selling",
          description: "Our combination of trained sales staff and competitive pricing ensures a high percentage of liquidation with the highest possible return. The integrity of your home and the security of your high-value items matter to us.",
          image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2070&auto=format&fit=crop" // Shopping crowd
      },
      {
          title: "Post-Sale Clean-Out & Collecting Profits",
          description: "Our carefully crafted and fine-tuned clean-out service provides you with a hands-off and stress-free close to your estate sale. We have a 2-step process. First, we collect and donate as many viable items as possible. Secondly, for a discounted rate we will provide a dumpster and clean-out crew, and you can expect the home to be completely empty in broom-swept condition. All you have to do is sit back and collect your check.",
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" // Empty clean room
      },
      {
          title: "Auction & Donations",
          description: "For select high-value items that didn't find a home during the sale, we transition them to our online auction platform to reach a broader, competitive audience. Simultaneously, for remaining household goods, we coordinate charitable donations with trusted local partners, ensuring usable items find a second life rather than a landfill. We handle all logistics and provide you with the necessary tax receipts.",
          image: "https://images.unsplash.com/photo-1593113598340-06871912ca2d?q=80&w=2070&auto=format&fit=crop" // Donations/Boxes
      }
  ];

  const faqs = [
      { question: "What do I do to prepare for a sale?", answer: "We ask you to focus on removing personal items, financial documents, family photos and things you'd like to keep, and then leave the rest for us to handle. If any personal items are left, such as family photos or financial documents, our team will collect these items and box them up for you before the sale. We ask you not to pack or organize items that are to be sold – our staff will stage the sale, and empty all cabinets and drawers. It is also best not to donate items before the sale, we will help with donations after the sale has concluded since most items will sell." },
      { question: "I have items I don't think you'll want to sell – what should i do with them?" },
      { question: "How far in advance do I have to book a sale at my home?" },
      { question: "How do you market your estate sales?" },
      { question: "I am a real estate agent with a client that needs to have an estate sale. What should I do?" },
      { question: "What happens post-sale?" },
      { question: "When will I be paid?" },
      { question: "Do you sell fine jewelry and silver?" },
      { question: "How do you price items?" },
      { question: "What areas do you service?" }
  ];

  return (
    <div className="w-full bg-white animate-fade-in">
        
        {/* HERO SECTION */}
        <div className="relative w-full h-[500px] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-black/50"></div>
            
            <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center text-white">
                <h1 className="text-4xl sm:text-6xl font-serif uppercase tracking-widest mb-4">OUR PROCESS</h1>
                <div className="w-24 h-1 bg-dotted mx-auto mb-6 opacity-50"></div>
                <p className="text-xl sm:text-2xl font-light">
                    We Make the Whole Process <br/> Simple, Easy, and Stress-Free.
                </p>
            </div>
        </div>

        {/* INTRO TEXT SECTION */}
        <section className="bg-[#EFEBE6] py-20">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-12 text-sm leading-relaxed">
                <div className="w-full md:w-1/2">
                    <p className="font-bold text-gray-900">
                        Each home is unique and every situation is different. Thee Perfect Sale, LLC takes pride in providing tailored services to each client’s needs. Giving you peace of mind and saving you an abundance of time and stress.
                    </p>
                </div>
                <div className="w-full md:w-1/2">
                    <p className="text-gray-600">
                        Whether you are selling a home after 50 years, a long-time collector, managing an estate, relocating, closing the doors of a business, or simply decluttering. We take the utmost care and professionalism in every aspect of the process.
                    </p>
                </div>
            </div>
        </section>

        {/* STEPS SECTION */}
        <section className="max-w-6xl mx-auto px-4 py-12">
            {steps.map((step, index) => (
                <ProcessStep 
                    key={index}
                    number={index + 1}
                    title={step.title}
                    description={step.description}
                    image={step.image}
                    isReversed={index % 2 !== 0} // Alternates Left/Right
                />
            ))}
        </section>

        {/* FAQ SECTION */}
        <section className="max-w-3xl mx-auto px-4 py-24">
             <h2 className="text-4xl font-serif text-center text-gray-900 mb-16">Frequently asked questions</h2>
             <div>
                 {faqs.map((faq, index) => (
                     <FAQItem 
                        key={index} 
                        question={faq.question} 
                        answer={faq.answer}
                        isOpen={openFAQ === index}
                        onClick={() => toggleFAQ(index)}
                     />
                 ))}
             </div>
        </section>

        {/* READY TO TALK CTA */}
        <section className="bg-black text-white py-20 text-center">
             <h2 className="text-3xl font-serif text-white mb-4">Ready to talk?</h2>
             <p className="text-gray-400 font-light text-sm mb-8 max-w-xl mx-auto px-4">
                 Whether you're in the early sorting stage or ready to book your estate sale we would love to guide you through the process and answer any questions you may have. <br/>
                 <span className="italic">All we ask is that you don't donate or throw anything away until we come out!</span>
             </p>
             <button className="bg-[#333] text-white border border-gray-700 px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors flex items-center gap-2 mx-auto">
                 <DocumentIcon className="w-4 h-4" /> Schedule a Free Consultation
             </button>
        </section>

        <Footer onAdminLogin={onAdminLogin} showAdminLink={showAdminLink} />
    </div>
  );
};

export default OurProcessView;
