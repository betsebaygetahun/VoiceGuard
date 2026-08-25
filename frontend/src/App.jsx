import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [pipelineState, setPipelineState] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [micError, setMicError] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const recordingIntervalRef = useRef(null)

  const API_URL = 'http://localhost:3001/api/stream'

  // Start the rolling chunk recording
  const startRecording = async () => {
    try {
      setMicError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setIsListening(true)

      const startNewChunk = () => {
        if (!streamRef.current) return;
        
        const recorder = new MediaRecorder(streamRef.current)
        mediaRecorderRef.current = recorder
        const audioChunks = []

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.push(event.data)
        }

        recorder.onstop = async () => {
          if (audioChunks.length === 0) return
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          await uploadChunk(audioBlob)
        }

        recorder.start()
      }

      // Start first chunk
      startNewChunk()

      // Stop current and start new every 4 seconds
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop() // triggers onstop, which uploads
        }
        startNewChunk() // immediately start the next one
      }, 4000)

    } catch (err) {
      console.error("Mic access denied or error:", err)
      setMicError("Microphone access denied. Please allow mic permissions.")
      setIsListening(false)
    }
  }

  const stopRecording = () => {
    setIsListening(false)
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const uploadChunk = async (blob) => {
    try {
      const formData = new FormData()
      formData.append('chunk', blob, 'chunk.webm')

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      
      // Only update if we are still listening, to prevent ghost updates after stopping
      if (streamRef.current) {
        setPipelineState(data)
      }
    } catch (err) {
      console.error("Backend error:", err)
    }
  }

  const toggleListen = () => {
    if (isListening) stopRecording()
    else startRecording()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

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
             onClick={toggleListen}
           >
             🎤
           </button>
           <p style={{ marginTop: '12px', color: 'var(--color-gray-500)' }}>
             {isListening ? 'Listening to call...' : 'Tap to start live monitoring'}
           </p>
           {micError && <p style={{ color: 'var(--risk-red)', marginTop: '8px', fontSize: '14px' }}>{micError}</p>}
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
              <p className="transcript-text">
                {pipelineState.stt.transcript ? `"${pipelineState.stt.transcript}"` : <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Silence...</span>}
              </p>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {pipelineState.language_risk.tags.map(tag => (
                  <span key={tag} className="risk-tag risk-tag--yellow">⚠ {tag}</span>
                ))}
              </div>
            </div>

            {/* Graceful Degradation UI: Warning if an API is down */}
            {(pipelineState.voice_auth.label === 'error' || pipelineState.stt.confidence === 0) && pipelineState.stt.transcript !== "No audio chunk received." && (
               <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                 <p style={{ color: '#d97706', fontSize: '14px', margin: 0 }}>
                   ⚠️ <strong>Reduced Confidence Mode:</strong> One or more AI verification services are currently unreachable. Relying on local keywords only.
                 </p>
               </div>
            )}

            {status === 'HIGH RISK' && (
               <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <button className="btn btn-primary">Call Back on Known Number</button>
                 <button className="btn btn-outline">Use Family Code Word</button>
               </div>
            )}
          </>
        )}
      </main>

      {/* Privacy Hardening */}
      <footer style={{ marginTop: 'auto', padding: '20px', textAlign: 'center', borderTop: '1px solid var(--color-gray-200)' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-gray-500)', margin: 0 }}>
          🔒 <strong>Privacy First:</strong> VoiceGuard processes audio in volatile memory only. No audio is ever stored to disk or transmitted to unauthorized third parties. Audio chunks are instantly deleted after analysis.
        </p>
      </footer>
    </div>
  )
}

export default App
