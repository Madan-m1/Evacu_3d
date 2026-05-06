import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { getApiUrl } from '../api/config';

// Live password strength — must match backend validatePassword regex
const rules = [
  { test: (pw: string) => pw.length >= 8,          label: 'At least 8 characters' },
  { test: (pw: string) => /[A-Z]/.test(pw),         label: 'One uppercase letter' },
  { test: (pw: string) => /[0-9]/.test(pw),         label: 'One number' },
  { test: (pw: string) => /[@$!%*?&]/.test(pw),     label: 'One special character (@$!%*?&)' },
];

export default function Register() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const navigate = useNavigate();

  const metCount = rules.filter(r => r.test(password)).length;
  const isStrong = metCount === rules.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isStrong) { setError('Please meet all password requirements below.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      setSuccess('Account created! Awaiting admin approval. Redirecting to login…');
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const inputCls = 'w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition';

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1d2e] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30 mb-4">
              <ShieldAlert size={32} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-gray-400 text-sm mt-1">Join Evacu3D to report hazards and participate in drills</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/50 text-emerald-300 px-4 py-3 rounded-xl text-sm">
                <CheckCircle size={16} className="shrink-0" /> {success}
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email address</label>
              <input type="email" placeholder="you@example.com" className={inputCls}
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className={inputCls + ' pr-10'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Live password rules */}
              {password && (
                <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 pl-0.5">
                  {rules.map(r => {
                    const met = r.test(password);
                    return (
                      <li key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-gray-500'}`}>
                        <Check size={11} className={met ? 'opacity-100' : 'opacity-0'} aria-hidden="true" />
                        {r.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm password</label>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Repeat your password"
                className={`${inputCls} ${confirm && confirm !== password ? 'border-red-700 focus:ring-red-500' : ''}`}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400 mt-1.5">Passwords do not match.</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white py-3 rounded-xl font-semibold transition mt-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <UserPlus size={16} />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              New accounts require admin approval before you can sign in.
              Guests can still <Link to="/simulator" className="text-blue-400 hover:text-blue-300">try the simulator</Link> without an account.
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
