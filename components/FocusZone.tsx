
import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, CheckCircle, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Task } from '../types';

interface FocusZoneProps {
  task: Task;
  onFinish: () => void;
}

export const FocusZone: React.FC<FocusZoneProps> = ({ task, onFinish }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const currentSession = task.sessions.find(s => !s.endTime);
    if (currentSession) {
      const elapsed = Math.floor((Date.now() - currentSession.startTime) / 1000);
      setSeconds(elapsed);
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [task.id, task.sessions]);

  // Discipline Logic: Is user within a scheduled slot right now?
  const isOnSchedule = useMemo(() => {
    if (!task.scheduledSlots || task.scheduledSlots.length === 0) return null;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return task.scheduledSlots.some(slot => {
      return slot.date === todayStr && timeStr >= slot.startTime && timeStr <= slot.endTime;
    });
  }, [task.scheduledSlots]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((seconds / (task.plannedMinutes * 60)) * 100, 100);

  return (
    <div className="bg-indigo-950 text-white px-8 py-4 flex items-center justify-between shadow-2xl relative z-40 border-b border-indigo-900 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-full border-4 border-indigo-800/50 flex items-center justify-center relative overflow-hidden group">
          <div 
            className="absolute bottom-0 left-0 w-full bg-indigo-500/30 transition-all duration-1000"
            style={{ height: `${progress}%` }}
          />
          <Clock className="w-6 h-6 relative z-10 text-indigo-200" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-indigo-900/50 px-2 py-0.5 rounded-full border border-indigo-700/50">
               <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
               <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Em Foco</span>
            </div>
            {isOnSchedule === true && (
               <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> NO PLANO
               </div>
            )}
            {isOnSchedule === false && (
               <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3" /> FORA DO HORÁRIO
               </div>
            )}
          </div>
          <h2 className="font-bold text-xl truncate max-w-lg tracking-tight">{task.title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="text-right flex flex-col items-end">
          <div className="text-4xl font-mono font-bold tracking-tighter tabular-nums text-white drop-shadow-sm">
            {formatTime(seconds)}
          </div>
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
            Meta Global: {task.plannedMinutes} min
          </div>
        </div>

        <button 
          onClick={onFinish}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-emerald-950/20 active:scale-95 group"
        >
          <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-lg">Concluir</span>
        </button>
      </div>
    </div>
  );
};
