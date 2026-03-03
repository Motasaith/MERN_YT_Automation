/**
 * Video Generator Service
 * Creates videos using FFmpeg, Pexels stock footage, and Edge TTS neural voices.
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { generateScript, getSearchKeywords } = require("./scriptGenerator");
const { generateTTS } = require("./ttsService");
const { searchPexelsVideos, downloadPexelsVideo } = require("./pexelsService");

ffmpeg.setFfmpegPath(ffmpegPath);

const TEMP_DIR = path.join(__dirname, "..", "temp");
const OUTPUT_DIR = path.join(__dirname, "..", "output");

// Ensure directories exist
[TEMP_DIR, OUTPUT_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

/**
 * Create a single scene image with text overlay using FFmpeg filters.
 * Returns path to the scene video clip.
 */
async function createSceneClip(scene, index, width, height, bgVideoPath = null) {
  const outputPath = path.join(TEMP_DIR, `scene_${index}_${uuidv4()}.mp4`);
  const duration = scene.duration || 5;

  // Escape text for FFmpeg drawtext filter
  const escapedText = scene.text
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, "\\\\:")
    .replace(/\[/g, "\\\\[")
    .replace(/\]/g, "\\\\]");

  // Font size based on scene type
  const fontSizes = {
    title: 54,
    intro: 40,
    body: 36,
    outro: 40,
    hashtags: 28,
  };
  const fontSize = fontSizes[scene.type] || 36;

  // Background color gradient based on scene type
  const bgColors = {
    title: "0x1a0a2e",
    intro: "0x0d1b2a",
    body: "0x1b1b2f",
    outro: "0x2d1b33",
    hashtags: "0x0a0a0a",
  };

  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    if (bgVideoPath && fs.existsSync(bgVideoPath)) {
      // Use stock video as background
      command
        .input(bgVideoPath)
        .inputOptions([`-t ${duration}`, "-stream_loop -1"])
        .complexFilter([
          `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1[bg]`,
          `[bg]drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=10,fade=t=in:st=0:d=0.5,fade=t=out:st=${duration - 0.5}:d=0.5[v]`,
        ])
        .outputOptions([
          "-map [v]",
          `-t ${duration}`,
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-preset ultrafast",
          "-r 24",
        ]);
    } else {
      // Create solid color background with text
      const bgColor = bgColors[scene.type] || "0x1b1b2f";
      command
        .input(`color=c=${bgColor}:s=${width}x${height}:d=${duration}:r=24`)
        .inputOptions(["-f lavfi"])
        .complexFilter([
          `[0:v]drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=10,fade=t=in:st=0:d=0.5,fade=t=out:st=${duration - 0.5}:d=0.5[v]`,
        ])
        .outputOptions([
          "-map [v]",
          `-t ${duration}`,
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-preset ultrafast",
          "-r 24",
        ]);
    }

    command
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => {
        console.error(`Scene ${index} error:`, err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Concatenate scene clips into a single video.
 */
async function concatenateClips(clipPaths, outputPath) {
  const listFile = path.join(TEMP_DIR, `concat_${uuidv4()}.txt`);
  const content = clipPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(listFile, content);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .output(outputPath)
      .on("end", () => {
        try { fs.unlinkSync(listFile); } catch (e) {}
        resolve(outputPath);
      })
      .on("error", (err) => reject(err))
      .run();
  });
}

/**
 * Merge video and audio tracks.
 */
async function mergeAudioVideo(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        "-shortest",
        "-map 0:v:0",
        "-map 1:a:0",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
}

/**
 * Main video generation function.
 */
async function generateVideo({
  title,
  description,
  niche,
  hashtags,
  videoFormat = "reel",
  pexelsApiKey = "",
  geminiKeys = [],
  voice = "en-US-ChristopherNeural",
  voiceRate = "+0%",
  voicePitch = "+0Hz",
  onProgress = () => {},
}) {
  const width = videoFormat === "reel" ? 1080 : 1920;
  const height = videoFormat === "reel" ? 1920 : 1080;
  const orientation = videoFormat === "reel" ? "portrait" : "landscape";
  const jobId = uuidv4();

  try {
    // Step 1: Generate script
    onProgress("Generating script...", 5);
    const scriptData = await generateScript(title, description, niche, hashtags, geminiKeys);
    const { scenes } = scriptData;
    onProgress(`Script generated via ${scriptData.source.toUpperCase()}`, 10);

    // Step 2: Generate TTS audio
    onProgress("Generating neural voiceover...", 15);
    const ttsPath = path.join(TEMP_DIR, `tts_${jobId}.mp3`);
    await generateTTS(scriptData.fullScript, ttsPath, voice, voiceRate, voicePitch);
    onProgress("Voiceover complete", 25);

    // Step 3: Fetch stock footage
    let stockVideoPaths = [];
    if (pexelsApiKey) {
      onProgress("Fetching stock footage from Pexels...", 30);
      const keywords = getSearchKeywords(niche, title);

      for (const keyword of keywords.slice(0, 4)) {
        if (stockVideoPaths.length >= scenes.length) break;
        const videos = await searchPexelsVideos(pexelsApiKey, keyword, 2, orientation);

        for (const vid of videos) {
          if (stockVideoPaths.length >= scenes.length) break;
          const dlPath = path.join(TEMP_DIR, `stock_${stockVideoPaths.length}_${jobId}.mp4`);
          const downloaded = await downloadPexelsVideo(vid, dlPath);
          if (downloaded) stockVideoPaths.push(downloaded);
        }
        onProgress(`Downloaded ${stockVideoPaths.length} stock clips...`, 30 + stockVideoPaths.length * 3);
      }
    }

    // Step 4: Create scene clips
    onProgress("Composing video scenes...", 55);
    const sceneClips = [];
    for (let i = 0; i < scenes.length; i++) {
      const bgVideo = i < stockVideoPaths.length ? stockVideoPaths[i] : null;
      const clipPath = await createSceneClip(scenes[i], i, width, height, bgVideo);
      sceneClips.push(clipPath);
      onProgress(`Scene ${i + 1}/${scenes.length} created`, 55 + Math.floor((i / scenes.length) * 25));
    }

    // Step 5: Concatenate scenes
    onProgress("Concatenating scenes...", 82);
    const concatPath = path.join(TEMP_DIR, `concat_${jobId}.mp4`);
    await concatenateClips(sceneClips, concatPath);

    // Step 6: Merge audio
    onProgress("Adding voiceover audio...", 88);
    const sanitizedTitle = title.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").slice(0, 50);
    const finalPath = path.join(OUTPUT_DIR, `${sanitizedTitle}_${videoFormat}_${jobId.slice(0, 8)}.mp4`);
    await mergeAudioVideo(concatPath, ttsPath, finalPath);

    // Cleanup temp files
    onProgress("Cleaning up...", 95);
    const tempFiles = [ttsPath, concatPath, ...sceneClips, ...stockVideoPaths];
    for (const f of tempFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
    }

    onProgress("Done!", 100);

    return {
      success: true,
      videoPath: finalPath,
      filename: path.basename(finalPath),
      scriptData,
    };
  } catch (err) {
    console.error("Video generation error:", err);
    return { success: false, error: err.message };
  }
}

module.exports = { generateVideo };
