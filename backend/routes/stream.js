const express = require('express');
const router = express.Router();
const multer = require('multer');
const { calculateFusion } = require('../services/fusion');

// Configure multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Dummy tracking variables to simulate a continuous call
let chunkCounter = 0;

/**
 * POST /api/stream
 * Endpoint to receive rolling audio chunks (3-5 seconds)
 * 
 * In Week 2, this will route the chunk to Deepgram and Resemble AI.
 * For Day 6, it uses hardcoded transcripts but runs them through the real Fusion and Lexicon engines.
 */
router.post('/stream', upload.single('chunk'), (req, res) => {
  const startTime = Date.now();
  chunkCounter++;

  // Log incoming chunk size if it exists
  const fileSize = req.file ? req.file.size : 0;
  console.log(`[Stream] Received Chunk #${chunkCounter} | Size: ${fileSize} bytes`);

  // Simulate pipeline processing delay
  setTimeout(() => {
    // 1. Mock STT output
    const mockTranscript = chunkCounter % 2 !== 0 
      ? "Hello? It's me. Don't tell mom and dad." 
      : "I need you to send money right now via gift cards. Please hurry.";
      
    // 2. Mock Voice Auth Score (0-100)
    const mockVoiceAuthScore = chunkCounter % 2 !== 0 ? 45 : 88;

    // 3. Run real Lexicon and Fusion logic
    const finalPayload = calculateFusion(mockTranscript, mockVoiceAuthScore, chunkCounter);
    
    // Calculate total time
    finalPayload.fusion.total_latency_ms = Date.now() - startTime;

    console.log(`[Stream] Processed Chunk #${chunkCounter} | Score: ${finalPayload.fusion.total_risk_score} | Status: ${finalPayload.fusion.status}`);
    res.status(200).json(finalPayload);
  }, 1000); // 1.0s simulated delay
});

module.exports = router;
