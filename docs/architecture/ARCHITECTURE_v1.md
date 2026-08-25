# VoiceGuard — Architecture Diagram v1
**Document:** VG-ARCH-001 v1.0  
**Date:** 26 August 2026  
**Status:** DRAFT — to be frozen Day 7

---

## Full Pipeline (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER DEVICE                              │
│                                                                 │
│   📞 Incoming Call                                              │
│         │                                                       │
│         ▼                                                       │
│   🎤 MICROPHONE  ──────────────────────────────────────────┐   │
│         │                                                   │   │
│         ▼                                                   │   │
│   ┌─────────────────┐                                       │   │
│   │  CHUNK CAPTURE  │  Rolling 3–5 sec audio windows        │   │
│   │  (Frontend JS)  │                                       │   │
│   └────────┬────────┘                                       │   │
│            │                                                │   │
└────────────┼────────────────────────────────────────────────┘   
             │ Audio chunks (via WebSocket / HTTP)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND PIPELINE                         │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    INGESTION LAYER                       │  │
│   │  Receives chunk → validates format → queues for parallel │  │
│   │  processing                                              │  │
│   └──────────────────┬───────────────────┬───────────────────┘  │
│                      │                   │                       │
│            (parallel track A)   (parallel track B)              │
│                      │                   │                       │
│                      ▼                   ▼                       │
│   ┌──────────────────────┐  ┌───────────────────────────────┐   │
│   │  SPEECH-TO-TEXT API  │  │  VOICE AUTHENTICITY API       │   │
│   │  (3rd party)         │  │  (deepfake detection, 3rd     │   │
│   │                      │  │   party)                      │   │
│   │  Output:             │  │  Output:                      │   │
│   │  - Transcript text   │  │  - Real/synthetic score       │   │
│   │  - Timestamps        │  │  - Normalized to 0–100        │   │
│   └──────────┬───────────┘  └──────────────┬────────────────┘   │
│              │                              │                    │
│              ▼                              │                    │
│   ┌──────────────────────┐                 │                    │
│   │  LANGUAGE RISK ENGINE│                 │                    │
│   │                      │                 │                    │
│   │  - Lexicon matching  │                 │                    │
│   │  - Co-occurrence logic│                │                    │
│   │  - Reason tag gen    │                 │                    │
│   │                      │                 │                    │
│   │  Output:             │                 │                    │
│   │  - Language risk score│                │                    │
│   │  - Reason tags[]     │                 │                    │
│   └──────────┬───────────┘                 │                    │
│              │                              │                    │
│              └──────────────┬───────────────┘                    │
│                             │                                    │
│                             ▼                                    │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                  SCORE FUSION ENGINE                     │  │
│   │                                                          │  │
│   │  fused = (auth_score × w1) + (lang_risk × w2)           │  │
│   │                                                          │  │
│   │  Bands:  GREEN  = fused < threshold_low                  │  │
│   │          YELLOW = threshold_low ≤ fused < threshold_high │  │
│   │          RED    = fused ≥ threshold_high                 │  │
│   │                                                          │  │
│   │  Output: { score, band, reason_tags[], transcript }      │  │
│   └──────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ Score payload (WebSocket push)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND UI                             │
│                                                                 │
│   ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│   │  LIVE        │  │  RISK METER      │  │  VERIFY        │   │
│   │  TRANSCRIPT  │  │  (green/yellow/  │  │  PROMPT        │   │
│   │              │  │   red + score)   │  │  (on RED only) │   │
│   │  Scrolling   │  │                  │  │                │   │
│   │  text as     │  │  Reason tags     │  │  "Call back    │   │
│   │  chunks land │  │  displayed       │  │  on known #"   │   │
│   └──────────────┘  └──────────────────┘  └────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Owner Layer | Technology |
|-----------|------------|------------|
| Chunk Capture | Frontend | Web Audio API / MediaRecorder |
| Chunk Upload Loop | Frontend → Backend | WebSocket or chunked HTTP POST |
| Ingestion + Queue | Backend | Node.js / Python (TBD Day 3) |
| STT API call | Backend | 3rd party (TBD Day 3) |
| Voice Auth API call | Backend | 3rd party (TBD Day 3) |
| Language Risk Engine | Backend | Custom rules engine |
| Score Fusion | Backend | Weighted formula |
| Score Push to UI | Backend → Frontend | WebSocket |
| Risk Meter UI | Frontend | HTML/CSS/JS |
| Transcript Display | Frontend | HTML/CSS/JS |
| Verify Prompt | Frontend | HTML/CSS/JS |

---

## Key Design Decisions

- **Parallel processing:** STT and Voice Auth run simultaneously on the same chunk (not sequential)
- **Chunk size:** 3–5 seconds rolling windows
- **Score scale:** 0–100 normalized for both signals
- **Fusion:** Weighted sum (weights TBD after Day 16 calibration)
- **No persistent audio storage:** Chunks discarded after scoring
- **Graceful degradation:** If either API fails → fallback value, pipeline continues

---

## What's OUT of Scope (to be confirmed Day 7)

- True carrier-level call interception
- Multi-language support (roadmap item)
- Multiple scam scenario types (roadmap — demo covers one only)
- Always-on background monitoring
- User account / data persistence
