const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Dummy tracking variables to simulate a continuous call
let chunkCounter = 0;

/**
 * POST /api/stream
 * Endpoint to receive rolling audio chunks (3-5 seconds)
 * 
 * In Week 2, this will route the chunk to Deepgram and Resemble AI.
 * For Day 4, it just returns a hardcoded mock response simulating the pipeline.
 */
router.post('/stream', upload.single('chunk'), (req, res) => {
  const startTime = Date.now();
  chunkCounter++;

  // Log incoming chunk size if it exists
  const fileSize = req.file ? req.file.size : 0;
  console.log(`[Stream] Received Chunk #${chunkCounter} | Size: ${fileSize} bytes`);

  // Simulate pipeline processing delay (e.g. 1.5 seconds)
  setTimeout(() => {
    // Hardcoded mock response for the "Family Emergency" scenario (Day 2 Demo design)
    const mockResponse = {
      chunk_id: chunkCounter,
      stt: {
        transcript: chunkCounter === 1 
          ? "Hello? It's me. Don't tell mom and dad." 
          : "I need you to send money right now. Please hurry.",
        confidence: 0.98,
        latency_ms: 320
      },
      voice_auth: {
        score: chunkCounter === 1 ? 45 : 82, // Higher score = more suspicious
        label: chunkCounter === 1 ? "bonafide" : "spoof",
        latency_ms: 280
      },
      language_risk: {
        tags: ["Urgency", "Secrecy", "Payment"],
        score: 85
      },
      fusion: {
        total_risk_score: chunkCounter === 1 ? 55 : 91,
        status: chunkCounter === 1 ? "CAUTION" : "HIGH RISK",
        total_latency_ms: Date.now() - startTime
      }
    };

    console.log(`[Stream] Processed Chunk #${chunkCounter} in ${mockResponse.fusion.total_latency_ms}ms`);
    res.status(200).json(mockResponse);
  }, 1500); // 1.5s simulated processing delay
});

module.exports = router;
