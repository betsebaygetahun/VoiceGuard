# VoiceGuard — API Decision Note
**Document:** VG-API-002  
**Date:** 27 August 2026  
**Status:** 🔒 DECIDED — do not re-litigate

---

## Final Decisions

| Role | Chosen API | Model | Rationale |
|------|-----------|-------|-----------|
| **Speech-to-Text** | **Deepgram** | Nova-3 (streaming) | Lowest latency, native WebSocket, $200 free credit |
| **Voice Authenticity** | **Resemble AI** | DETECT-3B | Public API, pay-per-use, $0.001/sec, sub-300ms |

---

## STT Decision: Deepgram Nova-3

**Winner:** Deepgram  
**Model:** `nova-3` via WebSocket streaming  
**Fallback model:** `nova-3` via REST (chunked upload if WebSocket drops)

### What we get
- Native WebSocket connection for continuous chunk streaming
- Per-chunk transcripts with word-level timestamps
- ~280ms latency from chunk end to final transcript returned
- $200 free credit on signup (no credit card required)
- Simple JSON response format — easy to parse

### Integration endpoint
```
WebSocket: wss://api.deepgram.com/v1/listen
REST:      POST https://api.deepgram.com/v1/listen
Auth:      Authorization: Token {DEEPGRAM_API_KEY}
```

### Response shape (what we parse)
```json
{
  "channel": {
    "alternatives": [{
      "transcript": "Don't tell your mother, I need the money right now",
      "confidence": 0.98,
      "words": [
        { "word": "Don't", "start": 0.0, "end": 0.24, "confidence": 0.99 },
        ...
      ]
    }]
  }
}
```

### Signup action required
→ Sign up at: https://console.deepgram.com/signup  
→ Copy API key to `.env` as `DEEPGRAM_API_KEY`

---

## Voice Auth Decision: Resemble AI DETECT-3B

**Winner:** Resemble AI  
**Model:** DETECT-3B  
**Fallback:** Return neutral score (0.5) if API times out

### What we get
- Probability score: 0.0 (definitely synthetic) → 1.0 (definitely real)
- We invert and scale: `auth_score = (1 - probability_real) × 100`
- So higher score = more suspicious = more likely synthetic
- Sub-300ms response on 3–5 sec audio chunks
- $0.001/sec → ~$0.004 per chunk = virtually free at demo scale

### Integration endpoint
```
POST https://detect.resemble.ai/detect
Content-Type: multipart/form-data
Auth: Authorization: Bearer {RESEMBLE_API_KEY}

Body:
  file: [audio chunk binary]   OR
  url: [publicly accessible audio URL]
```

### Response shape (what we parse)
```json
{
  "success": true,
  "item": {
    "label": "spoof",           // or "bonafide"
    "score": 0.87,              // 0=real, 1=synthetic
    "model_name": "detect-3b"
  }
}
```

### Score normalization
```javascript
// Raw API gives: 0.0 = real, 1.0 = synthetic
// We convert to: 0 = safe, 100 = max suspicious
function normalizeAuthScore(resembleScore) {
  return Math.round(resembleScore * 100);  // 0–100
}
// Example: score=0.87 → authScore=87 (highly suspicious)
// Example: score=0.12 → authScore=12 (likely real)
```

### Signup action required
→ Sign up at: https://app.resemble.ai/  
→ Select Flex (pay-as-you-go) plan  
→ Copy API key to `.env` as `RESEMBLE_API_KEY`

---

## Environment Variables (`.env` template)

```env
# VoiceGuard API Keys
# DO NOT commit this file to version control

# Speech-to-Text
DEEPGRAM_API_KEY=your_deepgram_key_here

# Voice Authenticity
RESEMBLE_API_KEY=your_resemble_key_here

# Pipeline config
CHUNK_DURATION_MS=4000
MAX_RETRIES=3
TIMEOUT_MS=8000
```

---

## Smoke Test Status

| API | Smoke Test | Result |
|-----|-----------|--------|
| Deepgram Nova-3 | See `smoke_test_stt.js` | Pending key |
| Resemble AI Detect | See `smoke_test_voiceauth.js` | Pending key |

> Once API keys are obtained, run the smoke test scripts in `/backend/smoke-tests/`

---

## Why not the others

| API | Reason not chosen |
|-----|------------------|
| AssemblyAI | Equally good but $200 Deepgram credit makes Deepgram free for this build |
| OpenAI Whisper | Not native real-time streaming — adds complexity we don't need |
| Reality Defender | Requires demo request — no instant API access |
| Pindrop | Enterprise-only, sales-gated, no public API |
