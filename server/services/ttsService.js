/**
 * Edge TTS Service - Microsoft Neural Voices
 * Sounds 95% human — far better than gTTS.
 */

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Available neural voices
const VOICES = {
  "Christopher (Male, US)": "en-US-ChristopherNeural",
  "Aria (Female, US)": "en-US-AriaNeural",
  "Guy (Male, US)": "en-US-GuyNeural",
  "Jenny (Female, US)": "en-US-JennyNeural",
  "Eric (Male, US)": "en-US-EricNeural",
  "Andrew (Male, US)": "en-US-AndrewNeural",
  "Emma (Female, UK)": "en-GB-SoniaNeural",
  "Ryan (Male, UK)": "en-GB-RyanNeural",
  "Natasha (Female, AU)": "en-AU-NatashaNeural",
  "William (Male, AU)": "en-AU-WilliamNeural",
  "Neerja (Female, IN)": "en-IN-NeerjaNeural",
  "Prabhat (Male, IN)": "en-IN-PrabhatNeural",
};

/**
 * Generate TTS audio using edge-tts CLI.
 * edge-tts must be installed: pip install edge-tts
 */
async function generateTTS(text, outputPath, voice = "en-US-ChristopherNeural", rate = "+0%", pitch = "+0Hz") {
  // Validate text — edge-tts cannot generate audio for empty or whitespace-only input
  const cleanedText = (text || "").replace(/[.\s]+/g, " ").trim();
  if (!cleanedText || cleanedText.length < 2) {
    throw new Error("TTS text is empty or contains no speakable content. Check script generation.");
  }

  // Sanitize text for shell
  const sanitizedText = text
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "");

  const cmd = `edge-tts --voice "${voice}" --rate="${rate}" --pitch="${pitch}" --text "${sanitizedText}" --write-media "${outputPath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        // Try with py -m edge_tts as fallback
        const fallbackCmd = `py -m edge_tts --voice "${voice}" --rate="${rate}" --pitch="${pitch}" --text "${sanitizedText}" --write-media "${outputPath}"`;
        exec(fallbackCmd, { maxBuffer: 1024 * 1024 * 10 }, (err2, out2, serr2) => {
          if (err2) {
            console.error("Edge TTS error:", err2.message);
            reject(err2);
          } else {
            resolve(outputPath);
          }
        });
      } else {
        resolve(outputPath);
      }
    });
  });
}

module.exports = { generateTTS, VOICES };
