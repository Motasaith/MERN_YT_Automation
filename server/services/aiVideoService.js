/**
 * AI Video Generation Service
 * Generates AI video clips using multiple providers with automatic fallback.
 *
 * Priority chain:
 *   1. Kling AI       — Best quality, 66 credits/day free
 *   2. Pixverse       — Good quality fallback
 *   3. Stability AI   — 25 credits/day (text-to-image → image-to-video)
 *   4. HuggingFace    — Unlimited but slow queue
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { execFile } = require("child_process");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const TEMP_DIR = path.join(__dirname, "..", "temp");

// ─────────────────────────────────────────────
// Kling AI (Priority 1)
// Uses JWT signed with access_key + secret_key
// ─────────────────────────────────────────────

function createKlingJWT(accessKey, secretKey) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iss: accessKey, exp: now + 1800, nbf: now - 5, iat: now },
    secretKey,
    { algorithm: "HS256", header: { alg: "HS256", typ: "JWT" } }
  );
}

async function generateWithKling(prompt, aspectRatio, duration) {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  if (!accessKey || !secretKey) return null;

  const token = createKlingJWT(accessKey, secretKey);
  const klingDuration = duration <= 5 ? "5" : "10";

  try {
    console.log("Kling AI: submitting video generation task...");
    const createRes = await axios.post(
      "https://api.klingai.com/v1/videos/text2video",
      {
        model_name: "kling-v1",
        prompt: prompt,
        negative_prompt: "blurry, distorted, low quality, watermark, text overlay",
        duration: klingDuration,
        aspect_ratio: aspectRatio === "portrait" ? "9:16" : "16:9",
        mode: "std",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );

    const taskId = createRes.data?.data?.task_id;
    if (!taskId) {
      console.log("Kling AI: no task_id returned", createRes.data);
      return null;
    }

    // Poll for completion (up to 5 minutes)
    console.log(`Kling AI: polling task ${taskId}...`);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const statusRes = await axios.get(
        `https://api.klingai.com/v1/videos/text2video/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        }
      );

      const taskData = statusRes.data?.data;
      const status = taskData?.task_status;

      if (status === "succeed") {
        const videoUrl = taskData?.task_result?.videos?.[0]?.url;
        if (videoUrl) {
          console.log("Kling AI: video ready, downloading...");
          return { url: videoUrl, provider: "kling" };
        }
      } else if (status === "failed") {
        console.log("Kling AI: task failed", taskData?.task_status_msg);
        return null;
      }
      // else "submitted" or "processing" — keep polling
    }

    console.log("Kling AI: timed out after 5 minutes");
    return null;
  } catch (err) {
    console.log(`Kling AI error: ${err.response?.status} ${err.response?.data?.message || err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Pixverse (Priority 2)
// ─────────────────────────────────────────────

async function generateWithPixverse(prompt, aspectRatio, duration) {
  const apiKey = process.env.PIXVERSE_API_KEY;
  if (!apiKey) return null;

  try {
    console.log("Pixverse: submitting video generation...");
    const createRes = await axios.post(
      "https://app-api.pixverse.ai/openapi/v2/video/text/generate",
      {
        prompt: prompt,
        negative_prompt: "blurry, distorted, watermark",
        aspect_ratio: aspectRatio === "portrait" ? "9:16" : "16:9",
        quality: "540p",
        duration: duration <= 5 ? 5 : 8,
        model: "v3.5",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "API-KEY": apiKey,
          "Ai-trial-code": "PixVerse",
        },
        timeout: 30000,
      }
    );

    const taskId = createRes.data?.Resp?.video_id || createRes.data?.data?.video_id;
    if (!taskId) {
      console.log("Pixverse: no video_id returned", JSON.stringify(createRes.data).slice(0, 200));
      return null;
    }

    // Poll for completion (up to 5 minutes)
    console.log(`Pixverse: polling task ${taskId}...`);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const statusRes = await axios.get(
        `https://app-api.pixverse.ai/openapi/v2/video/result/${taskId}`,
        {
          headers: { "API-KEY": apiKey, "Ai-trial-code": "PixVerse" },
          timeout: 15000,
        }
      );

      const respData = statusRes.data?.Resp || statusRes.data?.data;
      const status = respData?.status;

      if (status === 1 || status === "success") {
        const videoUrl = respData?.url || respData?.video_url;
        if (videoUrl) {
          console.log("Pixverse: video ready, downloading...");
          return { url: videoUrl, provider: "pixverse" };
        }
      } else if (status === -1 || status === "failed") {
        console.log("Pixverse: task failed");
        return null;
      }
    }

    console.log("Pixverse: timed out after 5 minutes");
    return null;
  } catch (err) {
    console.log(`Pixverse error: ${err.response?.status} ${err.response?.data?.message || err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Ken Burns effect helper
// Converts a still image into a video clip with slow zoom/pan
// ─────────────────────────────────────────────

function imageToVideoKenBurns(imgPath, outputPath, duration = 5) {
  return new Promise((resolve, reject) => {
    // Random effect: zoom-in, zoom-out, or pan
    const effects = [
      // Slow zoom in
      `zoompan=z='min(zoom+0.0015,1.4)':d=${duration * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25`,
      // Slow zoom out
      `zoompan=z='if(eq(on,1),1.4,max(zoom-0.0015,1.0))':d=${duration * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25`,
      // Pan left to right
      `zoompan=z='1.15':d=${duration * 25}:x='if(eq(on,1),0,min(x+2,(iw-iw/zoom)))':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25`,
    ];
    const vf = effects[Math.floor(Math.random() * effects.length)];

    const args = [
      "-loop", "1",
      "-i", imgPath,
      "-vf", vf,
      "-t", String(duration),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-y",
      outputPath,
    ];

    execFile(ffmpegPath, args, { timeout: 60000 }, (err) => {
      if (err) return reject(err);
      resolve(outputPath);
    });
  });
}

// ─────────────────────────────────────────────
// Stability AI (Priority 3)
// text-to-image → Ken Burns video effect
// ─────────────────────────────────────────────

async function generateWithStability(prompt, aspectRatio, duration) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return null;

  const FormData = require("form-data");

  try {
    // Generate image from text (SD3.5 requires multipart/form-data)
    console.log("Stability AI: generating scene image...");
    const imgForm = new FormData();
    imgForm.append("prompt", prompt);
    imgForm.append("negative_prompt", "blurry, text, watermark, low quality");
    imgForm.append("aspect_ratio", aspectRatio === "portrait" ? "9:16" : "16:9");
    imgForm.append("output_format", "png");
    imgForm.append("model", "sd3.5-medium");

    const imgRes = await axios.post(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      imgForm,
      {
        headers: {
          ...imgForm.getHeaders(),
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
        responseType: "arraybuffer",
        timeout: 60000,
      }
    );

    if (!imgRes.data || imgRes.data.length === 0) {
      console.log("Stability AI: no image returned");
      return null;
    }

    const imgPath = path.join(TEMP_DIR, `stability_img_${uuidv4()}.png`);
    fs.writeFileSync(imgPath, Buffer.from(imgRes.data));
    console.log("Stability AI: image generated, applying Ken Burns effect...");

    // Convert image to video with Ken Burns zoom/pan effect
    const vidPath = path.join(TEMP_DIR, `stability_vid_${uuidv4()}.mp4`);
    await imageToVideoKenBurns(imgPath, vidPath, duration || 5);

    try { fs.unlinkSync(imgPath); } catch (e) {}
    console.log("Stability AI: video clip ready");
    return { localPath: vidPath, provider: "stability" };
  } catch (err) {
    console.log(`Stability AI error: ${err.response?.status || ""} ${err.response?.data?.message || err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// HuggingFace Inference API (Priority 4 — Fallback)
// Uses text-to-image models → Ken Burns video effect
// ─────────────────────────────────────────────

async function generateWithHuggingFace(prompt, aspectRatio, duration) {
  const token = process.env.HF_ACCESS_TOKEN;
  if (!token) return null;

  // Text-to-image models (more reliable than text-to-video on HF)
  const models = [
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5",
    "CompVis/stable-diffusion-v1-4",
  ];

  for (const model of models) {
    try {
      console.log(`HuggingFace: generating image with ${model}...`);
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
          timeout: 120000,
        }
      );

      if (response.status === 200 && response.data && response.data.length > 1000) {
        const imgPath = path.join(TEMP_DIR, `hf_img_${uuidv4()}.png`);
        fs.writeFileSync(imgPath, Buffer.from(response.data));
        console.log(`HuggingFace: image ready via ${model}, applying Ken Burns effect...`);

        const vidPath = path.join(TEMP_DIR, `hf_vid_${uuidv4()}.mp4`);
        await imageToVideoKenBurns(imgPath, vidPath, duration || 5);

        try { fs.unlinkSync(imgPath); } catch (e) {}
        console.log("HuggingFace: video clip ready");
        return { localPath: vidPath, provider: "huggingface" };
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        console.log(`HuggingFace: ${model} is loading, trying next...`);
      } else {
        console.log(`HuggingFace: ${model} error ${status}, trying next...`);
      }
      continue;
    }
  }

  console.log("HuggingFace: all models failed");
  return null;
}

// ─────────────────────────────────────────────
// Download helper
// ─────────────────────────────────────────────

async function downloadVideoFile(url, outputPath) {
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 120000,
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(outputPath));
    writer.on("error", (err) => {
      try { fs.unlinkSync(outputPath); } catch (e) {}
      reject(err);
    });
  });
}

// ─────────────────────────────────────────────
// Main: Generate AI video clip with fallback chain
// ─────────────────────────────────────────────

/**
 * Generate a single AI video clip for a scene.
 * Tries providers in order: Kling → Pixverse → Stability → HuggingFace.
 *
 * @param {string} prompt  - Scene description for video generation
 * @param {string} orientation - "portrait" or "landscape"
 * @param {number} duration - Desired clip duration in seconds
 * @param {function} onStatus - Callback for status updates
 * @returns {string|null} - Local file path to the generated video, or null
 */
