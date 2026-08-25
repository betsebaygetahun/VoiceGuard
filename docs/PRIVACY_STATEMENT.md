# VoiceGuard — Privacy Statement
**Document:** VG-PRIVACY-001  
**Date:** 13 September 2026 (Day 20)  
**Classification:** Public-facing

## Our Privacy Commitment

VoiceGuard is built on a privacy-first architecture. Your voice and conversation data are among the most sensitive information that exist, and we treat them accordingly.

### What We Do With Your Audio

1. **Captured in volatile memory only.** When you tap "Start Monitoring," your device's microphone begins recording audio in 4-second rolling chunks. These chunks are held exclusively in your device's RAM — they are **never written to any file on disk**.

2. **Transmitted only to essential AI APIs.** Each audio chunk is transmitted over an encrypted HTTPS connection to two third-party AI APIs:
   - **Deepgram** (for Speech-to-Text transcription)
   - **Resemble AI** (for voice authenticity analysis)
   Both providers are subject to their own privacy policies and data retention rules.

3. **Explicitly discarded after analysis.** Immediately after both APIs return their results, VoiceGuard's backend **explicitly nullifies the audio buffer reference** (`req.file.buffer = null`), allowing it to be garbage collected. The audio chunk ceases to exist the moment the analysis is complete.

4. **No long-term storage.** VoiceGuard does not operate a database. No audio clip, transcript, or risk score is stored beyond the duration of a single API request. There is no "history" or "call log."

5. **No audio retention by VoiceGuard servers.** The VoiceGuard backend (`/api/stream`) acts as a pass-through relay only. It receives the audio, dispatches it to Deepgram and Resemble AI, receives the analysis scores, and returns those scores to your device. At no point does VoiceGuard persist any audio.

### The Text Transcript

The Deepgram API returns a text transcript of the audio. This transcript:
- Is displayed on your screen in real-time.
- Is run through our local keyword engine (entirely in-server memory).
- Is **not stored or logged** to any database.
- Is destroyed at the end of the HTTP request lifecycle.

### Summary

| Data Type | Stored on Disk? | Sent to Third Parties? | Retained After Call? |
|-----------|----------------|----------------------|----------------------|
| Audio Buffer | ❌ Never | ✅ Deepgram + Resemble AI | ❌ Discarded immediately |
| Text Transcript | ❌ Never | ✅ Deepgram only | ❌ Destroyed with request |
| Risk Score | ❌ Never | ❌ No | ❌ Destroyed with request |
| User Identity | ❌ Never | ❌ No | ❌ N/A |

*This document fulfills the Day 20 requirement for a written privacy note and constitutes VoiceGuard's official privacy statement for contest submission.*
