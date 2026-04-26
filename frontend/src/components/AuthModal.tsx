import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OmniLogo } from './OmniLogo';

interface AuthModalProps {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        onSuccess();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSignupSuccess(true);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 60px -12px rgba(0, 51, 160, 0.25)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <OmniLogo size="small" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {mode === 'signin'
              ? 'Sign in to access your personal screening history'
              : 'Join OmniScreen to save and track your results'}
          </p>
        </div>

        {/* Email verification success state */}
        {signupSuccess ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📧</div>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 10px' }}>Check your email!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 24px' }}>
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click the link to activate your account, then sign in.
            </p>
            <button
              onClick={() => { setMode('signin'); setSignupSuccess(false); setPassword(''); }}
              className="glow-btn"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogIn size={18} /> Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email field */}
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none'
              }} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input-field"
                style={{ paddingLeft: '44px', fontSize: '1rem' }}
              />
            </div>

            {/* Password field */}
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Password (min. 6 characters)' : 'Password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                style={{ paddingLeft: '44px', paddingRight: '44px', fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                  display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#dc2626', padding: '10px 14px',
                  borderRadius: '8px', fontSize: '0.875rem'
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="glow-btn"
              disabled={loading}
              style={{
                width: '100%', marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {loading ? 'Please wait...' : mode === 'signin'
                ? <><LogIn size={18} /> Sign In</>
                : <><UserPlus size={18} /> Create Account</>
              }
            </button>

            {/* Mode toggle */}
            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent)', fontWeight: 600, padding: 0, fontSize: '0.875rem'
                }}
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