async function generateAIVideoClip(prompt, orientation, duration, onStatus = () => {}) {
  const outputPath = path.join(TEMP_DIR, `ai_clip_${uuidv4()}.mp4`);

  const providers = [
    { name: "Kling AI", fn: generateWithKling },
    { name: "Pixverse", fn: generateWithPixverse },
    { name: "Stability AI", fn: generateWithStability },
    { name: "HuggingFace", fn: generateWithHuggingFace },
  ];

  for (const provider of providers) {
    onStatus(`Trying ${provider.name}...`);
    try {
      const result = await provider.fn(prompt, orientation, duration);
      if (!result) continue;

      // If we got a URL, download it
      if (result.url) {
        onStatus(`Downloading from ${provider.name}...`);
        await downloadVideoFile(result.url, outputPath);
        console.log(`AI video clip ready via ${provider.name}`);
        return { path: outputPath, provider: provider.name };
      }

      // If we got a local path (Stability/HF write directly)
      if (result.localPath && fs.existsSync(result.localPath)) {
        // Move/rename to our standard path
        fs.renameSync(result.localPath, outputPath);
        console.log(`AI video clip ready via ${provider.name}`);
        return { path: outputPath, provider: provider.name };
      }
    } catch (err) {
      console.log(`${provider.name} failed completely: ${err.message}`);
    }
  }

  console.log("All AI video providers failed for this clip.");
  return null;
}

/**
 * Check which AI video providers are configured.
 */
function getAvailableProviders() {
  const providers = [];
  if (process.env.KLING_ACCESS_KEY && process.env.KLING_SECRET_KEY) providers.push("Kling AI");
  if (process.env.PIXVERSE_API_KEY) providers.push("Pixverse");
  if (process.env.STABILITY_API_KEY) providers.push("Stability AI");
  if (process.env.HF_ACCESS_TOKEN) providers.push("HuggingFace");
  return providers;
}

module.exports = {
  generateAIVideoClip,
  getAvailableProviders,
};
