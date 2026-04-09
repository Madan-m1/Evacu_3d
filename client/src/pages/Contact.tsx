import { useState } from 'react';
import { Mail, User, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../api/config';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error');
      setStatusMsg('All fields are required.');
      return;
    }
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch(getApiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setStatusMsg(data.error || 'Submission failed'); }
      else {
        setStatus('success');
        setStatusMsg('Thank you! Your message has been received.');
        setName(''); setEmail(''); setMessage('');
      }
    } catch {
      setStatus('error');
      setStatusMsg('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const inputCls = 'w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition';

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
            <Mail size={28} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">Contact Us</h1>
          <p className="text-gray-400 leading-relaxed">
            Have questions about Evacu3D, need help setting up your building, or just want to say hello?
            <br />We'd love to hear from you.
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1d2e] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {status !== 'idle' && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-6 border ${
              status === 'success'
                ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-300'
                : 'bg-red-900/20 border-red-800/50 text-red-300'
            }`}>
              {status === 'success' ? <CheckCircle size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Your name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Jane Smith" className={inputCls + ' pl-10'}
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" placeholder="jane@example.com" className={inputCls + ' pl-10'}
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Message</label>
              <div className="relative">
                <MessageSquare size={15} className="absolute left-3.5 top-3.5 text-gray-500" />
                <textarea
                  placeholder="Tell us what's on your mind…"
                  className={inputCls + ' pl-10 min-h-[140px] resize-y'}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white py-3.5 rounded-xl font-semibold transition">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={16} />}
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Response within 24 hours · <a href="mailto:admin@evacu3d.com" className="text-blue-400 hover:text-blue-300">admin@evacu3d.com</a>
        </div>
      </div>
    </div>
  );
}
