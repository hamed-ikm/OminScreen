import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, Zap, Upload, ArrowLeft, XCircle, History, LogOut } from 'lucide-react';
import { ScoreDial } from './components/ScoreDial';
import { MetricCard } from './components/MetricCard';
import { ResultsTable } from './components/ResultsTable';
import Landing from './Landing';
import { OmniLogo } from './components/OmniLogo';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import './index.css';

interface PredictionResponse {
  features: Record<string, number>;
  druglikeness: {
    MolecularWeight: number;
    LogP: number;
    HBD: number;
    HBA: number;
    PassesLipinski: boolean;
  };
  predicted_probability: number;
  confidence_score: number;
}

export default function App() {
  const [smiles, setSmiles] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const { user, loading: authLoading, signOut } = useAuth();

  // Called when "Try Now" is clicked on Landing page
  const handleTryNow = () => {
    if (user) {
      // Already logged in — go straight to screening
      setShowLanding(false);
    } else {
      // Not logged in — show auth modal over the landing page
      setShowAuth(true);
    }
  };

  // Called after successful login/signup
  const handleAuthSuccess = () => {
    setShowAuth(false);
    setShowLanding(false);
  };

  // ── History (Supabase per-user) ──────────────────────────────────────────
  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('screening_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Map Supabase column names to the format ResultsTable expects
      const mapped = data.map(row => ({
        id: row.id,
        SMILES: row.smiles,
        Date: new Date(row.created_at).toLocaleDateString(),
        Prediction_Probability: row.prediction_probability,
        Scientific_Confidence: row.confidence_score,
        Drug_Likeness_Pass: row.drug_likeness_pass,
      }));
      setHistoryData(mapped);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    await supabase.from('screening_history').delete().eq('user_id', user.id);
    setHistoryData([]);
  };

  const handleDeleteHistoryRow = async (id: string) => {
    await supabase.from('screening_history').delete().eq('id', id);
    setHistoryData(prev => prev ? prev.filter(r => r.id !== id) : null);
  };

  const toggleHistory = () => {
    if (!showHistory) fetchHistory();
    setShowHistory(!showHistory);
    setResult(null);
    setBatchResults(null);
    setSmiles('');
    setError('');
  };

  // ── Save prediction to Supabase ─────────────────────────────────────────
  const savePrediction = async (smilesStr: string, data: PredictionResponse) => {
    if (!user) return;
    await supabase.from('screening_history').insert({
      user_id: user.id,
      smiles: smilesStr,
      prediction_probability: data.predicted_probability,
      confidence_score: data.confidence_score,
      drug_likeness_pass: data.druglikeness.PassesLipinski ? 'Passed' : 'Failed',
    });
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setError('Screening cancelled by user.');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setBatchMode(true);
    setResult(null);
    setBatchResults(null);

    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/predict_batch`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Batch prediction failed.');
      }

      const data = await response.json();
      setBatchResults(data.data);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'An error occurred during batch screening.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handlePredict = async () => {
    if (!smiles) return;
    setLoading(true);
    setError('');
    setBatchMode(false);
    setBatchResults(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Prediction failed or invalid SMILES.');
      }

      const data = await response.json();
      setResult(data);
      await savePrediction(smiles, data);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowLanding(true);
    setResult(null);
    setBatchResults(null);
    setHistoryData(null);
    setShowHistory(false);
    setSmiles('');
    setError('');
  };

  // Waiting for auth session to be checked
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent)', filter: 'blur(15px)' }}
        />
      </div>
    );
  }

  if (showLanding) {
    return (
      <>
        <Landing onTryNow={handleTryNow} />
        <AnimatePresence>
          {showAuth && <AuthModal onSuccess={handleAuthSuccess} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="omni-app-container relative">

      <div className="omni-top-nav">
        <button
          onClick={() => setShowLanding(true)}
          className="flex items-center gap-2 hover:text-[#0033A0] transition-colors font-medium text-[#64748b]"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={toggleHistory}
            className="flex items-center gap-2 hover:text-[#0033A0] transition-colors font-medium text-[#64748b]"
          >
            <History size={20} /> {showHistory ? 'Close History' : 'My History'}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 hover:text-[#ef4444] transition-colors font-medium text-[#64748b]"
            title={`Signed in as ${user?.email}`}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {!showHistory && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ textAlign: 'center', marginBottom: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
              <OmniLogo size="small" />
            </div>
            <p className="omni-description">
              Antibacterial module. Enter a SMILES string to virtually screen your chemical compound's efficacy.
            </p>
          </motion.div>

          <motion.div
            className="glass-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ padding: '30px', display: 'flex', gap: '20px', alignItems: 'center', flexDirection: 'column' }}
          >
            <div className="omni-input-row">
              <input
                type="text"
                className="input-field"
                placeholder="e.g. CC1(C(N2C(S1)C(C2=O)NC(=O)C(C3=CC=CC=C3O)N)C(=O)O)C (Amoxicillin)"
                value={smiles}
                onChange={(e) => { setSmiles(e.target.value); setBatchMode(false); }}
              />
              <div className="omni-input-btns">
                <button
                  className="glow-btn"
                  onClick={handlePredict}
                  disabled={loading || !smiles}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}
                >
                  {loading && !batchMode ? 'Screening...' : 'Screen Compound'}
                  {!loading && <ArrowRight size={20} />}
                </button>
                {loading && !batchMode && (
                  <button
                    onClick={handleCancel}
                    className="glow-btn"
                    style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px' }}
                  >
                    <XCircle size={18} /> Cancel
                  </button>
                )}
              </div>
            </div>

            <div style={{ margin: '30px 0', color: 'var(--text-muted)', fontSize: '0.9rem', width: '100%', textAlign: 'center', borderBottom: '1px solid var(--border-light)', lineHeight: '0.1em' }}>
              <span style={{ background: 'var(--panel-bg)', padding: '0 15px' }}>OR</span>
            </div>

            <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'center' }}>
              <div style={{ flex: 1, display: 'flex' }}>
                <input
                  type="file"
                  id="csvUpload"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="csvUpload"
                  className="glow-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: (loading ? 'not-allowed' : 'pointer'), background: 'var(--bg-light)', border: '1px dashed var(--border-light)', color: 'var(--text-main)', opacity: loading ? 0.8 : 1, width: '100%', justifyContent: 'center' }}
                >
                  <Upload size={20} />
                  {loading && batchMode ? 'Processing CSV...' : 'Upload CSV for Batch Screening'}
                </label>
              </div>
              {loading && batchMode && (
                <button
                  onClick={handleCancel}
                  className="glow-btn"
                  style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', flexShrink: 0 }}
                >
                  <XCircle size={18} /> Cancel
                </button>
              )}
            </div>
            {error && <div style={{ color: 'var(--error)', marginTop: '10px' }}>{error}</div>}
          </motion.div>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', filter: 'blur(20px)' }}
              />
            </motion.div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="omni-results-grid"
              >
                <div className="glass-panel omni-score-panel">
                  <h2 style={{ marginTop: 0, marginBottom: '30px', color: 'var(--text-main)' }}>Prediction Probability</h2>
                  <ScoreDial score={result.predicted_probability} />

                  <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Scientific Confidence Score</span>
                      <strong>{(result.confidence_score * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="omni-metric-grid">
                    <MetricCard
                      title="Drug-Likeness (Lipinski)"
                      icon={<Activity size={24} color="var(--success)" />}
                      value={result.druglikeness.PassesLipinski ? "Passed" : "Failed"}
                      status={result.druglikeness.PassesLipinski ? 'success' : 'error'}
                    />
                    <MetricCard
                      title="Target Affiliation"
                      icon={<Zap size={24} color={result.predicted_probability > 0.8 ? "var(--success)" : "var(--warning)"} />}
                      value={result.predicted_probability > 0.8 ? "High" : result.predicted_probability > 0.5 ? "Moderate" : "Low"}
                      status={result.predicted_probability > 0.8 ? 'success' : 'warning'}
                    />
                  </div>

                  <div className="glass-panel" style={{ padding: '25px', flex: 1 }}>
                    <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Physicochemical Properties
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                      {Object.entries({
                        "Mol Weight": `${result.druglikeness.MolecularWeight.toFixed(1)} Da`,
                        "LogP": result.druglikeness.LogP.toFixed(2),
                        "HBD": result.druglikeness.HBD,
                        "HBA": result.druglikeness.HBA,
                        "TPSA": `${result.features['TPSA']} Å²`
                      }).map(([key, val]) => (
                        <div key={key} style={{ background: 'var(--bg-light)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{key}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {batchResults && !loading && batchMode && (
              <ResultsTable data={batchResults} />
            )}
          </AnimatePresence>
        </>
      )}

      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResultsTable
            data={historyData || []}
            title={`My Screening History`}
            filename="OmniScreen_History.csv"
            onClearAll={handleClearHistory}
            onDeleteRow={handleDeleteHistoryRow}
          />
          {historyData && historyData.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧪</div>
              <p>No screening history yet. Screen your first compound to get started!</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
