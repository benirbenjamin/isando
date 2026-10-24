import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Play, Search, Sparkles, Video as VideoIcon, Youtube, UploadCloud,
  Eye, Calendar, Share2, MessageCircle, X, ExternalLink, RefreshCw, Volume2
} from 'lucide-react';
import { api, getWhatsAppLink } from '../services/api';

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'YOUTUBE', 'UPLOAD', 'FEATURED'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null); // Video currently playing in top in-page player
  const playerRef = useRef(null);

  // Auto-play video from query parameter (e.g. from Featured Spotlight slide)
  const playIdParam = searchParams.get('play');

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/videos?limit=100');
      const list = res.videos || [];
      setVideos(list);

      // If playIdParam is present, automatically start playing that video in-page
      if (playIdParam) {
        const found = list.find(v => v.id === playIdParam || v.youtubeId === playIdParam);
        if (found) {
          handlePlayVideo(found, false);
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

  // Handle playing video directly IN-PAGE (NO MODAL) and record view count
  const handlePlayVideo = async (video, shouldScroll = true) => {
    setActiveVideo(video);

    // Update query parameter cleanly without reloading
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('play', video.id);
    setSearchParams(nextParams, { replace: true });

    // Smooth scroll directly to the in-page cinema player section
    if (shouldScroll) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }

    // 1. Optimistic UI update: increment view count immediately
    const nextViews = (video.viewsCount || 0) + 1;
    setVideos(prev => prev.map(v => (v.id === video.id || v.youtubeId === video.id) ? { ...v, viewsCount: nextViews } : v));
    setActiveVideo(prev => prev && (prev.id === video.id || prev.youtubeId === video.id) ? { ...prev, viewsCount: nextViews } : video);

    // 2. Persist view count to database via POST /api/videos/:id/view
    try {
      const res = await api.post(`/videos/${video.id}/view`);
      if (res && typeof res.viewsCount === 'number') {
        setVideos(prev => prev.map(v => (v.id === video.id || v.youtubeId === video.id) ? { ...v, viewsCount: res.viewsCount } : v));
        setActiveVideo(prev => prev && (prev.id === video.id || prev.youtubeId === video.id) ? { ...prev, viewsCount: res.viewsCount } : prev);
      }
    } catch (_) {
      // Fallback: also ping GET /api/videos/:id
      api.get(`/videos/${video.id}`).catch(() => {});
    }
  };

  // Handle closing / minimizing the in-page player
  const handleClosePlayer = () => {
    setActiveVideo(null);
    if (searchParams.has('play')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('play');
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Filter videos based on active tab and search query
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

        {/* =========================================================================
            IN-PAGE FEATURED CINEMA PLAYER (NOT A MODAL - PLAYS DIRECTLY ON PAGE)
            ========================================================================= */}
        {activeVideo && (
          <section ref={playerRef} className="scroll-mt-24 transition-all duration-500 animate-fade-in">
            <div className="bg-[#12141A] text-white rounded-3xl overflow-hidden shadow-2xl border-2 border-brand-yellow/70 flex flex-col">
              {/* Cinema Player Top Bar */}
              <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-gray-800 bg-[#1A1D26]">
                <div className="flex items-center gap-2.5 truncate pr-4">
                  <span className="w-3 h-3 rounded-full bg-brand-red animate-ping flex-shrink-0" />
                  <span className="text-[11px] font-black text-brand-yellow uppercase tracking-wider bg-brand-yellow/10 px-2.5 py-0.5 rounded-full border border-brand-yellow/30 flex-shrink-0">
                    Now Playing
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-gray-100 truncate">
                    {activeVideo.title}
                  </h2>
                </div>
                <button
                  onClick={handleClosePlayer}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 transition flex-shrink-0"
                  title="Close player"
                  aria-label="Close player"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close Player</span>
                </button>
              </div>

              {/* Video Viewport (16:9 ratio directly in page) */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                {activeVideo.youtubeId ? (
                  <iframe
                    src={getYoutubeEmbedUrl(activeVideo.youtubeId)}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (activeVideo.videoUrl && (activeVideo.videoUrl.endsWith('.mp4') || activeVideo.videoUrl.endsWith('.webm'))) ? (
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

              {/* Video Meta & Actions Bar */}
              <div className="p-5 sm:p-7 space-y-4 bg-[#14161F]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {activeVideo.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                      <span className="flex items-center gap-1.5 font-bold text-brand-yellow bg-brand-yellow/10 px-2.5 py-0.5 rounded-full border border-brand-yellow/30">
                        <Eye className="w-3.5 h-3.5 text-brand-yellow" />
                        <span>{activeVideo.viewsCount || 0} views</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(activeVideo.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      {activeVideo.sourceType === 'YOUTUBE' && (
                        <>
                          <span>•</span>
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <Youtube className="w-3.5 h-3.5" />
                            <span>YouTube Production</span>
                          </span>
                        </>
                      )}
                      {activeVideo.duration && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400 font-semibold">{activeVideo.duration}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions: Direct WhatsApp Booking & External YouTube Link */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <a
                      href={getWhatsAppLink('250786639945', `Hello Romantic T Solutions, I watched your video "${activeVideo.title}" and I would like to book a related service!`)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg transition transform hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Inquire on WhatsApp</span>
                    </a>

                    {activeVideo.youtubeId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition text-xs font-semibold"
                        title="Watch on YouTube"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Description */}
                {activeVideo.description && (
                  <div className="bg-[#1C1F27] p-4 sm:p-5 rounded-2xl text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-line border border-gray-800">
                    {activeVideo.description}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const isYoutube = video.sourceType === 'YOUTUBE';
              const thumb = video.thumbnailUrl || (video.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg` : '/placeholder-video.jpg');
              const isCurrentlyPlaying = activeVideo && (activeVideo.id === video.id || activeVideo.youtubeId === video.youtubeId);

              return (
                <div
                  key={video.id}
                  onClick={() => handlePlayVideo(video)}
                  className={`group bg-white rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col cursor-pointer ${
                    isCurrentlyPlaying ? 'border-brand-red ring-2 ring-brand-red/30 shadow-lg' : 'border-brand-border hover:border-brand-yellow'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video bg-black overflow-hidden select-none">
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
                      <div className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-2xl transform group-hover:scale-115 transition-all duration-300 backdrop-blur-sm border-2 border-white/40 ${
                        isCurrentlyPlaying ? 'bg-brand-red animate-pulse' : 'bg-brand-red/90 group-hover:bg-brand-red'
                      }`}>
                        {isCurrentlyPlaying ? (
                          <Volume2 className="w-6 h-6 fill-white" />
                        ) : (
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Live Views Counter Pill */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-white/95 text-[11px] font-bold bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                      <Eye className="w-3.5 h-3.5 text-brand-yellow" />
                      <span>{video.viewsCount || 0} views</span>
                    </div>

                    {video.duration && (
                      <div className="absolute bottom-3 left-3 text-white/90 text-[10px] font-semibold bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                        {video.duration}
                      </div>
                    )}
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
                        <span>{new Date(video.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className="font-bold text-brand-red group-hover:underline flex items-center gap-1">
                        <span>{isCurrentlyPlaying ? 'Playing' : 'Watch Video'}</span>
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
    </div>
  );
}
