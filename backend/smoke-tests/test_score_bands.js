/**
 * VoiceGuard — Score Fusion Sanity Check (Day 12)
 * 
 * Runs a matrix of test scenarios through the fusion engine to verify 
 * that the mathematical weighting and threshold bands work as expected.
 */

const { calculateFusion } = require('../services/fusion');

const testMatrix = [
  {
    name: "Scenario A: Normal Call (Safe)",
    transcript: "Hey, are we still on for dinner tomorrow?",
    voiceAuthScore: 10, // Highly likely real human
    expectedStatus: "SAFE"
  },
  {
    name: "Scenario B: Borderline Real Voice, High Risk Language (Caution)",
    transcript: "Hey it's me. Don't tell anyone but I need you to wire transfer money right now for bail.",
    voiceAuthScore: 35, // Probably real, but slightly degraded audio
    expectedStatus: "CAUTION"
  },
  {
    name: "Scenario C: Fake Voice, Normal Language (Caution/High Risk)",
    transcript: "Hello, my name is John from Microsoft. I am calling about your computer.",
    voiceAuthScore: 92, // Highly synthetic
    expectedStatus: "HIGH RISK" // 92 * 0.6 = 55.2 (Yellow) -> Actually expected CAUTION if language score is 0. Let's see!
  },
  {
    name: "Scenario D: The Demo Scam (Red/High Risk)",
    transcript: "Grandma, it's an emergency. I'm in jail. Don't tell mom and dad, just send apple gift cards right now.",
    voiceAuthScore: 88, // Synthetic
    expectedStatus: "HIGH RISK"
  }
];

console.log("🛡️ VoiceGuard — Score Fusion Matrix Sanity Check");
console.log("=================================================");

testMatrix.forEach((test, index) => {
  // Pass chunkId = index + 1
  const result = calculateFusion(test.transcript, test.voiceAuthScore, index + 1);
  
  console.log(`\n▶ ${test.name}`);
  console.log(`  Input STT: "${test.transcript}"`);
  console.log(`  Input Voice Auth: ${test.voiceAuthScore}`);
  console.log(`  --> Math: (Auth ${test.voiceAuthScore} * 0.6) + (Lang ${result.language_risk.score} * 0.4)`);
  console.log(`  --> Result Score: ${result.fusion.total_risk_score} / 100`);
  
  const statusMatch = result.fusion.status === test.expectedStatus ? '✅' : '❌';
  console.log(`  --> Result Status: ${result.fusion.status} ${statusMatch} (Expected: ${test.expectedStatus})`);
  
  if (result.language_risk.reasons && result.language_risk.reasons.length > 0) {
    console.log(`  --> Reasons: ${result.language_risk.reasons.join(' | ')}`);
  }
});
console.log("\n=================================================");
