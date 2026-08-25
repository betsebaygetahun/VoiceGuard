# VoiceGuard — Score Fusion & Thresholds
**Document:** VG-SCORE-001  
**Date:** 5 September 2026 (Day 12)

This document formalizes the mathematical formula used to fuse our multiple AI inputs into a single risk score and defines the threshold bands that trigger UI state changes.

## 1. The Fusion Formula

The VoiceGuard system relies on two distinct inputs:
1. **Language Risk Score (0-100):** Derived from Deepgram STT text passing through our Lexicon Co-occurrence engine.
2. **Voice Authenticity Score (0-100):** Derived from Resemble AI's probability that the voice is synthetic.

These two scores are fused together using a weighted average. The weights prioritize voice authenticity over language risk, as the primary threat is AI voice cloning.

**Final Score = (Voice Auth * 0.6) + (Language Risk * 0.4)**

*Note: These weights (`WEIGHT_VOICE_AUTH`, `WEIGHT_LANGUAGE_RISK`) can be dynamically tuned via the `.env` file during the Day 17 Calibration phase.*

## 2. Threshold Bands (Green / Yellow / Red)

The Final Score (0-100) dictates the UI state. We use strict threshold bands to minimize false positives while ensuring rapid response to actual threats.

| State | Score Range | Color | Description | Action Required |
|-------|-------------|-------|-------------|-----------------|
| **SAFE** | `0 - 35` | 🟢 Green | Normal conversation. Low synthetic probability and no heavy scam keywords. | None. Continue call. |
| **CAUTION** | `36 - 65` | 🟡 Yellow | Suspicious indicators present. Either mild scam language or borderline voice authenticity. | User should be alert. UI displays warning tags. |
| **HIGH RISK** | `66 - 100` | 🔴 Red | High probability of a scam. Confirmed synthetic voice OR high co-occurrence of urgency/payment language. | UI turns red. Prompt user to hang up and call back on known number. |

## 3. Co-occurrence Multiplier

To aggressively catch the "Family Emergency" scam, the Language Risk engine applies penalties before fusion:
- **2 Categories detected:** 1.5x multiplier to the language score.
- **3 Categories detected:** 2.0x multiplier to the language score.

*This documentation fulfills the Day 12 requirement for documenting the scoring algorithm and thresholds.*
