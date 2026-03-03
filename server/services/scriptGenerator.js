/**
 * Gemini AI Script Generator Service
 * Generates unique video scripts using Google Gemini API with multi-key rotation.
 * Retries aggressively with exponential backoff — no template fallback.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Retry config
const MAX_ROUNDS = 3;           // Full cycles through all keys
const BASE_DELAY_MS = 2000;     // Starting delay between rounds
const PER_KEY_DELAY_MS = 1000;  // Delay after a rate-limit hit on a single key

class GeminiScriptWriter {
  constructor(apiKeys = []) {
    this.apiKeys = apiKeys.filter((k) => k && k.trim());
    this.currentKeyIndex = 0;
  }

  _getNextKey() {
    if (this.apiKeys.length === 0) return null;
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  async generate(title, description, niche, hashtags) {
    if (this.apiKeys.length === 0) {
      throw new Error("No Gemini API keys provided. Please add at least one key.");
    }

    const prompt = `You are a viral YouTube Shorts scriptwriter. Write a highly engaging, 
60-second YouTube Short script about the following:

Title: ${title}
Niche: ${niche}
Description: ${description}
Hashtags: ${hashtags}

RULES:
- Start with a powerful 3-second HOOK that stops the scroll (question, bold claim, or shocking stat)
- Follow with 3 rapid-fire points (each 10-15 seconds)  
- End with a strong call-to-action outro (5 seconds)
- Use conversational, energetic tone — like talking to a friend
- Vary sentence length: short punchy lines mixed with flowing ones
- Include natural pauses (indicated by "...")
- Total script should be speakable in ~50-60 seconds
- Do NOT use emojis or stage directions
- Do NOT include timestamps

OUTPUT FORMAT (use these exact labels):
HOOK: [your hook line]
POINT1: [first key point]
POINT2: [second key point]  
POINT3: [third key point]
OUTRO: [call to action]`;

    const errors = [];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      console.log(`Gemini attempt round ${round + 1}/${MAX_ROUNDS}...`);

      for (let i = 0; i < this.apiKeys.length; i++) {
        const key = this._getNextKey();
        const keyLabel = `Key #${((this.currentKeyIndex - 1 + this.apiKeys.length) % this.apiKeys.length) + 1}`;
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent(prompt);
          const text = result.response.text();

          if (text && text.trim().length > 20) {
            console.log(`Gemini succeeded with ${keyLabel} on round ${round + 1}`);
            return this._parseResponse(text, title, hashtags);
          }
          console.log(`${keyLabel}: empty/short response, trying next...`);
        } catch (err) {
          const errMsg = err.message?.toLowerCase() || "";
          console.log(`${keyLabel} failed: ${err.message}`);
          errors.push(`${keyLabel} round ${round + 1}: ${err.message}`);

          if (
            errMsg.includes("429") ||
            errMsg.includes("quota") ||
            errMsg.includes("rate") ||
            errMsg.includes("resource_exhausted")
          ) {
            await new Promise((r) => setTimeout(r, PER_KEY_DELAY_MS));
          }
        }
      }

      // Wait with exponential backoff before next round
      if (round < MAX_ROUNDS - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, round);
        console.log(`All keys failed round ${round + 1}. Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw new Error(
      `Gemini script generation failed after ${MAX_ROUNDS} rounds across ${this.apiKeys.length} key(s). ` +
      `Last errors: ${errors.slice(-3).join(" | ")}`
    );
  }

  _parseResponse(text, title, hashtags) {
    const lines = text.trim().split("\n");
    let hook = "";
    const points = [];
    let outro = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const upper = trimmed.toUpperCase();

      if (upper.startsWith("HOOK:")) {
        hook = trimmed.split(":").slice(1).join(":").trim();
      } else if (upper.startsWith("POINT1:") || upper.startsWith("POINT 1:")) {
        points.push(trimmed.split(":").slice(1).join(":").trim());
      } else if (upper.startsWith("POINT2:") || upper.startsWith("POINT 2:")) {
        points.push(trimmed.split(":").slice(1).join(":").trim());
      } else if (upper.startsWith("POINT3:") || upper.startsWith("POINT 3:")) {
        points.push(trimmed.split(":").slice(1).join(":").trim());
      } else if (upper.startsWith("OUTRO:")) {
        outro = trimmed.split(":").slice(1).join(":").trim();
      }
    }

    // Fallback if parsing fails
    if (!hook && points.length === 0) {
      const chunks = text
        .split(".")
        .map((c) => c.trim())
        .filter((c) => c);
      hook = chunks[0] || title;
      points.push(...chunks.slice(1, 4));
      outro = chunks[chunks.length - 1] || "Follow for more!";
    }

    const scenes = [
      { text: title, duration: 3, type: "title" },
      { text: hook, duration: 4, type: "intro" },
      ...points.map((p) => ({ text: p, duration: 7, type: "body" })),
      { text: outro, duration: 4, type: "outro" },
    ];
    if (hashtags) {
      scenes.push({ text: hashtags, duration: 3, type: "hashtags" });
    }

    return {
      title,
      fullScript: `${hook} ${points.join(" ")} ${outro}`,
      intro: hook,
      body: points,
      outro,
      scenes,
      source: "gemini",
    };
  }
}

function sampleN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Main script generation function.
 * Uses Gemini AI only — retries aggressively, throws on failure.
 */
async function generateScript(title, description, niche, hashtags, geminiKeys = []) {
  if (!geminiKeys || geminiKeys.filter((k) => k && k.trim()).length === 0) {
    throw new Error("No Gemini API keys provided. Please add at least one Gemini key to generate a script.");
  }

  const writer = new GeminiScriptWriter(geminiKeys);
  return await writer.generate(title, description, niche, hashtags);
}

/**
 * Generate search keywords for Pexels stock footage.
 */
function getSearchKeywords(niche, title) {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "it", "its",
    "this", "that", "and", "or", "but", "not", "no", "so", "if", "how",
    "what", "when", "where", "why", "who", "which", "your", "you", "my",
  ]);

  const titleWords = title
    .split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[.,!?#]/g, ""))
    .filter((w) => !stopWords.has(w) && w.length > 2);

  const nicheKeywords = {
    motivation: ["success", "inspiration", "sunrise", "mountain"],
    tech: ["technology", "computer", "digital", "futuristic"],
    finance: ["money", "business", "investment", "wealth"],
    health: ["fitness", "exercise", "nature", "wellness"],
    education: ["books", "learning", "knowledge", "study"],
    gaming: ["gaming", "video games", "esports", "controller"],
  };

  const extra = nicheKeywords[niche?.toLowerCase()] || ["creative", "abstract", "cinematic"];
  const keywords = [niche, ...titleWords.slice(0, 3), ...sampleN(extra, 2)];
  return [...new Set(keywords)];
}

module.exports = {
  generateScript,
  getSearchKeywords,
  GeminiScriptWriter,
};
