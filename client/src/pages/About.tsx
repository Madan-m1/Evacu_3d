import { Link } from 'react-router-dom';
import { ShieldAlert, Map, Users, Zap, GitBranch, Building2, Bell } from 'lucide-react';

const features = [
  {
    icon: <Map size={22} className="text-blue-400" />,
    title: 'Real-Time Pathfinding',
    desc: 'Uses Dijkstra\'s algorithm to compute the safest, shortest evacuation path — dynamically avoiding active hazard zones.',
  },
  {
    icon: <Zap size={22} className="text-yellow-400" />,
    title: 'Live Hazard Simulation',
    desc: 'Admins and users can mark fire, smoke, or blocked areas in real time. The routing engine reacts instantly to reflect changes.',
  },
  {
    icon: <Users size={22} className="text-purple-400" />,
    title: 'Multi-User Awareness',
    desc: 'See other participants in the 3D scene as they navigate the building. Real-time presence tracking for collaborative drills.',
  },
  {
    icon: <Building2 size={22} className="text-emerald-400" />,
    title: 'Multi-Building Support',
    desc: 'Manage any number of buildings, each with its own unique floor plans, node layouts, and evacuation routes.',
  },
  {
    icon: <GitBranch size={22} className="text-orange-400" />,
    title: 'Refuge & Exit Modes',
    desc: 'If all exits are blocked, the system switches to refuge mode — guiding users to the nearest safe shelter area.',
  },
  {
    icon: <Bell size={22} className="text-red-400" />,
    title: 'Role-Based Access',
    desc: 'Admins configure building layouts and escalate hazards. Users participate in drills. Guests explore freely, read-only.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Hero */}
      <div className="pt-28 pb-16 px-6 text-center max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
            <ShieldAlert size={48} className="text-red-400" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 mb-4">
          About Evacu3D
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Evacu3D is an intelligent building evacuation simulator built for emergency preparedness training,
          safety planning, and multi-user evacuation drills. It combines 3D visualization with real-time pathfinding
          to transform how people prepare for emergencies.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <div className="bg-[#1a1d2e] border border-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-gray-400 leading-relaxed">
            Traditional evacuation drills are static, paper-based, and difficult to visualize. Evacu3D changes that
            by providing an interactive <strong className="text-white">3D simulation environment</strong> where any
            building can be modeled, hazards can be injected in real time, and users can experience a realistic
            evacuation — all from their browser, without any installation.
          </p>
          <p className="text-gray-400 leading-relaxed mt-4">
            Whether you're a safety officer configuring drill scenarios, an occupant learning your nearest exit, 
            or a researcher studying crowd dynamics, Evacu3D provides the tools to do it effectively.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Platform Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="bg-[#1a1d2e] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-800 rounded-lg">{f.icon}</div>
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to explore?</h2>
        <p className="text-gray-400 mb-8">Try the simulator as a guest — no account needed.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/simulator"
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-red-900/30 transition">
            Launch Simulator
          </Link>
          <Link to="/register"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-8 py-3.5 rounded-xl font-medium transition">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
