import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode, Link as LinkIcon, Download, Upload, Share2, Smartphone, FileJson } from 'lucide-react';
import { type HistoryRow, generateShareUrl, exportHistoryAsJson, decodeHistoryFromShare, addHistoryRows } from '../lib/localHistory';

interface ShareHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyData: any[];
  onImportSuccess?: (count: number) => void;
}

export function ShareHistoryModal({ isOpen, onClose, historyData, onImportSuccess }: ShareHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'import' | 'export'>('share');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [loadingUrl, setLoadingUrl] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [importInput, setImportInput] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // Generate share URL when modal opens
  useEffect(() => {
    if (!isOpen || historyData.length === 0) {
      setShareUrl('');
      return;
    }

    setLoadingUrl(true);
    setCopied(false);

    // Normalize historyData to HistoryRow shape
    const normalizedRows: HistoryRow[] = historyData.map((r, i) => ({
      id: String(r.id || `row-${i}`),
      smiles: String(r.SMILES || r.smiles || ''),
      prediction_probability: Number(r.Prediction_Probability ?? r.prediction_probability ?? 0),
      confidence_score: Number(r.Scientific_Confidence ?? r.confidence_score ?? 0),
      drug_likeness_pass: String(r.Drug_Likeness_Pass ?? r.drug_likeness_pass ?? 'Yes'),
      created_at: String(r.created_at || r.Date || new Date().toISOString()),
      molecular_weight: r.Molecular_Weight !== undefined ? Number(r.Molecular_Weight) : r.molecular_weight,
      logp: r.LogP !== undefined ? Number(r.LogP) : r.logp,
      tpsa: r.TPSA !== undefined ? Number(r.TPSA) : r.tpsa,
    })).filter(r => r.smiles);

    generateShareUrl(normalizedRows)
      .then(url => setShareUrl(url))
      .catch(err => console.error('Failed to generate share URL:', err))
      .finally(() => setLoadingUrl(false));
  }, [isOpen, historyData]);

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleImportSubmit = async () => {
    const raw = importInput.trim();
    if (!raw) {
      setImportStatus({ message: 'Please paste a share URL, code, or JSON array.', isError: true });
      return;
    }

    try {
      let rowsToImport: any[] = [];

      // Check if it's a URL
      if (raw.includes('share=')) {
        const tokenMatch = raw.match(/share=([^&#]+)/);
        if (tokenMatch) {
          rowsToImport = await decodeHistoryFromShare(tokenMatch[1]);
        }
      } else if (raw.startsWith('gz_') || raw.startsWith('b64_')) {
        rowsToImport = await decodeHistoryFromShare(raw);
      } else if (raw.startsWith('[') || raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        rowsToImport = Array.isArray(parsed) ? parsed : [parsed];
      }

      if (!rowsToImport || rowsToImport.length === 0) {
        throw new Error('No valid compounds found in provided input.');
      }

      const formatted = rowsToImport.map(r => ({
        smiles: String(r.smiles || r.SMILES || ''),
        predictionProbability: Number(r.prediction_probability ?? r.Prediction_Probability ?? r.p ?? 0),
        confidenceScore: Number(r.confidence_score ?? r.Scientific_Confidence ?? r.c ?? 0),
        drugLikenessPass: String(r.drug_likeness_pass ?? r.Drug_Likeness_Pass ?? r.l ?? 'Yes'),
        molecularWeight: r.molecular_weight !== undefined ? Number(r.molecular_weight) : r.Molecular_Weight,
        logp: r.logp !== undefined ? Number(r.logp) : r.LogP,
        tpsa: r.tpsa !== undefined ? Number(r.tpsa) : r.TPSA,
      })).filter(r => r.smiles);

      addHistoryRows(formatted);
      setImportStatus({ message: `Successfully imported ${formatted.length} compounds to this device!`, isError: false });
      setImportInput('');
      if (onImportSuccess) {
        onImportSuccess(formatted.length);
      }
    } catch (err: any) {
      setImportStatus({ message: err.message || 'Invalid share code or JSON format.', isError: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportInput(content);
      } catch {
        setImportStatus({ message: 'Failed to read file.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const qrApiUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`
    : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '580px',
            background: 'var(--bg-main, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-light, #e2e8f0)',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(0, 51, 160, 0.1)', color: 'var(--accent)', padding: '8px', borderRadius: '10px' }}>
                <Share2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  Share & Sync History
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Access your screening history on any phone, tablet, or device
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 24px', background: 'var(--bg-light)' }}>
            <button
              onClick={() => setActiveTab('share')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'share' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'share' ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: activeTab === 'share' ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <LinkIcon size={16} /> Share Link & QR
            </button>
            <button
              onClick={() => setActiveTab('import')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'import' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'import' ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: activeTab === 'import' ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <Upload size={16} /> Import to this Device
            </button>
            <button
              onClick={() => setActiveTab('export')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'export' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'export' ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: activeTab === 'export' ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <FileJson size={16} /> Backup JSON
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '24px' }}>
            {activeTab === 'share' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {historyData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0 }}>You don't have any screened compounds in your history yet.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Screen a molecule first, then come back here to share it!</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                        Universal Share Link
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          readOnly
                          value={loadingUrl ? 'Generating compressed share link...' : shareUrl}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                            background: 'var(--bg-light)',
                            color: 'var(--text-main)',
                            fontSize: '0.82rem',
                            fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleCopyLink}
                          disabled={loadingUrl || !shareUrl}
                          className="glow-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 18px',
                            fontSize: '0.88rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                          {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                        ✨ Opens directly on any iPhone, Android, Mac, or PC without logging in.
                      </p>
                    </div>

                    {/* QR Code Quick Scan for Mobile */}
                    <div style={{ display: 'flex', gap: '18px', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                      <div style={{ width: '110px', height: '110px', background: '#fff', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                        {shareUrl ? (
                          <img
                            src={qrApiUrl}
                            alt="Scan with phone"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <QrCode size={48} color="#94a3b8" />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          <Smartphone size={16} color="var(--accent)" /> Scan to Open on Mobile
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Point your smartphone camera at this QR code to instantly view and run 3D docking on your phone.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'import' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Paste Share Link or Code
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Paste a link (e.g. https://.../?share=...) or raw share token..."
                    value={importInput}
                    onChange={e => setImportInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-light)',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>
                    <Upload size={14} /> Upload .json file
                    <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>

                  <button
                    onClick={handleImportSubmit}
                    className="glow-btn"
                    style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                  >
                    Import & Merge
                  </button>
                </div>

                {importStatus && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      background: importStatus.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                      color: importStatus.isError ? '#dc2626' : '#16a34a',
                      border: `1px solid ${importStatus.isError ? '#f87171' : '#86efac'}`,
                    }}
                  >
                    {importStatus.message}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Download a raw backup of your screening history to store safely or transfer to another machine.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      const normalizedRows: HistoryRow[] = historyData.map((r, i) => ({
                        id: String(r.id || `row-${i}`),
                        smiles: String(r.SMILES || r.smiles || ''),
                        prediction_probability: Number(r.Prediction_Probability ?? r.prediction_probability ?? 0),
                        confidence_score: Number(r.Scientific_Confidence ?? r.confidence_score ?? 0),
                        drug_likeness_pass: String(r.Drug_Likeness_Pass ?? r.drug_likeness_pass ?? 'Yes'),
                        created_at: String(r.created_at || r.Date || new Date().toISOString()),
                        molecular_weight: r.Molecular_Weight !== undefined ? Number(r.Molecular_Weight) : r.molecular_weight,
                        logp: r.LogP !== undefined ? Number(r.LogP) : r.logp,
                        tpsa: r.TPSA !== undefined ? Number(r.TPSA) : r.tpsa,
                      }));
                      exportHistoryAsJson(normalizedRows);
                    }}
                    className="glow-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}
                  >
                    <Download size={16} /> Download JSON Backup
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
