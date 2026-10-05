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

async function request(endpoint, options = {}, retries = 1) {
  const token = localStorage.getItem('romantic_token');
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }

    if (!response.ok) {
      if (response.status === 500 && retries > 0) {
        console.warn(`Retrying request to ${endpoint}...`);
        await new Promise(r => setTimeout(r, 1000));
        return request(endpoint, options, retries - 1);
      }

      const message = data.error || data.message || (typeof data.rawText === 'string' && data.rawText.length < 150 ? data.rawText : null) || `Server Error ${response.status}: ${response.statusText || 'Internal Server Error'}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return request(endpoint, options, retries - 1);
    }
    throw new Error(err.message || 'Network connection issue. Please try again.');
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
