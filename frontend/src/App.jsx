import { useState, useEffect, useRef } from 'react'
import './index.css'

// ---------------- Risk lexicon (v0.1, from Day 6 plan) ----------------
const LEXICON = {
  urgency: ["right now","immediately","hurry","quick","urgent","don't wait","act now","before it's too late","emergency","asap"],
  secrecy: ["don't tell","keep this between us","don't tell anyone","secret","don't call anyone else","don't mention this"],
  payment: ["gift card","wire transfer","send money","bitcoin","crypto","cash app","zelle","venmo","bank account number","routing number","western union"]
};

function scoreLanguage(text){
  const lower = text.toLowerCase();
  const hits = {urgency:[], secrecy:[], payment:[]};
  for(const cat in LEXICON){
    for(const phrase of LEXICON[cat]){
      if(lower.includes(phrase)) hits[cat].push(phrase);
    }
  }
  const catCount = Object.values(hits).filter(a=>a.length>0).length;
  let base = 0;
  base += hits.urgency.length * 12;
  base += hits.secrecy.length * 18;
  base += hits.payment.length * 20;
  if(catCount >= 2) base += 20;
  if(catCount >= 3) base += 15;
  return {score: Math.min(base, 100), hits};
}

function fuseScore(languageScore, authenticityRiskScore){
  const fused = (languageScore * 0.55) + (authenticityRiskScore * 0.45);
  return Math.round(Math.min(fused, 100));
}

function bandFor(score){
  if(score >= 60) return "red";
  if(score >= 30) return "yellow";
  return "green";
}

