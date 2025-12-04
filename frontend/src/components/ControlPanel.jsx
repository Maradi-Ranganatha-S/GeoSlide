import React from 'react';

const ControlPanel = ({ 
  lat, setLat, lon, setLon, 
  datePre, setDatePre, datePost, setDatePost, 
  threshold, setThreshold, 
  onRun, isProcessing 
}) => {
  return (
    <div className="control-panel">
      {/* Inputs */}
      <div className="input-group">
        <div className="input-row">
          <div><label>LATITUDE</label><input type="number" value={lat} onChange={e=>setLat(e.target.value)} /></div>
          <div><label>LONGITUDE</label><input type="number" value={lon} onChange={e=>setLon(e.target.value)} /></div>
        </div>
        
        <div className="input-row">
           <div><label>PRE-EVENT</label><input type="date" value={datePre} onChange={e=>setDatePre(e.target.value)} /></div>
           <div><label>POST-EVENT</label><input type="date" value={datePost} onChange={e=>setDatePost(e.target.value)} /></div>
        </div>

        <div style={{marginTop:10}}>
           <label style={{display:'flex', justifyContent:'space-between'}}>
             <span>SENSITIVITY (α)</span> <span style={{color:'#00ffcc'}}>{threshold}</span>
           </label>
           <input type="range" min="0.05" max="0.5" step="0.01" value={threshold} onChange={e=>setThreshold(e.target.value)} style={{width:'100%', accentColor:'#00ffcc'}} />
        </div>
      </div>

      <button className="btn-run" onClick={onRun} disabled={isProcessing}>
        {isProcessing ? "PROCESSING TENSORS..." : "INITIALIZE MODEL"}
      </button>
    </div>
  );
};

export default ControlPanel;