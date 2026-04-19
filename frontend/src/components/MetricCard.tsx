import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  status: 'success' | 'warning' | 'error' | 'neutral';
}

export function MetricCard({ title, value, icon, status }: MetricCardProps) {
  let color = 'var(--text-main)';
  if (status === 'success') color = 'var(--success)';
  if (status === 'warning') color = 'var(--warning)';
  if (status === 'error') color = 'var(--error)';

  return (
    <motion.div 
      className="glass-panel"
      whileHover={{ y: -5, scale: 1.02 }}
      style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}
    >
      <div style={{ background: 'var(--bg-light)', padding: '15px', borderRadius: '12px', display: 'flex' }}>
        {icon}
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px' }}>{title}</div>
        <div style={{ color, fontSize: '1.5rem', fontWeight: 600 }}>{value}</div>
      </div>
    </motion.div>
  );
}
