import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Atom, Check, Loader2 } from 'lucide-react';

// Steps mirror what the FastAPI backend actually does per prediction
const STEPS = [
  'Parsing SMILES structure',
  'Computing molecular descriptors',
  'Assessing drug-likeness (Lipinski)',
  'Running ML ensemble · RF + XGBoost + LR',
  'Calibrating confidence score',
];

interface PredictionOverlayProps {
  onCancel: () => void;
  /** SMILES of the compound being screened (single mode only) */
  compound?: string;
  /** True when screening a whole CSV batch */
  batch?: boolean;
}

export function PredictionOverlay({ onCancel, compound, batch }: PredictionOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(248, 250, 252, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="glass-panel"
        style={{
          padding: '38px 34px',
          maxWidth: '470px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px -12px rgba(0, 51, 160, 0.18)',
        }}
      >
        {/* ── Animated molecule orbit ─────────────────────────────────── */}
        <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 22px' }}>
          {/* faint glow behind the nucleus */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.5, 0.25] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: 'calc(50% - 26px)',
              borderRadius: '50%',
              background: 'var(--accent)',
              filter: 'blur(22px)',
            }}
          />

          {/* three orbit rings, each with a traveling "electron" */}
          {[
            { r: 66, dur: 9, color: 'var(--accent)' },
            { r: 46, dur: 6, color: 'var(--success)' },
            { r: 28, dur: 4, color: 'var(--warning)' },
          ].map(({ r, dur, color }, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `calc(50% - ${r}px)`,
                left: `calc(50% - ${r}px)`,
                width: r * 2,
                height: r * 2,
                border: `1.5px dashed ${i === 0 ? 'var(--border-light)' : 'var(--border-light)'}`,
                borderRadius: '50%',
                animation: `omni-orbit ${dur}s linear infinite${i % 2 ? ' reverse' : ''}`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: '50%',
                  marginLeft: -4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                }}
              />
            </div>
          ))}

          {/* nucleus */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Atom size={30} color="var(--accent)" />
          </motion.div>
        </div>

        <style>{`@keyframes omni-orbit { to { transform: rotate(360deg); } }`}</style>

        {/* ── Title ───────────────────────────────────────────────────── */}
        <h3
          style={{
            margin: '0 0 4px',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
          }}
        >
          {batch ? 'Screening your molecules' : 'Analyzing your compound'}
        </h3>
        <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          OmniScreen ensemble in progress…
        </p>

        {compound && (
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-light)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={compound}
          >
            {compound}
          </div>
        )}

        {/* ── Live pipeline steps ─────────────────────────────────────── */}
        <div style={{ textAlign: 'left', margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                {done ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={13} color="#fff" strokeWidth={3} />
                  </motion.span>
                ) : active ? (
                  <Loader2 size={20} color="var(--accent)" style={{ animation: 'omni-orbit 1s linear infinite', flexShrink: 0 }} />
                ) : (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '1.5px solid var(--border-light)',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--text-main)' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* ── Progress bar ────────────────────────────────────────────── */}
        <div
          style={{
            height: 6,
            background: 'var(--bg-light)',
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: '18px',
          }}
        >
          <motion.div
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 999,
              boxShadow: '0 0 8px var(--accent-glow)',
            }}
          />
        </div>

        {/* ── Cancel ──────────────────────────────────────────────────── */}
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 8,
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Cancel screening
        </button>
      </motion.div>
    </motion.div>
  );
}
