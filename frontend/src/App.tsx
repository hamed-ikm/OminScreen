import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, Zap, Upload, ArrowLeft, XCircle, History, Compass } from 'lucide-react';
import { ScoreDial } from './components/ScoreDial';
import { MetricCard } from './components/MetricCard';
import { ResultsTable } from './components/ResultsTable';
import { Batch3DPlots } from './components/Batch3DPlots';
import { DockingStudio } from './components/DockingStudio';
import Landing from './Landing';
import { OmniLogo } from './components/OmniLogo';
import { PredictionOverlay } from './components/PredictionOverlay';
import { addHistoryRow, addHistoryRows, clearHistoryRows, deleteHistoryRow, getHistoryRows } from './lib/localHistory';
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
  structure_3d?: any;
}

export default function App() {
  const [smiles, setSmiles] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showDocking, setShowDocking] = useState(false);
  const [dockingCandidate, setDockingCandidate] = useState<string>('');
  const [historyData, setHistoryData] = useState<any[] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Called when "Try Now" is clicked on Landing page
  const handleTryNow = () => {
    // Auth temporarily bypassed — guests go straight to screening
    setShowLanding(false);
  };

  // ── History (local, per-browser — guest mode) ────────────────────────────
  const fetchHistory = async () => {
    setHistoryData(getHistoryRows().map(row => ({
      id: row.id,
      SMILES: row.smiles,
      Date: new Date(row.created_at).toLocaleDateString(),
      Prediction_Probability: row.prediction_probability,
      Scientific_Confidence: row.confidence_score,
      Drug_Likeness_Pass: row.drug_likeness_pass,
      Molecular_Weight: row.molecular_weight,
      LogP: row.logp,
      TPSA: row.tpsa,
    })));
  };

  const handleClearHistory = async () => {
    clearHistoryRows();
    setHistoryData([]);
  };

  const handleDeleteHistoryRow = async (id: string) => {
    deleteHistoryRow(id);
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

  // ── Save prediction locally (guest mode) ────────────────────────────────
  const savePrediction = async (smilesStr: string, data: PredictionResponse) => {
    addHistoryRow(
      smilesStr,
      data.predicted_probability,
      data.confidence_score,
      data.druglikeness.PassesLipinski ? 'Passed' : 'Failed',
      data.druglikeness.MolecularWeight,
      data.druglikeness.LogP,
      Number(data.features['TPSA'] ?? 0),
    );
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

      // Persist batch results to local history so they appear in History & Docking Studio
      const batchData: any[] = data.data || [];
      addHistoryRows(
        batchData
          .filter((r: any) => r.Drug_Likeness_Pass !== 'Error')
          .map((r: any) => ({
            smiles: String(r.SMILES ?? r.smiles ?? r['Canonical_SMILES'] ?? ''),
            predictionProbability: Number(r.Prediction_Probability ?? 0),
            confidenceScore: Number(r.Scientific_Confidence ?? 0),
            drugLikenessPass: String(r.Drug_Likeness_Pass ?? ''),
            molecularWeight: r.Molecular_Weight != null ? Number(r.Molecular_Weight) : undefined,
            logp: r.LogP != null ? Number(r.LogP) : undefined,
            tpsa: r.TPSA != null ? Number(r.TPSA) : undefined,
          }))
      );
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

  if (showLanding) {
    return <Landing onTryNow={handleTryNow} />;
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
            onClick={() => {
              if (!showDocking) fetchHistory();
              setShowDocking(!showDocking);
              setShowHistory(false);
            }}
            className="flex items-center gap-2 font-medium transition-colors"
            style={{
              color: showDocking ? 'var(--accent)' : '#64748b',
              background: showDocking ? 'rgba(0, 51, 160, 0.08)' : 'transparent',
              padding: '6px 12px',
              borderRadius: '6px',
              border: showDocking ? '1px solid var(--accent)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <Compass size={19} color={showDocking ? 'var(--accent)' : '#64748b'} />
            {showDocking ? 'Close Docking' : 'Docking Studio'}
          </button>

          <button
            onClick={() => {
              toggleHistory();
              setShowDocking(false);
            }}
            className="flex items-center gap-2 hover:text-[#0033A0] transition-colors font-medium text-[#64748b]"
          >
            <History size={20} /> {showHistory ? 'Close History' : 'My History'}
          </button>
        </div>
      </div>

      {!showHistory && !showDocking && (
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

          <AnimatePresence>
            {loading && (
              <PredictionOverlay
                onCancel={handleCancel}
                batch={batchMode}
                compound={batchMode ? undefined : smiles}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}
              >
                <div className="omni-results-grid">
                  <div className="glass-panel omni-score-panel">
                    <h2 style={{ marginTop: 0, marginBottom: '30px', color: 'var(--text-main)' }}>Prediction Probability</h2>
                    <ScoreDial score={result.predicted_probability} />

                    <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Scientific Confidence Score</span>
                        <strong>{(result.confidence_score * 100).toFixed(1)}%</strong>
                      </div>
                      {result.predicted_probability >= 0.60 && (
                        <button
                          onClick={() => {
                            setDockingCandidate(smiles);
                            setShowDocking(true);
                            setShowHistory(false);
                          }}
                          className="glow-btn"
                          style={{
                            marginTop: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #0033A0 0%, #1e40af 100%)',
                            color: '#fff',
                            width: '100%',
                          }}
                        >
                          <Compass size={16} /> Test Pose in Docking Studio ➔
                        </button>
                      )}
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
                          "TPSA": `${Number(result.features['TPSA']).toFixed(2)} Å²`
                        }).map(([key, val]) => (
                          <div key={key} style={{ background: 'var(--bg-light)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{key}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3D Prediction Plots (Chemical Space, Polarity Landscape, Lipinski Frontier, 3D Conformer) */}
                <Batch3DPlots
                  data={[{
                    SMILES: smiles,
                    smiles: smiles,
                    Molecular_Weight: result.druglikeness.MolecularWeight,
                    LogP: result.druglikeness.LogP,
                    TPSA: Number(result.features['TPSA'] ?? 0),
                    HBD: result.druglikeness.HBD,
                    HBA: result.druglikeness.HBA,
                    Prediction_Probability: result.predicted_probability,
                    Scientific_Confidence: result.confidence_score,
                    Drug_Likeness_Pass: result.druglikeness.PassesLipinski ? 'Yes' : 'No',
                    structure_3d: result.structure_3d,
                  }]}
                  structure3d={result.structure_3d}
                  candidateSmiles={smiles}
                  title="Candidate 3D Visualizations & Chemical Space"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {batchResults && !loading && batchMode && (
              <>
                <ResultsTable data={batchResults} onDock={(smi) => { setDockingCandidate(smi); setShowDocking(true); }} />
                <Batch3DPlots data={batchResults} />
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {showDocking && (
        <DockingStudio
          initialSmiles={dockingCandidate || smiles}
          historyCandidates={historyData || []}
          onClose={() => setShowDocking(false)}
        />
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
            onDock={(smi) => { setDockingCandidate(smi); setShowDocking(true); }}
          />
          {historyData && historyData.length > 0 && (
            <Batch3DPlots
              data={historyData}
              title="Screening History 3D Space & Landscapes"
            />
          )}
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
