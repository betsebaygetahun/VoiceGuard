/**
 * VoiceGuard — STT Service (Deepgram)
 * Day 8
 * 
 * Takes an audio chunk buffer and returns the transcript using Deepgram's REST API.
 */

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const STT_ENDPOINT = 'https://api.deepgram.com/v1/listen';
const MODEL = 'nova-3';

/**
 * Transcribes an audio buffer using Deepgram API
 * 
 * @param {Buffer} audioBuffer 
 * @returns {Object} { transcript, confidence, latency_ms }
 */
async function transcribeChunk(audioBuffer) {
  if (!DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY is missing in environment');
  }

  const startTime = Date.now();

  try {
    const response = await fetch(
      `${STT_ENDPOINT}?model=${MODEL}&punctuate=true&utterances=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav',
        },
        body: audioBuffer,
      }
    );

    const latency_ms = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      console.error('[STT] Deepgram API Error:', response.status, errText);
      return { transcript: "", confidence: 0, latency_ms };
    }

    const data = await response.json();
    const result = data?.results?.channels?.[0]?.alternatives?.[0];

    return {
      transcript: result?.transcript || "",
      confidence: result?.confidence || 0,
      latency_ms
    };

  } catch (error) {
    console.error('[STT] Network Error:', error.message);
    return { transcript: "", confidence: 0, latency_ms: Date.now() - startTime };
  }
}

module.exports = { transcribeChunk };
