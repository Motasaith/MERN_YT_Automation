/**
 * Gemini AI Script Generator Service
 * Generates unique video scripts using Google Gemini API with multi-key rotation.
 * Falls back to enhanced templates when no keys are available.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

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

    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      const key = this._getNextKey();
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text) {
          return this._parseResponse(text, title, hashtags);
        }
      } catch (err) {
        const errMsg = err.message?.toLowerCase() || "";
        console.log(`Gemini key #${this.currentKeyIndex} failed: ${err.message}`);

        if (
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("rate")
        ) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        continue;
      }
    }
    return null;
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

// ========================
// Enhanced Template Fallback
// ========================

const NICHE_TEMPLATES = {
  motivation: {
    hooks: [
      "Stop scrolling. This one habit separates the top 1% from everyone else.",
      "You're not lazy. You've just been using the wrong strategy.",
      "What if everything you thought about success... was completely wrong?",
      "In the next 60 seconds, I'm going to change how you think about discipline.",
      "Most people will ignore this. But the ones who don't? They win.",
    ],
    points: [
      "First... your environment shapes you more than your willpower ever will. Change your space, change your life.",
      "The most successful people don't rely on motivation. They build systems. Tiny habits, every single day.",
      "Here's the truth nobody talks about... failure isn't the opposite of success. It's the price of it.",
      "You don't need to be perfect. You need to be consistent. Show up even when you don't feel like it.",
      "Stop comparing your chapter 1 to someone else's chapter 20. Your timeline is yours.",
      "Write down your goals every morning. Not because you'll forget them... but because your brain needs to see them.",
      "The pain of discipline weighs ounces. The pain of regret? That weighs tons.",
      "Surround yourself with people who challenge you, not people who just agree with you.",
    ],
    outros: [
      "Start today. Not tomorrow. Today. Follow for your daily dose of motivation.",
      "Share this with someone who needs to hear it right now.",
      "Your future self is counting on you. Don't let them down. Follow for more.",
      "Like this if it hit different. Subscribe for daily motivation.",
    ],
  },
  tech: {
    hooks: [
      "This new technology is about to make your phone feel ancient.",
      "99% of people don't know this tech trick. Here's what the pros use.",
      "The future just arrived... and it's not what you expected.",
      "I tested this for 30 days and the results were genuinely shocking.",
      "This free tool does what people are paying hundreds of dollars for.",
    ],
    points: [
      "This uses AI in a way we've never seen before. It learns your patterns and adapts in real time.",
      "The processing power needed for this used to fill an entire room. Now it fits in your pocket.",
      "What makes this different is the architecture. It's not just faster... it's fundamentally smarter.",
      "Companies are spending billions on this right now. And the free version is already incredible.",
      "The open-source community cracked this months before the big companies did. That's the beauty of open source.",
      "This works offline too. No internet, no cloud, no subscriptions. Just pure local power.",
    ],
    outros: [
      "The future waits for no one. Follow to stay ahead of the curve.",
      "Drop a comment if you want a full tutorial on this.",
      "Subscribe. I post tech that actually matters, not just hype.",
      "Save this for later. You're going to need it.",
    ],
  },
  finance: {
    hooks: [
      "I wish someone told me this about money when I was 18.",
      "The rich don't budget. Here's what they actually do instead.",
      "This money rule is simple, boring, and it works every single time.",
      "You're losing money every month and you don't even know it.",
      "Here's why your savings account is actually making you poorer.",
    ],
    points: [
      "The 50-30-20 rule changed everything for me. 50% needs, 30% wants, 20% invest. Simple but powerful.",
      "Stop trying to time the market. Consistent investing over time beats guessing every single time.",
      "Your first $100,000 is the hardest. After that compound interest does the heavy lifting for you.",
      "Track every dollar for 30 days. Not to restrict yourself... but to see where your money actually goes.",
      "Multiple income streams isn't about working more. It's about building assets that work while you sleep.",
      "Automate your finances. If you have to think about saving, you won't do it consistently.",
    ],
    outros: [
      "Financial freedom isn't a dream. It's a math problem. Follow for the solutions.",
      "Save this video. Come back in a year and thank yourself.",
      "Tag someone who needs to hear this. It could change their life.",
      "Follow for daily money tips that actually work.",
    ],
  },
  health: {
    hooks: [
      "This one change to my morning routine fixed everything.",
      "Doctors won't tell you this... but your phone is ruining your sleep.",
      "I tried the world's simplest workout for 90 days. The results speak for themselves.",
    ],
    points: [
      "Walking 10,000 steps isn't just a trend. Studies show it reduces anxiety by 40%.",
      "Cold showers for 30 seconds in the morning activate your nervous system better than any cup of coffee.",
      "Sleep is the ultimate performance hack. Just one bad night drops your cognitive ability by 30%.",
      "Gut health controls everything... your mood, your energy, even your skin. Feed it fiber, not junk.",
      "Eating protein in the morning stops cravings all day.",
      "Screen time before bed destroys your melatonin production.",
    ],
    outros: [
      "Your health is your wealth. Start with one change today. Follow for more.",
      "Save this. Screenshot it. Make it happen.",
      "Follow for health tips that are actually backed by science.",
    ],
  },
  education: {
    hooks: [
      "The education system didn't teach you this... but it might be the most important skill you ever learn.",
      "I memorized an entire textbook in one weekend. Here's the technique.",
      "Why do you forget 90% of what you read? Here's the science... and the fix.",
    ],
    points: [
      "Active recall. Close the book and try to remember. That struggle is where learning happens.",
      "The Feynman Technique: explain it like you're teaching a 5-year-old. If you can't simplify it, you don't understand it.",
      "Spaced repetition beats cramming every time. Review at intervals: 1 day, 3 days, 7 days, 30 days.",
      "Your brain learns better in 25-minute focused blocks with 5-minute breaks. The Pomodoro Technique.",
      "Teaching others is the fastest way to master anything.",
      "Handwriting notes activates more brain regions than typing.",
    ],
    outros: [
      "Knowledge is the one thing nobody can take from you. Follow for more learning hacks.",
      "Save this for your next study session.",
      "Subscribe for study tips that actually work in the real world.",
    ],
  },
  gaming: {
    hooks: [
      "This trick will instantly boost your K/D ratio. Most players have no idea.",
      "I found a setting that 99% of gamers have turned off. Big mistake.",
      "Pro gamers warm up for 30 minutes before every match. Here's their exact routine.",
    ],
    points: [
      "Crosshair placement is everything. Always keep it at head level.",
      "Lower your sensitivity. Precision beats speed in every competitive game.",
      "Review your replays. Every death is a lesson.",
      "Take breaks every hour. Fatigue tanks your reaction time.",
      "Audio is an underrated advantage. Good headphones let you hear everything others miss.",
      "Communication wins team games. Callouts and positivity carry harder than raw aim.",
    ],
    outros: [
      "GG. Now go apply this and watch your rank climb. Follow for more tips.",
      "Drop your current rank in the comments.",
      "Subscribe for daily gaming content that actually makes you better.",
    ],
  },
  default: {
    hooks: [
      "This changed my entire perspective. And it'll change yours too.",
      "I learned this the hard way so you don't have to.",
      "Stop what you're doing. You need to hear this.",
    ],
    points: [
      "The difference between knowing and doing is everything.",
      "Consistency beats talent when talent doesn't show up consistently.",
      "Small improvements compound. 1% better every day means 37 times better in a year.",
      "Overthinking is the killer of progress. Done is better than perfect.",
      "Everything you want is on the other side of fear.",
      "The ones who succeed aren't special. They just refused to quit.",
    ],
    outros: [
      "Follow for more content that actually makes a difference.",
      "Don't just watch this... apply it. That's where the magic happens.",
      "Subscribe. I don't waste your time with fluff.",
    ],
  },
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sampleN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}

function generateFromTemplates(title, description, niche, hashtags) {
  const templates = NICHE_TEMPLATES[niche?.toLowerCase()] || NICHE_TEMPLATES.default;

  const hook = pickRandom(templates.hooks);
  const bodyParts = sampleN(templates.points, 3);
  const outro = pickRandom(templates.outros);

  const scenes = [
    { text: title, duration: 3, type: "title" },
    { text: hook, duration: 4, type: "intro" },
    ...bodyParts.map((p) => ({ text: p, duration: 7, type: "body" })),
    { text: outro, duration: 4, type: "outro" },
  ];
  if (hashtags) {
    scenes.push({ text: hashtags, duration: 3, type: "hashtags" });
  }

  return {
    title,
    description,
    niche,
    hashtags,
    fullScript: `${hook} ${bodyParts.join(" ")} ${outro}`,
    intro: hook,
    body: bodyParts,
    outro,
    scenes,
    source: "template",
  };
}

/**
 * Main script generation function.
 * Tries Gemini first, falls back to templates.
 */
async function generateScript(title, description, niche, hashtags, geminiKeys = []) {
  // Try Gemini AI first
  if (geminiKeys && geminiKeys.length > 0) {
    const writer = new GeminiScriptWriter(geminiKeys);
    const result = await writer.generate(title, description, niche, hashtags);
    if (result) return result;
    console.log("All Gemini keys failed, falling back to templates...");
  }

  // Fallback to templates
  return generateFromTemplates(title, description, niche, hashtags);
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
  NICHE_TEMPLATES,
};
