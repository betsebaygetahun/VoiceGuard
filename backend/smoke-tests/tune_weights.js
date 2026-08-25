/**
 * VoiceGuard — Day 17 Calibration & Tuning Script
 * 
 * Tests multiple fusion weight configurations to ensure our baseline
 * (0.6 Voice Auth / 0.4 Language Risk) is truly optimal.
 */

const { LEXICON, analyzeLanguageRisk } = require('../services/lexicon');

const testMatrix = [
  {
    name: "Scenario A: Normal Call (Safe)",
    transcript: "Hey, are we still on for dinner tomorrow?",
    voiceAuthScore: 10,
    expectedStatus: "SAFE"
  },
  {
    name: "Scenario B: Borderline Real Voice, High Risk Language (Caution)",
    transcript: "Hey it's me. Don't tell anyone but I need you to wire transfer money right now for bail.",
    voiceAuthScore: 35,
    expectedStatus: "CAUTION"
  },
  {
    name: "Scenario C: Fake Voice, Normal Language (Caution/High Risk)",
    transcript: "Hello, my name is John from Microsoft. I am calling about your computer.",
    voiceAuthScore: 92,
    expectedStatus: "HIGH RISK"
  },
  {
    name: "Scenario D: The Demo Scam (Red/High Risk)",
    transcript: "Grandma, it's an emergency. I'm in jail. Don't tell mom and dad, just send apple gift cards right now.",
    voiceAuthScore: 88,
    expectedStatus: "HIGH RISK"
  }
];

function runConfig(weightAuth, weightLang, configName) {
  console.log(`\n=================================================`);
  console.log(`🧪 Testing Config: ${configName} (Auth: ${weightAuth}, Lang: ${weightLang})`);
  console.log(`=================================================`);

  testMatrix.forEach((test, index) => {
    const languageRisk = analyzeLanguageRisk(test.transcript);
    let totalRiskScore = (test.voiceAuthScore * weightAuth) + (languageRisk.score * weightLang);
    totalRiskScore = Math.round(totalRiskScore);

    let status = "SAFE";
    if (totalRiskScore > 65) status = "HIGH RISK";
    else if (totalRiskScore > 35) status = "CAUTION";

    if (test.voiceAuthScore > 85) {
        status = "HIGH RISK";
        if (totalRiskScore < 66) totalRiskScore = 66; 
    }

    const match = status === test.expectedStatus ? '✅ PASS' : '❌ FAIL';
    console.log(`[${test.name.split(':')[0]}] Score: ${totalRiskScore} -> ${status} | ${match}`);
  });
}

// Config 1: Heavy Language Bias (50/50)
runConfig(0.5, 0.5, "Config 1 - Balanced 50/50");

// Config 2: Extreme Voice Auth Bias (75/25)
runConfig(0.75, 0.25, "Config 2 - Auth Heavy 75/25");

// Baseline: (60/40)
runConfig(0.6, 0.4, "Baseline - 60/40");
