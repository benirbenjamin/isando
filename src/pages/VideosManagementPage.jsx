import React, { useState, useEffect } from 'react';
import {
  Video as VideoIcon, Youtube, UploadCloud, Plus, RefreshCw, Trash2, Edit3,
  Sparkles, CheckCircle2, AlertCircle, Eye, Settings, ExternalLink, Play,
  Search, X, FileVideo, HardDrive
} from 'lucide-react';
import { api, getWhatsAppLink } from '../services/api';
import { cleanVideoFileName, compressVideoFile, uploadVideoWithChunks, formatFileSize } from '../utils/videoCompressor';

export default function VideosManagementPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // YouTube Channel Sync State
  const [channelConfig, setChannelConfig] = useState({ channelId: '', lastSync: null, configured: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Modals
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [savingChannel, setSavingChannel] = useState(false);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [modalTab, setModalTab] = useState('YOUTUBE'); // 'YOUTUBE' or 'UPLOAD'

  // Video Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeThumb, setYoutubeThumb] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [inspectingYoutube, setInspectingYoutube] = useState(false);

  // Upload & Compression State
  const [selectedFile, setSelectedFile] = useState(null);
  const [shouldCompress, setShouldCompress] = useState(true);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionSavings, setCompressionSavings] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Preview Player Modal
  const [previewVideo, setPreviewVideo] = useState(null);

  // Load videos and channel config
  const loadData = async () => {
    setLoading(true);
    try {
      const [vidsRes, configRes] = await Promise.all([
        api.get('/videos?limit=100').catch(() => ({ videos: [] })),
        api.get('/videos/channel-config/status').catch(() => ({ channelId: '', lastSync: null, configured: false }))
      ]);
      setVideos(vidsRes.videos || []);
      setChannelConfig(configRes);
      setChannelInput(configRes.channelId || '');
    } catch (err) {
      console.warn('Error loading video management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. YouTube Channel Sync
  const handleSyncChannel = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await api.post('/videos/sync', { channelId: channelConfig.channelId });
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: res.message || `Successfully synced YouTube channel! (${res.importedCount} new videos imported)`
        });
        loadData();
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message || 'Could not sync YouTube channel.'
        });
      }
    } catch (err) {
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Failed to sync YouTube channel'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Save YouTube Channel Configuration
  const handleSaveChannelConfig = async (e) => {
    e.preventDefault();
    if (!channelInput.trim()) return;

    setSavingChannel(true);
    try {
      const res = await api.post('/videos/channel-config', {
        channelId: channelInput.trim(),
        autoSyncNow: true
      });
      setChannelConfig(prev => ({
        ...prev,
        channelId: res.channelId || channelInput.trim(),
        configured: true,
        lastSync: new Date().toISOString()
      }));
      setShowChannelModal(false);
      setSyncFeedback({
        type: 'success',
        message: `YouTube Channel saved! ${res.syncResult?.message || 'Sync in progress.'}`
      });
      loadData();
    } catch (err) {
      alert('Error saving channel: ' + err.message);
    } finally {
      setSavingChannel(false);
    }
  };

  // 3. Inspect YouTube URL automatically
  const handleInspectYoutubeUrl = async (url) => {
    setYoutubeUrl(url);
    if (!url || (!url.includes('youtu') && url.length < 11)) return;

    setInspectingYoutube(true);
    try {
      const info = await api.post('/videos/fetch-youtube-info', { url });
      if (info) {
        setYoutubeId(info.youtubeId);
        setYoutubeThumb(info.thumbnailUrl);
        if (!videoTitle) {
          setVideoTitle(info.title);
        }
      }
    } catch (err) {
      console.warn('Could not inspect YouTube URL:', err.message);
    } finally {
      setInspectingYoutube(false);
    }
  };

  // 4. File input change: catch video name and prepare compression
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setCompressionSavings(null);
    setCompressionProgress(0);
    setUploadProgress(0);

    // Automatically catch video filename & populate clean title
    if (!videoTitle) {
      const cleanTitle = cleanVideoFileName(file.name);
      setVideoTitle(cleanTitle);
    }
  };

  // 5. Open Add Video Modal
  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setVideoTitle('');
    setVideoDesc('');
    setYoutubeUrl('');
    setYoutubeThumb('');
    setYoutubeId('');
    setUploadedUrl('');
    setSelectedFile(null);
    setIsFeatured(true);
    setCompressionSavings(null);
    setModalTab('YOUTUBE');
    setShowVideoModal(true);
  };

  // 6. Open Edit Video Modal
  const handleOpenEditModal = (video) => {
    setEditingVideo(video);
    setVideoTitle(video.title || '');
    setVideoDesc(video.description || '');
    setYoutubeUrl(video.videoUrl || '');
    setYoutubeThumb(video.thumbnailUrl || '');
    setYoutubeId(video.youtubeId || '');
    setUploadedUrl(video.sourceType === 'UPLOAD' ? video.videoUrl : '');
    setSelectedFile(null);
    setIsFeatured(Boolean(video.isFeatured));
    setModalTab(video.sourceType || 'YOUTUBE');
    setShowVideoModal(true);
  };

  // 7. Save Video (Create or Update)
  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      alert('Please enter a video title');
      return;
    }

    setSubmitting(true);
    try {
      let finalVideoUrl = editingVideo?.videoUrl || '';
      let finalSourceType = modalTab;
      let finalYoutubeId = youtubeId;
      let finalThumb = youtubeThumb;

      if (modalTab === 'YOUTUBE') {
        if (!youtubeUrl.trim() && !finalVideoUrl) {
          alert('Please enter a YouTube video URL');
          setSubmitting(false);
          return;
        }
        finalVideoUrl = youtubeUrl.trim() || finalVideoUrl;
        finalSourceType = 'YOUTUBE';
      } else if (modalTab === 'UPLOAD') {
        finalSourceType = 'UPLOAD';

        // If user picked a new file to upload
        if (selectedFile) {
          let fileToUpload = selectedFile;

          // Perform video compression if enabled
          if (shouldCompress && selectedFile.size > 3 * 1024 * 1024) {
            setIsCompressing(true);
            try {
              fileToUpload = await compressVideoFile(selectedFile, {
                onProgress: (pct) => setCompressionProgress(pct)
              });
              const savedPct = Math.round(((selectedFile.size - fileToUpload.size) / selectedFile.size) * 100);
              if (savedPct > 0) {
                setCompressionSavings(`Compressed: ${formatFileSize(selectedFile.size)} ➔ ${formatFileSize(fileToUpload.size)} (${savedPct}% saved)`);
              }
            } catch (compErr) {
              console.warn('Compression skipped:', compErr.message);
            } finally {
              setIsCompressing(false);
            }
          }

          // Upload video via chunked upload
          setIsUploading(true);
          const uploadRes = await uploadVideoWithChunks(fileToUpload, (pct) => {
            setUploadProgress(pct);
          });
          setIsUploading(false);

          finalVideoUrl = uploadRes.url;
          finalThumb = uploadRes.thumbnailUrl || uploadRes.url;
        }

        if (!finalVideoUrl) {
          alert('Please select a video file to upload');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        title: videoTitle.trim(),
        description: videoDesc.trim(),
        videoUrl: finalVideoUrl,
        youtubeId: finalYoutubeId || null,
        thumbnailUrl: finalThumb || null,
        sourceType: finalSourceType,
        isFeatured,
      };

      if (editingVideo) {
        await api.put(`/videos/${editingVideo.id}`, payload);
      } else {
        await api.post('/videos', payload);
      }

      setShowVideoModal(false);
      loadData();
    } catch (err) {
      alert('Error saving video: ' + err.message);
    } finally {
      setSubmitting(false);
      setIsCompressing(false);
      setIsUploading(false);
    }
  };

  // 8. Toggle Featured in Spotlight
  const handleToggleFeatured = async (video) => {
    try {
      const nextVal = !video.isFeatured;
      await api.put(`/videos/${video.id}`, { isFeatured: nextVal });
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, isFeatured: nextVal } : v));
    } catch (err) {
      alert('Error updating spotlight status: ' + err.message);
    }
  };

  // 9. Delete video
  const handleDeleteVideo = async (video) => {
    if (!window.confirm(`Are you sure you want to delete "${video.title}"?`)) return;
    try {
      await api.delete(`/videos/${video.id}`);
      setVideos(prev => prev.filter(v => v.id !== video.id));
    } catch (err) {
      alert('Error deleting video: ' + err.message);
    }
  };

  const filteredVideos = videos.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (v.title || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark flex items-center gap-2.5">
            <VideoIcon className="w-8 h-8 text-brand-red" />
            <span>Videos & Media Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Post YouTube videos or upload compressed clips, sync channel videos automatically 4 times a day, and manage Featured Spotlight.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowChannelModal(true)}
            className="inline-flex items-center gap-1.5 bg-white border border-brand-border hover:bg-gray-50 text-brand-dark px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span>YouTube Channel Settings</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 bg-brand-red hover:bg-brand-redDark text-white px-4 py-2 rounded-xl text-xs font-black shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Video</span>
          </button>
        </div>
      </div>

      {/* YouTube Channel Sync Banner Card */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 fill-white" />
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Automated Channel Sync (4x Daily)
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black">
            {channelConfig.configured
              ? `Channel Connected: ${channelConfig.channelId}`
              : 'No YouTube Channel Connected'}
          </h3>
          <p className="text-xs text-white/90">
            {channelConfig.configured
              ? `Automated background crawler checks every 6 hours (4 times a day) for newly uploaded videos.`
              : 'Connect your YouTube Channel ID or @handle to automatically import and post new videos with titles & descriptions.'}
            {channelConfig.lastSync && (
              <span className="block mt-0.5 text-white/80">
                Last checked: {new Date(channelConfig.lastSync).toLocaleString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {channelConfig.configured ? (
            <button
              onClick={handleSyncChannel}
              disabled={isSyncing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-red-700 hover:bg-amber-100 font-black text-xs px-5 py-2.5 rounded-full shadow transition disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Checking for New Videos...' : 'Check for New Videos Now'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowChannelModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-black text-xs px-5 py-2.5 rounded-full shadow transition"
            >
              <Settings className="w-4 h-4" />
              <span>Connect Channel ID</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-sm ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-gray-400 hover:text-gray-600 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Videos List Section */}
      <div className="bg-white rounded-3xl border border-brand-border p-4 sm:p-6 shadow-sm space-y-4">
        {/* Search & Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-brand-dark">Video Library</span>
            <span className="bg-brand-soft text-brand-dark text-xs font-black px-2.5 py-0.5 rounded-full border border-brand-border">
              {videos.length} Total
            </span>
            <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full">
              {videos.filter(v => v.isFeatured).length} In Spotlight
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </div>
        </div>

        {/* Videos Table */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-yellow" />
            <span>Loading video records...</span>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs space-y-2">
            <FileVideo className="w-8 h-8 mx-auto text-gray-300" />
            <p>No videos found matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Video</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3 text-center">Featured Spotlight</th>
                  <th className="py-3 px-3 text-center">Views</th>
                  <th className="py-3 px-3">Date Added</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVideos.map((video) => {
                  const isYoutube = video.sourceType === 'YOUTUBE' || Boolean(video.youtubeId);
                  const thumb = video.thumbnailUrl || (video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` : '');

                  return (
                    <tr key={video.id} className="hover:bg-gray-50/80 transition">
                      {/* Video Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 max-w-md">
                          <div
                            onClick={() => setPreviewVideo(video)}
                            className="relative w-20 h-12 bg-black rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group/thumb"
                          >
                            <img
                              src={thumb || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=70'}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover/thumb:scale-110 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover/thumb:opacity-100">
                              <Play className="w-4 h-4 fill-white text-white" />
                            </div>
                          </div>

                          <div className="truncate">
                            <span
                              onClick={() => setPreviewVideo(video)}
                              className="font-extrabold text-brand-dark hover:text-brand-red cursor-pointer truncate block"
                            >
                              {video.title}
                            </span>
                            {video.description && (
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isYoutube ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold text-[10px] border border-red-200">
                            <Youtube className="w-3 h-3 text-red-600" />
                            <span>YouTube</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[10px] border border-blue-200">
                            <UploadCloud className="w-3 h-3 text-blue-600" />
                            <span>Uploaded</span>
                          </span>
                        )}
                      </td>

                      {/* Featured Spotlight Toggle */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleFeatured(video)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black transition ${
                            video.isFeatured
                              ? 'bg-brand-yellow text-brand-dark shadow-sm'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title="Click to toggle Featured in Homepage Spotlight"
                        >
                          <Sparkles className={`w-3 h-3 ${video.isFeatured ? 'text-brand-red' : ''}`} />
                          <span>{video.isFeatured ? 'In Spotlight' : 'Off'}</span>
                        </button>
                      </td>

                      {/* Views */}
                      <td className="py-3 px-3 text-center text-gray-500 whitespace-nowrap">
                        {video.viewsCount || 0}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewVideo(video)}
                            className="p-1.5 text-gray-400 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition"
                            title="Play Video Preview"
                          >
                            <Play className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(video)}
                            className="p-1.5 text-gray-400 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition"
                            title="Edit Video"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteVideo(video)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          CONFIGURE YOUTUBE CHANNEL MODAL
          ========================================================================= */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-brand-border">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-lg text-brand-dark">YouTube Channel Sync</h3>
              </div>
              <button onClick={() => setShowChannelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannelConfig} className="space-y-4 text-xs">
              <p className="text-gray-500 leading-relaxed">
                Enter your YouTube Channel ID (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">UC...</code>) or your Channel handle (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">@RomanticTSolutions</code>).
              </p>

              <div>
                <label className="font-extrabold text-brand-dark block mb-1.5">
                  YouTube Channel ID or URL:
                </label>
                <input
                  type="text"
                  placeholder="e.g. UCxxxxxxxxxxxxxxxxxxxxxx or @handle"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl font-mono text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div className="bg-amber-50 border border-brand-yellow/40 p-3 rounded-xl text-amber-900 leading-relaxed text-[11px]">
                <strong>Automated Crawling:</strong> When configured, the system automatically checks your channel 4 times a day (every 6 hours) and posts newly uploaded videos directly to your website.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowChannelModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChannel}
                  className="px-5 py-2 bg-brand-red hover:bg-brand-redDark text-white font-black rounded-xl shadow transition disabled:opacity-50"
                >
                  {savingChannel ? 'Verifying & Saving...' : 'Save & Sync Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD / EDIT VIDEO MODAL (YOUTUBE OR UPLOAD WITH COMPRESSION)
          ========================================================================= */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-brand-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-lg text-brand-dark">
                {editingVideo ? 'Edit Video Details' : 'Post a New Video'}
              </h3>
              <button onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Mode Toggle (Only when creating new) */}
            {!editingVideo && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-brand-soft rounded-2xl border border-brand-border">
                <button
                  type="button"
                  onClick={() => setModalTab('YOUTUBE')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition ${
                    modalTab === 'YOUTUBE'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-brand-dark'
                  }`}
                >
                  <Youtube className="w-4 h-4" />
                  <span>YouTube Video Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('UPLOAD')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition ${
                    modalTab === 'UPLOAD'
                      ? 'bg-brand-dark text-white shadow-sm'
                      : 'text-gray-600 hover:text-brand-dark'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Video File</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs">
              {/* YouTube Tab Inputs */}
              {modalTab === 'YOUTUBE' && (
                <div className="space-y-2">
                  <label className="font-extrabold text-brand-dark block">
                    YouTube URL or Video ID:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=LXb3EKWsInQ"
                      value={youtubeUrl}
                      onChange={(e) => handleInspectYoutubeUrl(e.target.value)}
                      required={!editingVideo}
                      className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                    {inspectingYoutube && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      </span>
                    )}
                  </div>

                  {youtubeThumb && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black mt-2">
                      <img src={youtubeThumb} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        YouTube Preview
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Tab Inputs */}
              {modalTab === 'UPLOAD' && (
                <div className="space-y-3">
                  <label className="font-extrabold text-brand-dark block">
                    Select Video File (Automatically catches title):
                  </label>

                  <div className="border-2 border-dashed border-brand-border hover:border-brand-yellow rounded-2xl p-6 text-center bg-brand-soft/50 cursor-pointer relative">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/mov,video/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-brand-red mx-auto mb-2" />
                    <p className="font-extrabold text-brand-dark text-xs">
                      {selectedFile ? selectedFile.name : 'Click to select or drag video file here'}
                    </p>
                    {selectedFile && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Original size: {formatFileSize(selectedFile.size)}
                      </p>
                    )}
                  </div>

                  {/* Compression Options */}
                  {selectedFile && (
                    <div className="bg-amber-50 border border-brand-yellow/50 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-extrabold text-brand-dark">
                          <input
                            type="checkbox"
                            checked={shouldCompress}
                            onChange={(e) => setShouldCompress(e.target.checked)}
                            className="rounded text-brand-red focus:ring-brand-yellow"
                          />
                          <span>Compress video to save memory & storage</span>
                        </label>
                        <HardDrive className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Automatically optimizes resolution and bitrate, reducing file size by 60%-85% without noticeable quality loss.
                      </p>
                      {compressionSavings && (
                        <p className="text-[11px] font-black text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-lg">
                          🎉 {compressionSavings}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Progress bars */}
                  {isCompressing && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-gray-600">
                        <span>Compressing Video...</span>
                        <span>{compressionProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${compressionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-gray-600">
                        <span>Uploading Video Chunks...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-red h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="font-extrabold text-brand-dark block mb-1">
                  Video Title (Auto-detected from file or YouTube):
                </label>
                <input
                  type="text"
                  placeholder="Enter video title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow font-bold"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="font-extrabold text-brand-dark block mb-1">
                  Description / Story:
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell clients about this wedding film, drone coverage, car fleet or service..."
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              {/* Spotlight Toggle */}
              <div className="bg-amber-50 border border-brand-yellow/40 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-brand-dark block">Feature in Homepage Spotlight</span>
                  <span className="text-[11px] text-gray-500">Include this video in the rotating Featured Spotlight slider on the homepage</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-brand-red rounded focus:ring-brand-yellow"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isCompressing || isUploading}
                  className="px-6 py-2 bg-brand-red hover:bg-brand-redDark text-white font-black rounded-xl shadow transition disabled:opacity-50"
                >
                  {isCompressing
                    ? 'Compressing Video...'
                    : isUploading
                    ? 'Uploading File...'
                    : submitting
                    ? 'Saving Video...'
                    : editingVideo
                    ? 'Update Video'
                    : 'Publish Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIDEO PREVIEW MODAL
          ========================================================================= */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-black rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl border border-gray-800">
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full">
              {previewVideo.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${previewVideo.youtubeId}?autoplay=1`}
                  title={previewVideo.title}
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={previewVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>

            <div className="p-4 bg-[#1C1F27] text-white">
              <h4 className="font-extrabold text-sm">{previewVideo.title}</h4>
              {previewVideo.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{previewVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
