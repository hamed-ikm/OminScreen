// eslint-disable-next-line @typescript-eslint/no-explicit-any
import Plotly from 'plotly.js-dist-min';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Download, Box, Layers, RefreshCw, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PlotlyAny: any = Plotly;

export interface Atom3D {
  index: number;
  symbol: string;
  x: number;
  y: number;
  z: number;
  is_hydrogen: boolean;
}

export interface Bond3D {
  begin: number;
  end: number;
  order: number;
}

export interface Structure3D {
  atoms: Atom3D[];
  bonds: Bond3D[];
}

export interface Batch3DPlotsProps {
  data: any[];
  title?: string;
  structure3d?: Structure3D | null;
  candidateSmiles?: string;
}

const PLOT_VIEWS = [
  { key: 'chemical_space', label: 'Chemical Space', desc: 'Molecular Weight (Da) × LogP × P(active)%' },
  { key: 'polarity_map', label: 'Polarity Landscape', desc: 'TPSA (Å²) × Molecular Weight (Da) × Confidence%' },
  { key: 'lipinski_space', label: 'Lipinski Frontier', desc: 'LogP × Molecular Weight (Da) × P(active)%' },
  { key: 'structure_3d', label: '3D Molecular Structure', desc: 'Interactive 3D ball-and-stick atomic conformer' },
] as const;

type ViewKey = (typeof PLOT_VIEWS)[number]['key'];

// Reference antibiotic benchmarks for contextual chemical space mapping
const REFERENCE_BENCHMARKS = [
  { name: 'Penicillin G', category: 'β-Lactam', mw: 334.39, logp: 1.83, tpsa: 97.4, prob: 94.2, conf: 91.5, lipinski: 'Yes' },
  { name: 'Amoxicillin', category: 'β-Lactam', mw: 365.40, logp: 0.87, tpsa: 120.3, prob: 92.8, conf: 89.0, lipinski: 'Yes' },
  { name: 'Ciprofloxacin', category: 'Fluoroquinolone', mw: 331.34, logp: 0.28, tpsa: 72.8, prob: 96.1, conf: 94.3, lipinski: 'Yes' },
  { name: 'Doxycycline', category: 'Tetracycline', mw: 444.43, logp: -0.02, tpsa: 181.6, prob: 89.4, conf: 87.2, lipinski: 'Yes' },
  { name: 'Meropenem', category: 'Carbapenem', mw: 383.46, logp: -0.32, tpsa: 114.5, prob: 95.0, conf: 93.1, lipinski: 'Yes' },
  { name: 'Sulfamethoxazole', category: 'Sulfonamide', mw: 253.28, logp: 0.89, tpsa: 104.9, prob: 88.5, conf: 86.4, lipinski: 'Yes' },
  { name: 'Azithromycin', category: 'Macrolide', mw: 749.00, logp: 4.02, tpsa: 180.1, prob: 86.3, conf: 82.0, lipinski: 'No' },
  { name: 'Vancomycin', category: 'Glycopeptide', mw: 1449.27, logp: -3.10, tpsa: 521.0, prob: 91.2, conf: 85.0, lipinski: 'No' },
  // Controls
  { name: 'Aspirin (Control)', category: 'NSAID', mw: 180.16, logp: 1.19, tpsa: 63.6, prob: 11.8, conf: 46.5, lipinski: 'Yes' },
  { name: 'Paracetamol (Control)', category: 'Analgesic', mw: 151.16, logp: 0.46, tpsa: 49.3, prob: 8.4, conf: 42.0, lipinski: 'Yes' },
  { name: 'Caffeine (Control)', category: 'Stimulant', mw: 194.19, logp: -0.07, tpsa: 58.4, prob: 14.6, conf: 48.0, lipinski: 'Yes' },
];

const CPK_COLORS: Record<string, string> = {
  C: '#334155',
  N: '#2563eb',
  O: '#dc2626',
  S: '#eab308',
  P: '#ea580c',
  F: '#06b6d4',
  Cl: '#16a34a',
  Br: '#991b1b',
  I: '#7c3aed',
  H: '#94a3b8',
};

const ATOM_SIZES: Record<string, number> = {
  H: 7,
  C: 13,
  N: 12,
  O: 12,
  F: 11,
  Cl: 14,
  Br: 15,
  I: 16,
  P: 14,
  S: 14,
};

