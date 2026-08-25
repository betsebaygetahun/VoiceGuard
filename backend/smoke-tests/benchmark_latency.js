/**
 * VoiceGuard — Day 18: Latency Benchmark Script
 *
 * Simulates 5 rapid sequential requests to measure the end-to-end pipeline timing.
 * Uses a short real WAV buffer to get realistic API latency without needing live mic.
 */

const path = require('path');
const fs = require('fs');

// Tiny valid WAV header (44 bytes) + silence (to simulate a small audio chunk)
function createSilentWavBuffer() {
  const numChannels = 1;
  const sampleRate = 16000;
  const bitsPerSample = 16;
  const numSamples = sampleRate * 1; // 1 second of silence
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // Rest is silence (already zeroed)
  return buffer;
}

async function runBenchmark() {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });

  const { transcribeChunk } = require('../services/stt');
  const { detectVoice } = require('../services/voiceauth');

  const wavBuffer = createSilentWavBuffer();
  const RUNS = 3;
  const results = [];

  console.log('\n🛡️  VoiceGuard — Latency Benchmark (Day 18)');
  console.log('============================================');
  console.log(`Sending ${RUNS} silent WAV chunks through full pipeline (STT + VoiceAuth in parallel)\n`);

  for (let i = 1; i <= RUNS; i++) {
    const start = Date.now();

    const [sttResult, authResult] = await Promise.all([
      transcribeChunk(wavBuffer),
      detectVoice(wavBuffer)
    ]);

    const totalMs = Date.now() - start;
    results.push(totalMs);

    console.log(`Run ${i}: STT=${sttResult.latency_ms}ms | VoiceAuth=${authResult.latency_ms}ms | Total=${totalMs}ms`);
  }

  const median = results.sort((a, b) => a - b)[Math.floor(results.length / 2)];
  const max = Math.max(...results);
  const min = Math.min(...results);

  console.log('\n--------------------------------------------');
  console.log(`📊 Median Latency : ${median}ms`);
  console.log(`📊 Min Latency    : ${min}ms`);
  console.log(`📊 Max Latency    : ${max}ms`);
  console.log(`🎯 Target         : ≤ 6000ms`);
  console.log(`✅ Status         : ${median <= 6000 ? 'PASS' : 'FAIL'}`);
  console.log('--------------------------------------------\n');
}

runBenchmark().catch(console.error);
