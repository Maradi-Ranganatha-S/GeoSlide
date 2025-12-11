import { useState } from 'react';
import { Shield, LayoutDashboard, BarChart3 } from 'lucide-react';
import './App.css';

// Import Pages
import Dashboard from './Dashboard'; // Move your OLD App.jsx content here!
import AnalysisPage from './components/AnalysisPage';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'analysis'

  return (
    <div className="app-container">
      {/* 1. GLOBAL HEADER */}
      <header className="app-header">
        <div className="brand">
          <Shield size={24} color="#00ffcc" fill="rgba(0,255,204,0.2)" />
          GeoSlide <span>AI</span>
        </div>
        
        {/* VIEW SWITCHER */}
        <div className="nav-menu" style={{ display: 'flex', gap: '20px', marginRight: '20px' }}>
          <button 
            onClick={() => setView('dashboard')}
            style={{ 
              background: 'none', border: 'none', color: view === 'dashboard' ? '#00ffcc' : '#666', 
              cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px' 
            }}
          >
            <LayoutDashboard size={18} /> LIVE INFERENCE
          </button>
          
          <button 
            onClick={() => setView('analysis')}
            style={{ 
              background: 'none', border: 'none', color: view === 'analysis' ? '#00ffcc' : '#666', 
              cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px' 
            }}
          >
            <BarChart3 size={18} /> COMPARATIVE ANALYSIS
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <div className="main-content" style={{ overflow: 'hidden' }}>
        {view === 'dashboard' ? <Dashboard /> : <AnalysisPage />}
      </div>
    </div>
  );
}

export default App;