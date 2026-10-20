/**
 * Cleans a video filename to produce a readable, professional title.
 * e.g., "Romantic_Wedding_Ceremony_Highlights_2026.mp4" -> "Romantic Wedding Ceremony Highlights 2026"
 */
export function cleanVideoFileName(filename = '') {
  if (!filename) return '';

  // Remove file extension
  let name = filename.replace(/\.[^/.]+$/, '');

  // Replace underscores, hyphens, and multiple dots with spaces
  name = name.replace(/[_\-+.]+/g, ' ');

  // Remove common camera/recorder prefixes like VID_, MOV_, DJI_, etc.
  name = name.replace(/^(VID|MOV|DJI|DSC|IMG|GOPR|REC)[ _]/i, '');

  // Trim and capitalize first letter of each word
  name = name.trim().replace(/\b\w/g, char => char.toUpperCase());

  return name || filename;
}

/**
 * Formats byte size into human readable string (e.g. 14.5 MB)
 */
export function formatFileSize(bytes = 0) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Client-side video compression using HTML5 Canvas & MediaRecorder API.
 * Reduces bitrate & resolution (e.g. down to 720p/1080p @ 1.8Mbps),
 * saving 60% - 85% of memory and upload bandwidth!
 */
export async function compressVideoFile(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    videoBitrate = 1800000, // 1.8 Mbps (high efficiency)
    audioBitrate = 128000,  // 128 kbps
    onProgress = () => {},
  } = options;

  // If file is already small (under 3MB), return directly
  if (file.size <= 3 * 1024 * 1024) {
    onProgress(100, file.size, file.size);
    return file;
  }

  // Check browser MediaRecorder support
  if (typeof window === 'undefined' || !window.MediaRecorder || !HTMLVideoElement.prototype.captureStream) {
    console.warn('MediaRecorder or captureStream not supported in this browser, using original file.');
    return file;
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      let width = video.videoWidth || 1280;
      let height = video.videoHeight || 720;
      const duration = video.duration;

      // Scale down if larger than target resolution
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Ensure even dimensions
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(25); // 25 fps stream

      // Pick supported mimeType
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }

      let recorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: videoBitrate,
          audioBitsPerSecond: audioBitrate,
        });
      } catch (e) {
        console.warn('Could not initialize MediaRecorder:', e.message);
        cleanup();
        return resolve(file);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        cleanup();
        const compressedBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
        
        // If compressed file turned out larger than original, stick with original
        if (compressedBlob.size >= file.size) {
          return resolve(file);
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webm';
        const compressedFile = new File([compressedBlob], cleanName, {
          type: mimeType || 'video/webm',
          lastModified: Date.now(),
        });

        onProgress(100, compressedFile.size, file.size);
        resolve(compressedFile);
      };

      // Play & draw frame by frame
      let animFrameId = null;
      const drawFrame = () => {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, width, height);

        if (duration && duration > 0) {
          const pct = Math.min(95, Math.round((video.currentTime / duration) * 100));
          onProgress(pct, 0, file.size);
        }

        animFrameId = requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        cancelAnimationFrame(animFrameId);
        recorder.stop();
      };

      video.onerror = () => {
        cleanup();
        resolve(file);
      };

      // Start playback and recording
      recorder.start(500); // 500ms chunk slices
      video.play().then(() => {
        drawFrame();
      }).catch(() => {
        cleanup();
        resolve(file);
      });
    };

    video.onerror = () => {
      cleanup();
      resolve(file);
    };
  });
}

/**
 * Uploads a video file in resilient chunks (3MB each) with live progress tracking
 */
export async function uploadVideoWithChunks(file, onProgress = () => {}) {
  const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

  const token = localStorage.getItem('romantic_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  // For small files under 3MB, standard single upload is faster
  if (totalChunks <= 1) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res);
          } else {
            reject(new Error(res.error || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid server response'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  }

  // Multi-chunk upload
  let lastResponse = null;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('originalName', file.name);
    formData.append('mimeType', file.type || 'video/mp4');

    const res = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload/chunk', true);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const chunkProgress = (e.loaded / e.total);
          const overallProgress = Math.round(((i + chunkProgress) / totalChunks) * 100);
          onProgress(overallProgress);
        }
      };

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json);
          } else {
            reject(new Error(json.error || `Chunk ${i} failed`));
          }
        } catch (err) {
          reject(new Error('Invalid server response'));
        }
      };

      xhr.onerror = () => reject(new Error(`Network error on chunk ${i}`));
      xhr.send(formData);
    });

    lastResponse = res;
  }

  onProgress(100);
  return lastResponse;
}
