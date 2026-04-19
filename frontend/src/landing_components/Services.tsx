import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Users, Globe, TrendingUp } from 'lucide-react';

const statsData = [
  {
    icon: Users,
    value: '0.978',
    title: 'Model Accuracy',
    desc: 'Exceptional predictive performance across diverse chemical libraries using soft-voting ensemble logic.'
  },
  {
    icon: Globe,
    value: '15',
    title: 'Core Descriptors',
    desc: 'Optimized feature selection using SFS to identify the most critical physicochemical drivers of activity.'
  },
  {
    icon: TrendingUp,
    value: 'Zero',
    title: 'De Novo Lag',
    desc: 'Bypassing traditional development timelines by repurposing existing, safety-validated compounds.'
  }
];

const services = [
  {
    title: 'Antibiotic Model',
    num: '01',
    description: 'Our ensemble machine learning pipeline integrates Random Forest, XGBoost, and Logistic Regression to virtually screen chemical libraries with surgical precision. By isolating 15 key molecular descriptors, including TPSA, we identify high-confidence repurposing candidates to bypass traditional drug development bottlenecks',
    stats: statsData,
  }
];

export default function Services() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-[#F8FAFC] py-24 md:py-32 border-b border-gray-200">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-16">
        <div>
          <h3 className="text-[#0033A0] font-bold tracking-widest uppercase text-sm mb-6">PROJECTS</h3>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
            ELEVATING DRUG DISCOVERY
          </h2>
          <p className="text-slate-600 text-lg font-medium max-w-md">
            Our goal is to develop AI drug discovery models , that are accurate , cost saving and fast
          </p>
        </div>

        <div className="flex flex-col border-t border-gray-200">
          {services.map((service, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="border-b border-gray-200 group">
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-8 flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex items-center gap-8">
                    <span className="font-mono text-[#0033A0] font-bold text-sm">{service.num}</span>
                    <span className={`text-2xl md:text-4xl font-black transition-colors ${isOpen ? 'text-[#0033A0]' : 'text-slate-900 group-hover:text-[#0033A0]'}`}>
                      {service.title}
                    </span>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${isOpen ? 'border-[#0033A0] bg-[#0033A0] text-white' : 'border-gray-300 text-slate-400 group-hover:border-[#0033A0] group-hover:text-[#0033A0]'}`}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-8 pl-16 max-w-2xl text-slate-600 text-lg font-medium">
                        {service.description}
                      </p>

                      {service.stats && (
                        <div className="pl-16 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
                          {service.stats.map((stat, statIdx) => (
                            <div key={statIdx} className="flex flex-col gap-4">
                              <div className="bg-blue-50 w-12 h-12 flex items-center justify-center rounded-xl text-[#0033A0]">
                                <stat.icon className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="text-3xl font-black text-slate-900 mb-2">{stat.value}</div>
                                <div className="text-sm font-bold tracking-widest text-[#0033A0] uppercase mb-1">{stat.title}</div>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">{stat.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
