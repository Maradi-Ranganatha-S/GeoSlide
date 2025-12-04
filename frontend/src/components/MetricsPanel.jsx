import React from 'react';

const MetricsPanel = ({ confidence, metrics }) => {
  // Dynamic color based on risk level
  const getRiskColor = (conf) => {
    if (conf > 75) return '#ff4444'; // Red
    if (conf > 40) return '#ffcc00'; // Amber
    return '#00ffcc'; // Green/Cyan
  };
  
  const riskColor = getRiskColor(confidence);

  return (
    <div className="metrics-wrapper">
      {/* Confidence Box */}
      <div className="conf-box" style={{borderColor: confidence > 0 ? riskColor : '#333'}}>
        <div className="conf-val" style={{color: confidence > 0 ? riskColor : '#00ffcc'}}>
           {confidence}%
        </div>
        <div className="conf-label">Landslide Probability</div>
      </div>

      {/* Detailed Metrics */}
      <div className={`metrics-grid ${metrics.active ? 'active' : ''}`}>
         <div className="metric-card">
            <span className="metric-val">{metrics.prec}</span>
            <span className="metric-lbl">PRECISION</span>
         </div>
         <div className="metric-card">
            <span className="metric-val">{metrics.acc}</span>
            <span className="metric-lbl">ACCURACY</span>
         </div>
         <div className="metric-card">
            <span className="metric-val">{metrics.f1}</span>
            <span className="metric-lbl">F1 SCORE</span>
         </div>
      </div>
    </div>
  );
};

export default MetricsPanel;