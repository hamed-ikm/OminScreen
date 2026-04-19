import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function Cta() {
  return (
    <div className="bg-white py-32 border-b border-gray-200">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-16 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-[-0.04em] text-slate-900 mb-8"
        >
          PROJECT IN <br/> <span className="text-[#0033A0]">MIND?</span>
        </motion.h2>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="flex justify-center"
        >
          <button className="flex items-center gap-4 bg-[#0033A0] text-white rounded-full pl-8 pr-3 py-3 text-lg font-bold hover:bg-[#002277] transition-all shadow-xl shadow-blue-900/20 group">
            Start a Conversation
            <div className="bg-white text-[#0033A0] w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-6 h-6" strokeWidth={2.5} />
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
