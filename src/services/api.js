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
function xhrRequest(method, endpoint, data = null, headers = {}, customTimeout = 35000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE}${endpoint}`;

    xhr.open(method, url, true);
    xhr.timeout = customTimeout;

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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('database-ready', { detail: { endpoint } }));
        }
        resolve(responseData);
      } else {
        const message =
          responseData.error ||
          responseData.message ||
          (typeof responseData.rawText === 'string' && responseData.rawText.length < 150 ? responseData.rawText : null) ||
          `Server Error (${xhr.status}: ${xhr.statusText || 'Internal Server Error'})`;

        console.error(`🚨 [API Error ${xhr.status}] ${method} ${endpoint}:`, message, responseData);

        const error = new Error(message);
        error.status = xhr.status;
        error.data = responseData;
        reject(error);
      }
    };

    xhr.onerror = function () {
      console.error(`🚨 [Network Error] ${method} ${endpoint} could not reach the server.`);
      reject(new Error('Network connection error. Please verify your internet connection.'));
    };

    xhr.ontimeout = function () {
      console.error(`🚨 [Timeout Error] ${method} ${endpoint} timed out after ${customTimeout / 1000}s. The database server may be waking up.`);
      reject(new Error('Database server request timed out. The database may be waking up from sleep.'));
    };

    xhr.send(payload);
  });
}

// Automatic retry for serverless cold-starts & database sleep wake-up
async function requestWithRetry(method, endpoint, data = null, headers = {}, retries = 3, delayMs = 1500) {
  try {
    return await xhrRequest(method, endpoint, data, headers);
  } catch (err) {
    const isRetryable =
      !err.status ||
      err.status >= 500 ||
      err.status === 408 ||
      (err.message && (
        err.message.includes('timed out') ||
        err.message.includes('Network connection') ||
        err.message.includes('Database') ||
        err.message.includes('waking up')
      ));

    if (retries > 0 && isRetryable) {
      console.warn(`⏳ [API Wake-up Retry] ${method} ${endpoint} failed (${err.message}). Retrying in ${delayMs}ms (${retries} attempts left)...`);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('database-waking-up', {
          detail: { endpoint, retriesLeft: retries, delay: delayMs }
        }));
      }

      await new Promise(r => setTimeout(r, delayMs));
      return requestWithRetry(method, endpoint, data, headers, retries - 1, Math.round(delayMs * 1.5));
    }
    throw err;
  }
}

export const api = {
  get: (endpoint, options = {}) => requestWithRetry('GET', endpoint, null, options.headers || {}, options.retries ?? 3, options.delayMs ?? 1500),
  post: (endpoint, body, options = {}) => requestWithRetry('POST', endpoint, body, options.headers || {}, options.retries ?? 1, options.delayMs ?? 1000),
  put: (endpoint, body, options = {}) => requestWithRetry('PUT', endpoint, body, options.headers || {}, options.retries ?? 1, options.delayMs ?? 1000),
  delete: (endpoint, options = {}) => requestWithRetry('DELETE', endpoint, null, options.headers || {}, options.retries ?? 1, options.delayMs ?? 1000),
};

