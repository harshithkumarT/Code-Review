import { Menu, Sparkles, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ setMobileOpen }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Model: <strong className="text-slate-200">Gemini 1.5 Pro</strong></span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline-block">
            {user?.name}
          </span>
          <img
            src={user?.profileImage}
            alt={user?.name}
            className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover"
          />
        </div>
      </div>
    </header>
  );
}
