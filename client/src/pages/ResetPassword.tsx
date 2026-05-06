import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Lock, Check } from 'lucide-react';
import { getApiUrl } from '../api/config';

// Simple password strength checker
const getStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[@$!%*?&]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
};

const Rule: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <li className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-gray-500'}`}>
    <Check size={11} className={met ? 'opacity-100' : 'opacity-0'} />
    {text}
  </li>
);

type Stage = 'form' | 'success' | 'invalid';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<Stage>('form');

  // If no token in URL, show invalid state immediately
  useEffect(() => {
    if (!token) setStage('invalid');
  }, [token]);

  const strength = getStrength(password);
  const rules = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
    { met: /[@$!%*?&]/.test(password), text: 'One special character (@$!%*?&)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strength.score < 4) { setError('Please meet all password requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Token expired or invalid
        if (res.status === 400) { setStage('invalid'); return; }
        setError(data.error || 'Reset failed. Please try again.');
        return;
      }
      setStage('success');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition';

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1d2e] border border-gray-800 rounded-2xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className={`p-3 rounded-2xl border mb-4 ${
              stage === 'invalid'
                ? 'bg-red-500/20 border-red-500/30'
                : stage === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30'
                : 'bg-blue-500/20 border-blue-500/30'
            }`}>
              {stage === 'success'
                ? <CheckCircle size={32} className="text-emerald-400" />
                : stage === 'invalid'
                ? <AlertCircle size={32} className="text-red-400" />
                : <Lock size={32} className="text-blue-400" />
              }
            </div>
            <h1 className="text-2xl font-bold text-white">
              {stage === 'success' ? 'Password Updated' : stage === 'invalid' ? 'Link Expired' : 'Set New Password'}
            </h1>
            <p className="text-gray-400 text-sm mt-1 text-center">
              {stage === 'success'
                ? 'Your password has been updated successfully.'
                : stage === 'invalid'
                ? 'This reset link is invalid or has expired.'
                : 'Choose a strong password for your Evacu3D account.'}
            </p>
          </div>

          {/* Success state */}
          {stage === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-400">You can now sign in with your new password.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {/* Invalid / Expired state */}
          {stage === 'invalid' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-400">
                Please request a new password reset link from the login page.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-8 py-3 rounded-xl font-medium transition"
              >
                Back to Login
              </Link>
            </div>
          )}

          {/* Form state */}
          {stage === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} className="shrink-0" /> {error}
                </div>
              )}

              {/* New password */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={inputCls + ' pr-10'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {password && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        strength.score === 4 ? 'text-emerald-400' :
                        strength.score === 3 ? 'text-yellow-400' :
                        strength.score === 2 ? 'text-amber-500' : 'text-red-400'
                      }`}>{strength.label}</span>
                    </div>
                    <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 pl-0.5">
                      {rules.map(r => <Rule key={r.text} met={r.met} text={r.text} />)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  className={`${inputCls} ${confirm && confirm !== password ? 'border-red-700 focus:ring-red-500' : ''}`}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || strength.score < 4 || password !== confirm}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition mt-2"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Updating...</>
                  : <><ShieldAlert size={16} /> Update Password</>
                }
              </button>
            </form>
          )}

          {stage === 'form' && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Remembered it?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
