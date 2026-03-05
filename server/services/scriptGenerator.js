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

function buildPrompt(title) {
  return `You are a top-tier viral YouTube Shorts scriptwriter. Your job is to write an incredibly engaging 60-second script based ONLY on this video title:

"${title}"

Your script must sound EXACTLY like the title suggests — if the title says "3 AI Tools That Are Writing Your Code", you must actually talk about 3 specific real AI tools that write code. If the title mentions "5 habits", give 5 real habits. MATCH THE TITLE PRECISELY.

RULES:
- HOOK (3 seconds): A scroll-stopping opening line. Bold claim, shocking stat, or provocative question directly about the title topic.
- POINT1 (12-15 seconds): First major point. Be SPECIFIC — use real names, real numbers, real examples. No generic filler.
- POINT2 (12-15 seconds): Second major point. Different angle, equally specific and valuable.
- POINT3 (12-15 seconds): Third major point. End strong with the most surprising or valuable insight.
- OUTRO (5 seconds): Short punchy call-to-action that ties back to the title.

STYLE:
- Conversational and energetic, like explaining to a smart friend
- Mix short punchy sentences with longer flowing ones
- Use "..." for dramatic pauses
- Be ultra-specific: real tool names, real stats, real techniques
- NO emojis, NO stage directions, NO timestamps, NO hashtags
- Total script must be naturally speakable in 50-60 seconds

OUTPUT FORMAT (use these EXACT labels on separate lines):
HOOK: [hook text]
POINT1: [point 1 text]
POINT2: [point 2 text]
POINT3: [point 3 text]
OUTRO: [outro text]`;
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
  const prompt = buildPrompt(title);
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

    const prompt = buildPrompt(title);
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
  const shuffled = [...extra].sort(() => 0.5 - Math.random()).slice(0, 2);
  const keywords = [niche, ...titleWords.slice(0, 3), ...shuffled];
  return [...new Set(keywords)];
}

module.exports = {
  generateScript,
  getSearchKeywords,
  GeminiScriptWriter,
};
