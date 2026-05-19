import React from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Shield, User } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f1f5f9] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0f172a]/70 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between shrink-0">
        <div>
          {/* Sidebar Header Brand Logo */}
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                T
              </span>
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                TaskSync
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive('/')
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <LayoutDashboard size={20} className={isActive('/') ? 'text-indigo-400' : 'text-slate-400'} />
              <span className="font-medium text-sm">Dashboard</span>
            </Link>
          </nav>
        </div>

        {/* User Card Profile & Actions */}
        <div className="p-4 border-t border-slate-800/50 space-y-4 bg-slate-900/30">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-slate-700/50 text-indigo-400 font-bold shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate text-slate-200">{user?.name}</h4>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                {user?.role === 'Admin' ? (
                  <Shield size={12} className="text-emerald-400" />
                ) : (
                  <User size={12} className="text-blue-400" />
                )}
                <span className="font-medium">{user?.role}</span>
              </p>
            </div>
          </div>

          {/* Logout Action Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 border border-red-900/20 hover:border-red-900/40 transition-all duration-200 font-medium text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main viewport Container */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
