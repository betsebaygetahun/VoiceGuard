/**
 * VoiceGuard — Score Fusion Engine
 * Day 6 · v0.1
 * 
 * Fuses inputs from STT (Language Risk) and Voice Authenticity to generate final score.
 */

const { analyzeLanguageRisk } = require('./lexicon');

/**
 * calculateFusion
 * 
 * @param {string} transcript - Text from STT API
 * @param {number} voiceAuthScore - Score from 0 (real) to 100 (synthetic) from Resemble AI
 * @returns {object} Full fusion payload for the frontend
 */
function calculateFusion(transcript, voiceAuthScore, chunkId) {
  // 1. Calculate Language Risk
  const languageRisk = analyzeLanguageRisk(transcript);
  
  // 2. Fusion Formula (Weights from .env or fallback)
  // Risk = STT * 0.4 + VoiceAuth * 0.6
  const weightVoiceAuth = parseFloat(process.env.WEIGHT_VOICE_AUTH) || 0.6;
  const weightLangRisk = parseFloat(process.env.WEIGHT_LANGUAGE_RISK) || 0.4;

  let totalRiskScore = (voiceAuthScore * weightVoiceAuth) + (languageRisk.score * weightLangRisk);
  totalRiskScore = Math.round(totalRiskScore);

  // 3. Thresholding
  const thresholdGreen = parseInt(process.env.THRESHOLD_GREEN_MAX) || 35;
  const thresholdYellow = parseInt(process.env.THRESHOLD_YELLOW_MAX) || 65;

  let status = "SAFE";
  if (totalRiskScore > thresholdYellow) {
    status = "HIGH RISK";
  } else if (totalRiskScore > thresholdGreen) {
    status = "CAUTION";
  }

  // Failsafe Override: If Resemble AI is highly confident the voice is fake,
  // override the formula and flag HIGH RISK immediately, even if language is normal.
  if (voiceAuthScore > 85) {
    status = "HIGH RISK";
    if (totalRiskScore < 66) totalRiskScore = 66; // Bump score visually into the red
  }

  // 4. Return formatted response
  return {
    chunk_id: chunkId,
    stt: {
      transcript: transcript,
      confidence: 0.95, // mock for now
      latency_ms: 250   // mock for now
    },
    voice_auth: {
      score: voiceAuthScore,
      label: voiceAuthScore > 50 ? "spoof" : "bonafide",
      latency_ms: 300   // mock for now
    },
    language_risk: languageRisk,
    fusion: {
      total_risk_score: totalRiskScore,
      status: status,
      total_latency_ms: 550 // mock STT + Auth + processing
    }
  };
}

module.exports = {
  calculateFusion
};
