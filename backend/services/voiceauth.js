/**
 * VoiceGuard — Voice Authenticity Service (Resemble AI)
 * Day 9
 * 
 * Takes an audio chunk buffer and returns the real/synthetic probability score
 * using Resemble AI's DETECT-3B API.
 */

const RESEMBLE_API_KEY = process.env.RESEMBLE_API_KEY;
const DETECT_ENDPOINT = 'https://detect.resemble.ai/detect';

/**
 * Analyzes an audio buffer for synthetic voice probability
 * 
 * @param {Buffer} audioBuffer 
 * @returns {Object} { score: 0-100 (100 = most suspicious), label: 'bonafide' | 'spoof', latency_ms }
 */
async function detectVoice(audioBuffer) {
  if (!RESEMBLE_API_KEY) {
    throw new Error('RESEMBLE_API_KEY is missing in environment');
  }

  const startTime = Date.now();

  try {
    // Dynamic import for node-fetch FormData if needed, but modern Node has FormData globally
    const FormDataClass = globalThis.FormData || (await import('node-fetch')).FormData;
    const form = new FormDataClass();
    
    // Convert Buffer to Blob for FormData
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    form.append('file', audioBlob, 'chunk.wav');

    const response = await fetch(DETECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEMBLE_API_KEY}`
      },
      body: form,
    });

    const latency_ms = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      console.error('[VoiceAuth] Resemble API Error:', response.status, errText);
      // Fallback to neutral score (50) on API error
      return { score: 50, label: 'unknown', latency_ms };
    }

    const data = await response.json();
    
    // Raw score: 0.0 = real/bonafide, 1.0 = synthetic/spoof
    const rawScore = data?.item?.score ?? 0.5;
    const label = data?.item?.label ?? 'unknown';
    
    // Normalize to 0-100 scale where 100 is highly suspicious
    const normalizedScore = Math.round(rawScore * 100);

    return {
      score: normalizedScore,
      label,
      latency_ms
    };

  } catch (error) {
    console.error('[VoiceAuth] Network Error:', error.message);
    // Fallback to neutral score (50) on network error
    return { score: 50, label: 'error', latency_ms: Date.now() - startTime };
  }
}

module.exports = { detectVoice };
