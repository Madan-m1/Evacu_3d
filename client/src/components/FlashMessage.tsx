import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface FlashMessageProps {
  text: string;
  type: 'success' | 'error';
  onClose: () => void;
  autoDismissMs?: number;
}

const FlashMessage: React.FC<FlashMessageProps> = ({
  text,
  type,
  onClose,
  autoDismissMs = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onClose, autoDismissMs]);

  const isSuccess = type === 'success';

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-fade-in-up ${
        isSuccess
          ? 'bg-emerald-900/95 border-emerald-600/60 text-emerald-100'
          : 'bg-red-900/95 border-red-700/60 text-red-100'
      }`}
    >
      {isSuccess
        ? <CheckCircle size={16} className="shrink-0 text-emerald-400" />
        : <AlertCircle size={16} className="shrink-0 text-red-400" />
      }
      <span className="flex-1">{text}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className={`ml-2 p-1 rounded-lg transition shrink-0 ${
          isSuccess
            ? 'hover:bg-emerald-800/60 text-emerald-300 hover:text-emerald-100'
            : 'hover:bg-red-800/60 text-red-300 hover:text-red-100'
        }`}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default FlashMessage;
