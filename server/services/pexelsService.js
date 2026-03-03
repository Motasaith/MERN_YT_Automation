/**
 * Pexels Service - Free Stock Video Downloads
 * Fetches relevant stock footage for video backgrounds.
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Search Pexels for stock videos matching a query.
 */
async function searchPexelsVideos(apiKey, query, perPage = 5, orientation = "portrait") {
  try {
    const response = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: apiKey },
      params: {
        query,
        per_page: perPage,
        orientation,
        size: "medium",
      },
    });

    if (response.data && response.data.videos && response.data.videos.length > 0) {
      return response.data.videos.map((video) => {
        // Pick the best quality file that's not too large
        const files = video.video_files
          .filter((f) => f.width && f.width >= 720)
          .sort((a, b) => (a.width || 0) - (b.width || 0));
        const bestFile = files[0] || video.video_files[0];
        return {
          id: video.id,
          url: bestFile.link,
          width: bestFile.width,
          height: bestFile.height,
          duration: video.duration,
          image: video.image, // thumbnail
        };
      });
    }

    return [];
  } catch (error) {
    console.error("Pexels search error:", error.message);
    return [];
  }
}

/**
 * Download a Pexels video to a local path.
 */
async function downloadPexelsVideo(videoData, outputPath) {
  try {
    const url = typeof videoData === "string" ? videoData : videoData.url;
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
      timeout: 60000,
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(outputPath));
      writer.on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });
  } catch (error) {
    console.error("Pexels download error:", error.message);
    throw error;
  }
}

/**
 * Get search keywords from title/niche for better Pexels results.
 */
function getSearchQueries(title, niche) {
  const queries = [];
  
  if (niche) queries.push(niche);
  
  // Extract meaningful words from title
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "to", "of", "and", "or", "in", "on", "at", "for", "with", "how", "what", "why", "when", "top", "best"]);
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  
  if (titleWords.length >= 2) {
    queries.push(titleWords.slice(0, 3).join(" "));
  }
  
  // Fallback generic queries based on niche
  const nicheQueries = {
    technology: ["technology", "coding", "futuristic", "digital"],
    motivation: ["success", "sunrise", "running", "determination"],
    education: ["learning", "books", "classroom", "study"],
    fitness: ["gym", "workout", "running", "exercise"],
    cooking: ["cooking", "kitchen", "food preparation", "chef"],
    travel: ["travel", "landscape", "adventure", "nature"],
    finance: ["money", "business", "stock market", "investment"],
    gaming: ["gaming", "esports", "controller", "neon"],
    science: ["science", "laboratory", "space", "research"],
    health: ["health", "wellness", "meditation", "nature"],
  };
  
  const lowerNiche = (niche || "").toLowerCase();
  if (nicheQueries[lowerNiche]) {
    queries.push(...nicheQueries[lowerNiche].slice(0, 2));
  }
  
  return queries.length > 0 ? queries : ["abstract background", "cinematic"];
}

module.exports = { searchPexelsVideos, downloadPexelsVideo, getSearchQueries };
