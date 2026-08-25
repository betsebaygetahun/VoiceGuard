/**
 * VoiceGuard — Smoke Test: Resemble AI Voice Auth API
 * Day 3 · 27 August 2026
 *
 * Run with: node smoke_test_voiceauth.js
 * Requires: RESEMBLE_API_KEY in .env file
 *
 * Expected result:
 *   real_voice.wav  → low score  (< 30)   → label: bonafide
 *   synth_voice.wav → high score (> 60)   → label: spoof
 */

const fs   = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const RESEMBLE_API_KEY = process.env.RESEMBLE_API_KEY;
if (!RESEMBLE_API_KEY) {
  console.error('❌  RESEMBLE_API_KEY not found in .env');
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────
const DETECT_ENDPOINT = 'https://detect.resemble.ai/detect';

const TEST_CLIPS = [
  {
    label: 'Real Voice (expected: LOW score, bonafide)',
    file:  path.join(__dirname, '../../../test-clips/real_voice_smoke.wav'),
    expectedLabel: 'bonafide',
  },
  {
    label: 'Synthetic Voice (expected: HIGH score, spoof)',
    file:  path.join(__dirname, '../../../test-clips/synth_voice_smoke.wav'),
    expectedLabel: 'spoof',
  },
];

// ── Score Normalizer (matches pipeline logic) ─────────────
function normalizeAuthScore(rawScore) {
  // rawScore: 0.0 = real/bonafide, 1.0 = synthetic/spoof
  // Returns: 0–100 where 100 = most suspicious
  return Math.round(rawScore * 100);
}

// ── Per-clip test ─────────────────────────────────────────
async function testClip(clip) {
  console.log(`\n🎵  Testing: ${clip.label}`);
  console.log(`   File: ${clip.file}`);

  if (!fs.existsSync(clip.file)) {
    console.warn(`   ⚠️  File not found — skipping. Place a WAV clip there to test.`);
    return null;
  }

  const audioData   = fs.readFileSync(clip.file);
  const FormData    = (await import('node-fetch')).FormData ?? globalThis.FormData;
  const startTime   = Date.now();

  // Build multipart form
  const form = new FormData();
  form.append('file', new Blob([audioData], { type: 'audio/wav' }), 'chunk.wav');

  try {
    const response = await fetch(DETECT_ENDPOINT, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${RESEMBLE_API_KEY}` },
      body:    form,
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const err = await response.text();
      console.error(`   ❌  API error: ${response.status}`, err);
      return null;
    }

    const data         = await response.json();
    const rawScore     = data?.item?.score ?? 0.5;
    const label        = data?.item?.label ?? 'unknown';
    const normalizedScore = normalizeAuthScore(rawScore);
    const passed       = label === clip.expectedLabel;

    console.log(`   📊  Raw score:        ${rawScore.toFixed(4)}`);
    console.log(`   🔢  Normalized (0–100): ${normalizedScore}`);
    console.log(`   🏷️   Label:            ${label}`);
    console.log(`   ⏱️   Latency:          ${latencyMs}ms`);
    console.log(`   ${passed ? '✅  PASS' : '⚠️  UNEXPECTED LABEL'} (expected: ${clip.expectedLabel})`);

    return { rawScore, normalizedScore, label, latencyMs, passed };

  } catch (err) {
    console.error(`   ❌  Network error: ${err.message}`);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────
async function smokeTestVoiceAuth() {
  console.log('🛡️  VoiceGuard — Resemble AI Voice Auth Smoke Test');
  console.log('─'.repeat(55));
  console.log('Goal: Real voice → LOW score | Synthetic → HIGH score');

  const results = [];
  for (const clip of TEST_CLIPS) {
    const result = await testClip(clip);
    if (result) results.push({ ...clip, ...result });
  }

  // Summary
  console.log('\n' + '─'.repeat(55));
  console.log('📋  SMOKE TEST SUMMARY');
  console.log('─'.repeat(55));

  if (results.length === 0) {
    console.log('⚠️  No clips were tested. Add WAV files to /test-clips/ and rerun.');
    console.log('\nExpected files:');
    TEST_CLIPS.forEach(c => console.log('  ', c.file));
    return;
  }

  // Check if real < synthetic (core requirement)
  const realResult  = results.find(r => r.expectedLabel === 'bonafide');
  const synthResult = results.find(r => r.expectedLabel === 'spoof');

  if (realReal && synthResult) {
    const scoreDiff = synthResult.normalizedScore - realResult.normalizedScore;
    console.log(`\nScore spread: +${scoreDiff} pts (synthetic vs real)`);
    if (scoreDiff > 20) {
      console.log('✅  CORE VALIDATION PASSED — scores visibly differ between real and synthetic');
    } else {
      console.log('⚠️  WARNING — score spread < 20 pts. May need threshold adjustment.');
    }
  }

  console.log('\nAll results saved to: smoke_test_voiceauth_response.json');
  fs.writeFileSync(
    path.join(__dirname, 'smoke_test_voiceauth_response.json'),
    JSON.stringify(results, null, 2)
  );
}

smokeTestVoiceAuth();
