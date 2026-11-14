/**
 * In-memory sliding-window rate limiter middleware
 * Protects endpoints from brute-force, credential stuffing, and DoS attacks.
 */
class MemoryRateLimiter {
  constructor() {
    this.hits = new Map(); // key -> { count, expiresAt }
    
    // Periodic garbage collection every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.hits.entries()) {
        if (now > data.expiresAt) {
          this.hits.delete(key);
        }
      }
    }, 2 * 60 * 1000);
  }

  limit({ windowMs = 60 * 1000, max = 30, message = 'Too many requests, please try again later.', keyGenerator = null }) {
    return (req, res, next) => {
      // Determine client identifier
      const clientIp = (
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        'unknown'
      ).trim();

      const customKey = keyGenerator ? keyGenerator(req) : '';
      const trackingKey = customKey ? `${clientIp}:${customKey}` : clientIp;

      const now = Date.now();
      const entry = this.hits.get(trackingKey);

      if (!entry || now > entry.expiresAt) {
        this.hits.set(trackingKey, { count: 1, expiresAt: now + windowMs });
        return next();
      }

      entry.count += 1;

      if (entry.count > max) {
        const retryAfterSec = Math.ceil((entry.expiresAt - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: message,
          retryAfterSeconds: retryAfterSec,
        });
      }

      next();
    };
  }
}

export const rateLimiter = new MemoryRateLimiter();

// Presets
export const authRateLimiter = rateLimiter.limit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,                 // max 10 requests per 5 minutes per IP
  message: 'Too many authentication attempts. Please wait 5 minutes before trying again.',
  keyGenerator: (req) => (req.body?.email ? req.body.email.toLowerCase().trim() : ''),
});

export const otpVerifyLimiter = rateLimiter.limit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 12,                 // max 12 OTP verification attempts per 5 minutes
  message: 'Too many verification attempts. Please wait a few minutes before trying again.',
  keyGenerator: (req) => (req.body?.email ? req.body.email.toLowerCase().trim() : ''),
});

export const publicContactLimiter = rateLimiter.limit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // max 5 contact submissions per 15 min
  message: 'Too many contact messages submitted. Please try again later.',
});
