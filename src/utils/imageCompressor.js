/**
 * Client-Side Image Compression Utility
 * Resizes and compresses image files before sending to serverless endpoints,
 * preventing Vercel HTTP 413 FUNCTION_PAYLOAD_TOO_LARGE errors.
 */

export async function compressImage(file, { maxWidth = 1920, maxHeight = 1920, quality = 0.82 } = {}) {
  if (!file || !(file instanceof Blob)) return file;
  if (!file.type || !file.type.startsWith('image/')) return file;
  // Keep SVGs and GIFs intact
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  // If already under 800 KB, no need to compress heavily
  if (file.size < 800 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob || blob.size >= file.size) {
                  // If compression didn't help or failed, keep original
                  resolve(file);
                  return;
                }
                const newFileName = file.name ? file.name.replace(/\.[^.]+$/, '.jpg') : 'upload.jpg';
                const compressedFile = new File([blob], newFileName, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              'image/jpeg',
              quality
            );
          } catch (innerErr) {
            console.warn('Canvas compression failed, falling back to original file:', innerErr);
            resolve(file);
          }
        };

        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };

      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Image compression reader error:', err);
      resolve(file);
    }
  });
}
