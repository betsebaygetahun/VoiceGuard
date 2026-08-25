/**
 * VoiceGuard — Language Risk Lexicon
 * Day 6 · v0.1
 * 
 * Contains keyword/phrase lists for detecting common scam indicators.
 */

const LEXICON = {
    urgency: [
      "right now",
      "immediately",
      "hurry",
      "emergency",
      "in trouble",
      "asap",
      "hospital",
      "police",
      "jail",
      "arrested",
      "quickly"
    ],
    secrecy: [
      "don't tell anyone",
      "keep this between us",
      "don't tell mom",
      "don't tell dad",
      "secret",
      "don't let anyone know",
      "promise not to tell",
      "our little secret",
      "they can't know",
      "is anyone else home",
      "is anyone else there",
      "are you alone",
      "who else is home"
    ],
    payment: [
      "send money",
      "wire transfer",
      "gift cards",
      "gift card",
      "apple cards",
      "target cards",
      "crypto",
      "bitcoin",
      "cash app",
      "zelle",
      "venmo",
      "western union",
      "bail money"
    ]
  };
  
  /**
   * Analyzes a transcript against the lexicon.
   * Returns triggered tags and a calculated base language risk score (0-100).
   */
  function analyzeLanguageRisk(transcript) {
    const text = transcript.toLowerCase();
    const tags = new Set();
    const reasons = new Set();
    let score = 0;
  
    // Weight per hit
    const weightPerHit = 15;
  
    for (const phrase of LEXICON.urgency) {
      if (text.includes(phrase)) {
        tags.add("Urgency");
        reasons.add(`Detected urgent language: "${phrase}"`);
        score += weightPerHit;
      }
    }
  
    for (const phrase of LEXICON.secrecy) {
      if (text.includes(phrase)) {
        tags.add("Secrecy");
        reasons.add(`Detected secrecy request: "${phrase}"`);
        score += weightPerHit;
      }
    }
  
    for (const phrase of LEXICON.payment) {
      if (text.includes(phrase)) {
        tags.add("Payment");
        reasons.add(`Detected payment demand: "${phrase}"`);
        score += weightPerHit;
      }
    }

    // Co-occurrence logic: Scams rarely just use one category.
    // If multiple categories are hit, apply a risk multiplier.
    if (tags.size === 2) {
      score *= 1.5; // 50% penalty for double category
      reasons.add("Multiple scam indicators detected simultaneously.");
    } else if (tags.size >= 3) {
      score *= 2.0; // 100% penalty for full trifecta
      reasons.add("High confidence scam pattern (Urgency + Secrecy + Payment) detected.");
    }
  
    // Cap score at 100
    if (score > 100) score = 100;
  
    return {
      tags: Array.from(tags),
      reasons: Array.from(reasons),
      score: Math.round(score)
    };
  }
  
  module.exports = {
    LEXICON,
    analyzeLanguageRisk
  };
