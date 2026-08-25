/**
 * VoiceGuard — Smoke Test: Deepgram STT API
 * Day 3 · 27 August 2026
 *
 * Run with: node smoke_test_stt.js
 * Requires: DEEPGRAM_API_KEY in environment or .env file
 *
 * Expected result: prints transcript of the test audio clip
 */

const fs   = require('fs');
const path = require('path');

// ── Load env ──────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  console.error('❌  DEEPGRAM_API_KEY not found in .env');
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────
const STT_ENDPOINT = 'https://api.deepgram.com/v1/listen';
const MODEL        = 'nova-3';
const TEST_AUDIO   = path.join(__dirname, '../../../test-clips/smoke_test.wav');

// ── Main ──────────────────────────────────────────────────
async function smokeTestSTT() {
  console.log('🎙️  VoiceGuard — Deepgram STT Smoke Test');
  console.log('─'.repeat(50));

  // Check test audio exists
  if (!fs.existsSync(TEST_AUDIO)) {
    console.warn('⚠️  No test clip found at:', TEST_AUDIO);
    console.warn('   Recording a short clip and saving it there, or using URL mode below.');
    await smokeTestSTTUrl();
    return;
  }

  const audioData   = fs.readFileSync(TEST_AUDIO);
  const startTime   = Date.now();

  console.log(`📤  Sending chunk to Deepgram (model: ${MODEL})...`);

  try {
    const response = await fetch(
      `${STT_ENDPOINT}?model=${MODEL}&punctuate=true&utterances=true&words=true`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type':  'audio/wav',
        },
        body: audioData,
      }
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const err = await response.text();
      console.error('❌  API error:', response.status, err);
      return;
    }

    const data       = await response.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0];

    if (!transcript) {
      console.error('❌  Unexpected response shape:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('');
    console.log('✅  SMOKE TEST PASSED');
    console.log('─'.repeat(50));
    console.log(`📝  Transcript:   "${transcript.transcript}"`);
    console.log(`📊  Confidence:   ${(transcript.confidence * 100).toFixed(1)}%`);
    console.log(`⏱️   Latency:      ${latencyMs}ms`);
    console.log(`🔤  Word count:   ${transcript.words?.length ?? 0}`);
    console.log('');
    console.log('📦  Raw response saved to: smoke_test_stt_response.json');

    fs.writeFileSync(
      path.join(__dirname, 'smoke_test_stt_response.json'),
      JSON.stringify(data, null, 2)
    );

  } catch (err) {
    console.error('❌  Network error:', err.message);
  }
}

// URL-based test (no local file needed)
async function smokeTestSTTUrl() {
  // Use a public sample audio URL for testing
  const TEST_URL = 'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav';

  console.log(`📤  Using public URL: ${TEST_URL}`);
  const startTime = Date.now();

  try {
    const response = await fetch(
      `${STT_ENDPOINT}?model=${MODEL}&punctuate=true&words=true`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ url: TEST_URL }),
      }
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const err = await response.text();
      console.error('❌  API error:', response.status, err);
      return;
    }

    const data       = await response.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0];

    console.log('');
    console.log('✅  SMOKE TEST PASSED (URL mode)');
    console.log('─'.repeat(50));
    console.log(`📝  Transcript:   "${transcript?.transcript?.slice(0, 100)}..."`);
    console.log(`📊  Confidence:   ${((transcript?.confidence ?? 0) * 100).toFixed(1)}%`);
    console.log(`⏱️   Latency:      ${latencyMs}ms`);

  } catch (err) {
    console.error('❌  Network error:', err.message);
  }
}

smokeTestSTT();
