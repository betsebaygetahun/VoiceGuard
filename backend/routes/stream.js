const express = require('express');
const router = express.Router();
const multer = require('multer');
const { calculateFusion } = require('../services/fusion');
const { transcribeChunk } = require('../services/stt');

// Configure multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Dummy tracking variables to simulate a continuous call
let chunkCounter = 0;

/**
 * POST /api/stream
 * Endpoint to receive rolling audio chunks (3-5 seconds)
 * 
 * Day 8: Deepgram STT wired in. Voice Auth is still mocked.
 */
router.post('/stream', upload.single('chunk'), async (req, res) => {
  const startTime = Date.now();
  chunkCounter++;

  const fileSize = req.file ? req.file.size : 0;
  console.log(`[Stream] Received Chunk #${chunkCounter} | Size: ${fileSize} bytes`);

  try {
    // 1. Run real Deepgram STT if audio provided, else fallback to mock
    let sttResult;
    if (req.file && req.file.buffer) {
      sttResult = await transcribeChunk(req.file.buffer);
    } else {
      console.warn('[Stream] No audio file provided. Using empty STT fallback.');
      sttResult = { transcript: "No audio chunk received.", confidence: 0, latency_ms: 0 };
    }

    // 2. Mock Voice Auth Score (0-100) - To be wired on Day 9
    const mockVoiceAuthScore = chunkCounter % 2 !== 0 ? 45 : 88;

    // 3. Run real Lexicon and Fusion logic with LIVE transcript
    const finalPayload = calculateFusion(sttResult.transcript, mockVoiceAuthScore, chunkCounter);
    
    // Override fusion STT block with actual STT metrics
    finalPayload.stt = sttResult;
    
    // Calculate total time
    finalPayload.fusion.total_latency_ms = Date.now() - startTime;

    console.log(`[Stream] Processed Chunk #${chunkCounter} | Score: ${finalPayload.fusion.total_risk_score} | Status: ${finalPayload.fusion.status}`);
    res.status(200).json(finalPayload);

  } catch (error) {
    console.error('[Stream] Error processing chunk:', error);
    res.status(500).json({ error: 'Internal Server Error processing audio chunk' });
  }
});

module.exports = router;
