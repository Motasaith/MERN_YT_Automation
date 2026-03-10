// API service layer — connects to MERN backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/theme';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiCall = async (endpoint, options = {}) => {
  const headers = await getHeaders();
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

// ── Health ───────────────────────────────────
export const checkHealth = () => apiCall('/api/health');

// ── Scripts ──────────────────────────────────
export const generateScriptPreview = (title, description, niche, tone, duration) =>
  apiCall('/api/script/preview', {
    method: 'POST',
    body: JSON.stringify({ title, description, niche, tone, videoDuration: duration }),
  });

// ── Voices ───────────────────────────────────
export const getVoices = () => apiCall('/api/voices');

// ── Video Generation ─────────────────────────
export const startVideoGeneration = (params) =>
  apiCall('/api/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });

// ── AI Providers ─────────────────────────────
export const getAIProviders = () => apiCall('/api/ai-providers');

// ── Videos ───────────────────────────────────
export const getVideos = () => apiCall('/api/videos');
export const deleteVideo = (filename) =>
  apiCall(`/api/videos/${encodeURIComponent(filename)}`, { method: 'DELETE' });

// ── YouTube ──────────────────────────────────
export const getYouTubeStatus = () => apiCall('/api/youtube/status');
export const uploadToYouTube = (params) =>
  apiCall('/api/upload', {
    method: 'POST',
    body: JSON.stringify(params),
  });
export const revokeYouTube = () => apiCall('/api/youtube/revoke', { method: 'POST' });

// ── TTS (text-to-speech) ─────────────────────
export const generateVoice = (text, voice, rate, pitch) =>
  apiCall('/api/tts/generate', {
    method: 'POST',
    body: JSON.stringify({ text, voice, rate, pitch }),
  });

// ── Keywords ─────────────────────────────────
export const getKeywordTrends = (query) =>
  apiCall('/api/keywords/trends', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

// ── Thumbnails ───────────────────────────────
export const generateThumbnailPrompt = (title, script, style) =>
  apiCall('/api/thumbnail/prompt', {
    method: 'POST',
    body: JSON.stringify({ title, script, style }),
  });

export const generateThumbnailImage = (prompt) =>
  apiCall('/api/thumbnail/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });

// ── Social Scheduling ────────────────────────
export const getScheduledPosts = () => apiCall('/api/schedule/posts');
export const createScheduledPost = (post) =>
  apiCall('/api/schedule/posts', {
    method: 'POST',
    body: JSON.stringify(post),
  });
export const deleteScheduledPost = (id) =>
  apiCall(`/api/schedule/posts/${id}`, { method: 'DELETE' });

// ── Media / Pexels ───────────────────────────
export const searchMedia = (query, type = 'video') =>
  apiCall('/api/media/search', {
    method: 'POST',
    body: JSON.stringify({ query, type }),
  });

// ── User / Auth ──────────────────────────────
export const loginUser = (email, password) =>
  apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const registerUser = (name, email, password) =>
  apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

export const getUserProfile = () => apiCall('/api/auth/profile');

// ── Credits ──────────────────────────────────
export const getCredits = () => apiCall('/api/credits');
export const purchaseCredits = (pack) =>
  apiCall('/api/credits/purchase', {
    method: 'POST',
    body: JSON.stringify({ pack }),
  });
