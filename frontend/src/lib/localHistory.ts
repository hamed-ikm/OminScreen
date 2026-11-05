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

interface MinifiedRow {
  s: string;
  p: number;
  c: number;
  l: string;
  d?: string;
  m?: number;
  o?: number;
  t?: number;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function compressString(str: string): Promise<string> {
  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(new TextEncoder().encode(str));
      writer.close();
      const chunks: Uint8Array[] = [];
      const reader = cs.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return 'gz_' + uint8ArrayToBase64Url(merged);
    } catch {
      // fallback
    }
  }
  return 'b64_' + btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function decompressString(token: string): Promise<string> {
  if (token.startsWith('gz_')) {
    const raw = token.slice(3);
    const bytes = base64UrlToUint8Array(raw);
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      writer.write(bytes as any);
      writer.close();
      const chunks: Uint8Array[] = [];
      const reader = ds.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return new TextDecoder().decode(merged);
    }
  } else if (token.startsWith('b64_')) {
    const raw = token.slice(4).replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(raw)));
  }

  try {
    const raw = token.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(raw)));
  } catch {
    return atob(token);
  }
}

export async function encodeHistoryToShare(rows: HistoryRow[]): Promise<string> {
  const minified: MinifiedRow[] = rows.map(r => ({
    s: r.smiles,
    p: Math.round((r.prediction_probability ?? 0) * 1000) / 1000,
    c: Math.round((r.confidence_score ?? 0) * 1000) / 1000,
    l: r.drug_likeness_pass || 'Yes',
    d: r.created_at,
    m: r.molecular_weight,
    o: r.logp,
    t: r.tpsa,
  }));
  return compressString(JSON.stringify(minified));
}

export async function decodeHistoryFromShare(token: string): Promise<HistoryRow[]> {
  const jsonStr = await decompressString(token);
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any, idx: number) => {
    const smiles = item.s || item.smiles || item.SMILES || '';
    const prob = Number(item.p ?? item.prediction_probability ?? item.Prediction_Probability ?? 0);
    const conf = Number(item.c ?? item.confidence_score ?? item.Scientific_Confidence ?? 0);
    const pass = String(item.l ?? item.drug_likeness_pass ?? item.Drug_Likeness_Pass ?? 'Yes');
    const date = item.d ?? item.created_at ?? item.Date ?? new Date().toISOString();
    const mw = item.m !== undefined ? Number(item.m) : item.molecular_weight !== undefined ? Number(item.molecular_weight) : undefined;
    const logp = item.o !== undefined ? Number(item.o) : item.logp !== undefined ? Number(item.logp) : undefined;
    const tpsa = item.t !== undefined ? Number(item.t) : item.tpsa !== undefined ? Number(item.tpsa) : undefined;

    return {
      id: item.id || `shared-${idx}-${Date.now()}`,
      smiles,
      prediction_probability: prob,
      confidence_score: conf,
      drug_likeness_pass: pass,
      created_at: date,
      molecular_weight: mw,
      logp,
      tpsa,
    };
  });
}

export async function generateShareUrl(rows: HistoryRow[]): Promise<string> {
  const token = await encodeHistoryToShare(rows);
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?share=${token}`;
}

export function exportHistoryAsJson(rows: HistoryRow[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rows, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `OmniScreen_History_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}
