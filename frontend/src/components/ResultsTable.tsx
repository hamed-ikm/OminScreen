import { Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ResultsTable({ 
  data, 
  title = "Batch Screening Results", 
  filename = "OmniScreen_Results.csv",
  onClearAll,
  onDeleteRow
}: { 
  data: any[],
  title?: string,
  filename?: string,
  onClearAll?: () => void,
  onDeleteRow?: (id: number) => void
}) {
  if (!data || data.length === 0) return null;

  // Extract all keys from the first row to determine columns
  const allKeys = Object.keys(data[0]);
  
  // Custom headers that we added, we want them nicely formatted
  const metricKeys = ['Prediction_Probability', 'Scientific_Confidence', 'Drug_Likeness_Pass'];
  
  // Original keys are everything else, exclude 'id' from generic display
  const originalKeys = allKeys.filter(k => !metricKeys.includes(k) && k !== 'id');

  const downloadCSV = () => {
    // Generate CSV string
    const headers = [...originalKeys, ...metricKeys];
    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        // Wrap strings in quotes to handle commas
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel" 
      style={{ padding: '30px', marginTop: '20px', width: '100%', overflowX: 'auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{title} ({data.length} compounds)</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onClearAll && (
            <button 
              className="glow-btn"
              onClick={onClearAll}
              style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', border: 'none' }}
            >
              <Trash2 size={16} /> Clear History
            </button>
          )}
          <button 
            className="glow-btn"
            onClick={downloadCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-light)' }}>
              {originalKeys.map(k => (
                <th key={k} style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>{k}</th>
              ))}
              <th style={{ padding: '15px', color: 'var(--accent)', fontWeight: 600 }}>Probability</th>
              <th style={{ padding: '15px', color: 'var(--accent)', fontWeight: 600 }}>Confidence</th>
              <th style={{ padding: '15px', color: 'var(--accent)', fontWeight: 600 }}>Lipinski</th>
              {onDeleteRow && <th style={{ padding: '15px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                {originalKeys.map(k => (
                  <td key={k} style={{ padding: '12px 15px', fontSize: '0.9rem' }}>{row[k]}</td>
                ))}
                
                {/* Metric Columns */}
                <td style={{ padding: '12px 15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {(row.Prediction_Probability * 100).toFixed(1)}%
                </td>
                <td style={{ padding: '12px 15px', fontSize: '0.9rem' }}>
                  {(row.Scientific_Confidence * 100).toFixed(1)}%
                </td>
                <td style={{ padding: '12px 15px', fontSize: '0.9rem', color: row.Drug_Likeness_Pass === 'Yes' ? 'var(--success)' : 'var(--error)' }}>
                  {row.Drug_Likeness_Pass}
                </td>
                
                {onDeleteRow && (
                  <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                    <button 
                      onClick={() => onDeleteRow(row.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '5px' }}
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
