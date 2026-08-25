# VoiceGuard Test Matrix Manifest
**Phase:** Week 3 Calibration (Day 15)

This directory (`/test-clips/`) is the staging ground for our rigorous 2x2 testing matrix. To properly calibrate the fusion engine on Day 17, we must pass these 4 specific files through the pipeline.

## The 4 Required Clips

### 1. `real_normal.wav`
* **Voice:** Real Human (You)
* **Language:** Normal conversation
* **Transcript:** "Hey, are we still on for dinner tomorrow? I can bring the dessert."
* **Expected Result:** 🟢 SAFE (Score < 35)

### 2. `real_scam.wav`
* **Voice:** Real Human (You)
* **Language:** Scam script
* **Transcript:** "I'm in trouble. Please don't tell anyone, just send me a wire transfer right now."
* **Expected Result:** 🟡 CAUTION (Score ~50-60) *(Real voice, but extremely risky language)*

### 3. `synth_normal.wav`
* **Voice:** Synthetic / AI Cloned (e.g., generated via ElevenLabs/OpenAI)
* **Language:** Normal conversation
* **Transcript:** "Hello, my name is John from Microsoft. I am calling about your computer warranty."
* **Expected Result:** 🔴 HIGH RISK (Score > 65) *(Even with normal language, the Voice Auth failsafe should trigger a red flag)*

### 4. `synth_scam.wav`
* **Voice:** Synthetic / AI Cloned
* **Language:** Scam script (The Demo)
* **Transcript:** "Grandma, it's an emergency. I'm in jail. Don't tell mom and dad, just send apple gift cards right now."
* **Expected Result:** 🔴 HIGH RISK (Score > 90) *(Maximum penalty across both APIs)*

---
**Instructions for User:**
Please record or generate these 4 audio clips and place them in the `test-clips/` folder with the exact filenames listed above before proceeding to the Day 16 Baseline Metrics run.
