import { Link } from 'react-router-dom';
import {
  ShieldAlert, Map, Users, Zap, GitBranch, Building2, Bell,
  ArrowRight, CheckCircle, Globe, Lock, Cpu
} from 'lucide-react';

const features = [
  {
    icon: <Map size={22} className="text-blue-400" />,
    title: 'Real-Time Pathfinding',
    desc: "Dijkstra's algorithm computes the shortest safe route instantly — dynamically rerouting around active hazard zones as conditions change.",
  },
  {
    icon: <Zap size={22} className="text-yellow-400" />,
    title: 'Live Hazard Simulation',
    desc: 'Trigger fire, smoke, or structural blocks in real time. The routing engine reacts immediately, broadcasting updated routes to all connected users.',
  },
  {
    icon: <Users size={22} className="text-purple-400" />,
    title: 'Multi-User Awareness',
    desc: 'See all participants moving through the building in 3D. Real-time crowd density visualization helps identify dangerous congestion points.',
  },
  {
    icon: <Building2 size={22} className="text-emerald-400" />,
    title: 'Multi-Building Support',
    desc: 'Manage unlimited buildings, each with custom floor plans, node layouts, and independently configurable evacuation routes.',
  },
  {
    icon: <GitBranch size={22} className="text-orange-400" />,
    title: 'Refuge & Exit Fallback',
    desc: 'When all exits are blocked, the system automatically switches to refuge mode — guiding occupants to the nearest safe shelter area.',
  },
  {
    icon: <Bell size={22} className="text-red-400" />,
    title: 'Role-Based Access',
    desc: 'Admins configure scenarios and escalate hazards. Users participate in drills. Guests explore freely in read-only mode.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Design Your Building',
    desc: 'Use the visual node editor to map out rooms, corridors, exits, and refuge areas — no CAD skills required.',
    color: 'text-blue-400',
    border: 'border-blue-800/40',
    bg: 'bg-blue-900/10',
  },
  {
    number: '02',
    title: 'Inject Hazard Scenarios',
    desc: 'Simulate fire, smoke, or blocked paths in real time and watch the pathfinding engine instantly compute new safe routes.',
    color: 'text-red-400',
    border: 'border-red-800/40',
    bg: 'bg-red-900/10',
  },
  {
    number: '03',
    title: 'Run the Evacuation',
    desc: 'Participants join the simulation and follow glowing 3D routes to the nearest exit or refuge — all visible in real time.',
    color: 'text-emerald-400',
    border: 'border-emerald-800/40',
    bg: 'bg-emerald-900/10',
  },
];

const techStack = [
  { icon: <Cpu size={16} className="text-blue-400" />, label: 'React + TypeScript' },
  { icon: <Globe size={16} className="text-purple-400" />, label: 'Three.js / WebGL' },
  { icon: <Zap size={16} className="text-yellow-400" />, label: 'Socket.io Real-Time' },
  { icon: <Lock size={16} className="text-emerald-400" />, label: 'JWT Authentication' },
  { icon: <Building2 size={16} className="text-orange-400" />, label: 'Node.js + Express' },
  { icon: <CheckCircle size={16} className="text-red-400" />, label: 'MongoDB + Mongoose' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      {/* ── Hero ── */}
      <div className="pt-28 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
            <ShieldAlert size={48} className="text-red-400" />
          </div>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 mb-5">
          About Evacu3D
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          An intelligent building evacuation simulator built for emergency preparedness training,
          safety planning, and multi-user evacuation drills — all in your browser, in real time.
        </p>
      </div>

      {/* ── Mission ── */}
      <div className="max-w-4xl mx-auto px-6 mb-20">
        <div className="bg-gradient-to-br from-[#1a1d2e] to-[#151825] border border-gray-800 rounded-2xl p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-gray-400 leading-relaxed mb-4">
            Traditional evacuation drills are static, paper-based, and difficult to visualize under pressure.
            Evacu3D changes that with an <strong className="text-white">interactive 3D simulation environment</strong> where
            any building can be modeled, hazards injected in real time, and occupants can experience
            a realistic evacuation — without any installation.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Whether you're a safety officer configuring drill scenarios, an occupant learning your nearest exit,
            or a researcher studying crowd dynamics — Evacu3D gives you the tools to do it effectively and safely.
          </p>
        </div>
      </div>

      {/* ── How It Works ── */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-3">How It Works</h2>
        <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto text-sm">
          Three simple steps from building setup to full evacuation simulation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map(s => (
            <div key={s.number} className={`${s.bg} border ${s.border} rounded-2xl p-6`}>
              <div className={`text-3xl font-black mb-3 ${s.color} opacity-60`}>{s.number}</div>
              <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features Grid ── */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-3">Platform Features</h2>
        <p className="text-gray-400 text-center mb-10 text-sm">
          Built with production-grade patterns used in real safety systems.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div
              key={f.title}
              className="group bg-[#1a1d2e] border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-800/80 rounded-lg group-hover:bg-gray-700/80 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech Stack ── */}
      <div className="max-w-4xl mx-auto px-6 mb-20">
        <div className="bg-[#1a1d2e] border border-gray-800 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Built with Modern Technology</h2>
          <p className="text-gray-500 text-sm mb-7">A full-stack, production-grade architecture from frontend to database.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map(t => (
              <div
                key={t.label}
                className="flex items-center gap-2 bg-gray-900/60 border border-gray-700 px-4 py-2 rounded-xl text-sm text-gray-300 hover:border-gray-500 hover:text-white transition"
              >
                {t.icon}
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="max-w-2xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to explore?</h2>
        <p className="text-gray-400 mb-8 text-sm">
          Launch the simulator as a guest — no account required. See pathfinding in action in under 60 seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/simulator"
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-red-900/30 transition"
          >
            Launch Simulator <ArrowRight size={16} />
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-8 py-3.5 rounded-xl font-medium transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
