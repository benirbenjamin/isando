import prisma, { withDbRetry } from '../database/prisma.js';

/**
 * Extracts a YouTube Video ID from any format of YouTube URL
 */
export function extractYouTubeId(url = '') {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  // If already an 11-char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;

  // youtu.be/<id>
  const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=<id>
  const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/embed/<id>
  const embedMatch = clean.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/shorts/<id>
  const shortsMatch = clean.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/live/<id>
  const liveMatch = clean.match(/\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return liveMatch[1];

  return null;
}

/**
 * Fetches public video info (title, author, thumbnail) via YouTube oEmbed (Free, zero API key required)
 */
export async function fetchYouTubeVideoInfo(urlOrId) {
  const youtubeId = extractYouTubeId(urlOrId);
  if (!youtubeId) {
    throw new Error('Invalid YouTube URL or Video ID');
  }

  const standardUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(standardUrl)}&format=json`;

  let title = 'YouTube Video';
  let authorName = 'Romantic T Solutions';
  let thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  try {
    const res = await fetch(oEmbedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
      if (data.author_name) authorName = data.author_name;
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
    }
  } catch (err) {
    console.warn(`oEmbed lookup notice for ${youtubeId}:`, err.message);
  }

  return {
    youtubeId,
    title,
    authorName,
    thumbnailUrl,
    videoUrl: standardUrl,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`
  };
}

/**
 * Resolves any YouTube Channel input (ID, URL, or @handle) to a canonical 24-character 'UC...' Channel ID
 */
export async function resolveChannelId(input = '') {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();

  // 1. Direct UC Channel ID (24 characters, starts with UC)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(raw)) {
    return raw;
  }

  // 2. URL containing /channel/UC...
  const channelMatch = raw.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelMatch) {
    return channelMatch[1];
  }

  // 3. Handle or custom URL (e.g., @RomanticTSolutions, or https://www.youtube.com/@...)
  let lookupUrl = raw;
  if (!lookupUrl.startsWith('http')) {
    const handle = raw.startsWith('@') ? raw : `@${raw}`;
    lookupUrl = `https://www.youtube.com/${handle}`;
  }

  try {
    const res = await fetch(lookupUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (res.ok) {
      const html = await res.text();

      // Look for <meta itemprop="channelId" content="UC...">
      const metaMatch = html.match(/itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]{22})"/i)
        || html.match(/content="(UC[a-zA-Z0-9_-]{22})"\s+itemprop="channelId"/i);
      if (metaMatch) return metaMatch[1];

      // Look for canonical link or channel_id
      const canonicalMatch = html.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
      if (canonicalMatch) return canonicalMatch[1];

      // Look for "channelId":"UC..." in JSON payload
      const jsonMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
      if (jsonMatch) return jsonMatch[1];

      // Look for externalId
      const extMatch = html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/);
      if (extMatch) return extMatch[1];
    }
  } catch (err) {
    console.warn(`Could not resolve channel ID from ${lookupUrl}:`, err.message);
  }

  return raw; // Fallback to provided raw string
}

/**
 * Parses XML text from YouTube RSS feed without requiring heavy native binaries
 */
function parseRssXml(xmlText) {
  const items = [];
  const entryMatches = xmlText.match(/<entry[\s\S]*?<\/entry>/g) || [];

  for (const entry of entryMatches) {
    const videoIdMatch = entry.match(/<yt:videoId>([a-zA-Z0-9_-]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const thumbMatch = entry.match(/<media:thumbnail[^>]+url="([^">]+)"/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1];
      let title = titleMatch ? titleMatch[1].trim() : 'Video';
      // Unescape basic XML entities
      title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

      let description = descMatch ? descMatch[1].trim() : '';
      description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

      const thumbUrl = thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      items.push({
        youtubeId: videoId,
        title,
        description,
        thumbnailUrl: thumbUrl,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: publishedMatch ? new Date(publishedMatch[1]) : new Date(),
      });
    }
  }

  return items;
}

/**
 * Fetches latest videos from YouTube Channel RSS feed
 */
