import { motion } from 'framer-motion';

export function OmniLogo({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isSmall = size === 'small';
  
  return (
    <motion.div
      layoutId="omniscreen-logo"
      className="flex flex-col text-[#0033A0] font-black uppercase pointer-events-none"
    >
      <div 
        className="flex flex-row items-center justify-center w-full"
        style={{ fontSize: isSmall ? 'clamp(2rem, 5vw, 4rem)' : 'clamp(5rem, 16vw, 32rem)' }}
      >
        <div
          className="relative rounded-full flex-shrink-0 overflow-hidden shadow-2xl"
          style={{
            height: '0.73em',
            width: '1.8em',
            border: '0.14em solid #0033A0',
            marginRight: '0.04em',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/60 via-blue-400/40 to-indigo-500/20 backdrop-blur-sm mix-blend-multiply" />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(255,255,255,0.7)] pointer-events-none" />
        </div>

        <span className="tracking-[-0.05em]" style={{ lineHeight: 0.73 }}>
          MNI
        </span>
      </div>

      <div 
        className="flex flex-row justify-between w-full"
        style={{ fontSize: isSmall ? 'clamp(0.6rem, 1.3vw, 1.1rem)' : 'clamp(1.5rem, 4.4vw, 8.8rem)', marginTop: '0.1em' }}
      >
        <span>S</span>
        <span>C</span>
        <span>R</span>
        <span>E</span>
        <span>E</span>
        <span>N</span>
      </div>
    </motion.div>
  );
}
