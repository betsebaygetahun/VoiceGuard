const express = require('express');
const router = express.Router();
const multer = require('multer');
const { calculateFusion } = require('../services/fusion');
const { transcribeChunk } = require('../services/stt');
const { detectVoice } = require('../services/voiceauth');

// Configure multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Dummy tracking variables to simulate a continuous call
let chunkCounter = 0;

/**
 * POST /api/stream
 * Endpoint to receive rolling audio chunks (3-5 seconds)
 * 
 * Day 9: Both Deepgram STT and Resemble Voice Auth wired in and running in parallel.
 */
router.post('/stream', upload.single('chunk'), async (req, res) => {
  const startTime = Date.now();
  chunkCounter++;

  const fileSize = req.file ? req.file.size : 0;
  console.log(`[Stream] Received Chunk #${chunkCounter} | Size: ${fileSize} bytes`);

  try {
    let sttResult;
    let authResult;

    // 1. Run STT and Voice Auth APIs in parallel if audio provided
    if (req.file && req.file.buffer) {
      [sttResult, authResult] = await Promise.all([
        transcribeChunk(req.file.buffer),
        detectVoice(req.file.buffer)
      ]);
    } else {
      console.warn('[Stream] No audio file provided. Using empty fallbacks.');
      sttResult = { transcript: "No audio chunk received.", confidence: 0, latency_ms: 0 };
      authResult = { score: 50, label: 'bonafide', latency_ms: 0 };
    }

    // 2. Run real Lexicon and Fusion logic with LIVE transcript & auth score
    const finalPayload = calculateFusion(sttResult.transcript, authResult.score, chunkCounter);
    
    // Override fusion blocks with actual metrics
    finalPayload.stt = sttResult;
    finalPayload.voice_auth = authResult;
    
    // Calculate total pipeline time
    finalPayload.fusion.total_latency_ms = Date.now() - startTime;

    console.log(`[Stream] Processed Chunk #${chunkCounter} | Score: ${finalPayload.fusion.total_risk_score} | Status: ${finalPayload.fusion.status} | Time: ${finalPayload.fusion.total_latency_ms}ms`);
    res.status(200).json(finalPayload);

  } catch (error) {
    console.error('[Stream] Error processing chunk:', error);
    res.status(500).json({ error: 'Internal Server Error processing audio chunk' });
  }
});

module.exports = router;
