import { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  Bell,
} from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random().toString();
    const newToast = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    loading: (msg, duration = 0) => addToast('loading', msg, duration),
    reviewComplete: (msg, duration = 5000) => addToast('reviewComplete', msg, duration),
    dismiss: (id) => removeToast(id),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Responsive Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slideUp ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-300'
                : t.type === 'loading'
                ? 'bg-slate-900/95 border-indigo-500/40 text-indigo-300'
                : 'bg-gradient-to-r from-indigo-950/95 to-slate-900/95 border-cyan-500/50 text-cyan-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="shrink-0">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {t.type === 'loading' && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                {t.type === 'reviewComplete' && <Sparkles className="w-5 h-5 text-cyan-400 animate-bounce" />}
              </div>
              <p className="text-xs font-semibold leading-snug">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-2 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
