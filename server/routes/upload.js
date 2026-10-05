import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { uploadFile } from '../services/storageService.js';

const router = express.Router();
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return res.json({
      url: fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

export default router;
