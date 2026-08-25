# VoiceGuard — Architecture Freeze Document
**Document:** VG-ARCH-FREEZE-001  
**Date:** 31 August 2026  
**Status:** 🔒 LOCKED — NO SCOPE CREEP ALLOWED

---

## 1. Scope & Demo Scenario (LOCKED)
- **Demo Scenario:** "Family Emergency" Scam
- **Storyline:** AI-cloned grandchild voice claims to be in trouble (urgency), asks not to tell parents (secrecy), and demands payment via gift cards/wire (payment).
- **Core Functionality:** Audio capture → STT & Voice Auth analysis → Scoring Fusion → UI feedback.

## 2. API Decisions (LOCKED)
- **Speech-to-Text (STT):** Deepgram (`nova-3` streaming). Chosen for sub-300ms latency.
- **Voice Authenticity:** Resemble AI (`DETECT-3B`). Chosen for real vs synthetic probabilistic scoring under 300ms.

## 3. Tech Stack (LOCKED)
- **Frontend:** React + Vite (Vanilla CSS using `design-system.css`).
- **Backend:** Node.js + Express (handling multer audio streams and API orchestration).
- **Styling:** Playfair Display (headings), Poppins (UI), Crimson/Rose `#f43f5e` primary color. Semantic traffic-light risk states (Green, Yellow, Red).

## 4. Pipeline Flow (LOCKED)
1. **Mic Capture:** React frontend captures audio chunks (3-5 seconds).
2. **Transmission:** Chunks sent to `POST /api/stream` via `multipart/form-data`.
3. **Parallel Processing:**
   - Chunk → Deepgram (Text transcript)
   - Chunk → Resemble AI (Voice auth score 0-1)
4. **Lexicon Engine:** Parses transcript for `[Urgency, Secrecy, Payment]` keywords to generate Language Risk score.
5. **Fusion Engine:** `(VoiceAuth * 0.6) + (LanguageRisk * 0.4) = Total Risk (0-100)`
6. **UI Response:** 
   - `0-35`: SAFE (🟢)
   - `36-65`: CAUTION (🟡)
   - `66-100`: HIGH RISK (🔴)

## 5. Success Metrics (LOCKED)
- **Recall:** ≥75% (Catch 3 out of 4 deepfakes).
- **False-positive rate:** ≤15% (Don't alarm normal conversations).
- **End-to-End Latency:** ≤6 seconds from speaking to UI update.

---
*By reaching Day 7, the foundation is set. Week 2 will strictly focus on API wiring and frontend-backend connectivity without changing the underlying blueprint.*
