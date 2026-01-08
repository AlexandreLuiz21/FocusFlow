import React, { useState, useEffect } from 'react';
import { LayoutGrid, BarChart3, Sparkles, LogOut, Bell, BellOff } from 'lucide-react';
import { NotificationManager } from '../lib/notifications';

interface SidebarProps {
  activeView: 'board' | 'dashboard' | 'ai';
  onViewChange: (view: 'board' | 'dashboard' | 'ai') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setNotifPermission(NotificationManager.getPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await NotificationManager.requestPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  };

  const menuItems = [
    { id: 'board', label: 'Fluxo', icon: LayoutGrid },
    { id: 'dashboard', label: 'Análise', icon: BarChart3 },
    { id: 'ai', label: 'Insights AI', icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full z-20">
      <div className="p-8 flex-1">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">FocusFlow</span>
        </div>

        <nav className="space-y-2 mb-10">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeView === item.id 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          <div className="px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Preferências</p>
            <button
              onClick={handleRequestPermission}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all font-medium border ${
                notifPermission === 'granted'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {notifPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span className="text-sm">Alertas</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${notifPermission === 'granted' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 border-t border-slate-100">
        <button className="flex items-center gap-3 text-slate-400 hover:text-red-500 transition-colors px-4 py-2 w-full font-medium">
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};