function App() {
  const [listening, setListening] = useState(false)
  const [simState, setSimState] = useState("real")
  const [fullTranscript, setFullTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [errorMsg, setErrorMsg] = useState(null)
  
  const [scoreData, setScoreData] = useState({ fused: 0, hits: {urgency:[], secrecy:[], payment:[]} })
  
  const canvasRef = useRef(null)
  const recognitionRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const micStreamRef = useRef(null)
  const animationIdRef = useRef(null)
  const isListeningRef = useRef(false) // for inside callbacks
  const transcriptBoxRef = useRef(null)

  // Combined transcript for processing
  const combinedText = (fullTranscript + " " + interimTranscript).trim()

  // Run fusion whenever transcript or sim state changes
  useEffect(() => {
    const {score: langScore, hits} = scoreLanguage(combinedText);
    const authRisk = simState === "fake" ? 85 : 8; 
    const fused = fuseScore(langScore, authRisk);
    setScoreData({ fused, hits })
  }, [combinedText, simState])

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
      let finalStr = "";
      for(let i = event.resultIndex; i < event.results.length; i++){
        const chunk = event.results[i][0].transcript;
        if(event.results[i].isFinal){
          finalStr += chunk + " ";
        } else {
          interim += chunk;
        }
      }
      if (finalStr) {
        setFullTranscript(prev => prev + finalStr)
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
    
    // resize again to be sure
    if(canvasRef.current){
      canvasRef.current.width = canvasRef.current.clientWidth * window.devicePixelRatio;
      canvasRef.current.height = canvasRef.current.clientHeight * window.devicePixelRatio;
    }
    drawWave();
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
        const hue = isListeningRef.current ? '79,209,197' : '90,96,112';
        ctx2d.fillStyle = `rgba(${hue},${0.35 + v*0.5})`;
        ctx2d.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    }
    loop();
  }

  const stopMic = () => {
    if(animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
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
    setScoreData({ fused: 0, hits: {urgency:[], secrecy:[], payment:[]} })
  }

  // Render helpers
  const renderHighlightedTranscript = () => {
    if(!combinedText) return <span className="empty">Transcript will appear here once you start listening and speak…</span>
    
    let html = combinedText;
    const allPhrases = [...scoreData.hits.urgency, ...scoreData.hits.secrecy, ...scoreData.hits.payment].sort((a,b)=>b.length-a.length);
    for(const phrase of allPhrases){
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
      html = html.replace(re, m => `<mark>${m}</mark>`);
    }
    return <span dangerouslySetInnerHTML={{__html: html}} />
  }
  
  const getTags = () => {
    const tags = [];
    if(scoreData.hits.urgency.length) tags.push(`⏱ urgency language (${scoreData.hits.urgency.length})`);
    if(scoreData.hits.secrecy.length) tags.push(`🤫 secrecy language (${scoreData.hits.secrecy.length})`);
    if(scoreData.hits.payment.length) tags.push(`💳 payment request (${scoreData.hits.payment.length})`);
    if(simState === "fake") tags.push(`🤖 voice flagged as likely synthetic`);
    return tags;
  }

  const band = bandFor(scoreData.fused);
  
  let meterProps = { color: 'var(--green)', label: 'LOW RISK', bg: 'var(--green-bg)' }
  if (band === 'red') meterProps = { color: 'var(--red)', label: 'HIGH RISK', bg: 'var(--red-bg)' }
  else if (band === 'yellow') meterProps = { color: 'var(--amber)', label: 'ELEVATED', bg: 'var(--amber-bg)' }

  const wordCount = combinedText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="wrap">

      <header>
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 3C10.3 3 9 4.3 9 6v6c0 1.7 1.3 3 3 3s3-1.3 3-3V6c0-1.7-1.3-3-3-3z" fill="#0a1512"/><path d="M5 11a7 7 0 0 0 14 0M12 20v2" stroke="#0a1512" stroke-width="1.8" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="brand-name">VoiceGuard</div>
            <div className="brand-sub">Live call risk monitor · Local Build</div>
          </div>
        </div>
        <div className="status-pill">
          <div className={`status-dot ${listening ? 'live' : ''}`}></div>
          <span>{errorMsg ? errorMsg : listening ? "Listening…" : "Idle — mic off"}</span>
        </div>
      </header>

      <div className="panel">
        <div className="hero">
          <div className="wave-box">
            <div className="wave-label"><span>MIC INPUT</span><span>{listening ? 'live' : 'off'}</span></div>
            <canvas ref={canvasRef} id="waveCanvas"></canvas>
          </div>
          <div className="meter-box">
            <div className="meter-ring" style={{ '--pct': scoreData.fused, '--ring-color': meterProps.color }}>
              <div className="meter-inner">
                <div className="meter-score">{scoreData.fused}</div>
                <div className="meter-tag">risk score</div>
              </div>
            </div>
            <div className="meter-band" style={{ background: meterProps.bg, color: meterProps.color }}>
              {meterProps.label}
            </div>
          </div>
        </div>

        <div className="controls">
          <button className={listening ? "danger-active" : "primary"} onClick={toggleListen} disabled={!!errorMsg && !listening}>
            {listening ? (
               <>⏹ Stop listening</>
            ) : (
               <><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3C10.3 3 9 4.3 9 6v6c0 1.7 1.3 3 3 3s3-1.3 3-3V6c0-1.7-1.3-3-3-3z" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 20v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> Start listening</>
            )}
          </button>
          <button onClick={resetSession}>Reset session</button>
          <div className="sim-group">
            <button className={simState === 'real' ? 'active' : ''} onClick={()=>setSimState('real')}>🎙 Simulate: real voice</button>
            <button className={simState === 'fake' ? 'active' : ''} onClick={()=>setSimState('fake')}>🤖 Simulate: synthetic voice</button>
          </div>
        </div>
        <div className="note">
          Voice-authenticity detection is simulated today with the toggle above — this stands in for the real deepfake-detection API, which gets wired in next. Speech-to-text is live and real, running in your browser.
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

      <div className={`verify-banner ${band === 'red' ? 'show' : ''}`}>
        <div className="verify-icon">⚠️</div>
        <div>
          <div className="verify-title">High risk detected — verify before you act</div>
          <div className="verify-body">This call shows strong signs of a voice-cloning scam pattern: urgency, secrecy, or a payment request paired with a synthetic-sounding voice. Don't act on what you just heard until you've confirmed it's really them.</div>
          <div className="verify-actions">
            <button>📞 Call back on a saved number</button>
            <button>🔑 Ask for the family code word</button>
          </div>
        </div>
      </div>

      <footer>
        VoiceGuard prototype · <span className="footer-flag">Day 1</span> · Speech-to-text: live browser API · Voice authenticity: simulated placeholder · Chrome/Edge recommended for mic transcription
      </footer>

    </div>
  )
}

export default App
