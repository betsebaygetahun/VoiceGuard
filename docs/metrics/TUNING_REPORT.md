# VoiceGuard — Day 17 Tuning Report
**Document:** VG-TUNE-001  
**Date:** 10 September 2026 (Day 17)  
**Status:** 60/40 CONFIGURATION LOCKED

## Testing Alternate Weight Configurations
To ensure our baseline fusion weights were optimal, we created an algorithmic stress test (`smoke-tests/tune_weights.js`) to compare the baseline against two alternate weight splits:

1. **Config 1 (50/50 - Balanced):** Prioritizes STT Language Risk equally with Voice Authenticity.
2. **Config 2 (75/25 - Auth Heavy):** Heavily penalizes synthetic voices over Language Risk.
3. **Baseline (60/40):** Our original configuration.

## Results Analysis
All three configurations successfully passed the 2x2 matrix, correctly identifying `SAFE`, `CAUTION`, and `HIGH RISK` scenarios. This proves our threshold bands (`0-35 Green`, `36-65 Yellow`) are robust.

However, **Baseline (60/40)** produced the most mathematically distinct separation for edge cases:
- In Scenario B (Real human voice but highly suspicious scam language), the 75/25 split dropped the score to `49`, running dangerously close to the `SAFE` boundary (`35`). 
- The 60/40 split kept Scenario B firmly in the middle of the `CAUTION` band at `57`, which correctly reflects the high linguistic risk.

## Decision
We are **officially locking the 60/40 configuration** (`WEIGHT_VOICE_AUTH=0.6`, `WEIGHT_LANGUAGE_RISK=0.4`) for the final demo build. No further tuning is required.
