# 🎬 YouTube Automation Studio — MERN Edition

> **Generate AI-powered YouTube videos & Reels with neural voices and stock footage — 100% FREE**

A full-stack MERN application that automates YouTube content creation. Enter a title, description, niche, and hashtags — the app generates a unique AI script, creates a voiceover with Microsoft's neural voices, fetches stock footage, and renders a complete video you can download or upload directly to YouTube.

---

## 🚀 Features

| Feature | Details |
|---------|---------|
| **🤖 AI Script Generation** | Google Gemini AI writes unique, engaging scripts. Multi-key rotation (up to 5 API keys) with automatic failover to smart templates |
| **🎙️ Neural TTS Voices** | 12 Microsoft Edge neural voices that sound 95% human — NOT robotic gTTS |
| **🎬 Stock Footage** | Auto-fetches relevant Pexels stock videos for scene backgrounds |
| **📐 Two Formats** | Vertical Reels/Shorts (9:16) or Landscape (16:9) |
| **⚡ Real-time Progress** | Socket.IO streams generation progress to the browser live |
| **📤 YouTube Upload** | OAuth2 upload directly from the app (privacy: private by default) |
| **💾 Video Management** | Browse, play, download, or delete previously generated videos |
| **🎛️ Voice Controls** | Adjustable speech rate (-50% to +50%) and pitch (-20Hz to +20Hz) |
| **💰 100% Free** | All APIs used have generous free tiers |

---

## 📁 Project Structure

```
mern_youtube_automation/
├── server/                      # Express.js backend
│   ├── server.js                # Main server (API routes + Socket.IO)
│   ├── services/
│   │   ├── scriptGenerator.js   # Gemini AI + template fallback
│   │   ├── ttsService.js        # Edge TTS neural voice
│   │   ├── videoGenerator.js    # FFmpeg video rendering
│   │   ├── pexelsService.js     # Stock footage search + download
│   │   └── youtubeUploader.js   # YouTube OAuth2 upload
│   ├── .env                     # Environment variables
│   ├── .env.example
│   └── package.json
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Custom dark theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── .gitignore
```

---

## 🛠️ Prerequisites

- **Node.js** 18+ (https://nodejs.org) 
- **Python 3.10+** with `edge-tts` installed:
  ```bash
  pip install edge-tts
  ```
- **FFmpeg** — installed automatically via `@ffmpeg-installer/ffmpeg`

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
# Server
cd mern_youtube_automation/server
npm install

# Client
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env`:
```env
PORT=5000
PEXELS_API_KEY=your_pexels_api_key_here
GEMINI_API_KEYS=key1,key2,key3
```

> You can also enter API keys directly in the web UI — the .env is optional.

### 3. Start Both Servers

**Terminal 1 — Backend:**
```bash
cd server
npm start
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# → http://localhost:3000
```

### 4. Open http://localhost:3000 🎉

---

## 🔑 Free API Keys

| Service | Where to Get | Free Tier |
|---------|-------------|-----------|
| **Google Gemini** | https://aistudio.google.com/apikey | 15 req/min per key |
| **Pexels** | https://www.pexels.com/api/ | 200 req/month |
| **YouTube Data API** | https://console.cloud.google.com | ~6 uploads/day |
| **Edge TTS** | No key needed | Unlimited |

**Tip:** Get Gemini keys from 3-5 different Google accounts. The app rotates through them — if one hits rate limits, it automatically uses the next.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/voices` | List available TTS voices |
| `POST` | `/api/script/preview` | Generate script without video |
| `POST` | `/api/generate` | Generate full video (returns jobId for Socket.IO tracking) |
| `POST` | `/api/upload` | Upload video to YouTube |
| `GET` | `/api/videos` | List generated videos |
| `DELETE` | `/api/videos/:filename` | Delete a generated video |
| `GET` | `/api/youtube/status` | Check YouTube auth status |

---

## 🎨 Tech Stack

### Backend
- **Express.js** — REST API + middleware
- **Socket.IO** — Real-time progress updates
- **FFmpeg** (via fluent-ffmpeg) — Video rendering with text overlays
- **@google/generative-ai** — Gemini AI script generation
- **edge-tts** (Python CLI) — Neural text-to-speech
- **googleapis** — YouTube Data API v3
- **axios** — HTTP client for Pexels API

### Frontend
- **React 18** — Component-based UI
- **Vite** — Fast build tool
- **Socket.IO Client** — Real-time progress tracking
- **Lucide React** — Icons
- **React Toastify** — Notifications
- Custom dark theme with CSS variables

---

## 🔧 How Video Generation Works

```
Title + Niche + Description
        │
        ▼
┌─────────────────┐
│  Gemini AI       │ ──(fails)──→ Smart Templates
│  Script Writer   │
└────────┬────────┘
         │ Script (5 scenes)
         ▼
┌─────────────────┐
│  Edge TTS        │ Microsoft Neural Voice
│  (Python CLI)    │
└────────┬────────┘
         │ Audio (.mp3)
         ▼
┌─────────────────┐
│  Pexels API      │ Stock Footage Search
│                  │
└────────┬────────┘
         │ Video clips
         ▼
┌─────────────────┐
│  FFmpeg          │ Scene clips + text overlays
│  Video Renderer  │ → Concatenate → Merge audio
└────────┬────────┘
         │ Final video (.mp4)
         ▼
   Download  or  Upload to YouTube
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|---------|
| `edge-tts` not found | Run `pip install edge-tts` or `py -m pip install edge-tts` |
| Pexels returns 0 results | Check API key, or you've hit the 200 req/month limit |
| Gemini fails on all keys | Check keys at https://aistudio.google.com — template fallback will engage |
| FFmpeg errors | Usually resolved by `npm rebuild @ffmpeg-installer/ffmpeg` |
| YouTube upload stuck | Delete `server/youtube_token.json` and re-authenticate |
| Port 5000 in use | Change PORT in `.env` or kill the existing process |

---

## 📋 Also Available: Python/Streamlit Version

The original Python version is in the `YT_Automation/` folder with the same features:
- Streamlit web UI
- MoviePy video rendering
- Same Gemini AI + Edge TTS + Pexels integration

See the [Python README](../YT_Automation/README.md) for setup instructions.

---

## 📄 License

MIT — Free to use, modify, and distribute.
