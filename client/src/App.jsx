import { useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Sparkles, Video, Upload, Settings, Play, Download,
  Trash2, Eye, ChevronDown, ChevronUp, Mic, Key,
  Film, Hash, FileText, Zap, Volume2, RefreshCw
} from 'lucide-react'

const API_BASE = ''  // proxy handles it in dev

function App() {
  // ─── State ───
  const [activeTab, setActiveTab] = useState('generate')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    niche: 'technology',
    hashtags: '',
    videoFormat: 'reel',
  })
  const [voiceSettings, setVoiceSettings] = useState({
    voice: 'en-US-ChristopherNeural',
    voiceRate: 0,
    voicePitch: 0,
  })
  const [youtubeCredentials, setYoutubeCredentials] = useState({
    clientId: '',
    clientSecret: '',
  })

  const [voices, setVoices] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ step: '', progress: 0, message: '' })
  const [currentJobId, setCurrentJobId] = useState(null)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [scriptPreview, setScriptPreview] = useState(null)
  const [generatedVideos, setGeneratedVideos] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isPreviewingScript, setIsPreviewingScript] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [socket, setSocket] = useState(null)

  // ─── Load voices + connect socket ───
  useEffect(() => {
    // Fetch voices
    axios.get(`${API_BASE}/api/voices`).then(res => {
      setVoices(res.data.voices || {})
    }).catch(() => {})

    // Fetch existing videos
    axios.get(`${API_BASE}/api/videos`).then(res => {
      setGeneratedVideos(res.data.videos || [])
    }).catch(() => {})

    // Socket connection
    const s = io(window.location.origin, { transports: ['websocket', 'polling'] })
    setSocket(s)
    return () => s.disconnect()
  }, [])

  // ─── Listen for job progress ───
  useEffect(() => {
    if (!socket || !currentJobId) return

    const onProgress = (data) => {
      setProgress(data)
    }
    const onComplete = (data) => {
      setIsGenerating(false)
      if (data.success) {
        setGeneratedVideo(data)
        if (data.script) setScriptPreview(data.script)
        toast.success('Video generated successfully!')
        // Refresh video list
        axios.get(`${API_BASE}/api/videos`).then(res => {
          setGeneratedVideos(res.data.videos || [])
        }).catch(() => {})
      } else {
        toast.error(`Generation failed: ${data.error}`)
      }
    }

    socket.on(`progress:${currentJobId}`, onProgress)
    socket.on(`complete:${currentJobId}`, onComplete)

    return () => {
      socket.off(`progress:${currentJobId}`, onProgress)
      socket.off(`complete:${currentJobId}`, onComplete)
    }
  }, [socket, currentJobId])

  // ─── Handlers ───
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerateVideo = async () => {
    if (!formData.title.trim()) {
      toast.warning('Please enter a video title')
      return
    }

    setIsGenerating(true)
    setProgress({ step: '', progress: 0, message: 'Starting...' })
    setGeneratedVideo(null)

    try {
      const rate = voiceSettings.voiceRate >= 0 ? `+${voiceSettings.voiceRate}%` : `${voiceSettings.voiceRate}%`
      const pitch = voiceSettings.voicePitch >= 0 ? `+${voiceSettings.voicePitch}Hz` : `${voiceSettings.voicePitch}Hz`

      const res = await axios.post(`${API_BASE}/api/generate`, {
        ...formData,
        voice: voiceSettings.voice,
        voiceRate: rate,
        voicePitch: pitch,
      })

      setCurrentJobId(res.data.jobId)
    } catch (error) {
      setIsGenerating(false)
      toast.error(`Error: ${error.response?.data?.error || error.message}`)
    }
  }

  const handlePreviewScript = async () => {
    if (!formData.title.trim()) {
      toast.warning('Please enter a video title')
      return
    }

    setIsPreviewingScript(true)
    try {
      const res = await axios.post(`${API_BASE}/api/script/preview`, {
        title: formData.title,
        description: formData.description,
        niche: formData.niche,
      })
      setScriptPreview(res.data.script)
      toast.success(`Script generated via ${res.data.script.source}`)
    } catch (error) {
      toast.error(`Script error: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsPreviewingScript(false)
    }
  }

  const handleUploadToYoutube = async () => {
    if (!generatedVideo?.videoUrl) {
      toast.warning('No video to upload')
      return
    }
    if (!youtubeCredentials.clientId || !youtubeCredentials.clientSecret) {
      toast.warning('YouTube API credentials required')
      return
    }

    setIsUploading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/upload`, {
        videoPath: generatedVideo.fileName,
        title: formData.title,
        description: `${formData.description}\n\n${formData.hashtags}`,
        tags: formData.hashtags.replace(/#/g, '').split(/\s+/).join(','),
        privacy: 'private',
        ...youtubeCredentials,
      })
      toast.success(`Uploaded! ${res.data.url}`)
    } catch (error) {
      toast.error(`Upload error: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteVideo = async (filename) => {
    try {
      await axios.delete(`${API_BASE}/api/videos/${filename}`)
      setGeneratedVideos(prev => prev.filter(v => v.name !== filename))
      toast.info('Video deleted')
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  const NICHES = [
    'technology', 'motivation', 'education', 'fitness', 'cooking',
    'travel', 'finance', 'gaming', 'science', 'health', 'entertainment', 'general'
  ]

  // ─── Render ───
  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <h1>YouTube Automation Studio</h1>
        <p>Generate AI-powered videos with neural voices &amp; stock footage — 100% free</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>
          <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Generate
        </button>
        <button className={`tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
          <Film size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          My Videos
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Settings
        </button>
      </div>

      {/* ════════ GENERATE TAB ════════ */}
      {activeTab === 'generate' && (
        <div className="main-grid">
          {/* Left Column — Form */}
          <div>
            {/* Video Details */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title"><FileText size={20} /> Video Details</div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  className="form-input"
                  placeholder="e.g. 5 AI Tools That Will Replace Your Job in 2025"
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Brief description of the video content..."
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Niche</label>
                  <select
                    className="form-select"
                    value={formData.niche}
                    onChange={e => handleInputChange('niche', e.target.value)}
                  >
                    {NICHES.map(n => (
                      <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Format</label>
                  <select
                    className="form-select"
                    value={formData.videoFormat}
                    onChange={e => handleInputChange('videoFormat', e.target.value)}
                  >
                    <option value="reel">Reel / Short (9:16)</option>
                    <option value="landscape">Landscape (16:9)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Hashtags</label>
                <input
                  className="form-input"
                  placeholder="#ai #technology #2025 #viral"
                  value={formData.hashtags}
                  onChange={e => handleInputChange('hashtags', e.target.value)}
                />
              </div>
            </div>

            {/* Voice Settings */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title"><Mic size={20} /> Voice Settings</div>

              <div className="form-group">
                <label>Neural Voice</label>
                <select
                  className="form-select"
                  value={voiceSettings.voice}
                  onChange={e => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                >
                  {Object.entries(voices).length > 0
                    ? Object.entries(voices).map(([label, id]) => (
                        <option key={id} value={id}>{label}</option>
                      ))
                    : <>
                        <option value="en-US-ChristopherNeural">Christopher (Male, US)</option>
                        <option value="en-US-AriaNeural">Aria (Female, US)</option>
                        <option value="en-US-GuyNeural">Guy (Male, US)</option>
                        <option value="en-US-JennyNeural">Jenny (Female, US)</option>
                      </>
                  }
                </select>
              </div>

              <div className="form-group">
                <label>Speech Rate</label>
                <div className="slider-group">
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={voiceSettings.voiceRate}
                    onChange={e => setVoiceSettings(prev => ({ ...prev, voiceRate: parseInt(e.target.value) }))}
                  />
                  <span className="slider-value">{voiceSettings.voiceRate >= 0 ? '+' : ''}{voiceSettings.voiceRate}%</span>
                </div>
              </div>

              <div className="form-group">
                <label>Pitch</label>
                <div className="slider-group">
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    value={voiceSettings.voicePitch}
                    onChange={e => setVoiceSettings(prev => ({ ...prev, voicePitch: parseInt(e.target.value) }))}
                  />
                  <span className="slider-value">{voiceSettings.voicePitch >= 0 ? '+' : ''}{voiceSettings.voicePitch}Hz</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={handlePreviewScript}
                disabled={isPreviewingScript || isGenerating}
                style={{ flex: 1 }}
              >
                {isPreviewingScript ? <div className="spinner" /> : <Eye size={16} />}
                Preview Script
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                style={{ flex: 2 }}
              >
                {isGenerating ? <div className="spinner" /> : <Zap size={16} />}
                {isGenerating ? 'Generating...' : 'Generate Video'}
              </button>
            </div>
          </div>

          {/* Right Column — Output */}
          <div>
            {/* Progress */}
            {isGenerating && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title"><RefreshCw size={20} className="spinner" /> Generating Video</div>
                <div className="progress-container">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress.progress}%` }} />
                  </div>
                  <div className="progress-text">
                    <span>{progress.message || 'Starting...'}</span>
                    <span>{progress.progress}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Script Preview */}
            {scriptPreview && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title">
                  <FileText size={20} />
                  Script Preview
                  <span className={`badge badge-gemini`}>
                    ✨ {scriptPreview.source || 'AI'}
                  </span>
                </div>
                <div className="script-preview">
                  {scriptPreview.scenes?.map((scene, i) => (
                    <div className="script-scene" key={i}>
                      <div className="script-scene-title">{scene.type?.toUpperCase() || `Scene ${i + 1}`}</div>
                      <div>{scene.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Video */}
            {generatedVideo?.success && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title"><Video size={20} /> Your Video</div>
                <div className="video-player-container">
                  <video controls src={generatedVideo.videoUrl} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <a
                    href={generatedVideo.videoUrl}
                    download={generatedVideo.fileName}
                    className="btn btn-success btn-sm"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <Download size={14} /> Download
                  </a>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setActiveTab('settings')}
                  >
                    <Upload size={14} /> Upload to YouTube
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isGenerating && !generatedVideo && !scriptPreview && (
              <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                <Sparkles size={48} color="var(--accent)" style={{ marginBottom: 16 }} />
                <h3 style={{ marginBottom: 8 }}>Ready to Create</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Fill in the details and click Generate to create your video
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ VIDEOS TAB ════════ */}
      {activeTab === 'videos' && (
        <div className="card">
          <div className="card-title" style={{ justifyContent: 'space-between' }}>
            <span><Film size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />Generated Videos</span>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              axios.get(`${API_BASE}/api/videos`).then(res => setGeneratedVideos(res.data.videos || []))
            }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {generatedVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Film size={40} style={{ marginBottom: 12 }} />
              <p>No videos generated yet</p>
            </div>
          ) : (
            generatedVideos.map((video, i) => (
              <div className="video-list-item" key={i}>
                <div>
                  <div className="video-name" title={video.name}>{video.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {(video.size / 1024 / 1024).toFixed(1)} MB — {new Date(video.created).toLocaleDateString()}
                  </div>
                </div>
                <div className="video-actions">
                  <a href={video.url} target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                    <Play size={12} />
                  </a>
                  <a href={video.url} download className="btn btn-success btn-sm" style={{ textDecoration: 'none' }}>
                    <Download size={12} />
                  </a>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVideo(video.name)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════ SETTINGS TAB ════════ */}
      {activeTab === 'settings' && (
        <div className="main-grid">
          <div>
            {/* API Keys Setup Guide */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title"><Key size={20} /> API Keys Setup</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 12 }}>
                API keys are configured in the server's <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>.env</code> file for security. No keys needed in the UI.
              </p>
              <div style={{ lineHeight: 2, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--accent)' }}>Pexels API Key</strong> (stock footage)
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                    1. Go to <a href="https://www.pexels.com/api/" target="_blank" style={{ color: 'var(--accent)' }}>pexels.com/api</a> and sign up for free<br/>
                    2. Copy your API key<br/>
                    3. Add to <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>server/.env</code>: <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>PEXELS_API_KEY=your_key_here</code>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--accent)' }}>OpenRouter API Key</strong> (AI script generation)
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                    1. Go to <a href="https://openrouter.ai/keys" target="_blank" style={{ color: 'var(--accent)' }}>openrouter.ai/keys</a> and create a free key<br/>
                    2. Copy your API key<br/>
                    3. Add to <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>server/.env</code>: <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>OPENROUTER_API_KEY=your_key_here</code>
                  </div>
                </div>
                <div>
                  <strong style={{ color: 'var(--accent)' }}>Gemini API Keys</strong> (fallback, optional)
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                    1. Go to <a href="https://aistudio.google.com/apikey" target="_blank" style={{ color: 'var(--accent)' }}>aistudio.google.com/apikey</a><br/>
                    2. Add comma-separated keys to <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>server/.env</code>: <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>GEMINI_API_KEYS=key1,key2</code>
                  </div>
                </div>
              </div>
            </div>

            {/* YouTube Credentials */}
            <div className="card">
              <div className="card-title"><Upload size={20} /> YouTube Upload</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 12 }}>
                Enter your Google Cloud OAuth2 credentials to upload videos directly to YouTube.
                Create them in the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style={{ color: 'var(--accent)' }}>Google Cloud Console</a>.
              </p>
              <div className="form-group">
                <label>OAuth2 Client ID</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter Client ID"
                  value={youtubeCredentials.clientId}
                  onChange={e => setYoutubeCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>OAuth2 Client Secret</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter Client Secret"
                  value={youtubeCredentials.clientSecret}
                  onChange={e => setYoutubeCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                />
              </div>
              {generatedVideo?.success && (
                <button
                  className="btn btn-primary"
                  onClick={handleUploadToYoutube}
                  disabled={isUploading || !youtubeCredentials.clientId || !youtubeCredentials.clientSecret}
                  style={{ marginTop: 8 }}
                >
                  {isUploading ? <div className="spinner" /> : <Upload size={16} />}
                  {isUploading ? 'Uploading...' : 'Upload to YouTube'}
                </button>
              )}
            </div>
          </div>

          <div>
            {/* How It Works */}
            <div className="card">
              <div className="card-title"><Sparkles size={20} /> How It Works</div>
              <div style={{ lineHeight: 2, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div><strong style={{ color: 'var(--accent)' }}>1.</strong> Enter your video title, description, and niche</div>
                <div><strong style={{ color: 'var(--accent)' }}>2.</strong> AI generates a unique script via OpenRouter / Gemini</div>
                <div><strong style={{ color: 'var(--accent)' }}>3.</strong> Neural voice (Edge TTS) creates natural-sounding narration</div>
                <div><strong style={{ color: 'var(--accent)' }}>4.</strong> Stock footage from Pexels adds visual depth</div>
                <div><strong style={{ color: 'var(--accent)' }}>5.</strong> FFmpeg renders the final video with text overlays</div>
                <div><strong style={{ color: 'var(--accent)' }}>6.</strong> Download or upload directly to YouTube</div>
              </div>
              <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-input)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--warning)' }}>Free Tier Limits:</strong><br />
                • OpenRouter: Free models unlimited*<br />
                • Pexels: 200 requests/month<br />
                • Gemini (fallback): 15 req/min per key<br />
                • YouTube: ~6 uploads/day<br />
                • Edge TTS: Unlimited
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
