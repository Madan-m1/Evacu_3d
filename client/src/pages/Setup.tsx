import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';

export default function Setup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/setup-check')
      .then(res => res.json())
      .then(data => {
        setIsSetupRequired(data.setupRequired);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to check setup status.');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, setupKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Setup failed');
        setLoading(false);
        return;
      }
      setSuccess('Admin account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 pt-20 text-white">
        Loading...
      </div>
    );
  }

  if (!isSetupRequired && !success) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md bg-[#1a1d2e] border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Setup Complete</h1>
          <p className="text-gray-400 mb-6">The system is already initialized.</p>
          <button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1d2e] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 mb-4">
              <ShieldAlert size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Evacu3D Setup</h1>
            <p className="text-gray-400 text-sm mt-1 text-center">Create the initial admin account to secure your system.</p>
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
              <label className="block text-xs text-gray-400 mb-1.5 font-medium flex justify-between">Setup Key <span className="text-amber-500 font-normal">Expires in 15m</span></label>
              <input type="text" placeholder="Check server terminal logs" className={inputCls + ' font-mono'}
                value={setupKey} onChange={e => setSetupKey(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Admin Email</label>
              <input type="email" placeholder="admin@example.com" className={inputCls}
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Admin Password</label>
              <input type="password" placeholder="Min 8 chars, 1 upper, 1 num, 1 special" className={inputCls}
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white py-3 rounded-xl font-semibold transition mt-2">
              <UserCheck size={16} /> Create Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
