// Theme & constants for the CreatorFlow app
export const COLORS = {
  // Backgrounds
  bg: '#0a0a1a',
  bgCard: '#141428',
  bgCardLight: '#1a1a3e',
  bgInput: '#1e1e3a',
  bgOverlay: 'rgba(10, 10, 26, 0.85)',

  // Primary / Accent
  primary: '#b44aff',
  primaryLight: '#d17aff',
  primaryDark: '#8a2be2',
  primaryGlow: 'rgba(180, 74, 255, 0.3)',

  // Secondary
  secondary: '#e040fb',
  secondaryDark: '#c020d9',
  gradient: ['#b44aff', '#e040fb'],
  gradientAlt: ['#8a2be2', '#b44aff', '#e040fb'],

  // Text
  text: '#ffffff',
  textSecondary: '#a0a0c0',
  textMuted: '#6a6a8a',
  textDark: '#3a3a5a',

  // Status 
  success: '#00e676',
  warning: '#ffc107',
  error: '#ff5252',
  info: '#40c4ff',

  // Premium
  premium: '#ffd700',
  premiumBg: 'rgba(255, 215, 0, 0.15)',

  // Specific
  border: '#2a2a4a',
  borderLight: '#3a3a6a',
  shadow: '#000000',
};

export const FONTS = {
  regular: { fontSize: 14, color: COLORS.text },
  medium: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  bold: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  heading: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  small: { fontSize: 12, color: COLORS.textSecondary },
  caption: { fontSize: 10, color: COLORS.textMuted },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// API Config — point to your MERN backend
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000' // Change to your local network IP
  : 'https://your-production-server.com';

export const TONE_OPTIONS = [
  { id: 'viral', label: 'Viral', icon: 'trending-up' },
  { id: 'educational', label: 'Educational', icon: 'school' },
  { id: 'storytelling', label: 'Storytelling', icon: 'auto-stories' },
  { id: 'funny', label: 'Funny', icon: 'mood' },
];

export const WORKFLOW_STEPS = [
  { id: 'script', label: 'Script', sublabel: 'AI Generation', icon: 'edit-note', color: COLORS.primary },
  { id: 'voice', label: 'Voice', sublabel: 'Neural Synthesis', icon: 'mic', color: COLORS.info },
  { id: 'media', label: 'Media', sublabel: 'Asset Sourcing', icon: 'perm-media', color: COLORS.success },
  { id: 'edit', label: 'Edit', sublabel: 'Pro Timeline', icon: 'movie-edit', color: COLORS.warning },
  { id: 'schedule', label: 'Schedule', sublabel: 'Auto-Publish', icon: 'schedule-send', color: COLORS.secondary },
];

export const TOOLS = [
  { id: 'script', name: 'Script Generator', desc: 'AI-powered scripts for YouTube, TikTok & Reels.', icon: 'description', route: '/scripts/generator' },
  { id: 'voice', name: 'Voice Generator', desc: 'Neural text-to-speech with 12+ AI voices.', icon: 'record-voice-over', route: '/voice' },
  { id: 'keywords', name: 'Keyword Trends', desc: 'Real-time search insights and viral topics.', icon: 'trending-up', route: '/keywords' },
  { id: 'thumbnail', name: 'Thumbnail AI', desc: 'Generate thumbnails with Stability AI.', icon: 'image', route: '/thumbnail' },
  { id: 'gallery', name: 'Media Gallery', desc: 'Browse free stock photos & videos from Pexels.', icon: 'collections', route: '/gallery' },
  { id: 'editor', name: 'Online Video Editor', desc: 'Cloud-based editing with stock library.', icon: 'movie-filter', route: '/editor' },
  { id: 'scheduler', name: 'Social Scheduler', desc: 'Multi-platform auto-posting tool.', icon: 'calendar-month', route: '/scheduler' },
  { id: 'brand', name: 'Brand Assets', desc: 'Manage logos, fonts, and brand styles.', icon: 'palette', route: '/brand' },
];
