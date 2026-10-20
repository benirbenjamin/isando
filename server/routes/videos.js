import express from 'express';
import prisma, { withDbRetry } from '../database/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  extractYouTubeId,
  fetchYouTubeVideoInfo,
  resolveChannelId,
  syncYouTubeChannel
} from '../services/youtubeSyncService.js';

const router = express.Router();

/**
 * Public: List all active videos
 */
router.get('/', async (req, res) => {
  try {
    const { isFeatured, sourceType, search, limit = 50, offset = 0 } = req.query;

    const where = { status: 'ACTIVE' };

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (sourceType) {
      where.sourceType = sourceType.toUpperCase();
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const [total, videos] = await withDbRetry(
      () => Promise.all([
        prisma.video.count({ where }),
        prisma.video.findMany({
          where,
          orderBy: [
            { isFeatured: 'desc' },
            { sortOrder: 'asc' },
            { createdAt: 'desc' }
          ],
          take: parseInt(limit, 10),
          skip: parseInt(offset, 10),
        })
      ]),
      { maxRetries: 3, initialDelayMs: 1200, operationName: 'List videos' }
    );

    return res.json({ total, videos });
  } catch (err) {
    console.error('List videos error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Public: Get single video and increment view count
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await withDbRetry(
      () => prisma.video.findUnique({ where: { id } }),
      { maxRetries: 3, operationName: 'Get single video' }
    );

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment view count in background non-blocking
    prisma.video.update({
      where: { id },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => {});

    return res.json(video);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Public or Authenticated: Inspect YouTube URL and auto-fetch metadata
 */
router.post('/fetch-youtube-info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL or Video ID is required' });
    }

    const info = await fetchYouTubeVideoInfo(url);
    return res.json(info);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Admin: Get YouTube Channel Configuration & Sync Status
 */
router.get('/channel-config/status', authenticateToken, async (req, res) => {
  try {
    const [channelSetting, lastSyncSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'youtube_channel_id' } }).catch(() => null),
      prisma.setting.findUnique({ where: { key: 'youtube_last_sync' } }).catch(() => null),
    ]);

    const channelId = channelSetting ? channelSetting.value : (process.env.YOUTUBE_CHANNEL_ID || '');
    const lastSync = lastSyncSetting ? lastSyncSetting.value : null;

    return res.json({
      channelId,
      lastSync,
      configured: Boolean(channelId && channelId.trim()),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Save YouTube Channel ID & Preferences
 */
router.post('/channel-config', authenticateToken, async (req, res) => {
  try {
    const { channelId, autoSyncNow = true } = req.body;

    if (!channelId || !channelId.trim()) {
      return res.status(400).json({ error: 'Valid YouTube Channel ID or handle is required' });
    }

    const cleanChannelId = await resolveChannelId(channelId.trim());

    await prisma.setting.upsert({
      where: { key: 'youtube_channel_id' },
      update: { value: cleanChannelId },
      create: { key: 'youtube_channel_id', value: cleanChannelId, category: 'VIDEOS' }
    });

    let syncResult = null;
    if (autoSyncNow) {
      syncResult = await syncYouTubeChannel(cleanChannelId);
    }

    return res.json({
      success: true,
      channelId: cleanChannelId,
      message: `YouTube Channel ID saved successfully.`,
      syncResult
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Trigger Manual Sync from YouTube Channel
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.body;
    const result = await syncYouTubeChannel(channelId || null);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Create a Video (YouTube or Uploaded)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      youtubeId,
      thumbnailUrl,
      sourceType = 'YOUTUBE',
      isFeatured = false,
      duration = '',
      sortOrder = 0
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Video title is required' });
    }

    if (!videoUrl || !videoUrl.trim()) {
      return res.status(400).json({ error: 'Video URL or file path is required' });
    }

    let finalYoutubeId = youtubeId || null;
    let finalThumbnail = thumbnailUrl || null;

    if (sourceType.toUpperCase() === 'YOUTUBE' || videoUrl.includes('youtu')) {
      finalYoutubeId = finalYoutubeId || extractYouTubeId(videoUrl);
      if (finalYoutubeId && !finalThumbnail) {
        finalThumbnail = `https://img.youtube.com/vi/${finalYoutubeId}/maxresdefault.jpg`;
      }
    }

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        videoUrl: videoUrl.trim(),
        youtubeId: finalYoutubeId,
        thumbnailUrl: finalThumbnail,
        sourceType: sourceType.toUpperCase(),
        isFeatured: Boolean(isFeatured),
        duration: duration ? duration.trim() : null,
        sortOrder: parseInt(sortOrder, 10) || 0,
        status: 'ACTIVE',
      }
    });

    return res.status(201).json(video);
  } catch (err) {
    console.error('Create video error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Update Video Details
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      videoUrl,
      youtubeId,
      thumbnailUrl,
      sourceType,
      isFeatured,
      sortOrder,
      status
    } = req.body;

    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl.trim();
    if (youtubeId !== undefined) updateData.youtubeId = youtubeId;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (sourceType !== undefined) updateData.sourceType = sourceType.toUpperCase();
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10) || 0;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.video.update({
      where: { id },
      data: updateData
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Delete Video
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.video.delete({ where: { id } });
    return res.json({ success: true, message: 'Video deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
