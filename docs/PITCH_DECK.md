# VoiceGuard — Pitch Deck
**Document:** VG-PITCH-001  
**Event:** Contest Submission — 23 September 2026  
**Version:** v1.0 (Day 25 Draft)

---

## SLIDE 1 — Title

**🛡️ VoiceGuard**  
*Real-Time AI Voice Scam Call Detector*

> "Your loved ones can't tell the difference. VoiceGuard can."

---

## SLIDE 2 — The Problem (The Hook)

### AI Voice Cloning Has Changed Scams Forever

- **$1.1 billion** lost to phone scams in the US in 2023 alone *(FBI IC3 Report 2023)*
- AI tools like ElevenLabs can clone a voice from **3 seconds** of audio
- The "Grandparent Scam" is now the **#1 AI-assisted fraud** targeting elderly people
- Victims cannot distinguish between their grandchild's real voice and a deepfake
- **FATF Recommendation 15** calls for tech-based controls against AI-enabled financial fraud

> *"Mom, it's me. I'm in jail. Please send gift cards — don't tell anyone."*  
> *— A call your grandmother cannot recognize as fake. VoiceGuard can.*

---

## SLIDE 3 — The Solution

### VoiceGuard: A Real-Time Scam Shield

VoiceGuard runs **silently in the background** during a phone call. It listens, analyzes, and alerts — all within 6 seconds of the caller speaking.

**Three layers of defense:**
1. 🎙 **Voice Authenticity** — Detects AI-cloned synthetic voices in real time
2. 📝 **Language Risk** — Flags scam language patterns (urgency, secrecy, payment demands)
3. ⚡ **Fusion Engine** — Combines both signals into a single 0-100 Risk Score

---

## SLIDE 4 — Live Demo

### The "Family Emergency" Scam — Live

*[Run Guided Demo mode here]*

**Step 1:** Caller opens with secrecy language → Score: **39 (🟡 CAUTION)**  
**Step 2:** Caller escalates, claims to be in jail → Score: **76 (🔴 HIGH RISK)**  
**Step 3:** Caller demands Apple gift cards immediately → Score: **95 (🔴 HIGH RISK)**

Reason Tags appear:
- ⚠ Detected urgent language: *"emergency"*
- ⚠ Detected secrecy request: *"don't tell mom"*
- ⚠ Detected payment demand: *"gift cards"*
- ⚠ High confidence scam pattern (Urgency + Secrecy + Payment) detected.

**Action buttons appear:**
- 📞 Call Back on Known Number
- 🔑 Use Your Family Code Word

---

## SLIDE 5 — How It Works (Technical)

### The Pipeline (< 1.2 seconds end-to-end)

```
Microphone
    ↓ (4-second rolling chunks)
Backend Server (Node.js / Express)
    ↓         ↓
Deepgram    Resemble AI
(STT)       (Voice Auth)
    ↓         ↓
  [Running in parallel via Promise.all]
    ↓
Language Risk Engine (Lexicon + Co-occurrence)
    ↓
Score Fusion: (Auth × 0.6) + (Language × 0.4)
    ↓
React UI (Green / Yellow / Red)
```

**Median Latency: 1,134ms** *(Target: ≤ 6,000ms — 4.8s under budget)*

---

## SLIDE 6 — Performance Metrics

### We Tested It. It Passes.

| Metric | Target | Achieved |
|--------|--------|----------|
| Recall (Catching deepfakes) | ≥ 75% | **100%** (2/2 synthetic clips caught) |
| False Positive Rate | ≤ 15% | **0%** (Normal calls stay GREEN) |
| End-to-End Latency | ≤ 6.0s | **1.13s median** |

**Scoring Matrix (4/4 PASS):**
- Human + Normal Language → 🟢 SAFE (Score: 6)
- Human + Scam Language → 🟡 CAUTION (Score: 57)
- AI Voice + Normal Language → 🔴 HIGH RISK (Score: 66, override)
- AI Voice + Scam Script → 🔴 HIGH RISK (Score: 93)

---

## SLIDE 7 — Privacy by Design

### We Never Store Your Voice. Ever.

| Data | Stored? | Sent Externally? |
|------|---------|-----------------|
| Audio Buffer | ❌ Never | ✅ Deepgram + Resemble (HTTPS) |
| Transcript | ❌ Never | ✅ Deepgram only |
| Risk Score | ❌ Never | ❌ No |
| User Identity | ❌ Never | ❌ No |

- Audio chunks held in **volatile RAM only**
- Buffer explicitly **nullified** after each API call
- No database. No history. No logs.
- Compliant with **FATF Rec 15** principles of proportional, targeted AI monitoring

---

## SLIDE 8 — Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React + Vite | Fast, mobile-first SPA |
| Audio Capture | Web MediaRecorder API | No native app required |
| STT | **Deepgram nova-3** | <300ms streaming latency |
| Voice Auth | **Resemble AI DETECT-3B** | State-of-art deepfake detection |
| Backend | Node.js + Express | Lightweight, async-first |
| Fusion Engine | Custom (JS) | Tuned 60/40 weighted formula |
| Deployment | Local (demo) | Runs on any laptop |

---

## SLIDE 9 — Market & Impact

### Who Needs This?

- 👵 **Elderly individuals** most targeted by grandparent scams
- 👨‍👩‍👧 **Families** who want passive protection for vulnerable relatives  
- 🏦 **Banks & Telcos** looking for client protection tools
- 🏛 **Governments** meeting FATF Rec 15 obligations on AI-enabled fraud

### The Opportunity
- $1.1B+ in annual US phone scam losses
- AI voice cloning tools are **free and publicly available**
- No real-time detection tools exist for consumers today

> *VoiceGuard is the smoke detector for AI voice scams.*

---

## SLIDE 10 — The Team & What's Next

### Built in 30 Days

VoiceGuard was designed and built in a structured 30-day sprint:
- **Week 1:** Architecture, API selection, design system
- **Week 2:** Full pipeline — STT + Voice Auth + Fusion Engine
- **Week 3:** Calibration, latency benchmarking, privacy hardening
- **Week 4:** UX polish, demo mode, pitch packaging

### Next Steps
- 📱 Native mobile app (iOS + Android)
- 🔗 Telecom API integration (intercept at network layer)
- 🧠 Fine-tuned language model for scam scripts
- 🌍 Multi-language lexicon expansion

---

*Thank you. Questions?*

**🛡️ VoiceGuard** — *Because your family deserves protection.*
