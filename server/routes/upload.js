import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { uploadFile } from '../services/storageService.js';

const router = express.Router();
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit per individual request
});

// In-memory chunk store for reassembling chunked uploads
const chunkSessions = new Map(); // uploadId -> { chunks: Buffer[], totalChunks: number, originalName: string, mimeType: string, updatedAt: number }

// Periodically clean up stale abandoned chunks (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of chunkSessions.entries()) {
    if (now - session.updatedAt > 10 * 60 * 1000) {
      chunkSessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

/**
 * Standard single-file upload
 */
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadResult = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const fileUrl = typeof uploadResult === 'object' ? uploadResult.url : uploadResult;
    const backupUrl = typeof uploadResult === 'object' ? uploadResult.backupUrl : null;

    return res.json({
      url: fileUrl,
      backupUrl: backupUrl || null,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

/**
 * Chunked Upload Endpoint (/api/upload/chunk)
 * Allows large files to bypass Vercel Serverless 4.5MB request limit
 */
router.post('/chunk', authenticateToken, upload.single('chunk'), async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, originalName, mimeType } = req.body;

    if (!uploadId || chunkIndex === undefined || !totalChunks || !req.file) {
      return res.status(400).json({ error: 'Missing chunk metadata or file slice' });
    }

    const cIndex = parseInt(chunkIndex, 10);
    const tChunks = parseInt(totalChunks, 10);

    let session = chunkSessions.get(uploadId);
    if (!session) {
      session = {
        chunks: new Array(tChunks),
        receivedCount: 0,
        totalChunks: tChunks,
        originalName: originalName || 'uploaded-file.jpg',
        mimeType: mimeType || 'image/jpeg',
        updatedAt: Date.now(),
      };
      chunkSessions.set(uploadId, session);
    }

    session.chunks[cIndex] = req.file.buffer;
    session.receivedCount += 1;
    session.updatedAt = Date.now();

    // If not all chunks have arrived yet, acknowledge receipt of this chunk
    if (session.receivedCount < tChunks) {
      return res.json({
        status: 'chunk_received',
        chunkIndex: cIndex,
        totalChunks: tChunks,
        progress: Math.round((session.receivedCount / tChunks) * 100),
      });
    }

    // All chunks received! Reassemble complete buffer
    const fullBuffer = Buffer.concat(session.chunks.filter(Boolean));
    chunkSessions.delete(uploadId);

    console.log(`📦 All ${tChunks} chunks received for ${session.originalName} (${fullBuffer.length} bytes). Processing storage upload...`);

    const uploadResult = await uploadFile(
      fullBuffer,
      session.originalName,
      session.mimeType
    );

    const fileUrl = typeof uploadResult === 'object' ? uploadResult.url : uploadResult;
    const backupUrl = typeof uploadResult === 'object' ? uploadResult.backupUrl : null;

    return res.json({
      url: fileUrl,
      backupUrl: backupUrl || null,
      originalName: session.originalName,
      size: fullBuffer.length,
    });
  } catch (err) {
    console.error('Chunk upload error:', err);
    return res.status(500).json({ error: 'Chunk upload failed: ' + err.message });
  }
});

export default router;
