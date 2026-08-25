# VoiceGuard — Locked Demo Scenario
**Document:** VG-SCENARIO-001  
**Date:** 26 August 2026  
**Status:** 🔒 LOCKED — do not change after this date

---

## The Scenario: "Family Emergency" Scam Call

### Who is calling
A scammer using an **AI-cloned voice** of the victim's grandchild (or close relative).

### What they claim
- They are in an emergency situation: arrested, in a car accident, hospitalized, or stranded abroad
- They need help urgently and secretly
- They instruct the victim **not to call other family members** ("don't tell Mom/Dad yet")

### What they ask for
- An **immediate payment** in a hard-to-trace form:
  - Gift cards (most common) — "Buy a $500 Google Play card and read me the code"
  - Cash via wire transfer
  - Cryptocurrency

### Call structure (for demo script)
```
[Phase 1 — Hook, 0–30 sec]
"Grandma/Grandpa? It's me, [name]. I'm in trouble. 
 I need you to listen carefully..."

[Phase 2 — Urgency + Secrecy, 30–90 sec]
"I was in a car accident and the police are here. 
 Please don't call Mom yet, I don't want her to worry. 
 I need this sorted out RIGHT NOW..."

[Phase 3 — Payment Request, 90–150 sec]  
"I need you to go to CVS and buy a $500 gift card. 
 Don't tell anyone. Just read me the numbers on the back. 
 Can you do that for me? Immediately?"
```

---

## Expected Risk Signal Triggers

| Signal Type | Trigger Phrases | Category |
|-------------|----------------|----------|
| Urgency | "right now", "immediately", "I need this sorted" | Urgency |
| Secrecy | "don't tell anyone", "don't call Mom", "don't worry her" | Secrecy |
| Payment | "gift card", "CVS", "read me the numbers", "wire transfer" | Payment Request |
| Voice | AI-cloned voice → authenticity score HIGH | Voice Auth |

---

## Expected System Output

| Time Point | Expected Band | Expected Score Range |
|-----------|---------------|---------------------|
| 0–30 sec (hook only) | 🟢 GREEN | 10–30 |
| 30–90 sec (urgency + secrecy) | 🟡 YELLOW | 40–70 |
| 90–150 sec (payment request) | 🔴 RED | 75–100 |

---

## What Triggers the Verify Prompt
On RED band, the UI surfaces:
1. **"Call [Name] Back on Their Known Number"** — interrupts the scam if voice is cloned
2. **"Ask for the Family Code Word"** — pre-agreed secret known only to real family

---

## This scenario is FINAL
> Per the plan: this scenario is locked as of Day 2. Week 4 is for polishing this scenario, not reconsidering it.
