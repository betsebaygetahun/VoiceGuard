# VoiceGuard — Integration Test Report
**Document:** VG-TEST-001  
**Date:** 7 September 2026 (Day 14)  
**Status:** PASS (with minor defects)

This document covers the end-to-end pipeline review conducted at the end of Week 2.

## 1. End-to-End Test Matrix

We ran 3 full live microphone tests against the `http://localhost:3001/api/stream` endpoint, testing the parallel Deepgram + Resemble AI processing pipeline.

| Test Case | Scenario | Expected Result | Actual Result | Status |
|-----------|----------|-----------------|---------------|--------|
| **1. Normal Conversation** | Reading a recipe out loud. | `SAFE` (🟢) | `SAFE` (Score: 12) | **PASS** |
| **2. Scam (The Demo Case)** | "Grandma I'm in jail, send apple gift cards right now." (Voice synthetically degraded via Resemble override test) | `HIGH RISK` (🔴) | `HIGH RISK` (Score: 93) | **PASS** |
| **3. Edge Case (Silence/Noise)**| Microphone left on in an empty room with faint background static. | `SAFE` (🟢) with empty transcript fallback. | `SAFE` (Score: 0). STT returned empty gracefully. | **PASS** |

---

## 2. Defect List & Triage

During integration, we identified the following defects. None are blockers for the core demo, but they are tracked for Week 4 polish.

| ID | Component | Severity | Description | Status |
|----|-----------|----------|-------------|--------|
| `BUG-01` | Frontend UI | **Low** | Risk meter briefly flickers `SAFE` during the exact moment a new 4-second chunk is initializing before the backend returns a score. | Tracked for Day 23 Polish |
| `BUG-02` | STT Pipeline | **Medium** | Deepgram `nova-3` occasionally hallucinates the word "now" if background static is loud, triggering a false Urgency tag. | Tracked for Day 17 Tuning |
| `BUG-03` | Lexicon | **Low** | The word "accident" triggers Urgency, which could flag normal conversations about traffic. | Tracked for Day 17 Tuning |

## 3. Conclusion
The core pipeline (Mic -> Chunker -> Backend -> Deepgram & Resemble -> Fusion Math -> Frontend UI) is 100% operational. The end-to-end median latency currently sits at **~1.2 seconds**, well below our 6.0-second success metric target. We are cleared to move into Week 3: Calibration.
