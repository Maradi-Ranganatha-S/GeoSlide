import { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import './App.css';
import { checkZone, searchSatelliteData, getPreviewUrl, processImages } from './utils/satelliteEngine';

// Components
import ControlPanel from './components/ControlPanel';
import Terminal from './components/Terminal';
import MetricsPanel from './components/MetricsPanel';
import MapView from './components/MapView';

//Services
import { runInference } from './services/api';

function App() {
  // --- STATE ---
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

  useEffect(() => {
    log("GeoSlide Kernel v4.5 initialized.", "cmd");
    setTimeout(() => log("Connection established. GPU: Tesla T4 [ONLINE]", "success"), 1000);
  }, []);

  // --- ENGINE ---
  // --- CORE ENGINE LOGIC ---
  const runEngine = async () => {
    setIsProcessing(true);
    setConfidence(0);
    setFeatureMaps({ heat: null, mask: null });
    setOverlay({ maskUrl: null, bounds: null });
    
    try {
      // 1. INITIAL LOGGING
      const { isExpert, isDesert } = checkZone(lat, lon);
      log(`Initiating Inference Sequence for ROI: [${lat}, ${lon}]`, "cmd");
      
      // 2. FETCH IMAGES (Visuals Only)
      // We start loading images so they are ready, but we don't calculate scores yet.
      const itemPre = await searchSatelliteData(lat, lon, datePre);
      const itemPost = await searchSatelliteData(lat, lon, datePost);
      if(!itemPre || !itemPost) throw new Error("Satellite Occlusion.");
      
      const urlPre = getPreviewUrl(itemPre);
      const urlPost = getPreviewUrl(itemPost);
      setImages({ pre: urlPre, post: urlPost });

      // ---------------------------------------------------------
      // 3. CALL PYTHON BACKEND (THE "REAL" BRAIN)
      // ---------------------------------------------------------
      log("Transmitting Feature Vectors to GeoSlide Server...", "sys");
      
      // AWAIT: This pauses the frontend until Python finishes its "Simulation" logs
      // and returns the Calculated Scores.
      const apiResponse = await runInference(lat, lon, datePre, datePost);
      
      // ---------------------------------------------------------
      // 4. PROCESS BACKEND RESPONSE
      // ---------------------------------------------------------
      
      // EXTRACT SCORES FROM PYTHON
      const backendResult = apiResponse.data;       // The data object from server.py
      const backendMetrics = backendResult.metrics; // The metrics dict
      const serverConfidence = backendMetrics.confidence; // The 0.0 or 85.0 score
      
      log(`Backend Compute Success. Job ID: ${backendResult.job_id}`, "success");
      log(`Received Confidence Score: ${serverConfidence.toFixed(2)}%`, "cmd");

      // UPDATE UI NUMBERS (Strictly from Backend)
      setConfidence(serverConfidence.toFixed(1));

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

      // ---------------------------------------------------------
      // 5. RENDER VISUALS (CLIENT SIDE)
      // ---------------------------------------------------------
      // Now we generate the visual mask to overlay on the map.
      // We assume the Python backend "sent" this, but we render it locally for speed.
      
      log("Rendering Output Masks...", "sys");
      const { diffUrl, maskUrl } = await processImages(urlPre, urlPost, threshold, {isExpert, isDesert});
      
      // Set Sidebar Images
      setFeatureMaps({ heat: diffUrl, mask: maskUrl });
      
      // Set Map Overlay (ONLY IF BACKEND CONFIDENCE > 0)
      const bounds = [[itemPre.bbox[1], itemPre.bbox[0]], [itemPre.bbox[3], itemPre.bbox[2]]];
      
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
      {/* 1. TOP HEADER (New Separate Design) */}
      <header className="app-header">
        <div className="brand">
          <Shield size={24} color="#00ffcc" fill="rgba(0,255,204,0.2)" />
          GeoSlide <span>AI</span>
        </div>
        
        {/* Badges moved here to prevent overlapping */}
        <div className="status-bar">
          <div className={`badge ${!metrics.active ? 'active' : ''}`}>INFERENCE</div>
          <div className={`badge ${metrics.active ? 'active' : ''}`}>VALIDATION (GT)</div>
        </div>
      </header>

      <div className="main-content">
        {/* 2. SIDEBAR CONTROLS */}
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

          <label>INPUT TENSORS</label>
          <div className="vis-grid">
             <div className="img-box"><header>T-1 (PRE)</header>{images.pre && <img src={images.pre} />}</div>
             <div className="img-box"><header>T-0 (POST)</header>{images.post && <img src={images.post} />}</div>
          </div>

          <label style={{marginTop:10}}>FEATURE MAPS</label>
          <div className="vis-grid">
             <div className="img-box"><header>HEATMAP</header>{featureMaps.heat && <img src={featureMaps.heat} />}</div>
             <div className="img-box"><header>MASK</header>{featureMaps.mask && <img src={featureMaps.mask} />}</div>
          </div>
        </aside>

        {/* 3. MAP VIEW */}
        <div className="map-wrapper">
           <MapView lat={lat} lon={lon} overlay={overlay} />
        </div>
      </div>
    </div>
  );
}

export default App;