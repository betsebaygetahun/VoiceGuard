# VoiceGuard — API Comparison Tables
**Document:** VG-API-001  
**Date:** 27 August 2026  
**Status:** Pre-decision research — see API_DECISION_NOTE.md for final choice

---

## PART A — Speech-to-Text (STT) APIs

### Candidates Evaluated

| Criterion | Deepgram Nova-3 | AssemblyAI Universal-3.5 | OpenAI Whisper / Realtime |
|-----------|----------------|--------------------------|---------------------------|
| **Real-time streaming** | ✅ Native WebSocket | ✅ Native WebSocket | ❌ Batch-only (Whisper-1) / Realtime API is separate |
| **Latency** | ~280ms (final turn) ⚡ | Configurable (tune speed vs accuracy) | Batch: N/A · Realtime: ~500ms+ |
| **Accuracy** | Excellent on conversational speech | Excellent + AI features | Gold standard for batch; streaming less proven |
| **Streaming pricing** | ~$0.0077/min | ~$0.45/hr ($0.0075/min) | Varies; Realtime API priced separately |
| **Free credits** | **$200 on signup** (no card needed) | Free tier available | $5 credit on signup |
| **Chunk/file upload** | ✅ Yes | ✅ Yes | ✅ Yes (batch) |
| **Timestamps per word** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Noise handling** | Excellent | Excellent | Excellent |
| **Multi-language** | Good | Good | Best-in-class |
| **SDK / docs quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Signup friction** | Low — instant API key | Low — instant API key | Medium — OpenAI account |
| **Best for VoiceGuard?** | ✅ **TOP CHOICE** | ✅ Strong backup | ❌ Not ideal for streaming |

### Why Deepgram wins for VoiceGuard
- ~280ms latency is the lowest available — keeps our total pipeline under the 6-sec target
- Native WebSocket streaming means chunks flow continuously, not in one-shot bursts
- $200 free credit is enough for the entire 30-day build and demo without spending anything
- Billing by exact second (no rounding) is fair for our 3–5 sec chunk model
- Simple REST fallback available if WebSocket fails (graceful degradation already handled)

---

## PART B — Voice Authenticity / Deepfake Detection APIs

### Candidates Evaluated

| Criterion | Resemble AI Detect | Reality Defender | Pindrop |
|-----------|-------------------|-----------------|---------|
| **API type** | REST + async | REST | Enterprise SDK |
| **Real-time capable** | ✅ Sub-300ms (DETECT-3B model) | ✅ Yes | ✅ Yes (live call) |
| **Input type** | Audio file / chunk upload | Audio/video/image | Live call stream |
| **Detection model** | DETECT-3B (multimodal) | Multi-model ensemble | Acoustic fingerprinting |
| **Accuracy** | High — ranked on Speech Deepfake Arena | High — enterprise grade | Very high — contact center tuned |
| **Pricing model** | **$0.001/sec** (pay-as-you-go Flex) | Quote-based | Enterprise quote only |
| **Free to start** | ✅ No card needed, credits never expire | ❌ Demo request required | ❌ No public access |
| **Developer access** | ✅ Instant signup, full API day 1 | ⚠️ Contact required | ❌ Sales-gated |
| **Docs / SDK** | ✅ Public REST docs | ⚠️ Limited public docs | ❌ Private |
| **Score output** | 0–1 float (real vs synthetic probability) | Risk score + label | Proprietary score |
| **Chunk/segment input** | ✅ 3–5 sec clips supported | ✅ Yes | ✅ Yes |
| **Contest budget fit** | ✅ **Ideal — pay per use** | ❌ No public pricing | ❌ Inaccessible |
| **Best for VoiceGuard?** | ✅ **TOP CHOICE** | 🔄 Backup if access granted | ❌ Not viable |

### Why Resemble AI Detect wins for VoiceGuard
- $0.001/sec = **$0.003–0.005 per chunk** at 3–5 sec windows — near-zero cost for a 3-min demo
- Flex plan: no monthly commitment, credits never expire — perfect for a contest build
- Full public REST API with docs available day 1 — no waiting for approval
- DETECT-3B returns a clean 0–1 probability score — easy to normalize to our 0–100 scale
- Sub-300ms detection latency — keeps our pipeline inside the 6-sec end-to-end target

---

## Cost Estimate for Full Build + Demo

| API | Usage estimate | Cost |
|-----|---------------|------|
| Deepgram Nova-3 | 30 days × ~20 min/day testing | ~$4.62 |
| Resemble AI Detect | 30 days × ~200 chunks/day × 4 sec avg | ~$0.24 |
| **Total** | | **~$4.86** (well within $200 Deepgram free credits) |

> Resemble cost is essentially zero at contest scale. Deepgram's $200 credit covers 430+ hours of streaming — more than enough.
