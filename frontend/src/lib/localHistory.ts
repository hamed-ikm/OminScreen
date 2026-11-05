// Local screening history (guest mode)
// Stored in the browser's localStorage — instant, no auth required.
// This mirrors the shape of the Supabase screening_history rows so the UI
// can switch between local and remote storage without changes.

export interface HistoryRow {
  id: string;
  smiles: string;
  prediction_probability: number;
  confidence_score: number;
  drug_likeness_pass: string;
  created_at: string;
  molecular_weight?: number;
  logp?: number;
  tpsa?: number;
}

const STORAGE_KEY = 'omniscreen_local_history';

const readRows = (): HistoryRow[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeRows = (rows: HistoryRow[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

export const getHistoryRows = (): HistoryRow[] =>
  readRows().sort((a, b) => b.created_at.localeCompare(a.created_at));

export const addHistoryRow = (
  smiles: string,
  predictionProbability: number,
  confidenceScore: number,
  drugLikenessPass: string,
  molecularWeight?: number,
  logp?: number,
  tpsa?: number,
) => {
  const row: HistoryRow = {
    id: (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    smiles,
    prediction_probability: predictionProbability,
    confidence_score: confidenceScore,
    drug_likeness_pass: drugLikenessPass,
    created_at: new Date().toISOString(),
    molecular_weight: molecularWeight,
    logp,
    tpsa,
  };
  writeRows([row, ...readRows()]);
  return row;
};

export const addHistoryRows = (
  rowsToAdd: Array<{
    smiles: string;
    predictionProbability: number;
    confidenceScore: number;
    drugLikenessPass: string;
    molecularWeight?: number;
    logp?: number;
    tpsa?: number;
  }>
) => {
  const now = new Date().toISOString();
  const existing = readRows();
  const existingSmiles = new Set(existing.map(r => r.smiles));

  const newRows: HistoryRow[] = [];
  for (const r of rowsToAdd) {
    if (!r.smiles || existingSmiles.has(r.smiles)) continue;
    existingSmiles.add(r.smiles);
    newRows.push({
      id: (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      smiles: r.smiles,
      prediction_probability: r.predictionProbability,
      confidence_score: r.confidenceScore,
      drug_likeness_pass: r.drugLikenessPass,
      created_at: now,
      molecular_weight: r.molecularWeight,
      logp: r.logp,
      tpsa: r.tpsa,
    });
  }

  const combined = [...newRows, ...existing].slice(0, 2000);
  writeRows(combined);
  return combined;
};

export const deleteHistoryRow = (id: string) => {
  writeRows(readRows().filter(r => r.id !== id));
};

export const clearHistoryRows = () => {
  localStorage.removeItem(STORAGE_KEY);
};
