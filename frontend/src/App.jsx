import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [pipelineState, setPipelineState] = useState(null)
  const [isListening, setIsListening] = useState(false)
  
  // Hardcoded endpoint (testing only)
  const API_URL = 'http://localhost:3001/api/stream'

  // Poll dummy backend
  useEffect(() => {
    let interval;
    if (isListening) {
      interval = setInterval(async () => {
        try {
          const formData = new FormData();
          formData.append('chunk', new Blob(['test'], { type: 'audio/wav' }));

          const res = await fetch(API_URL, {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          setPipelineState(data);
        } catch (err) {
          console.error("Backend error:", err);
        }
      }, 4000); // Poll every 4 seconds mimicking chunk
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Determine current screen state based on pipeline data
  const status = pipelineState?.fusion?.status || 'SAFE'
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-logo"><span className="shield">🛡️</span> VoiceGuard</h1>
        {isListening && (
          <span className={`risk-tag risk-tag--${
            status === 'SAFE' ? 'green' : 
            status === 'CAUTION' ? 'yellow' : 'red'
          }`}>
            {status}
          </span>
        )}
      </header>
      
      <main className="main-content" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ textAlign: 'center' }}>
           <button 
             className={`mic-button ${isListening ? 'listening' : ''}`}
             onClick={() => setIsListening(!isListening)}
           >
             🎤
           </button>
           <p style={{ marginTop: '12px', color: 'var(--color-gray-500)' }}>
             {isListening ? 'Listening to call...' : 'Tap to simulate live call'}
           </p>
        </div>

        {pipelineState && (
          <>
            <div className={`risk-meter-container risk-meter--${
              status === 'SAFE' ? 'green' : 
              status === 'CAUTION' ? 'yellow' : 'red'
            }`}>
              <div className="risk-score">{pipelineState.fusion.total_risk_score}</div>
              <div className="risk-label">{status}</div>
            </div>

            <div className="transcript-card">
              <h4>Live Transcript</h4>
              <p className="transcript-text">"{pipelineState.stt.transcript}"</p>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {pipelineState.language_risk.tags.map(tag => (
                  <span key={tag} className="risk-tag risk-tag--yellow">⚠ {tag}</span>
                ))}
              </div>
            </div>

            {status === 'HIGH RISK' && (
               <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <button className="btn btn-primary">Call Back on Known Number</button>
                 <button className="btn btn-outline">Use Family Code Word</button>
               </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
