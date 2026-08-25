import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [listening, setListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [pipelineState, setPipelineState] = useState(null)
  
  // Accumulated full transcript from backend chunks
  const [fullTranscript, setFullTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  
  // Demo Mode State
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [demoDone, setDemoDone] = useState(false)

  const canvasRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const micStreamRef = useRef(null)
  const animationIdRef = useRef(null)
  const transcriptBoxRef = useRef(null)
  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const demoIntervalRef = useRef(null)

  const API_URL = 'http://localhost:3001/api/stream'
  const STREAM_RESET_URL = 'http://localhost:3001/api/stream/reset'
  const DEMO_RESET_URL = 'http://localhost:3001/api/demo/reset'
  const DEMO_NEXT_URL = 'http://localhost:3001/api/demo/next'
  const CHUNK_DURATION_MS = Number(import.meta.env.VITE_CHUNK_DURATION_MS) || 4000
  
  const combinedText = (fullTranscript + " " + interimTranscript).trim()

  // Setup canvas resizing
  useEffect(() => {
    const resizeCanvas = () => {
      if(canvasRef.current){
        canvasRef.current.width = canvasRef.current.clientWidth * window.devicePixelRatio;
        canvasRef.current.height = canvasRef.current.clientHeight * window.devicePixelRatio;
      }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    if(transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [combinedText])

  const setupRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){
      setErrorMsg("Speech recognition isn't supported in this browser. Try Chrome or Edge on desktop.");
      return null;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

       rec.onresult = (event) => {
      let interim = "";
      for(let i = event.resultIndex; i < event.results.length; i++){
        const chunk = event.results[i][0].transcript;
        if(!event.results[i].isFinal){
          interim += chunk;
        }
      }
      setInterimTranscript(interim)
    };

    rec.onerror = (e) => {
      console.log('Speech recognition error:', e.error);
      if(e.error === 'not-allowed'){
        setErrorMsg("Mic permission denied");
      }
    };

    rec.onend = () => {
      if(isListeningRef.current){
        try{ rec.start(); }catch(e){}
      }
    };

    return rec;
  }

  const uploadChunk = async (blob) => {
    try {
      const formData = new FormData()
      // BUGFIX (Day 28): filename extension now matches blob.type so the browser's
      // multipart Content-Type header reflects the real encoding all the way to the
      // backend, instead of a hardcoded '.webm' regardless of what was recorded.
      const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('wav') ? 'wav' : 'bin'
      formData.append('chunk', blob, `chunk.${ext}`)
      const res = await fetch(API_URL, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      setPipelineState(data)
      if (data?.stt?.transcript) {
        setFullTranscript(prev => (prev + " " + data.stt.transcript).trim())
      }
    } catch (err) {
      console.error('Backend error:', err)
    }
  }

  const startMic = async () => {
    try{
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({audio:true});
      setErrorMsg(null)
    }catch(e){
      setErrorMsg("Mic permission denied");
      return false;
    }
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtxRef.current.createMediaStreamSource(micStreamRef.current);
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);
    
    if(canvasRef.current){
      canvasRef.current.width = canvasRef.current.clientWidth * window.devicePixelRatio;
      canvasRef.current.height = canvasRef.current.clientHeight * window.devicePixelRatio;
    }
    drawWave();

    // Start MediaRecorder chunking
    // BUGFIX (Day 28): explicitly request a supported mimeType instead of letting the
    // browser pick silently, and reuse recorder.mimeType (the ACTUAL encoding used)
    // when building the Blob — previously this was hardcoded to 'audio/webm' even
    // though nothing confirmed that's really what got recorded.
    const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''; // let the browser choose if neither is supported

    const startNewChunk = () => {
      if (!micStreamRef.current) return null
      const recorder = preferredMimeType
        ? new MediaRecorder(micStreamRef.current, { mimeType: preferredMimeType })
        : new MediaRecorder(micStreamRef.current)
      const audioChunks = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data)
      }

      recorder.onstop = async () => {
        if (audioChunks.length === 0) return
        if (!isListeningRef.current) return
        const realType = (recorder.mimeType || 'audio/webm').split(';')[0]
        const blob = new Blob(audioChunks, { type: realType })
        setIsProcessing(true)
        await uploadChunk(blob)
        setIsProcessing(false)
      }

      recorder.start()
      return recorder
    }

    const CHUNK_OVERLAP_MS = 1000

    mediaRecorderRef.current = startNewChunk()
    recordingIntervalRef.current = setInterval(() => {
      const oldRecorder = mediaRecorderRef.current
      mediaRecorderRef.current = startNewChunk()
      setTimeout(() => {
        if (oldRecorder?.state === 'recording') oldRecorder.stop()
      }, CHUNK_OVERLAP_MS)
    }, CHUNK_DURATION_MS)

    return true;
  }

  const drawWave = () => {
    if(!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx2d = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const loop = () => {
      animationIdRef.current = requestAnimationFrame(loop);
      analyserRef.current.getByteFrequencyData(dataArray);
      ctx2d.clearRect(0,0,canvas.width,canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.6;
      let x = 0;
      for(let i=0;i<bufferLength;i++){
        const v = dataArray[i] / 255;
        const barHeight = v * canvas.height;
        // Using a ref or simply relying on the color isn't perfect, but we can default to the active color since this only runs when listening.
        const hue = '79,209,197'; 
        ctx2d.fillStyle = `rgba(${hue},${0.35 + v*0.5})`;
        ctx2d.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    }
    loop();
  }

  const stopMic = () => {
    if(animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if(mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if(micStreamRef.current) micStreamRef.current.getTracks().forEach(t=>t.stop());
    if(audioCtxRef.current) audioCtxRef.current.close();
    if(canvasRef.current) {
        const ctx2d = canvasRef.current.getContext('2d');
        ctx2d.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    }
  }

  const toggleListen = async () => {
    if(!listening){
      isListeningRef.current = true;
      const ok = await startMic();
      if(!ok) {
          isListeningRef.current = false;
          return;
      }
      if(!recognitionRef.current) recognitionRef.current = setupRecognition();
      if(recognitionRef.current){
        try{ recognitionRef.current.start(); }catch(e){}
      }
      setListening(true);
    } else {
      isListeningRef.current = false;
      setListening(false);
      if(recognitionRef.current){ try{ recognitionRef.current.stop(); }catch(e){} }
      stopMic();
    }
  }

  const resetSession = () => {
    setFullTranscript("");
    setInterimTranscript("");
    setPipelineState(null);
    fetch(STREAM_RESET_URL, { method: 'POST' }).catch(err => console.error('[Reset] Backend session reset failed:', err))
  }

  // ── Demo Mode ──
  const startDemo = async () => {
    await fetch(DEMO_RESET_URL)
    setIsDemoMode(true)
    setListening(true)
    setDemoStep(0)
    setDemoDone(false)
    setPipelineState(null)
    setFullTranscript("")
    setInterimTranscript("")

    const advance = async () => {
      setIsProcessing(true)
      const res = await fetch(DEMO_NEXT_URL)
      const data = await res.json()
      setIsProcessing(false)
      if (data.done) {
        setDemoDone(true)
        setListening(false)
        clearInterval(demoIntervalRef.current)
        return
      }
      setDemoStep(data.step)
      setPipelineState(data)
      if (data.stt?.transcript) {
        setFullTranscript(prev => (prev + " " + data.stt.transcript).trim())
      }
    }

    await advance() 
    demoIntervalRef.current = setInterval(advance, 4000)
  }

  const stopDemo = () => {
    clearInterval(demoIntervalRef.current)
    setIsDemoMode(false)
    setListening(false)
    setDemoStep(0)
    setDemoDone(false)
    setPipelineState(null)
    setFullTranscript("")
  }

  useEffect(() => () => { stopMic(); stopDemo() }, [])

  // Render helpers
  const renderHighlightedTranscript = () => {
    if(!combinedText) return <span className="empty">Transcript will appear here once you start listening and speak…</span>
    return <span>{combinedText}</span> // Could add keyword highlighting here if needed, but backend gives us tags directly.
  }
  
  const getTags = () => {
    const tags = [];
    if(pipelineState?.language_risk?.reasons) {
        tags.push(...pipelineState.language_risk.reasons.map(r => `⚠ ${r}`))
    }
    if(pipelineState?.voice_auth?.label === 'spoof') {
        tags.push(`🤖 voice flagged as likely synthetic (Score: ${pipelineState.voice_auth.score})`)
    }
    return tags;
  }

  const score = pipelineState?.fusion?.total_risk_score || 0;
  const status = pipelineState?.fusion?.status || 'SAFE';
  
  let meterProps = { color: 'var(--green)', label: 'LOW RISK', bg: 'var(--green-bg)' }
  if (status === 'HIGH RISK') meterProps = { color: 'var(--red)', label: 'HIGH RISK', bg: 'var(--red-bg)' }
  else if (status === 'CAUTION') meterProps = { color: 'var(--amber)', label: 'ELEVATED', bg: 'var(--amber-bg)' }

  const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
  const isDegraded = pipelineState?.voice_auth?.label === 'error' || pipelineState?.voice_auth?.label === 'unknown';

  return (
    <div className="wrap">

      <header>
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 3C10.3 3 9 4.3 9 6v6c0 1.7 1.3 3 3 3s3-1.3 3-3V6c0-1.7-1.3-3-3-3z" fill="#0a1512"/><path d="M5 11a7 7 0 0 0 14 0M12 20v2" stroke="#0a1512" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="brand-name">VoiceGuard</div>
            <div className="brand-sub">Live call risk monitor · Day 27 Backend Connected</div>
          </div>
        </div>
        <div className="status-pill">
          <div className={`status-dot ${listening ? 'live' : ''}`}></div>
          <span>
            {errorMsg ? errorMsg : isProcessing ? "⏳ Analyzing chunk..." : listening && isDemoMode ? `🎬 Demo — Step ${demoStep} of 3` : listening ? "Listening…" : "Idle — mic off"}
          </span>
        </div>
      </header>

      <div className="panel">
        <div className="hero">
          <div className="wave-box">
            <div className="wave-label"><span>MIC INPUT</span><span>{listening ? 'live' : 'off'}</span></div>
            <canvas ref={canvasRef} id="waveCanvas"></canvas>
          </div>
          <div className="meter-box">
            <div className="meter-ring" style={{ '--pct': score, '--ring-color': meterProps.color }}>
              <div className="meter-inner">
                <div className="meter-score">{score}</div>
                <div className="meter-tag">risk score</div>
              </div>
            </div>
            <div className="meter-band" style={{ background: meterProps.bg, color: meterProps.color }}>
              {meterProps.label}
            </div>
            {pipelineState && (
                <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>
                    ⚡ {pipelineState.fusion.total_latency_ms}ms
                </div>
            )}
          </div>
        </div>

        <div className="controls">
          <button className={listening && !isDemoMode ? "danger-active" : "primary"} onClick={toggleListen} disabled={(!!errorMsg && !listening) || isDemoMode}>
            {listening && !isDemoMode ? (
               <>⏹ Stop listening</>
            ) : (
               <><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3C10.3 3 9 4.3 9 6v6c0 1.7 1.3 3 3 3s3-1.3 3-3V6c0-1.7-1.3-3-3-3z" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 20v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> Start listening</>
            )}
          </button>
          <button onClick={resetSession} disabled={isDemoMode}>Reset session</button>
          
          <div className="sim-group">
            {!isDemoMode ? (
                <button onClick={startDemo} disabled={listening}>🎬 Run Guided Demo</button>
            ) : (
                <button onClick={stopDemo} style={{ color: 'var(--red)' }}>✕ Stop Demo</button>
            )}
          </div>
        </div>
        <div className="note">
          {isDegraded 
            ? "⚠️ Reduced Confidence Mode — Voice Authentication API is unreachable. Relying on local keyword analysis only."
            : "Fully connected to the backend API. Real-time STT via Deepgram and deepfake detection via Resemble AI."}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">Live transcript <small>{wordCount > 0 ? `${wordCount} words transcribed` : 'no speech yet'}</small></div>
        <div className="transcript-box" ref={transcriptBoxRef}>
            {renderHighlightedTranscript()}
        </div>
        <div className="tags">
            {getTags().length > 0 ? getTags().map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
            )) : <span className="tag empty-tag">no risk patterns detected yet</span>}
        </div>
      </div>

      <div className={`verify-banner ${status === 'HIGH RISK' ? 'show' : ''}`}>
        <div className="verify-icon">⚠️</div>
        <div>
          <div className="verify-title">High risk detected — verify before you act</div>
          <div className="verify-body">This call shows strong signs of a voice-cloning scam pattern paired with a synthetic-sounding voice. Don't act on what you just heard until you've confirmed it's really them.</div>
          <div className="verify-actions">
            <button>📞 Call back on a saved number</button>
            <button>🔑 Ask for the family code word</button>
          </div>
        </div>
      </div>

      <footer>
        VoiceGuard prototype · <span className="footer-flag">Day 27</span> · Connected Backend Mode
      </footer>

    </div>
  )
}

export default App