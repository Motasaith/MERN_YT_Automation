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

// Paid models via OpenRouter (~$0.001 or less per script)
const OPENROUTER_MODELS = [
  "deepseek/deepseek-chat",           // ~$0.0003/script, excellent writer
  "google/gemini-2.0-flash-001",      // ~$0.0001/script, fast & reliable
  "openai/gpt-4o-mini",               // ~$0.0005/script, very good quality
];

/**
 * Detect how many points the title implies (e.g. "5 Most Powerful AI" → 5).
 * Defaults to 3 if no number found.
 */
function detectPointCount(title) {
  const match = title.match(/\b(\d{1,2})\b/);
  const n = match ? parseInt(match[1], 10) : 3;
  return Math.max(2, Math.min(n, 10)); // clamp 2–10
}

/** Duration presets: target speaking time in seconds */
const DURATION_PRESETS = {
  short:  { total: 30,  hookSec: 3,  pointSec: 5,   outroSec: 4  },
  medium: { total: 60,  hookSec: 4,  pointSec: 12,  outroSec: 5  },
  long:   { total: 120, hookSec: 5,  pointSec: 20,  outroSec: 8  },
};

function buildPrompt(title, videoDuration = "medium") {
  const pointCount = detectPointCount(title);
  const preset = DURATION_PRESETS[videoDuration] || DURATION_PRESETS.medium;

  // Build the POINT labels dynamically
  const pointRules = Array.from({ length: pointCount }, (_, i) => {
    const n = i + 1;
    return `- POINT${n} (~${preset.pointSec} seconds): Point #${n}. Be SPECIFIC — use real names, real numbers, real examples. No generic filler.`;
  }).join("\n");

  const pointLabels = Array.from({ length: pointCount }, (_, i) => {
    return `POINT${i + 1}: [point ${i + 1} text]\nSEARCH${i + 1}: [2-3 word Pexels search query for this point's background footage]`;
  }).join("\n");

  return `You are a top-tier viral YouTube scriptwriter. Write an engaging ~${preset.total}-second script based ONLY on this video title:

"${title}"

CRITICAL: The title implies ${pointCount} distinct points/items. You MUST provide exactly ${pointCount} points. If the title says "5 AI tools", list 5 real tools. If it says "7 habits", give 7 real habits. MATCH THE TITLE NUMBER PRECISELY.

RULES:
- HOOK (~${preset.hookSec} seconds): A scroll-stopping opening line. Bold claim, shocking stat, or provocative question.
${pointRules}
- OUTRO (~${preset.outroSec} seconds): Short punchy call-to-action that ties back to the title.
- Each POINT must also have a SEARCH line: 2-3 words describing the best stock footage for that point (e.g. "robot coding", "person typing laptop", "server room lights").

STYLE:
- Conversational and energetic, like explaining to a smart friend
- Mix short punchy sentences with longer flowing ones
- Use "..." for dramatic pauses
- Be ultra-specific: real tool names, real stats, real techniques
- NO emojis, NO stage directions, NO timestamps, NO hashtags
- Total script must be naturally speakable in ~${preset.total} seconds

OUTPUT FORMAT (use these EXACT labels on separate lines):
HOOK: [hook text]
SEARCH_HOOK: [2-3 word search query for hook footage]
${pointLabels}
OUTRO: [outro text]
SEARCH_OUTRO: [2-3 word search query for outro footage]`;
}

function parseScriptResponse(text, title, hashtags, source, videoDuration = "medium") {
  const preset = DURATION_PRESETS[videoDuration] || DURATION_PRESETS.medium;
  const lines = text.trim().split("\n");
  let hook = "";
  const points = [];
  let outro = "";
  const searchKeywords = {}; // scene index → search query

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const upper = trimmed.toUpperCase();

    if (upper.startsWith("HOOK:")) {
      hook = trimmed.split(":").slice(1).join(":").trim();
    } else if (/^POINT\s?\d+:/i.test(upper)) {
      points.push(trimmed.split(":").slice(1).join(":").trim());
    } else if (upper.startsWith("OUTRO:")) {
      outro = trimmed.split(":").slice(1).join(":").trim();
    } else if (/^SEARCH_HOOK:/i.test(upper)) {
      searchKeywords["hook"] = trimmed.split(":").slice(1).join(":").trim();
    } else if (/^SEARCH\s?\d+:/i.test(upper)) {
      const idx = parseInt(upper.match(/\d+/)[0], 10);
      searchKeywords[`point${idx}`] = trimmed.split(":").slice(1).join(":").trim();
    } else if (/^SEARCH_OUTRO:/i.test(upper)) {
      searchKeywords["outro"] = trimmed.split(":").slice(1).join(":").trim();
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
    { text: title, duration: 3, type: "title", searchQuery: title },
    { text: hook, duration: preset.hookSec, type: "intro", searchQuery: searchKeywords["hook"] || "" },
    ...points.map((p, i) => ({
      text: p,
      duration: preset.pointSec,
      type: "body",
      searchQuery: searchKeywords[`point${i + 1}`] || "",
    })),
    { text: outro, duration: preset.outroSec, type: "outro", searchQuery: searchKeywords["outro"] || "" },
  ];
  if (hashtags) {
    scenes.push({ text: hashtags, duration: 3, type: "hashtags", searchQuery: "" });
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
async function generateWithOpenRouter(apiKey, title, description, niche, hashtags, videoDuration = "medium") {
  const prompt = buildPrompt(title, videoDuration);
  const errors = [];

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://youtube-automation-studio.local",
    "X-Title": "YouTube Automation Studio",
  };

  async function tryModel(model) {
    console.log(`OpenRouter trying model: ${model}`);
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.9,
      },
      { headers, timeout: 45000 }
    );
    const text = response.data?.choices?.[0]?.message?.content;
    if (text && text.trim().length > 20) {
      console.log(`OpenRouter succeeded with ${model}`);
      return parseScriptResponse(text, title, hashtags, `openrouter/${model.split("/").pop()}`, videoDuration);
    }
    return null;
  }

  // Try each model once
  for (const model of OPENROUTER_MODELS) {
    try {
      const result = await tryModel(model);
      if (result) return result;
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      console.log(`  ${model} failed: [${status}] ${msg}`);
      errors.push(`${model}: ${msg}`);
      if (status === 429) await new Promise((r) => setTimeout(r, PER_KEY_DELAY_MS));
    }
  }

  console.log("OpenRouter: all models exhausted.");
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

  async generate(title, description, niche, hashtags, videoDuration = "medium") {
    if (this.apiKeys.length === 0) return null;

    const prompt = buildPrompt(title, videoDuration);
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
            return parseScriptResponse(text, title, hashtags, "gemini", videoDuration);
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
async function generateScript(title, description, niche, hashtags, geminiKeys = [], videoDuration = "medium") {
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";

  // Try OpenRouter first (most reliable)
  if (openRouterKey) {
    console.log("Trying OpenRouter (primary)...");
    const result = await generateWithOpenRouter(openRouterKey, title, description, niche, hashtags, videoDuration);
    if (result) return result;
    console.log("OpenRouter failed, trying Gemini fallback...");
  }

  // Try Gemini as fallback
  const validGeminiKeys = (geminiKeys || []).filter((k) => k && k.trim());
  if (validGeminiKeys.length > 0) {
    console.log("Trying Gemini (fallback)...");
    const writer = new GeminiScriptWriter(validGeminiKeys);
    const result = await writer.generate(title, description, niche, hashtags, videoDuration);
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
