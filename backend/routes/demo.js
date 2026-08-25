/**
 * VoiceGuard — Demo Mode Route
 * Day 24
 *
 * A pre-scripted endpoint that steps through the "Family Emergency" scam
 * scenario in 3 controlled chunks. Used for guaranteed consistent demo runs.
 *
 * GET /api/demo/reset   — resets the step counter
 * GET /api/demo/next    — returns the next step in the script
 */

const express = require('express');
const router = express.Router();

// The locked "Family Emergency" demo script — 3 chunks
const DEMO_SCRIPT = [
  {
    step: 1,
    label: 'Opening',
    stt: {
      transcript: "Hey... it's me. Is anyone else home right now?",
      confidence: 0.97,
      latency_ms: 312
    },
    voice_auth: {
      score: 55,
      label: 'bonafide',
      latency_ms: 290
    },
    language_risk: {
      tags: ['Secrecy'],
      reasons: ['Detected secrecy request: "is anyone else home"'],
      score: 15
    },
    fusion: {
      total_risk_score: 39,
      status: 'CAUTION',
      total_latency_ms: 602
    }
  },
  {
    step: 2,
    label: 'Escalation',
    stt: {
      transcript: "Grandma, I'm in trouble. I was in an accident — I'm in jail. Please don't tell mom and dad.",
      confidence: 0.96,
      latency_ms: 330
    },
    voice_auth: {
      score: 82,
      label: 'spoof',
      latency_ms: 310
    },
    language_risk: {
      tags: ['Urgency', 'Secrecy'],
      reasons: [
        'Detected urgent language: "in trouble"',
        'Detected urgent language: "jail"',
        'Detected secrecy request: "don\'t tell mom"',
        'Multiple scam indicators detected simultaneously.'
      ],
      score: 68
    },
    fusion: {
      total_risk_score: 76,
      status: 'HIGH RISK',
      total_latency_ms: 640
    }
  },
  {
    step: 3,
    label: 'The Demand',
    stt: {
      transcript: "I need you to send apple gift cards right now. Don't tell anyone — this is an emergency. Hurry!",
      confidence: 0.95,
      latency_ms: 355
    },
    voice_auth: {
      score: 91,
      label: 'spoof',
      latency_ms: 298
    },
    language_risk: {
      tags: ['Urgency', 'Secrecy', 'Payment'],
      reasons: [
        'Detected urgent language: "right now"',
        'Detected urgent language: "emergency"',
        'Detected urgent language: "hurry"',
        'Detected secrecy request: "don\'t tell anyone"',
        'Detected payment demand: "gift cards"',
        'Detected payment demand: "apple gift cards"',
        'High confidence scam pattern (Urgency + Secrecy + Payment) detected.'
      ],
      score: 100
    },
    fusion: {
      total_risk_score: 95,
      status: 'HIGH RISK',
      total_latency_ms: 653
    }
  }
];

let demoStep = 0;

// Reset the demo sequence
router.get('/demo/reset', (req, res) => {
  demoStep = 0;
  console.log('[Demo] Sequence reset to step 0');
  res.status(200).json({ message: 'Demo reset. Ready to start.' });
});

// Advance to next demo step
router.get('/demo/next', (req, res) => {
  if (demoStep >= DEMO_SCRIPT.length) {
    return res.status(200).json({
      done: true,
      message: 'Demo sequence complete. Call /api/demo/reset to replay.'
    });
  }

  const step = DEMO_SCRIPT[demoStep];
  demoStep++;

  console.log(`[Demo] Serving Step ${step.step}: "${step.label}" | Status: ${step.fusion.status}`);
  res.status(200).json({ ...step, chunk_id: step.step, done: false });
});

module.exports = router;