export function Batch3DPlots({ data, title = '3D Prediction Visualizations', structure3d, candidateSmiles }: Batch3DPlotsProps) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<ViewKey>('chemical_space');
  const [showReferences, setShowReferences] = useState<boolean>(() => (data || []).length <= 5);
  const [showHydrogens, setShowHydrogens] = useState<boolean>(false);
  const [activeStructure, setActiveStructure] = useState<Structure3D | null>(structure3d || null);
  const [selectedSmiles, setSelectedSmiles] = useState<string>(candidateSmiles || (data?.[0]?.SMILES || data?.[0]?.smiles || ''));
  const [loadingStructure, setLoadingStructure] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Synchronize incoming structure3d prop
  useEffect(() => {
    if (structure3d) {
      setActiveStructure(structure3d);
    }
  }, [structure3d]);

  // Valid compounds from input
  const valid = useMemo(() => {
    return (data || []).filter(
      d =>
        d.Drug_Likeness_Pass !== 'Error' &&
        typeof (d.Molecular_Weight ?? d.molecular_weight) === 'number' &&
        typeof (d.LogP ?? d.logp) === 'number'
    );
  }, [data]);

  const isSingle = valid.length <= 1;

  // On demand 3D structure fetch for selected SMILES if not already loaded
  const fetchStructureForSmiles = async (smi: string) => {
    if (!smi) return;
    setLoadingStructure(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/structure_3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles: smi }),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.structure_3d) {
          setActiveStructure(json.structure_3d);
        }
      }
    } catch {
      // ignore structure load failure
    } finally {
      setLoadingStructure(false);
    }
  };

  const handleSelectSmiles = (smi: string) => {
    setSelectedSmiles(smi);
    fetchStructureForSmiles(smi);
  };

  // If user switches to 3D structure view and none is loaded yet, fetch it
  useEffect(() => {
    if (view === 'structure_3d' && !activeStructure && selectedSmiles) {
      fetchStructureForSmiles(selectedSmiles);
    }
  }, [view, selectedSmiles, activeStructure]);

  const axisColor = 'rgba(15, 23, 42, 0.55)';
  const gridColor = 'rgba(226, 232, 240, 0.85)';

  const pick = <T,>(arr: T[], idxs: number[]): T[] => idxs.map(i => arr[i]);

  // Build Traces
  const makeTraces = (key: ViewKey) => {
    // ── 3D Ball-and-Stick Molecular Structure View ───────────────────────
    if (key === 'structure_3d') {
      if (!activeStructure || !activeStructure.atoms || activeStructure.atoms.length === 0) {
        return [
          {
            type: 'scatter3d',
            mode: 'text',
            x: [0],
            y: [0],
            z: [0],
            text: [loadingStructure ? 'Generating 3D Conformer...' : 'No 3D Conformer available for this SMILES'],
            textfont: { size: 14, color: '#64748b' },
          },
        ];
      }

      const filteredAtoms = showHydrogens
        ? activeStructure.atoms
        : activeStructure.atoms.filter(a => !a.is_hydrogen);

      const atomIdxSet = new Set(filteredAtoms.map(a => a.index));

      // Atoms trace (spheres)
      const atomTrace = {
        type: 'scatter3d',
        mode: 'markers+text',
        x: filteredAtoms.map(a => a.x),
        y: filteredAtoms.map(a => a.y),
        z: filteredAtoms.map(a => a.z),
        text: filteredAtoms.map(a => a.symbol),
        textposition: 'top center',
        textfont: { size: 10, color: 'rgba(30, 41, 59, 0.85)', family: 'monospace' },
        hovertemplate: '<b>%{text}</b> (Atom #%{customdata})<br>Coord: (%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>',
        customdata: filteredAtoms.map(a => a.index),
        marker: {
          size: filteredAtoms.map(a => ATOM_SIZES[a.symbol] || 12),
          color: filteredAtoms.map(a => CPK_COLORS[a.symbol] || '#8b5cf6'),
          opacity: 0.95,
          line: { color: 'rgba(255, 255, 255, 0.7)', width: 1.5 },
        },
        name: 'Atoms',
      };

      // Bonds trace (lines)
      const bondX: (number | null)[] = [];
      const bondY: (number | null)[] = [];
      const bondZ: (number | null)[] = [];

      (activeStructure.bonds || []).forEach(b => {
        if (!atomIdxSet.has(b.begin) || !atomIdxSet.has(b.end)) return;
        const a1 = activeStructure.atoms[b.begin];
        const a2 = activeStructure.atoms[b.end];
        if (a1 && a2) {
          bondX.push(a1.x, a2.x, null);
          bondY.push(a1.y, a2.y, null);
          bondZ.push(a1.z, a2.z, null);
        }
      });

      const bondTrace = {
        type: 'scatter3d',
        mode: 'lines',
        x: bondX,
        y: bondY,
        z: bondZ,
        line: { color: 'rgba(100, 116, 139, 0.75)', width: 6 },
        hoverinfo: 'none',
        name: 'Chemical Bonds',
      };

      return [bondTrace, atomTrace];
    }

    // ── Chemical Space, Polarity Landscape, and Lipinski Frontier ────────
    const mw = valid.map(d => Number(d.Molecular_Weight ?? d.molecular_weight ?? 0));
    const logp = valid.map(d => Number(d.LogP ?? d.logp ?? 0));
    const tpsa = valid.map(d => Number(d.TPSA ?? d.tpsa ?? 0));
    const prob = valid.map(d => Number(d.Prediction_Probability ?? d.prediction_probability ?? 0) * (Number(d.Prediction_Probability ?? d.prediction_probability) <= 1 ? 100 : 1));
    const conf = valid.map(d => Number(d.Scientific_Confidence ?? d.confidence_score ?? 0) * (Number(d.Scientific_Confidence ?? d.confidence_score) <= 1 ? 100 : 1));
    const smilesList = valid.map(d => String(d.SMILES ?? d.smiles ?? d['Canonical_SMILES'] ?? ''));

    const passIdx: number[] = [];
    const failIdx: number[] = [];
    valid.forEach((d, i) => {
      const pass = d.Drug_Likeness_Pass ?? d.drug_likeness_pass;
      if (pass === 'Yes' || pass === 'Passed' || pass === true) {
        passIdx.push(i);
      } else {
        failIdx.push(i);
      }
    });

    const traces: any[] = [];

    // Optional Reference Antibiotics Cloud
    if (showReferences) {
      const activeRefs = REFERENCE_BENCHMARKS.filter(r => !r.name.includes('(Control)'));
      const controlRefs = REFERENCE_BENCHMARKS.filter(r => r.name.includes('(Control)'));

      const getRefCoord = (r: typeof REFERENCE_BENCHMARKS[0]) => {
        if (key === 'chemical_space') return { x: r.mw, y: r.logp, z: r.prob };
        if (key === 'polarity_map') return { x: r.tpsa, y: r.mw, z: r.conf };
        return { x: r.logp, y: r.mw, z: r.prob };
      };

      // Reference Antibiotics Trace
      traces.push({
        type: 'scatter3d',
        mode: 'markers',
        x: activeRefs.map(r => getRefCoord(r).x),
        y: activeRefs.map(r => getRefCoord(r).y),
        z: activeRefs.map(r => getRefCoord(r).z),
        text: activeRefs.map(r => `<b>${r.name}</b> (${r.category})<br>MW: ${r.mw} · LogP: ${r.logp} · P(act): ${r.prob}%`),
        hoverinfo: 'text',
        marker: {
          size: 7,
          color: 'rgba(59, 130, 246, 0.55)',
          symbol: 'circle',
          line: { color: 'rgba(37, 99, 235, 0.85)', width: 1.5 },
        },
        name: 'Reference Antibiotics',
      });

      // Controls Trace
      traces.push({
        type: 'scatter3d',
        mode: 'markers',
        x: controlRefs.map(r => getRefCoord(r).x),
        y: controlRefs.map(r => getRefCoord(r).y),
        z: controlRefs.map(r => getRefCoord(r).z),
        text: controlRefs.map(r => `<b>${r.name}</b><br>MW: ${r.mw} · LogP: ${r.logp} · P(act): ${r.prob}%`),
        hoverinfo: 'text',
        marker: {
          size: 6,
          color: 'rgba(148, 163, 184, 0.45)',
          symbol: 'diamond-open',
          line: { color: 'rgba(100, 116, 139, 0.8)', width: 1.5 },
        },
        name: 'Negative Controls',
      });
    }

    // Candidate compound(s)
    if (isSingle && valid.length > 0) {
      // Single prediction highlight: prominent gold star/diamond
      const xVal = key === 'chemical_space' ? mw[0] : key === 'polarity_map' ? tpsa[0] : logp[0];
      const yVal = key === 'chemical_space' ? logp[0] : key === 'polarity_map' ? mw[0] : mw[0];
      const zVal = key === 'chemical_space' ? prob[0] : key === 'polarity_map' ? conf[0] : prob[0];

      traces.push({
        type: 'scatter3d',
        mode: 'markers+text',
        x: [xVal],
        y: [yVal],
        z: [zVal],
        text: ['⭐ Current Candidate'],
        textposition: 'top right',
        textfont: { size: 13, color: '#b45309', family: 'Inter, sans-serif' },
        hovertemplate:
          `<b>⭐ Current Candidate: ${smilesList[0]}</b><br>` +
          `MW: ${mw[0].toFixed(1)} Da · LogP: ${logp[0].toFixed(2)}<br>` +
          `TPSA: ${tpsa[0].toFixed(1)} Å² · P(active): ${prob[0].toFixed(1)}%<br>` +
          `Confidence: ${conf[0].toFixed(1)}%<extra></extra>`,
        marker: {
          size: 16,
          color: '#f59e0b',
          symbol: 'diamond',
          line: { width: 3, color: '#ffffff' },
          opacity: 1,
        },
        name: '⭐ Current Candidate',
      });
    } else if (valid.length > 0) {
      // Batch mode: Lipinski pass vs fail separate traces
      const buildBatchTrace = (idxs: number[], isFail: boolean) => ({
        type: 'scatter3d',
        mode: 'markers',
        x: pick(key === 'chemical_space' ? mw : key === 'polarity_map' ? tpsa : logp, idxs),
        y: pick(key === 'chemical_space' ? logp : key === 'polarity_map' ? mw : mw, idxs),
        z: pick(key === 'chemical_space' ? prob : key === 'polarity_map' ? conf : prob, idxs),
        text: pick(smilesList, idxs),
        hovertemplate:
          '<b>%{text}</b><br>' +
          (key === 'chemical_space'
            ? 'MW: %{x:.1f} Da · LogP: %{y:.2f} · P(active): %{z:.1f}%'
            : key === 'polarity_map'
            ? 'TPSA: %{x:.1f} Å² · MW: %{y:.1f} Da · Confidence: %{z:.1f}%'
            : 'LogP: %{x:.2f} · MW: %{y:.1f} Da · P(active): %{z:.1f}%') +
          '<extra></extra>',
        marker: {
          size: isFail ? 6 : pick(conf, idxs).map(c => 6 + (c / 100) * 8),
          color: isFail ? '#ef4444' : pick(prob, idxs),
          colorscale: isFail
            ? [[0, '#ef4444'], [1, '#ef4444']]
            : [[0, '#dbeafe'], [0.5, '#3b67d8'], [1, '#0033A0']],
          opacity: isFail ? 0.6 : 0.9,
          showscale: !isFail && !showReferences,
          colorbar: {
            title: { text: key === 'polarity_map' ? 'Conf %' : 'P(act) %', side: 'right' },
            thickness: 14,
            len: 0.55,
            x: 0.02,
          },
          line: { width: isFail ? 1.5 : 0.8, color: isFail ? '#991b1b' : 'rgba(255,255,255,0.7)' },
          symbol: isFail ? 'square-open' : 'circle',
        },
        name: isFail ? 'Lipinski Violation' : 'Screened Compounds (Pass)',
      });

      if (passIdx.length) traces.push(buildBatchTrace(passIdx, false));
      if (failIdx.length) traces.push(buildBatchTrace(failIdx, true));
    }

    return traces;
  };

  const axesFor = (key: ViewKey) => {
    if (key === 'structure_3d') {
      return {
        xaxis: { visible: false, showgrid: false, zeroline: false },
        yaxis: { visible: false, showgrid: false, zeroline: false },
        zaxis: { visible: false, showgrid: false, zeroline: false },
      };
    }
    if (key === 'chemical_space') {
      return {
        xaxis: { title: { text: 'Molecular Weight (Da)', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: isSingle ? [0, 850] : undefined },
        yaxis: { title: { text: 'LogP (Lipophilicity)', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: isSingle ? [-3.5, 6.5] : undefined },
        zaxis: { title: { text: 'Antibiotic P(active) %', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: [0, 105] },
      };
    }
    if (key === 'polarity_map') {
      return {
        xaxis: { title: { text: 'TPSA (Å²)', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: isSingle ? [0, 260] : undefined },
        yaxis: { title: { text: 'Molecular Weight (Da)', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: isSingle ? [0, 850] : undefined },
        zaxis: { title: { text: 'Scientific Confidence %', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: [0, 105] },
      };
    }
    // Lipinski Frontier
    return {
      xaxis: { title: { text: 'LogP (Rule of 5 ≤ 5)', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: isSingle ? [-3.5, 6.5] : undefined },
      yaxis: { title: { text: 'MW (Rule of 5 ≤ 500 Da)', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: isSingle ? [0, 850] : undefined },
      zaxis: { title: { text: 'Antibiotic P(active) %', font: { color: axisColor, size: 12 } }, gridcolor: gridColor, zerolinecolor: gridColor, range: [0, 105] },
    };
  };

  const layout = useMemo(() => ({
    paper_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', color: 'var(--text-main)' },
    scene: {
      ...axesFor(view),
      camera: view === 'structure_3d' ? { eye: { x: 1.25, y: 1.25, z: 1.0 } } : { eye: { x: 1.5, y: 1.4, z: 0.9 } },
      bgcolor: 'transparent',
    },
    margin: { t: 15, b: 15, l: 15, r: 15 },
    height: 540,
    legend: {
      orientation: 'h' as const,
      y: 0.02,
      bgcolor: 'rgba(255,255,255,0.75)',
      font: { size: 11 },
    },
    showlegend: view !== 'structure_3d',
  }), [view, isSingle]);

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  const redraw = (k: ViewKey) => {
    if (plotRef.current && PlotlyAny) {
      PlotlyAny.react(plotRef.current, makeTraces(k), layout, config);
    }
  };

  useEffect(() => {
    redraw(view);
  }, [view, valid, showReferences, showHydrogens, activeStructure, layout]);

  useEffect(() => {
    const handleResize = () => {
      if (plotRef.current && PlotlyAny) {
        PlotlyAny.Plots.resize(plotRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const downloadPlot = async () => {
    if (!plotRef.current) return;
    const dataUrl = await PlotlyAny.toImage(plotRef.current, {
      format: 'png',
      width: 1600,
      height: 1200,
      scale: 2,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `OmniScreen_3D_${view}.png`;
    a.click();
  };

  if (valid.length === 0 && !activeStructure) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel"
      style={{ padding: '26px', marginTop: '24px', width: '100%' }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '9px', fontSize: '1.25rem' }}>
            <Box size={22} color="var(--accent)" /> {title}
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {PLOT_VIEWS.find(v => v.key === view)?.desc}
          </p>
        </div>

        {/* View Switcher and Actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-light)', borderRadius: 8, padding: 4, border: '1px solid var(--border-light)' }}>
            {PLOT_VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '7px 13px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: 6,
                  transition: 'all 0.2s ease',
                  background: view === v.key ? 'var(--accent)' : 'transparent',
                  color: view === v.key ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {v.key === 'structure_3d' ? <Compass size={14} /> : <Layers size={14} />}
                {v.label}
              </button>
            ))}
          </div>

          <button
            className="glow-btn"
            onClick={downloadPlot}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.85rem' }}
          >
            <Download size={15} /> Export PNG
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Toggles for References, Hydrogens, or Compound Selection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          {view !== 'structure_3d' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showReferences}
                onChange={e => setShowReferences(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              Show Reference Antibiotic Benchmarks
            </label>
          )}

          {view === 'structure_3d' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showHydrogens}
                onChange={e => setShowHydrogens(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              Show Hydrogens (All-Atom Geometry)
            </label>
          )}

          {/* Molecule selector if multiple compounds */}
          {view === 'structure_3d' && valid.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Molecule:</span>
              <select
                value={selectedSmiles}
                onChange={e => handleSelectSmiles(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-light)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  maxWidth: '260px',
                }}
              >
                {valid.map((c, i) => {
                  const smi = String(c.SMILES ?? c.smiles ?? `Compound #${i + 1}`);
                  return (
                    <option key={i} value={smi}>
                      #{i + 1}: {smi.slice(0, 28)}{smi.length > 28 ? '...' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {view === 'structure_3d' ? (
            <span>💡 Click and drag to rotate 3D conformer · Scroll to zoom</span>
          ) : (
            <span>💡 Drag to rotate 3D scene · Scroll to zoom · Hover to inspect SMILES</span>
          )}
        </div>
      </div>

      {/* Plot Container */}
      <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-light)', position: 'relative' }}>
        {loadingStructure && view === 'structure_3d' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 600 }}>
              <RefreshCw className="animate-spin" size={20} /> Generating 3D conformer coordinates...
            </div>
          </div>
        )}
        <div ref={plotRef} style={{ width: '100%' }} />
      </div>

      {/* Legend / Info footer */}
      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {view === 'structure_3d' ? (
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span><strong>CPK Colors:</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#334155', display: 'inline-block' }} /> C (Carbon)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} /> O (Oxygen)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} /> N (Nitrogen)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} /> S (Sulfur)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> Cl (Chlorine)</span>
          </div>
        ) : (
          <div>
            {isSingle ? (
              <span><strong>⭐ Current Candidate</strong> is highlighted in gold. Blue dots represent FDA benchmark antibiotics.</span>
            ) : (
              <span>Square red markers indicate Lipinski Rule of 5 violations. Circle markers indicate Lipinski-compliant leads.</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
