# VoiceGuard — Success Metrics (Testable Terms)
**Document:** VG-METRICS-001  
**Date:** 26 August 2026  
**Status:** Draft — to be updated with real numbers after Week 3 calibration

---

## Primary Metrics

### 1. Detection Recall (Scam Detection Rate)
- **Definition:** % of scam test cases correctly flagged as HIGH RISK (RED band)
- **Target:** ≥ 75%
- **How measured:** Run the 2×2 test matrix (Days 15–17); count RED results on scam clips
- **Fail condition:** < 75% means the system misses too many real scams

### 2. False-Positive Rate
- **Definition:** % of genuine (non-scam) calls incorrectly flagged as HIGH RISK (RED band)
- **Target:** ≤ 15%
- **How measured:** Run normal conversation clips through the pipeline; count RED results
- **Fail condition:** > 15% causes alarm fatigue — users stop trusting the tool

### 3. End-to-End Latency
- **Definition:** Time from start of audio chunk capture to risk meter update on screen
- **Target:** ≤ 6 seconds (median per chunk)
- **How measured:** Timestamps logged at each pipeline stage; measured Days 16–18
- **Fail condition:** > 10 seconds makes the meter feel disconnected from the call

---

## Secondary Metrics

### 4. Score Consistency
- **Definition:** Same audio clip run twice should return a score within ±10 points
- **Target:** Variance ≤ 10 points on repeated runs
- **How measured:** Run the same clip 3 times, compare scores

### 5. Band Stability
- **Definition:** Risk band (color) should not flicker between states on consecutive chunks of steady audio
- **Target:** Band only changes when score crosses threshold by > 5 points
- **How measured:** Visual + log inspection during demo rehearsal

### 6. Reason Tag Accuracy
- **Definition:** Reason tags shown to user should accurately reflect what triggered the risk flag
- **Target:** 100% of displayed tags correspond to actual matched phrases
- **How measured:** Manual review of tags vs. transcript during testing

---

## Test Matrix (Used for Metric Measurement)

| Clip | Voice Type | Script Type | Expected Band |
|------|-----------|-------------|---------------|
| A | Real | Normal conversation | 🟢 GREEN |
| B | Real | Scam script | 🔴 RED |
| C | Synthetic (AI) | Normal conversation | 🟡 YELLOW / 🔴 RED |
| D | Synthetic (AI) | Scam script | 🔴 RED (highest score) |

---

## Baseline vs. Final (To be filled after Week 3)

| Metric | Target | Baseline (Day 16) | Final (Day 21) |
|--------|--------|-------------------|----------------|
| Detection Recall | ≥ 75% | TBD | TBD |
| False-Positive Rate | ≤ 15% | TBD | TBD |
| Median Latency | ≤ 6 sec | TBD | TBD |
| Score Consistency | ≤ ±10 pts | TBD | TBD |
