import { Globe, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function Stats() {
  return (
    <div className="bg-white py-24 border-b border-gray-200 overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-16">
        
        {/* Large "MODERN DESIGN" floating text */}
        <div className="mb-24 flex justify-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-[#0F172A] font-black uppercase text-center leading-[0.85] tracking-tight"
            style={{ fontSize: 'clamp(3rem, 10vw, 12rem)' }}
          >
            INTELLIGENT DISCOVERY <br/>
            WITH <span className="text-[#0033A0]">OMNISCREEN</span>
          </motion.h2>
        </div>

      </div>
    </div>
  );
}
