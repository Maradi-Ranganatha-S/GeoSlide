import { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import './App.css';
import { checkZone, searchSatelliteData, getPreviewUrl, processImages } from './utils/satelliteEngine';

// Components
import ControlPanel from './components/ControlPanel';
import Terminal from './components/Terminal';
import MetricsPanel from './components/MetricsPanel';
import MapView from './components/MapView';
import ComparisonGraph from './components/ComparisonGraph'; // <--- NEW IMPORT

// Services
import { runInference, checkBackendStatus } from './services/api';

function Dashboard() {
  // --- STATE ---
  const [severity, setSeverity] = useState(null); // 'LOW', 'MEDIUM', 'HIGH', 'SAFE'
  const [lat, setLat] = useState(30.4000);
  const [lon, setLon] = useState(79.3000);
  const [datePre, setDatePre] = useState('2023-10-15');
  const [datePost, setDatePost] = useState('2024-02-15');
  const [threshold, setThreshold] = useState(0.15);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [metrics, setMetrics] = useState({ prec: '--', acc: '--', f1: '--', active: false });
  const [images, setImages] = useState({ pre: null, post: null });
  const [featureMaps, setFeatureMaps] = useState({ heat: null, mask: null });
  const [overlay, setOverlay] = useState({ maskUrl: null, bounds: null });

  // --- LOGGING ---
  const log = (msg, type='sys') => {
    const ts = new Date().toISOString().split('T')[1].slice(0,8);
    setLogs(prev => [...prev, { ts, msg, type }]);
  };

  // --- BOOT SEQUENCE ---
  useEffect(() => {
    const boot = async () => {
      log("GeoSlide Kernel v4.5 initialized.", "cmd");
      const status = await checkBackendStatus();
      if(status) {
        log(`Connection established. GPU: Tesla T4 [ONLINE]`, "success");
      } else {
        log("Backend unreachable. Running in Client-Side Mode.", "warn");
      }
    };
    boot();
  }, []);

  // --- CORE ENGINE LOGIC ---
  const runEngine = async () => {
    setIsProcessing(true);
    setConfidence(0);
    setSeverity(null); // Reset severity
    setFeatureMaps({ heat: null, mask: null });
    setOverlay({ maskUrl: null, bounds: null });
    
    try {
      // 1. INITIAL LOGGING
      const { isExpert, isDesert } = checkZone(lat, lon);
      log(`Initiating Inference Sequence for ROI: [${lat}, ${lon}]`, "cmd");
      
      // 2. FETCH IMAGES (Visuals Only)
      const itemPre = await searchSatelliteData(lat, lon, datePre);
      const itemPost = await searchSatelliteData(lat, lon, datePost);
      if(!itemPre || !itemPost) throw new Error("Satellite Occlusion.");
      
      const urlPre = getPreviewUrl(itemPre);
      const urlPost = getPreviewUrl(itemPost);
      setImages({ pre: urlPre, post: urlPost });

      // 3. CALL PYTHON BACKEND (The Brain)
      log("Transmitting Feature Vectors to GeoSlide Server...", "sys");
      const apiResponse = await runInference(lat, lon, datePre, datePost);
      
      if(apiResponse.status === 'simulated_fallback') {
         throw new Error("Backend connection failed. Is server.py running?");
      }

      // 4. PROCESS BACKEND RESPONSE
      const backendResult = apiResponse.data;
      const backendMetrics = backendResult.metrics;
      const serverConfidence = backendMetrics.confidence; 
      const riskLevel = backendMetrics.severity; // <--- NEW: Get Severity
      
      log(`Backend Compute Success. Job ID: ${backendResult.job_id}`, "success");
      log(`Received Confidence Score: ${serverConfidence.toFixed(2)}%`, "cmd");

      // UPDATE UI STATE
      setConfidence(serverConfidence.toFixed(1));
      setSeverity(riskLevel); // <--- NEW: Update Severity State

      if (backendMetrics.status === "VALIDATED_DETECTION") {
        setMetrics({
          prec: backendMetrics.precision.toFixed(2),
          acc: backendMetrics.accuracy.toFixed(2),
          f1: backendMetrics.f1_score.toFixed(2),
          active: true
        });
        log("Validation Metrics Loaded from Ground Truth DB.", "success");
      } else {
        setMetrics({ prec: '--', acc: '--', f1: '--', active: false });
        if(isDesert) log("Backend Report: Topography Stable (No Anomaly).", "warn");
        else log("Backend Report: Unsupervised Inference Mode.", "sys");
      }

      // 5. RENDER VISUALS (Client Side)
      log("Rendering Output Masks...", "sys");
      const { diffUrl, maskUrl } = await processImages(urlPre, urlPost, threshold, {isExpert, isDesert});
      
      setFeatureMaps({ heat: diffUrl, mask: maskUrl });
      
      const bounds = [[itemPre.bbox[1], itemPre.bbox[0]], [itemPre.bbox[3], itemPre.bbox[2]]];
      
      // Only show overlay if confidence > 0
      if (serverConfidence > 0) {
        setOverlay({ maskUrl: maskUrl, bounds: bounds });
        log("Hazard Mask Projected to Map Layer.", "success");
      } else {
        setOverlay({ maskUrl: null, bounds: null });
        log("Visualization suppressed (Confidence < Threshold).", "sys");
      }

    } catch(e) {
      log(`Error: ${e.message}`, "err");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="brand">
          <Shield size={24} color="#00ffcc" fill="rgba(0,255,204,0.2)" />
          GeoSlide <span>AI</span>
        </div>
        
        <div className="status-bar">
          <div className={`badge ${!metrics.active ? 'active' : ''}`}>INFERENCE</div>
          <div className={`badge ${metrics.active ? 'active' : ''}`}>VALIDATION (GT)</div>
        </div>
      </header>

      <div className="main-content">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <ControlPanel 
            lat={lat} setLat={setLat} 
            lon={lon} setLon={setLon}
            datePre={datePre} setDatePre={setDatePre}
            datePost={datePost} setDatePost={setDatePost}
            threshold={threshold} setThreshold={setThreshold}
            onRun={runEngine} isProcessing={isProcessing}
          />
          
          <Terminal logs={logs} />
          
          <MetricsPanel confidence={confidence} metrics={metrics} />

          {/* NEW: SEVERITY BADGE */}
          {severity && severity !== 'SAFE' && (
            <div style={{
              marginTop: '10px', padding: '8px', textAlign: 'center',
              background: severity === 'HIGH' ? 'rgba(255, 68, 68, 0.15)' : 
                          severity === 'MEDIUM' ? 'rgba(255, 204, 0, 0.15)' : '#0f1f1a',
              border: `1px solid ${severity === 'HIGH' ? '#ff4444' : severity === 'MEDIUM' ? '#ffcc00' : '#00ffcc'}`,
              borderRadius: '4px'
            }}>
              <div style={{fontSize:'0.65rem', color:'#aaa', letterSpacing:'1px'}}>RISK ASSESSMENT</div>
              <div style={{
                fontSize:'1.2rem', fontWeight:'800', fontFamily:'monospace',
                color: severity === 'HIGH' ? '#ff4444' : severity === 'MEDIUM' ? '#ffcc00' : '#00ffcc'
              }}>
                {severity} SEVERITY
              </div>
            </div>
          )}

          {/* INPUTS */}
          <label style={{marginTop:15}}>INPUT TENSORS</label>
          <div className="vis-grid">
             <div className="img-box"><header>T-1 (PRE)</header>{images.pre && <img src={images.pre} />}</div>
             <div className="img-box"><header>T-0 (POST)</header>{images.post && <img src={images.post} />}</div>
          </div>

          {/* OUTPUTS */}
          <label style={{marginTop:10}}>FEATURE MAPS</label>
          <div className="vis-grid">
             <div className="img-box"><header>HEATMAP</header>{featureMaps.heat && <img src={featureMaps.heat} />}</div>
             <div className="img-box"><header>MASK</header>{featureMaps.mask && <img src={featureMaps.mask} />}</div>
          </div>

          {/* NEW: COMPARATIVE ANALYSIS */}
          <ComparisonGraph />
          
        </aside>

        {/* MAP */}
        <div className="map-wrapper">
           <MapView lat={lat} lon={lon} overlay={overlay} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;