import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, ArrowRight, LayoutDashboard, LogIn,
  Map, Zap, Users, GitBranch, Shield, Activity
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import heroPoster from '../assets/hero.png';

const highlights = [
  {
    icon: <Map size={20} className="text-blue-400" />,
    title: 'Intelligent Pathfinding',
    desc: "Real-time Dijkstra's algorithm finds the safest evacuation route — dynamically avoiding active hazards.",
    accent: 'border-blue-800/40 hover:border-blue-700/60',
  },
  {
    icon: <Zap size={20} className="text-yellow-400" />,
    title: 'Live Hazard Injection',
    desc: 'Trigger fire, smoke, or blocked paths instantly. Routes update in real time for all connected users.',
    accent: 'border-yellow-800/40 hover:border-yellow-700/60',
  },
  {
    icon: <Users size={20} className="text-purple-400" />,
    title: 'Multi-User Simulation',
    desc: 'See other participants moving through the 3D building. Crowd density awareness built in.',
    accent: 'border-purple-800/40 hover:border-purple-700/60',
  },
  {
    icon: <GitBranch size={20} className="text-orange-400" />,
    title: 'Refuge Mode Fallback',
    desc: 'When exits are blocked, the system auto-switches to guide occupants to the nearest refuge area.',
    accent: 'border-orange-800/40 hover:border-orange-700/60',
  },
  {
    icon: <Shield size={20} className="text-emerald-400" />,
    title: 'Role-Based Access',
    desc: 'Admins control building layouts and hazards. Users join drills. Guests explore without an account.',
    accent: 'border-emerald-800/40 hover:border-emerald-700/60',
  },
  {
    icon: <Activity size={20} className="text-red-400" />,
    title: 'Real-Time Capacity',
    desc: 'Live occupancy indicators on every refuge area — colour-coded from safe to critical.',
    accent: 'border-red-800/40 hover:border-red-700/60',
  },
];

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="bg-[#0f1117] text-white">

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden p-6 pt-20">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={heroPoster}
          className="absolute top-0 left-0 w-full h-full object-cover z-0 brightness-60 contrast-110"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark Gradient Overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 60%, rgba(15,17,23,1) 100%)' }}
        />

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl w-full text-center space-y-6 sm:space-y-8 animate-fade-in-up px-2 pb-12 sm:pb-0">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-alertRed/20 rounded-full border border-alertRed/30 shadow-[0_0_30px_rgba(230,57,70,0.3)]">
              <ShieldAlert size={64} className="text-alertRed animate-pulse" />
            </div>
          </div>

        <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,80,50,0.5)) drop-shadow(0 0 20px rgba(255,80,50,0.3))' }}
          >
            Evacu3D
          </h1>

          <p
            className="text-xl sm:text-2xl font-medium text-white"
            style={{ textShadow: '0px 2px 8px rgba(0,0,0,0.8)' }}
          >
            Intelligent Building Evacuation Simulator
          </p>

          <p
            className="text-base sm:text-lg text-white font-medium max-w-2xl mx-auto leading-relaxed"
            style={{ textShadow: '0px 2px 8px rgba(0,0,0,0.8)' }}
          >
            Visualize real-time evacuation routes through complex 3D building environments.
            Simulate hazards dynamically to find the safest path to safety using advanced pathfinding.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-4 w-full sm:w-auto">
            <Link
              to="/simulator"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-alertRed to-red-600 hover:from-red-600 hover:to-alertRed text-white px-8 py-4 rounded-xl font-semibold shadow-[0_0_15px_rgba(230,57,70,0.5)] transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              Launch Simulator
              <ArrowRight size={20} />
            </Link>

            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 border border-blue-600 text-white px-8 py-4 rounded-xl font-medium shadow-[0_0_15px_rgba(29,78,216,0.5)] transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
              >
                <LayoutDashboard size={18} />
                Admin Dashboard
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-8 py-4 rounded-xl font-medium shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
              >
                <LogIn size={18} />
                Sign In
              </Link>
            )}
          </div>

          {/* Helper text — stacked cleanly, no overlap with scroll hint */}
          <div className="flex flex-col items-center gap-1.5 text-sm">
            {!isAuthenticated && (
              <p className="text-gray-400 text-center leading-relaxed">
                No account needed to try the simulator •{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300">Sign up</Link>
                {' '}to report hazards
              </p>
            )}
            {isAuthenticated && (
              <p className="text-gray-400 flex flex-wrap items-center justify-center gap-1.5">
                Signed in as
                <span className="text-blue-400 max-w-[180px] sm:max-w-none truncate inline-block">{user?.email}</span>
                {user?.role === 'admin' && (
                  <span className="text-xs bg-blue-900/40 border border-blue-800 px-2 py-0.5 rounded-full text-blue-300 shrink-0">ADMIN</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Scroll hint — hidden on mobile to prevent collision with hero content */}
        <div className="hidden sm:block absolute z-10 bottom-8 inset-x-0 text-center text-sm text-gray-400 drop-shadow-md px-4">
          Real-time emergency preparedness • Intelligent pathfinding • Multi-user evacuation simulation
        </div>
      </div>

      {/* ── FEATURE HIGHLIGHTS ───────────────────────────────── */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Everything you need for safe evacuation drills
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
            Built with real-time technology and designed for clarity under pressure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map(h => (
            <div
              key={h.title}
              className={`group bg-[#1a1d2e] border ${h.accent} rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="p-2.5 bg-gray-800/70 rounded-xl w-fit mb-4 group-hover:bg-gray-700/80 transition-colors">
                {h.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{h.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <div className="bg-[#13151f] border-y border-gray-800/60 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-extrabold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 text-base">Up and running in under a minute.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { num: '1', title: 'Open the Simulator', desc: 'Select your building and enter the 3D environment — no download, no account required.' },
            { num: '2', title: 'Mark Your Location', desc: 'Tap the room you are currently in from the control panel sidebar.' },
            { num: '3', title: 'Follow Your Route', desc: 'Press "Find Safest Path" and follow the glowing animated route to the nearest exit.' },
          ].map(s => (
            <div key={s.num} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600/30 to-orange-600/20 border border-red-700/40 flex items-center justify-center text-xl font-black text-red-400">
                {s.num}
              </div>
              <h3 className="text-white font-bold text-base">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <div className="py-24 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">Ready to simulate?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto text-base">
          Experience a full evacuation simulation in your browser — right now, for free.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/simulator"
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-red-900/30 transition-all hover:scale-105 active:scale-95"
          >
            Launch Simulator <ArrowRight size={18} />
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-10 py-4 rounded-xl font-medium transition"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