export async function fetchChannelVideos(channelId) {
  if (!channelId) return [];
  const cleanChannelId = await resolveChannelId(channelId);
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${cleanChannelId}`;

  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!res.ok) {
      console.warn(`YouTube RSS responded with status ${res.status} for channel ${cleanChannelId}`);
      return [];
    }

    const xml = await res.text();
    return parseRssXml(xml);
  } catch (err) {
    console.error(`Error fetching YouTube RSS for channel ${cleanChannelId}:`, err.message);
    return [];
  }
}

/**
 * Syncs videos from the configured YouTube Channel into the database.
 * Posts any new video automatically with title, description, and thumbnail.
 */
export async function syncYouTubeChannel(explicitChannelId = null) {
  try {
    let targetChannelId = explicitChannelId;

    if (!targetChannelId) {
      const setting = await prisma.setting.findUnique({
        where: { key: 'youtube_channel_id' }
      }).catch(() => null);

      targetChannelId = setting ? setting.value : process.env.YOUTUBE_CHANNEL_ID;
    }

    if (!targetChannelId || !targetChannelId.trim()) {
      return {
        success: false,
        message: 'No YouTube Channel ID configured. Please configure your Channel ID in Settings or Videos Management.',
        importedCount: 0,
        totalChecked: 0
      };
    }

    const channelId = await resolveChannelId(targetChannelId.trim());
    console.log(`🎬 [YouTube Sync] Fetching channel videos for ID: ${channelId}...`);

    const videos = await fetchChannelVideos(channelId);
    if (!videos || videos.length === 0) {
      return {
        success: true,
        message: 'No new videos found in channel RSS feed or feed is currently empty.',
        importedCount: 0,
        totalChecked: 0,
        channelId
      };
    }

    let importedCount = 0;

    for (const v of videos) {
      const existing = await prisma.video.findFirst({
        where: { youtubeId: v.youtubeId }
      }).catch(() => null);

      if (!existing) {
        await prisma.video.create({
          data: {
            title: v.title,
            description: v.description,
            videoUrl: v.videoUrl,
            youtubeId: v.youtubeId,
            thumbnailUrl: v.thumbnailUrl,
            sourceType: 'YOUTUBE',
            channelId: channelId,
            isFeatured: true, // Auto-feature newly synced channel videos
            status: 'ACTIVE',
            createdAt: v.publishedAt || new Date(),
          }
        }).catch((err) => {
          console.warn(`Could not save video ${v.youtubeId}:`, err.message);
        });
        importedCount++;
      }
    }

    // Update last sync time
    await prisma.setting.upsert({
      where: { key: 'youtube_last_sync' },
      update: { value: new Date().toISOString() },
      create: { key: 'youtube_last_sync', value: new Date().toISOString(), category: 'VIDEOS' }
    }).catch(() => {});

    console.log(`✅ [YouTube Sync Complete] Processed ${videos.length} videos from channel ${channelId}. Imported ${importedCount} new videos.`);

    return {
      success: true,
      message: importedCount > 0 
        ? `Successfully imported ${importedCount} new video(s) from YouTube channel!`
        : `All ${videos.length} video(s) are already synced and up to date!`,
      importedCount,
      totalChecked: videos.length,
      channelId
    };
  } catch (err) {
    console.error('YouTube sync error:', err.message);
    return {
      success: false,
      message: 'Failed to sync YouTube channel: ' + err.message,
      importedCount: 0,
      totalChecked: 0
    };
  }
}

/**
 * Schedules background YouTube channel check 4 times a day (every 6 hours)
 */
let syncIntervalHandle = null;

export function initYouTubeAutoSync() {
  if (syncIntervalHandle) return;

  // 4 times a day = 24 / 4 = 6 hours = 6 * 60 * 60 * 1000 ms
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  console.log('⏰ [YouTube Scheduler] Initializing automated YouTube channel sync (4 times a day / every 6 hours)...');

  // Initial sync check 45 seconds after server startup
  setTimeout(async () => {
    try {
      await syncYouTubeChannel();
    } catch (e) {
      console.warn('Initial YouTube sync check notice:', e.message);
    }
  }, 45 * 1000);

  // Set recurring interval
  syncIntervalHandle = setInterval(async () => {
    console.log('⏰ [YouTube Scheduler] Running scheduled 6-hour YouTube channel check...');
    try {
      await syncYouTubeChannel();
    } catch (err) {
      console.error('Scheduled YouTube sync error:', err.message);
    }
  }, SIX_HOURS_MS);
}
