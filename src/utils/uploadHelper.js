import { api } from '../services/api';
import { compressImage } from './imageCompressor';

/**
 * Resilient upload utility:
 * 1. Automatically compresses image files to optimize size (~300-800 KB).
 * 2. If the file is still > 1.5 MB, uploads it in chunks to avoid Vercel 4.5MB FUNCTION_PAYLOAD_TOO_LARGE.
 * 3. Falls back to Drive / resilient cloud mirror automatically.
 *
 * @param {File|Blob} file 
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<{ url: string, backupUrl?: string, originalName?: string, size?: number }>}
 */
export async function resilientUpload(file, onProgress) {
  if (!file) throw new Error('No file provided for upload');

  // Step 1: Compress if it's an image
  let processedFile = file;
  if (file.type && file.type.startsWith('image/')) {
    processedFile = await compressImage(file);
  }

  const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5 MB per chunk (well under Vercel 4.5MB limit)

  // If <= 1.5MB, upload via standard single request
  if (processedFile.size <= CHUNK_SIZE) {
    const formData = new FormData();
    formData.append('file', processedFile);
    if (onProgress) onProgress(40);
    const res = await api.post('/upload', formData);
    if (onProgress) onProgress(100);
    return res;
  }

  // Otherwise, upload in chunks!
  const totalChunks = Math.ceil(processedFile.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  let finalRes = null;
  for (let idx = 0; idx < totalChunks; idx++) {
    const start = idx * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, processedFile.size);
    const chunkSlice = processedFile.slice(start, end);

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', String(idx));
    formData.append('totalChunks', String(totalChunks));
    formData.append('originalName', processedFile.name || 'image.jpg');
    formData.append('mimeType', processedFile.type || 'image/jpeg');
    formData.append('chunk', chunkSlice, processedFile.name || 'image.jpg');

    finalRes = await api.post('/upload/chunk', formData);
    if (onProgress) {
      const pct = Math.round(((idx + 1) / totalChunks) * 100);
      onProgress(pct);
    }
  }

  return finalRes;
}
