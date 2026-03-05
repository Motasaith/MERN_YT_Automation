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
const { VOICES } = require("./services/ttsService");
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
    const { title, description, niche, videoDuration } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const geminiKeys = (process.env.GEMINI_API_KEYS || "").split(",").filter((k) => k.trim());

    const script = await generateScript(title, description || "", niche || "general", "", geminiKeys, videoDuration || "medium");
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
    voice,
    voiceRate,
    voicePitch,
    videoFormat, // "reel" or "landscape"
    videoDuration, // "short", "medium", "long"
  } = req.body;

  if (!title) return res.status(400).json({ error: "Title is required" });

  // Send jobId immediately so client can track progress
  res.json({ jobId, status: "processing" });

  try {
    // Read keys from environment
    const allGeminiKeys = (process.env.GEMINI_API_KEYS || "").split(",").filter((k) => k.trim());
    const pexelsKey = process.env.PEXELS_API_KEY || "";

    // Delegate to videoGenerator which handles the full pipeline
    const result = await generateVideo({
      title,
      description: description || "",
      niche: niche || "general",
      hashtags: hashtags || "",
      videoFormat: videoFormat || "reel",
      videoDuration: videoDuration || "medium",
      pexelsApiKey: pexelsKey,
      geminiKeys: allGeminiKeys,
      voice: voice || "en-US-ChristopherNeural",
      voiceRate: voiceRate || "+0%",
      voicePitch: voicePitch || "+0Hz",
      onProgress: (message, progress) => {
        io.emit(`progress:${jobId}`, { step: message, progress, message });
      },
    });

    if (result.success) {
      io.emit(`complete:${jobId}`, {
        success: true,
        videoUrl: `/output/${result.filename}`,
        fileName: result.filename,
        script: result.scriptData,
      });
    } else {
      io.emit(`complete:${jobId}`, {
        success: false,
        error: result.error,
      });
    }
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
