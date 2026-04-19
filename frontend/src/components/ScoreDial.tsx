import { motion } from 'framer-motion';

export function ScoreDial({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  let color = 'var(--accent)';
  if (percentage > 80) color = 'var(--success)';
  if (percentage < 50) color = 'var(--error)';

  return (
    <div style={{ position: 'relative', width: '200px', height: '200px' }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
        <circle 
          cx="100" cy="100" r={radius} 
          fill="none" 
          stroke="var(--border-light)" 
          strokeWidth="12" 
        />
        <motion.circle 
          cx="100" cy="100" r={radius} 
          fill="none" 
          stroke={color} 
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <motion.span 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}
        >
          {percentage}%
        </motion.span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>Probability</span>
      </div>
    </div>
  );
}
