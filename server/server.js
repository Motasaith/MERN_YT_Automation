/**
 * Express Server — YouTube Automation MERN Backend
 * Handles video generation, YouTube upload, and real-time progress via Socket.IO.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Services
const { generateScript, getSearchKeywords } = require("./services/scriptGenerator");
const { generateVideo } = require("./services/videoGenerator");
const { generateTTS, VOICES } = require("./services/ttsService");
const { searchPexelsVideos, downloadPexelsVideo, getSearchQueries } = require("./services/pexelsService");
const { uploadVideo, isAuthenticated, revokeAuth } = require("./services/youtubeUploader");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files — serve generated videos
const OUTPUT_DIR = path.join(__dirname, "output");
const TEMP_DIR = path.join(__dirname, "temp");
[OUTPUT_DIR, TEMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
app.use("/output", express.static(OUTPUT_DIR));

// Serve React build in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "client", "build")));
}

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

/**
 * GET /api/health — Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /api/voices — Get available TTS voices
 */
app.get("/api/voices", (req, res) => {
  res.json({ voices: VOICES });
});

/**
 * GET /api/youtube/status — Check YouTube auth status
 */
app.get("/api/youtube/status", (req, res) => {
  res.json({ authenticated: isAuthenticated() });
});

/**
 * POST /api/youtube/revoke — Revoke YouTube auth
 */
app.post("/api/youtube/revoke", (req, res) => {
  const result = revokeAuth();
  res.json({ success: result });
});

/**
 * POST /api/script/preview — Generate script preview without video
 */
