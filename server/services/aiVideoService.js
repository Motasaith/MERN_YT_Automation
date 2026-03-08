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
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const TEMP_DIR = path.join(__dirname, "..", "temp");

// ─────────────────────────────────────────────
// Kling AI (Priority 1)
// Uses JWT signed with access_key + secret_key
// ─────────────────────────────────────────────

function createKlingJWT(accessKey, secretKey) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800, // 30 min
    nbf: now - 5,
    iat: now,
  };

  const b64 = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url");

  const headerB64 = b64(header);
  const payloadB64 = b64(payload);
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  return `${headerB64}.${payloadB64}.${signature}`;
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
          "X-API-Key": apiKey,
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
          headers: { "X-API-Key": apiKey },
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
// Stability AI (Priority 3)
// text-to-image → image-to-video pipeline
// ─────────────────────────────────────────────

async function generateWithStability(prompt, aspectRatio, duration) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return null;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  try {
    // Step 1: Generate image from prompt
    console.log("Stability AI: generating scene image...");
    const imgRes = await axios.post(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      {
        prompt: prompt,
        negative_prompt: "blurry, text, watermark, low quality",
        aspect_ratio: aspectRatio === "portrait" ? "9:16" : "16:9",
        output_format: "png",
        model: "sd3.5-medium",
      },
      {
        headers: { ...headers, "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    const imageB64 = imgRes.data?.image;
    if (!imageB64) {
      console.log("Stability AI: no image returned");
      return null;
    }

    // Save image to temp
    const imgPath = path.join(TEMP_DIR, `stability_img_${uuidv4()}.png`);
    fs.writeFileSync(imgPath, Buffer.from(imageB64, "base64"));

    // Step 2: Image to video
    console.log("Stability AI: converting image to video...");
    const FormData = require("form-data");
    const form = new FormData();
    form.append("image", fs.createReadStream(imgPath));
    form.append("cfg_scale", "1.8");
    form.append("motion_bucket_id", "127");

    const vidRes = await axios.post(
      "https://api.stability.ai/v2beta/image-to-video",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    const generationId = vidRes.data?.id;
    if (!generationId) {
      console.log("Stability AI: no generation_id returned");
      try { fs.unlinkSync(imgPath); } catch (e) {}
      return null;
    }

    // Poll for completion (up to 5 minutes)
    console.log(`Stability AI: polling generation ${generationId}...`);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const statusRes = await axios.get(
        `https://api.stability.ai/v2beta/image-to-video/result/${generationId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
          timeout: 15000,
        }
      );

      if (statusRes.status === 200 && statusRes.data?.video) {
        console.log("Stability AI: video ready");
        try { fs.unlinkSync(imgPath); } catch (e) {}
        // Video is returned as base64
        const videoB64 = statusRes.data.video;
        const vidPath = path.join(TEMP_DIR, `stability_vid_${uuidv4()}.mp4`);
        fs.writeFileSync(vidPath, Buffer.from(videoB64, "base64"));
        return { localPath: vidPath, provider: "stability" };
      }
      // 202 = still processing
    }

    console.log("Stability AI: timed out");
    try { fs.unlinkSync(imgPath); } catch (e) {}
    return null;
  } catch (err) {
    console.log(`Stability AI error: ${err.response?.status} ${err.response?.data?.message || err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// HuggingFace Inference API (Priority 4 — Fallback)
// Uses a text-to-video model on HF Inference
// ─────────────────────────────────────────────

async function generateWithHuggingFace(prompt, aspectRatio, duration) {
  const token = process.env.HF_ACCESS_TOKEN;
  if (!token) return null;

  try {
    console.log("HuggingFace: submitting text-to-video inference...");
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/ali-vilab/text-to-video-ms-1.7b",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 300000, // 5 min — HF can be slow
      }
    );

    if (response.status === 200 && response.data) {
      const vidPath = path.join(TEMP_DIR, `hf_vid_${uuidv4()}.mp4`);
      fs.writeFileSync(vidPath, Buffer.from(response.data));
      console.log("HuggingFace: video generated");
      return { localPath: vidPath, provider: "huggingface" };
    }

    console.log("HuggingFace: no video data returned");
    return null;
  } catch (err) {
    const status = err.response?.status;
    if (status === 503) {
      console.log("HuggingFace: model is loading, would need to wait");
    } else {
      console.log(`HuggingFace error: ${status} ${err.message}`);
    }
    return null;
  }
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
