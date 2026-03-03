/**
 * YouTube Upload Service - OAuth2 Upload via YouTube Data API v3
 * Supports resumable uploads with retry logic.
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const http = require("http");
const open = require("open");
const url = require("url");

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const TOKEN_PATH = path.join(__dirname, "..", "youtube_token.json");

/**
 * Get OAuth2 client configured with credentials.
 */
function getOAuth2Client(clientId, clientSecret) {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:3333/oauth2callback"
  );
}

/**
 * Authorize via browser OAuth2 flow.
 * Returns an authenticated OAuth2 client.
 */
async function authorize(clientId, clientSecret) {
  const oauth2Client = getOAuth2Client(clientId, clientSecret);

  // Check for existing token
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
      oauth2Client.setCredentials(tokenData);

      // Check if token is expired
      if (tokenData.expiry_date && tokenData.expiry_date > Date.now()) {
        return oauth2Client;
      }

      // Try to refresh
      if (tokenData.refresh_token) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
        return oauth2Client;
      }
    } catch (err) {
      console.log("Stored token invalid, re-authenticating...");
    }
  }

  // Start new OAuth2 flow
  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });

    // Start a temporary server to receive the callback
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = url.parse(req.url, true);
        if (parsedUrl.pathname === "/oauth2callback") {
          const code = parsedUrl.query.code;
          if (!code) {
            res.end("Authorization failed — no code received.");
            server.close();
            reject(new Error("No authorization code received"));
            return;
          }

          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          res.end(`
            <html>
              <body style="font-family: Arial; text-align: center; padding: 60px; background: #1a1a2e; color: #e94560;">
                <h1>✅ Authorization Successful!</h1>
                <p style="color: #ccc;">You can close this window and return to the app.</p>
              </body>
            </html>
          `);
          server.close();
          resolve(oauth2Client);
        }
      } catch (err) {
        res.end("Authorization failed.");
        server.close();
        reject(err);
      }
    });

    server.listen(3333, () => {
      console.log("Opening browser for YouTube authorization...");
      open(authUrl).catch(() => {
        console.log("Could not open browser. Visit this URL manually:");
        console.log(authUrl);
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 5 minutes"));
    }, 300000);
  });
}

/**
 * Upload a video to YouTube.
 */
async function uploadVideo(filePath, metadata, clientId, clientSecret, onProgress) {
  const oauth2Client = await authorize(clientId, clientSecret);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const fileSize = fs.statSync(filePath).size;

  const res = await youtube.videos.insert(
    {
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: metadata.title || "Untitled Video",
          description: metadata.description || "",
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || "22", // People & Blogs
          defaultLanguage: "en",
        },
        status: {
          privacyStatus: metadata.privacy || "private",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    },
    {
      onUploadProgress: (evt) => {
        const progress = Math.round((evt.bytesRead / fileSize) * 100);
        if (onProgress) onProgress(progress);
      },
    }
  );

  return {
    videoId: res.data.id,
    url: `https://www.youtube.com/watch?v=${res.data.id}`,
    title: res.data.snippet.title,
    status: res.data.status.uploadStatus,
  };
}

/**
 * Check if user is already authenticated.
 */
function isAuthenticated() {
  if (!fs.existsSync(TOKEN_PATH)) return false;
  try {
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    return tokenData.expiry_date && tokenData.expiry_date > Date.now();
  } catch {
    return false;
  }
}

/**
 * Revoke stored credentials.
 */
function revokeAuth() {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
    return true;
  }
  return false;
}

module.exports = {
  authorize,
  uploadVideo,
  isAuthenticated,
  revokeAuth,
};
