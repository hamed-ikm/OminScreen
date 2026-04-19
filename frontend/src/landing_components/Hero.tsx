import { ArrowUpRight, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import { OmniLogo } from '../components/OmniLogo';

interface HeroProps {
  onTryNow: () => void;
}

export default function Hero({ onTryNow }: HeroProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
        {/* Base Palette: Soft off-white to Science Blue */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-[#E6F0FF] to-[#A9CEFF]/60"></div>

        {/* Faint, light-grey orthographic grid across the canvas */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #cbd5e1 1px, transparent 1px),
              linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Dense micro-grid in upper corners fading out to center */}
        <div 
          className="absolute top-0 left-0 w-full h-[70%] pointer-events-none opacity-[0.5]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #94a3b8 1px, transparent 1px),
              linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px',
            WebkitMaskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 45%), radial-gradient(ellipse at top left, black 0%, transparent 45%)',
            maskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 45%), radial-gradient(ellipse at top left, black 0%, transparent 45%)',
          }}
        />

        {/* Guideline Segments: Vertical spaced out columns overlay */}
        <div className="absolute inset-0 pointer-events-none flex max-w-[1800px] w-full mx-auto">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full border-r border-[#94a3b8]/20 ${
                i === 5 ? 'border-r-0' : ''
              }`}
            ></div>
          ))}
        </div>

        {/* Floating Accuracy Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute top-12 left-8 md:left-12 z-20"
        >
           <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white/60 px-4 py-2 rounded-full shadow-lg shadow-blue-900/5">
             <Crosshair className="w-4 h-4 text-[#0033A0]" />
             <span className="font-mono text-xs font-bold text-slate-800 tracking-tight">0.978 AUC-ROC Accuracy</span>
           </div>
        </motion.div>

        {/* OMNI Big Text */}
        <div className="relative z-10 w-full px-4 md:px-8 flex items-center justify-center py-24 md:py-32">
          <OmniLogo />
        </div>
      </main>

      {/* Horizontal grey line divider */}
      <div className="w-full h-[1px] bg-gray-200 relative z-20"></div>

      {/* Bottom Footer block - Solid clean white area */}
      <div className="relative z-20 w-full bg-white px-6 py-10 lg:px-16 lg:py-12 flex justify-center">
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex shrink-0 items-center justify-center gap-3 bg-[#F8FAFC] border border-gray-200 text-[#0F172A] rounded-full pl-6 pr-2 py-2 text-[15px] font-bold hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm group"
          onClick={onTryNow}
        >
          Try Now
          <div className="bg-[#0033A0] group-hover:bg-[#002277] transition-colors text-white w-10 h-10 rounded-full flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
          </div>
        </motion.button>
      </div>
    </div>
  );
}
