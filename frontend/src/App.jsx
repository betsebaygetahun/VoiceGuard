import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [pipelineState, setPipelineState] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [micError, setMicError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const recordingIntervalRef = useRef(null)

  const API_URL = 'http://localhost:3001/api/stream'

  const startRecording = async () => {
    try {
      setMicError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setIsListening(true)

      const startNewChunk = () => {
        if (!streamRef.current) return
        const recorder = new MediaRecorder(streamRef.current)
        mediaRecorderRef.current = recorder
        const audioChunks = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data)
        }

        recorder.onstop = async () => {
          if (audioChunks.length === 0) return
          const blob = new Blob(audioChunks, { type: 'audio/webm' })
          setIsProcessing(true)
          await uploadChunk(blob)
          setIsProcessing(false)
        }

        recorder.start()
      }

      startNewChunk()
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
        startNewChunk()
      }, 4000)

    } catch (err) {
      setMicError('Microphone access denied. Please allow mic permissions.')
      setIsListening(false)
    }
  }

  const stopRecording = () => {
    setIsListening(false)
    setPipelineState(null)
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const uploadChunk = async (blob) => {
    try {
      const formData = new FormData()
      formData.append('chunk', blob, 'chunk.webm')
      const res = await fetch(API_URL, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      if (streamRef.current) setPipelineState(data)
    } catch (err) {
      console.error('Backend error:', err)
    }
  }

  useEffect(() => () => stopRecording(), [])

  const status = pipelineState?.fusion?.status || 'SAFE'
  const riskColor = status === 'SAFE' ? 'green' : status === 'CAUTION' ? 'yellow' : 'red'
  const isDegraded = pipelineState?.voice_auth?.label === 'error' || pipelineState?.voice_auth?.label === 'unknown'

  return (
    <div className="app-container">

      {/* ── Header ── */}
      <header className="app-header">
        <h1 className="app-logo">
          <span className="shield">🛡️</span> VoiceGuard
        </h1>
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isProcessing && (
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#f59e0b', display: 'inline-block',
                animation: 'pulse 1s infinite'
              }} />
            )}
            <span className={`risk-tag risk-tag--${riskColor}`}>
              {status}
            </span>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="main-content">

        {/* Mic Button Section */}
        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
          <button
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={() => isListening ? stopRecording() : startRecording()}
            aria-label={isListening ? 'Stop monitoring' : 'Start monitoring'}
          >
            {isListening ? '⏹' : '🎤'}
          </button>

          <p style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            {isProcessing
              ? '⏳ Analyzing chunk...'
              : isListening
              ? 'Listening to live call...'
              : 'Tap to start live monitoring'}
          </p>

          {micError && (
            <p style={{ marginTop: '10px', color: '#f43f5e', fontSize: '13px' }}>
              ⚠ {micError}
            </p>
          )}
        </div>

        {/* Risk Meter */}
        {pipelineState && (
          <div className={`risk-meter-container risk-meter--${riskColor} animate-fade-up`}>
            {/* Score Arc Label */}
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
              Risk Score
            </div>
            <div className="risk-score">
              {pipelineState.fusion.total_risk_score}
            </div>
            <div className="risk-label">{status}</div>
            <div style={{
              marginTop: '10px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              display: 'flex',
              gap: '16px'
            }}>
              <span>🎙 STT {pipelineState.stt.latency_ms}ms</span>
              <span>🔊 Auth {pipelineState.voice_auth.latency_ms}ms</span>
              <span>⚡ Total {pipelineState.fusion.total_latency_ms}ms</span>
            </div>
          </div>
        )}

        {/* Live Transcript */}
        {pipelineState && (
          <div className="transcript-card animate-fade-up">
            <h4>Live Transcript</h4>
            <p className="transcript-text">
              {pipelineState.stt.transcript
                ? `"${pipelineState.stt.transcript}"`
                : <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'normal' }}>Silence detected...</span>
              }
            </p>

            {pipelineState.language_risk.reasons?.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pipelineState.language_risk.reasons.map((reason, i) => (
                  <span key={i} className="risk-tag risk-tag--yellow">
                    ⚠ {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Degraded Mode Banner */}
        {pipelineState && isDegraded && (
          <div className="degradation-banner animate-fade-up">
            ⚠️ <strong>Reduced Confidence Mode</strong> — One or more AI services are unreachable. Relying on local keyword analysis only.
          </div>
        )}

        {/* High Risk CTA */}
        {pipelineState && status === 'HIGH RISK' && (
          <div className="high-risk-actions animate-fade-up">
            <p>🚨 Suspected AI voice scam detected. Take action:</p>
            <button className="btn btn-primary">📞 Call Back on Known Number</button>
            <button className="btn btn-outline">🔑 Use Your Family Code Word</button>
          </div>
        )}

      </main>

      {/* ── Privacy Footer ── */}
      <footer className="privacy-footer">
        <p>🔒 <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Privacy First</strong> — Audio is processed in volatile memory only and instantly discarded after analysis. Nothing is stored.</p>
      </footer>

    </div>
  )
}

export default App
