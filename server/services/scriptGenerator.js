/**
 * AI Script Generator Service
 * Primary: OpenRouter API (free models, highly available)
 * Fallback: Google Gemini API (multi-key rotation)
 * Retries aggressively with exponential backoff.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

// Retry config
const MAX_ROUNDS = 3;
const BASE_DELAY_MS = 2000;
const PER_KEY_DELAY_MS = 1000;

// OpenRouter free models to try (in priority order)
const OPENROUTER_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemma-3-4b-it:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

function buildPrompt(title, description, niche, hashtags) {
  return `You are a viral YouTube Shorts scriptwriter. Write a highly engaging, 
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
}

function parseScriptResponse(text, title, hashtags, source) {
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

  // Fallback if parsing fails — split by sentences
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
    source,
  };
}

// ─────────────────────────────────────────────
// OpenRouter (Primary)
// ─────────────────────────────────────────────
async function generateWithOpenRouter(apiKey, title, description, niche, hashtags) {
  const prompt = buildPrompt(title, description, niche, hashtags);
  const errors = [];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log(`OpenRouter round ${round + 1}/${MAX_ROUNDS} — model: ${model}`);
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
            temperature: 0.9,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://youtube-automation-studio.local",
              "X-Title": "YouTube Automation Studio",
            },
            timeout: 30000,
          }
        );

        const text = response.data?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 20) {
          console.log(`OpenRouter succeeded with ${model} on round ${round + 1}`);
          return parseScriptResponse(text, title, hashtags, `openrouter/${model.split("/").pop()}`);
        }
        console.log(`OpenRouter ${model}: empty/short response`);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.error?.message || err.message;
        console.log(`OpenRouter ${model} failed: [${status}] ${msg}`);
        errors.push(`${model}: ${msg}`);

        // Rate limited — wait before trying next model
        if (status === 429) {
          await new Promise((r) => setTimeout(r, PER_KEY_DELAY_MS));
        }
      }
    }

    // Backoff between rounds
    if (round < MAX_ROUNDS - 1) {
      const delay = BASE_DELAY_MS * Math.pow(2, round);
      console.log(`OpenRouter: all models failed round ${round + 1}. Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  console.log(`OpenRouter exhausted after ${MAX_ROUNDS} rounds.`);
  return null;
}

// ─────────────────────────────────────────────
// Gemini (Fallback)
// ─────────────────────────────────────────────
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
    if (this.apiKeys.length === 0) return null;

    const prompt = buildPrompt(title, description, niche, hashtags);
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
            return parseScriptResponse(text, title, hashtags, "gemini");
          }
          console.log(`Gemini ${keyLabel}: empty/short response`);
        } catch (err) {
          const errMsg = err.message?.toLowerCase() || "";
          console.log(`Gemini ${keyLabel} failed: ${err.message}`);
          errors.push(`${keyLabel}: ${err.message}`);

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

      if (round < MAX_ROUNDS - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, round);
        console.log(`Gemini: all keys failed round ${round + 1}. Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    console.log(`Gemini exhausted after ${MAX_ROUNDS} rounds.`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────

/**
 * Generate a script. Tries OpenRouter first, then Gemini.
 * Throws if both fail.
 */
async function generateScript(title, description, niche, hashtags, geminiKeys = []) {
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";

  // Try OpenRouter first (most reliable)
  if (openRouterKey) {
    console.log("Trying OpenRouter (primary)...");
    const result = await generateWithOpenRouter(openRouterKey, title, description, niche, hashtags);
    if (result) return result;
    console.log("OpenRouter failed, trying Gemini fallback...");
  }

  // Try Gemini as fallback
  const validGeminiKeys = (geminiKeys || []).filter((k) => k && k.trim());
  if (validGeminiKeys.length > 0) {
    console.log("Trying Gemini (fallback)...");
    const writer = new GeminiScriptWriter(validGeminiKeys);
    const result = await writer.generate(title, description, niche, hashtags);
    if (result) return result;
  }

  // Both failed
  const providers = [];
  if (openRouterKey) providers.push("OpenRouter");
  if (validGeminiKeys.length > 0) providers.push("Gemini");

  if (providers.length === 0) {
    throw new Error("No AI API keys configured. Add an OpenRouter key in .env or Gemini keys in the UI.");
  }

  throw new Error(
    `Script generation failed on all providers (${providers.join(", ")}). ` +
    `All models/keys are rate-limited or unavailable. Please try again in a minute.`
  );
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
