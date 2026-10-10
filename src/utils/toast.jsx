import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

let toastListeners = [];

/**
 * Trigger an in-app toast notification without blocking browser alert modal.
 * @param {string} message 
 * @param {'error'|'success'|'info'} type 
 * @param {number} duration 
 */
export function showToast(message, type = 'error', duration = 4000) {
  const id = Date.now() + Math.random().toString(36).substring(2, 9);
  const toast = { id, message, type, duration };
  toastListeners.forEach(listener => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toast) => {
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    };

    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handleNewToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md animate-pop transition-all ${
            t.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/40'
              : t.type === 'info'
              ? 'bg-brand-dark/95 text-white border-brand-yellow/40'
              : 'bg-red-950/95 text-red-100 border-red-500/50'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : t.type === 'info' ? (
            <Info className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 leading-snug">
            <p className="font-black text-[13px] tracking-wide">
              {t.type === 'success' ? 'Success' : t.type === 'info' ? 'Notification' : 'Upload Alert'}
            </p>
            <p className="text-xs opacity-90 mt-0.5 whitespace-pre-line">{t.message}</p>
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="text-white/60 hover:text-white p-1 rounded-lg transition -mr-1 -mt-1 flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
