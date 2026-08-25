/**
 * VoiceGuard — Day 19: Graceful Degradation Tests
 *
 * Deliberately simulates 2 failure scenarios to verify that the pipeline
 * never crashes and always returns a safe fallback response.
 *
 * Test 1: STT API unavailable (bad key → non-200 response)
 * Test 2: VoiceAuth API unavailable (network timeout)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL — ${label}`);
    failed++;
  }
}

async function testSTTFallback() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: STT API Fallback (simulated bad API key)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Temporarily override the key
  const originalKey = process.env.DEEPGRAM_API_KEY;
  process.env.DEEPGRAM_API_KEY = 'INVALID_KEY_FOR_TEST';

  // Force re-require with patched env
  delete require.cache[require.resolve('../services/stt')];
  const { transcribeChunk } = require('../services/stt');

  const silentBuffer = Buffer.alloc(100); // Tiny dummy buffer
  const result = await transcribeChunk(silentBuffer);

  console.log(`  Result: transcript="${result.transcript}", confidence=${result.confidence}`);
  assert(typeof result === 'object', 'Returns an object (does not throw)');
  assert(result.transcript === '', 'Transcript is empty string on API error');
  assert(result.confidence === 0, 'Confidence is 0 on API error');
  assert(result.latency_ms >= 0, 'Latency is tracked even on failure');

  // Restore key
  process.env.DEEPGRAM_API_KEY = originalKey;
  delete require.cache[require.resolve('../services/stt')];
}

async function testVoiceAuthFallback() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: Voice Auth API Fallback (simulated bad API key)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const originalKey = process.env.RESEMBLE_API_KEY;
  process.env.RESEMBLE_API_KEY = 'INVALID_KEY_FOR_TEST';

  delete require.cache[require.resolve('../services/voiceauth')];
  const { detectVoice } = require('../services/voiceauth');

  const silentBuffer = Buffer.alloc(100);
  const result = await detectVoice(silentBuffer);

  console.log(`  Result: score=${result.score}, label="${result.label}"`);
  assert(typeof result === 'object', 'Returns an object (does not throw)');
  assert(result.score === 50, 'Score is neutral 50 on API error (not 0 or 100)');
  assert(typeof result.label === 'string', 'Label is a string on API error');
  assert(result.latency_ms >= 0, 'Latency is tracked even on failure');

  process.env.RESEMBLE_API_KEY = originalKey;
  delete require.cache[require.resolve('../services/voiceauth')];
}

async function run() {
  console.log('\n🛡️  VoiceGuard — Day 19: Graceful Degradation Tests');
  console.log('====================================================');

  await testSTTFallback();
  await testVoiceAuthFallback();

  console.log('\n====================================================');
  console.log(`📋 Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('✅ All graceful degradation tests PASSED!');
  } else {
    console.log('❌ Some tests FAILED — check fallback handlers.');
  }
  console.log('====================================================\n');
}

run().catch(console.error);
