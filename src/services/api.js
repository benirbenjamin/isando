const API_BASE = '/api';

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Price on request';
  return `${Number(amount).toLocaleString('en-US')} Frw`;
}

export function calcDiscountPct(regularPrice, salePrice) {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

export function getWhatsAppLink(phone = '250786639945', message = '') {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function formatDriveCdnUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('drive.google.com/uc?export=view&id=')) {
    const id = url.split('id=')[1]?.split('&')[0];
    if (id) return `https://lh3.googleusercontent.com/d/${id}`;
  }
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

export function getImageUrl(item, fallback = '') {
  if (!item) return fallback;
  if (typeof item === 'string') return formatDriveCdnUrl(item);
  if (typeof item === 'object') {
    const rawUrl = item.url || item.backupUrl;
    if (rawUrl) return formatDriveCdnUrl(rawUrl);
  }
  return fallback;
}

export function getImageBackupUrl(item) {
  if (!item || typeof item !== 'object') return null;
  const backup = item.backupUrl || null;
  return backup ? formatDriveCdnUrl(backup) : null;
}

export function getImageCaption(item, fallback = '') {
  if (!item) return fallback;
  if (typeof item === 'object' && item.caption) return item.caption;
  return fallback;
}

/**
 * Native XMLHttpRequest transport (Completely replaces fetch)
 */
function xhrRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE}${endpoint}`;

    xhr.open(method, url, true);
    xhr.timeout = 25000;

    const token = localStorage.getItem('romantic_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    let payload = data;
    if (data && !(data instanceof FormData)) {
      xhr.setRequestHeader('Content-Type', 'application/json');
      payload = JSON.stringify(data);
    }

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.onload = function () {
      let responseData = {};
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch {
        responseData = { rawText: xhr.responseText };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseData);
      } else {
        const message =
          responseData.error ||
          responseData.message ||
          (typeof responseData.rawText === 'string' && responseData.rawText.length < 150 ? responseData.rawText : null) ||
          `Server Error (${xhr.status}: ${xhr.statusText || 'Internal Server Error'})`;

        const error = new Error(message);
        error.status = xhr.status;
        error.data = responseData;
        reject(error);
      }
    };

    xhr.onerror = function () {
      reject(new Error('Network connection error. Please verify your internet connection.'));
    };

    xhr.ontimeout = function () {
      reject(new Error('Server request timed out. Please try again.'));
    };

    xhr.send(payload);
  });
}

// Automatic retry for serverless cold-starts
async function requestWithRetry(method, endpoint, data = null, headers = {}, retries = 1) {
  try {
    return await xhrRequest(method, endpoint, data, headers);
  } catch (err) {
    if (retries > 0 && (!err.status || err.status >= 500)) {
      await new Promise(r => setTimeout(r, 1000));
      return requestWithRetry(method, endpoint, data, headers, retries - 1);
    }
    throw err;
  }
}

export const api = {
  get: (endpoint) => requestWithRetry('GET', endpoint),
  post: (endpoint, body) => requestWithRetry('POST', endpoint, body),
  put: (endpoint, body) => requestWithRetry('PUT', endpoint, body),
  delete: (endpoint) => requestWithRetry('DELETE', endpoint),
};