app.post("/api/script/preview", async (req, res) => {
  try {
    const { title, description, niche, geminiKeys } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const allKeys = [];
    if (geminiKeys && Array.isArray(geminiKeys)) {
      allKeys.push(...geminiKeys.filter((k) => k && k.trim()));
    }
    const envKeys = (process.env.GEMINI_API_KEYS || "").split(",").filter((k) => k.trim());
    allKeys.push(...envKeys);

    const script = await generateScript(title, description || "", niche || "general", allKeys);
    res.json({ script });
  } catch (error) {
    console.error("Script preview error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate — Generate video (main endpoint)
 * Uses Socket.IO for real-time progress updates.
 */
app.post("/api/generate", async (req, res) => {
  const jobId = uuidv4();
  const {
    title,
    description,
    niche,
    hashtags,
    geminiKeys,
    voice,
    voiceRate,
    voicePitch,
    pexelsApiKey,
    videoFormat, // "reel" or "landscape"
  } = req.body;

  if (!title) return res.status(400).json({ error: "Title is required" });

  // Send jobId immediately so client can track progress
  res.json({ jobId, status: "processing" });

  // Process in background
  const emitProgress = (step, progress, message) => {
    io.emit(`progress:${jobId}`, { step, progress, message });
  };

  try {
    const isReel = videoFormat !== "landscape";
    const width = isReel ? 1080 : 1920;
    const height = isReel ? 1920 : 1080;

    // Step 1: Generate script
    emitProgress("script", 10, "Generating script with AI...");

    const allGeminiKeys = [];
    if (geminiKeys && Array.isArray(geminiKeys)) {
      allGeminiKeys.push(...geminiKeys.filter((k) => k && k.trim()));
    }
    const envKeys = (process.env.GEMINI_API_KEYS || "").split(",").filter((k) => k.trim());
    allGeminiKeys.push(...envKeys);

    const script = await generateScript(title, description || "", niche || "general", allGeminiKeys);
    emitProgress("script", 20, `Script ready (Source: ${script.source})`);

    // Step 2: Generate TTS audio
    emitProgress("tts", 25, "Generating voiceover...");
    const fullText = script.scenes.map((s) => s.narration).join(". ");
    const audioPath = path.join(TEMP_DIR, `${jobId}_audio.mp3`);
    const selectedVoice = voice || "en-US-ChristopherNeural";
    const rate = voiceRate || "+0%";
    const pitch = voicePitch || "+0Hz";
    await generateTTS(fullText, audioPath, selectedVoice, rate, pitch);
    emitProgress("tts", 40, "Voiceover generated!");

    // Step 3: Fetch stock footage
    emitProgress("footage", 45, "Searching stock footage...");
    const pexelsKey = pexelsApiKey || process.env.PEXELS_API_KEY;
    const searchQueries = getSearchQueries(title, niche);
    let stockVideos = [];

    if (pexelsKey) {
      const orientation = isReel ? "portrait" : "landscape";
      for (const query of searchQueries.slice(0, 3)) {
        const results = await searchPexelsVideos(pexelsKey, query, 3, orientation);
        stockVideos.push(...results);
        if (stockVideos.length >= 5) break;
      }
    }
    emitProgress("footage", 55, `Found ${stockVideos.length} stock clips`);

    // Step 4: Download stock footage
    const downloadedClips = [];
    if (stockVideos.length > 0) {
      emitProgress("download", 60, "Downloading stock footage...");
      for (let i = 0; i < Math.min(stockVideos.length, script.scenes.length); i++) {
        try {
          const clipPath = path.join(TEMP_DIR, `${jobId}_clip_${i}.mp4`);
          await downloadPexelsVideo(stockVideos[i], clipPath);
          downloadedClips.push(clipPath);
        } catch (err) {
          console.error(`Failed to download clip ${i}:`, err.message);
        }
      }
    }
    emitProgress("download", 70, `Downloaded ${downloadedClips.length} clips`);

    // Step 5: Generate video
    emitProgress("render", 75, "Rendering video...");
    const outputFileName = `${title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)}_${jobId.substring(0, 8)}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    await generateVideo({
      script,
      audioPath,
      stockClips: downloadedClips,
      outputPath,
      width,
      height,
      title,
      hashtags: hashtags || "",
    });

    emitProgress("render", 95, "Video rendered!");

    // Step 6: Cleanup temp files
    emitProgress("cleanup", 98, "Cleaning up...");
    const tempFiles = [audioPath, ...downloadedClips];
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
    // Clean other temp files for this job
    const allTemp = fs.readdirSync(TEMP_DIR).filter((f) => f.startsWith(jobId));
    allTemp.forEach((f) => {
      try { fs.unlinkSync(path.join(TEMP_DIR, f)); } catch {}
    });

    emitProgress("done", 100, "Video ready!");
    io.emit(`complete:${jobId}`, {
      success: true,
      videoUrl: `/output/${outputFileName}`,
      fileName: outputFileName,
      script,
    });
  } catch (error) {
    console.error("Video generation error:", error);
    io.emit(`complete:${jobId}`, {
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/upload — Upload generated video to YouTube
 */
app.post("/api/upload", async (req, res) => {
  try {
    const { videoPath, title, description, tags, privacy, clientId, clientSecret } = req.body;

    if (!videoPath || !clientId || !clientSecret) {
      return res.status(400).json({ error: "videoPath, clientId, and clientSecret are required" });
    }

    const fullPath = path.join(OUTPUT_DIR, path.basename(videoPath));
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "Video file not found" });
    }

    const result = await uploadVideo(
      fullPath,
      {
        title: title || "Untitled",
        description: description || "",
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        privacy: privacy || "private",
      },
      clientId,
      clientSecret,
      (progress) => {
        io.emit("upload:progress", { progress });
      }
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/videos — List generated videos
 */
app.get("/api/videos", (req, res) => {
  try {
    const files = fs
      .readdirSync(OUTPUT_DIR)
      .filter((f) => f.endsWith(".mp4"))
      .map((f) => {
        const stats = fs.statSync(path.join(OUTPUT_DIR, f));
        return {
          name: f,
          url: `/output/${f}`,
          size: stats.size,
          created: stats.birthtime,
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ videos: files });
  } catch (error) {
    res.json({ videos: [] });
  }
});

/**
 * DELETE /api/videos/:filename — Delete a generated video
 */
app.delete("/api/videos/:filename", (req, res) => {
  try {
    const filePath = path.join(OUTPUT_DIR, path.basename(req.params.filename));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback to React app in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
  });
}

// ─────────────────────────────────────────────
// Socket.IO — real-time progress
// ─────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   YouTube Automation Server              ║
  ║   Running on http://localhost:${PORT}        ║
  ║                                          ║
  ║   API:    http://localhost:${PORT}/api      ║
  ║   Health: http://localhost:${PORT}/api/health║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
