import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-darkBg to-panelBg text-white p-6 pt-20">
      <div className="max-w-3xl text-center space-y-8 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-alertRed/20 rounded-full border border-alertRed/30 shadow-[0_0_30px_rgba(230,57,70,0.3)]">
            <ShieldAlert size={64} className="text-alertRed animate-pulse" />
          </div>
        </div>

        <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
          Evacu3D
        </h1>

        <p className="text-2xl font-light text-gray-300">
          Intelligent Building Evacuation Simulator
        </p>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Visualize real-time evacuation routes through complex 3D building environments.
          Simulate hazards dynamically to find the safest path to safety using advanced pathfinding algorithms.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            to="/simulator"
            className="flex items-center gap-2 bg-gradient-to-r from-alertRed to-red-600 hover:from-red-600 hover:to-alertRed text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-alertRed/20 transition-all hover:scale-105 active:scale-95"
          >
            Launch Simulator
            <ArrowRight size={20} />
          </Link>

          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 border border-blue-600 text-white px-8 py-4 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
            >
              <LayoutDashboard size={18} />
              Admin Dashboard
            </Link>
          )}

          {!isAuthenticated && (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-8 py-4 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
            >
              <LogIn size={18} />
              Login
            </Link>
          )}
        </div>

        {!isAuthenticated && (
          <p className="text-sm text-gray-500">
            No account needed to try the simulator •{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">Sign up</Link>
            {' '}to report hazards
          </p>
        )}
        {isAuthenticated && (
          <p className="text-sm text-gray-500">
            Signed in as <span className="text-blue-400">{user?.email}</span>
            {user?.role === 'admin' && <span className="ml-2 text-xs bg-blue-900/40 border border-blue-800 px-2 py-0.5 rounded-full text-blue-300">ADMIN</span>}
          </p>
        )}
      </div>

      <div className="absolute bottom-10 inset-x-0 text-center text-sm text-gray-600">
        Demo Application • Interactive 3D Pathfinding • React + Three.js
      </div>
    </div>
  );
};

export default Home;
