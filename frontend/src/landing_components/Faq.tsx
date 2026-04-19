import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'Do you only work with biotech and pharma?',
    a: 'While our primary expertise and deep domain knowledge lie within the life sciences, healthcare, and biotech sectors, we occasionally partner with ambitious brands in related technical fields that require similar precision and high-end design.'
  },
  {
    q: 'How long does a typical project take?',
    a: 'A comprehensive branding and platform design project typically ranges from 12 to 16 weeks. However, smaller tightly scoped engagements like UX audits or landing pages can be completed in 4 to 6 weeks.'
  },
  {
    q: 'What is your design process?',
    a: 'We follow a rigorous, data-informed process: Discovery & Strategy (understanding your science/audience), UX Architecture (wireframing the flow), High-Fidelity UI Design, and systematic Handoff or Development.'
  },
  {
    q: 'Can you implement the designs you create?',
    a: 'Yes, we have a specialized development team that builds pixel-perfect, performant, and secure front-end applications, ensuring the final product matches our rigorous design standards.'
  }
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-[#F8FAFC] py-24 md:py-32">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-16">
        <h3 className="text-[#0033A0] font-bold tracking-widest uppercase text-sm mb-4 text-center">Inquiries</h3>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-16 text-center">
          COMMON QUESTIONS
        </h2>

        <div className="flex flex-col border-t border-gray-200">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="border-b border-gray-200 bg-white">
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-6 px-6 sm:px-8 flex items-center justify-between text-left focus:outline-none group"
                >
                  <span className={`text-lg md:text-xl font-bold pr-8 transition-colors ${isOpen ? 'text-[#0033A0]' : 'text-slate-900 group-hover:text-[#0033A0]'}`}>
                    {faq.q}
                  </span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-[#0033A0] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-[#0033A0]'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-8 px-6 sm:px-8 text-slate-600 text-[1.1rem] font-medium leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
