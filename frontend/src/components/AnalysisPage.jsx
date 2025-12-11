// frontend/src/components/AnalysisPage.jsx
import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Play, FileText, CheckCircle } from 'lucide-react';

const AnalysisPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runBatchTest = async () => {
    setLoading(true);
    try {
      // Use the real backend endpoint
      const res = await fetch('http://127.0.0.1:5000/api/v1/benchmark', { method: 'POST' });
      const json = await res.json();
      setResults(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Averages for the Graph
  const getAverages = () => {
    if (!results) return { geo: [], base: [] };
    const avg = (key, metric) => results.reduce((sum, r) => sum + r[key][metric], 0) / results.length;
    return {
      geo: [avg('geo', 'acc'), avg('geo', 'prec'), avg('geo', 'f1')],
      base: [avg('base', 'acc'), avg('base', 'prec'), avg('base', 'f1')]
    };
  };

  const averages = getAverages();

  // --- COLOR HELPER FUNCTION ---
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH':   return '#ff4444'; // Red
      case 'MEDIUM': return '#ffbb33'; // Orange
      case 'LOW':    return '#00ccff'; // Cyan/Blue
      default:       return '#888888'; // Grey
    }
  };

  // Graph Config
  const chartData = {
    labels: ['Accuracy', 'Precision', 'F1-Score'],
    datasets: [
      {
        label: 'Baseline (ResNet-50)',
        data: averages.base,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'GeoSlide (Ours)',
        data: averages.geo,
        backgroundColor: 'rgba(0, 255, 204, 0.5)',
        borderColor: 'rgba(0, 255, 204, 1)',
        borderWidth: 1,
      }
    ]
  };

  return (
    <div style={{ padding: '20px', color: '#eee', height: '100%', overflowY: 'auto' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontFamily: 'monospace', color: '#00ffcc' }}>COMPARATIVE ANALYSIS SUITE</h1>
        <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.9rem' }}>
          Dataset: NASA GLC (Kaggle) | Test Samples: 10 (Mixed Severity) | Metric: F1 Weighted
        </p>
      </header>

      {!results ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <button 
            onClick={runBatchTest} 
            disabled={loading}
            style={{
              background: loading ? '#333' : 'rgba(0,255,204,0.1)',
              border: '1px solid #00ffcc', color: '#00ffcc',
              padding: '15px 40px', fontSize: '1.2rem', cursor: 'pointer',
              fontFamily: 'monospace', letterSpacing: '2px',
              transition: 'all 0.3s'
            }}
          >
            {loading ? "RUNNING BATCH BENCHMARK..." : "▶ RUN COMPARATIVE ANALYSIS (N=10)"}
          </button>
          <div style={{ marginTop: 20, color: '#666', fontSize: '0.8rem' }}>
            Will execute inference pipelines for both models on the test set.
          </div>
        </div>
      ) : (
        <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* LEFT: RESULTS TABLE */}
          <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '15px' }}>
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: 10 }}>TEST SAMPLE RESULTS</h3>
            <table style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#888', borderBottom: '1px solid #444' }}>
                  <th style={{ padding: '8px' }}>ID</th>
                  <th>LAT/LON</th>
                  <th>SEVERITY</th>
                  <th style={{ color: '#ff6384' }}>BASE (Acc)</th>
                  <th style={{ color: '#00ffcc' }}>OURS (Acc)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #222', height: '35px' }}>
                    <td style={{ padding: '8px', color: '#666' }}>#{r.id}</td>
                    <td style={{ fontFamily: 'monospace' }}>{r.lat.toFixed(3)}, {r.lon.toFixed(3)}</td>
                    
                    {/* COLORED SEVERITY CELL */}
                    <td style={{ 
                      color: getSeverityColor(r.severity), 
                      fontWeight: 'bold',
                      letterSpacing: '1px'
                    }}>
                      {r.severity}
                    </td>

                    <td style={{ color: '#ff6384' }}>{(r.base.acc * 100).toFixed(1)}%</td>
                    <td style={{ color: '#00ffcc' }}>{(r.geo.acc * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RIGHT: AGGREGATE GRAPH */}
          <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '15px' }}>
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: 10 }}>AGGREGATE PERFORMANCE</h3>
            <div style={{ height: '300px' }}>
              <Bar 
                data={chartData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { 
                    y: { beginAtZero: true, max: 1.0, grid: { color: '#222' } },
                    x: { grid: { display: false } }
                  }
                }} 
              />
            </div>
            <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,255,204,0.05)', borderLeft: '3px solid #00ffcc', fontSize: '0.8rem' }}>
              <strong>CONCLUSION:</strong> The GeoSlide OBIA architecture demonstrates a 
              <span style={{ color: '#00ffcc', fontWeight: 'bold' }}> +{((averages.geo[0] - averages.base[0])*100).toFixed(1)}% </span> 
              improvement in Accuracy over the baseline CNN on this mixed-severity test set.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;