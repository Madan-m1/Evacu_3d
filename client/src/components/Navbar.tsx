import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const linkCls = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  const navLinks = (
    <>
      <Link to="/" className={linkCls('/')} onClick={() => setMenuOpen(false)}>Home</Link>
      <Link to="/about" className={linkCls('/about')} onClick={() => setMenuOpen(false)}>About</Link>
      <Link to="/simulator" className={linkCls('/simulator')} onClick={() => setMenuOpen(false)}>Simulator</Link>
      <Link to="/contact" className={linkCls('/contact')} onClick={() => setMenuOpen(false)}>Contact</Link>
      {isAuthenticated && user?.role === 'admin' && (
        <Link to="/dashboard" className={linkCls('/dashboard')} onClick={() => setMenuOpen(false)}>
          <span className="flex items-center gap-1.5">
            <LayoutDashboard size={14} /> Admin
          </span>
        </Link>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1117]/90 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 bg-red-500/20 rounded-lg border border-red-500/30">
            <ShieldAlert size={18} className="text-red-400" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">Evacu<span className="text-red-400">3D</span></span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks}
        </div>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-lg">
                <User size={14} className="text-blue-400" />
                <span className="text-xs text-gray-300">{user.email}</span>
                {user.role === 'admin' && (
                  <span className="text-[10px] bg-blue-600/30 border border-blue-600/40 text-blue-300 px-1.5 py-0.5 rounded-full font-medium">ADMIN</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition">
                <LogIn size={14} /> Login
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-400 hover:text-white p-1"
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0f1117] border-t border-gray-800 px-4 py-4 flex flex-col gap-2">
          {navLinks}
          <div className="border-t border-gray-800 pt-3 mt-1">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 px-2">{user.email} · <span className="text-blue-400">{user.role}</span></div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-gray-800 w-full transition">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
