import React, { useState } from 'react';
import { X, Mail, ArrowRight, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { getApiUrl } from '../api/config';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

type Stage = 'form' | 'success';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      // Store dev reset URL if backend sends it (dev mode only)
      if (data._devResetUrl) setDevResetUrl(data._devResetUrl);
      setStage('success');
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-pw-title"
    >
      <div className="w-full max-w-md bg-[#1a1d2e] border border-gray-700 rounded-2xl shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 border border-blue-800/50 rounded-xl">
              <Mail size={18} className="text-blue-400" />
            </div>
            <h2 id="forgot-pw-title" className="text-base font-bold text-white">
              Reset Your Password
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {stage === 'form' ? (
            <>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                Enter the email address associated with your account. If it's registered, we'll send you a secure reset link.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm mb-4">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      autoFocus
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white py-3 rounded-xl font-semibold text-sm transition"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    : <><ArrowRight size={16} /> Send Reset Link</>
                  }
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-900/30 border border-emerald-700/50 rounded-2xl mb-4">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check your inbox</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                If <span className="text-white font-medium">{email}</span> is registered, a secure reset link has been sent. It expires in 1 hour.
              </p>

              {/* Dev-mode helper: show the reset URL directly since no SMTP is configured */}
              {devResetUrl && (
                <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 mb-4 text-left">
                  <p className="text-xs text-amber-400 font-semibold mb-1 flex items-center gap-1">
                    <span>🔧</span> Developer Mode — No Email Configured
                  </p>
                  <p className="text-xs text-amber-300/80 mb-2">Use this link to complete the reset:</p>
                  <a
                    href={devResetUrl}
                    className="text-xs text-blue-400 hover:text-blue-300 underline break-all flex items-center gap-1"
                  >
                    <ExternalLink size={11} /> Reset Password Link
                  </a>
                </div>
              )}

              <button
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-white transition font-medium"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
