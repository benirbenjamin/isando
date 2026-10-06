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

export function getImageUrl(item, fallback = '') {
  if (!item) return fallback;
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item.url) return item.url;
  return fallback;
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

    const token = localStorage.getItem('romantic_token');
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
