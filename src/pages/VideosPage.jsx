import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Play, Search, Sparkles, Video as VideoIcon, Youtube, UploadCloud,
  Eye, Calendar, Share2, MessageCircle, X, ExternalLink, RefreshCw
} from 'lucide-react';
import { api, getWhatsAppLink } from '../services/api';

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'YOUTUBE', 'UPLOAD', 'FEATURED'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null); // Video currently playing in modal

  // Auto-play video from query parameter (e.g. from Featured Spotlight slide)
  const playIdParam = searchParams.get('play');

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/videos?limit=100');
      const list = res.videos || [];
      setVideos(list);

      // If playIdParam is present, automatically open that video in modal
      if (playIdParam) {
        const found = list.find(v => v.id === playIdParam || v.youtubeId === playIdParam);
        if (found) {
          setActiveVideo(found);
        }
      }
    } catch (err) {
      console.warn('Failed to load videos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [playIdParam]);

  // Handle closing the player modal
  const handleClosePlayer = () => {
    setActiveVideo(null);
    if (searchParams.has('play')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('play');
      setSearchParams(nextParams);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeVideo) {
        handleClosePlayer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo]);

  // Filter videos
  const filteredVideos = videos.filter(v => {
    if (activeTab === 'YOUTUBE' && v.sourceType !== 'YOUTUBE') return false;
    if (activeTab === 'UPLOAD' && v.sourceType !== 'UPLOAD') return false;
    if (activeTab === 'FEATURED' && !v.isFeatured) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (v.title || '').toLowerCase().includes(q);
      const matchDesc = (v.description || '').toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }
    return true;
  });

  const getYoutubeEmbedUrl = (youtubeId) => {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-brand-dark via-[#2b0102] to-brand-red text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-brand-yellow text-brand-dark px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow">
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Media & Video Gallery</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
              Cinematic Videos & Highlights
            </h1>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
              Watch 4K wedding films, drone cinematography, bridal convoy fleet, commercial spotlights, and business productions by Romantic T Solutions Ltd.
            </p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-brand-border shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Videos', icon: VideoIcon },
              { id: 'FEATURED', label: 'Featured Spotlight', icon: Sparkles },
              { id: 'YOUTUBE', label: 'YouTube Productions', icon: Youtube },
              { id: 'UPLOAD', label: 'Direct Uploads', icon: UploadCloud },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-yellow text-brand-dark shadow-sm'
                      : 'text-gray-600 hover:text-brand-dark hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-red' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos & wedding films..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-brand-soft border border-brand-border rounded-xl text-xs sm:text-sm text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-brand-border p-4 space-y-4">
                <div className="aspect-video bg-gray-200 rounded-2xl" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-brand-border p-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-brand-yellow/50 flex items-center justify-center mx-auto text-2xl">
              🎬
            </div>
            <h3 className="text-xl font-black text-brand-dark">No Videos Found</h3>
            <p className="text-sm text-brand-muted max-w-md mx-auto">
              {searchQuery ? `No videos matched "${searchQuery}".` : 'There are currently no videos listed in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 bg-brand-yellow text-brand-dark px-5 py-2.5 rounded-full font-bold text-xs shadow hover:bg-brand-yellowDark transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Search</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredVideos.map((video) => {
              const isYoutube = video.sourceType === 'YOUTUBE' || Boolean(video.youtubeId);
              const thumb = video.thumbnailUrl || (video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70');

              return (
                <div
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className="group bg-white rounded-3xl border border-brand-border overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={thumb}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70';
                      }}
                    />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Source Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {isYoutube ? (
                        <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                          <Youtube className="w-3 h-3" />
                          <span>YouTube</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-brand-dark/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                          <UploadCloud className="w-3 h-3 text-brand-yellow" />
                          <span>HD Video</span>
                        </span>
                      )}

                      {video.isFeatured && (
                        <span className="inline-flex items-center gap-1 bg-brand-yellow text-brand-dark text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                          <Sparkles className="w-3 h-3 text-brand-red" />
                          <span>Spotlight</span>
                        </span>
                      )}
                    </div>

                    {/* Center Glowing Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-brand-red/90 group-hover:bg-brand-red text-white flex items-center justify-center shadow-2xl transform group-hover:scale-115 transition-all duration-300 backdrop-blur-sm border-2 border-white/40">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration or views pill */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 text-white/90 text-[11px] font-semibold bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                      <Eye className="w-3 h-3" />
                      <span>{video.viewsCount || 0} views</span>
                    </div>
                  </div>

                  {/* Video Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-brand-dark group-hover:text-brand-red transition line-clamp-2 leading-snug">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-brand-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(video.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className="font-bold text-brand-red group-hover:underline flex items-center gap-1">
                        <span>Play Video</span>
                        <Play className="w-3 h-3 fill-brand-red" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          CINEMA MODE VIDEO PLAYER MODAL
          ========================================================================= */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={handleClosePlayer} />

          {/* Modal Container */}
          <div className="relative z-10 bg-[#16181F] text-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[92vh]">
            {/* Top Bar with Title and Close Button */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800/80 bg-[#1C1F27]">
              <div className="flex items-center gap-2 truncate pr-4">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                <h3 className="font-extrabold text-sm sm:text-base text-gray-100 truncate">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={handleClosePlayer}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
                aria-label="Close video player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport (16:9 ratio) */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {activeVideo.youtubeId ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeVideo.youtubeId)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : activeVideo.videoUrl && activeVideo.videoUrl.endsWith('.mp4') || activeVideo.videoUrl.endsWith('.webm') ? (
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={activeVideo.videoUrl}
                  title={activeVideo.title}
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>

            {/* Video Meta & Actions */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                    {activeVideo.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{new Date(activeVideo.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>{activeVideo.viewsCount || 0} views</span>
                    {activeVideo.sourceType === 'YOUTUBE' && (
                      <>
                        <span>•</span>
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <Youtube className="w-3.5 h-3.5" />
                          <span>YouTube</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* WhatsApp & Share Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={getWhatsAppLink('250786639945', `Hello Romantic T Solutions, I watched your video "${activeVideo.title}" and I would like to book a related service!`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-4 py-2 rounded-full shadow transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire on WhatsApp</span>
                  </a>

                  {activeVideo.youtubeId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                      title="Open in YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {activeVideo.description && (
                <div className="bg-[#1C1F27] p-4 rounded-2xl text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line border border-gray-800">
                  {activeVideo.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
