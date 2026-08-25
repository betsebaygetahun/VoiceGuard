# VoiceGuard — Problem Statement & Project Overview
**Document:** VG-PS-001 v1.0  
**Date:** 25 August 2026  
**Status:** Active

---

## Problem Statement

AI voice cloning and deepfake impersonation scams are one of the fastest-growing and most damaging threats in financial security today. A scammer needs as little as 30 seconds of a person's voice to generate a convincing clone. That clone is then used to fake a phone call: a "grandchild" in an emergency, a "CEO" ordering an urgent wire transfer, or a "bank official" asking to confirm account details.

**The core problem:** Human hearing can no longer reliably tell a cloned voice from a real one. There is currently no simple, real-time tool that gives an ordinary person a way to check — in the moment — whether the voice on the other end of a call is real.

---

## What VoiceGuard Does

VoiceGuard is a real-time app that:
1. Listens through the device microphone during a call
2. Analyses audio in rolling 3–5 second chunks
3. Checks voice authenticity (real vs. synthetic)
4. Scans transcript for scam language patterns
5. Shows a live **GREEN / YELLOW / RED** risk meter
6. On RED: prompts the user to verify before acting

---

## Demo Scenario (to be locked Day 2)

**Target:** "Family Emergency" scam call  
- Fake grandchild/relative calls victim  
- Creates urgency + secrecy language  
- Requests untraceable payment (gift cards / crypto / wire)

---

## Target Metrics

| Metric | Target |
|--------|--------|
| Scam detection recall | ≥ 75% |
| False-positive rate | ≤ 15% |
| End-to-end latency | ≤ 6 seconds |

---

## Regulatory Relevance

**FATF Recommendation 15 — "New Technologies"**  
Requires countries and financial institutions to identify, assess, and mitigate risks from new technologies including AI voice synthesis. VoiceGuard is a direct, practical response to this open gap.

---

## Project Timeline

| Week | Dates | Phase |
|------|-------|-------|
| Week 1 | 25–31 Aug | Foundation |
| Week 2 | 1–7 Sep | Core Pipeline |
| Week 3 | 8–14 Sep | Calibration |
| Week 4 | 15–23 Sep | Demo Packaging |
| **Submit** | **Tue 22 Sep** | **Day 29** |
