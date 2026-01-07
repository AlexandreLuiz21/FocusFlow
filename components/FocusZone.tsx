
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, ShieldAlert, ShieldCheck, Target } from 'lucide-react';
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
    <div className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between shadow-2xl relative z-40 border-b border-white/5 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center relative overflow-hidden">
            <div 
              className="absolute bottom-0 left-0 w-full bg-indigo-500/40 transition-all duration-1000"
              style={{ height: `${progress}%` }}
            />
            <Target className="w-7 h-7 relative z-10 text-indigo-400" />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
               <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
               <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Sessão Ativa</span>
            </div>
            {isOnSchedule === true && (
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> FOCO PLANEJADO
               </div>
            )}
            {isOnSchedule === false && (
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  <ShieldAlert className="w-3.5 h-3.5" /> EXECUÇÃO AD-HOC
               </div>
            )}
          </div>
          <h2 className="font-bold text-2xl truncate max-w-xl tracking-tight text-white/90">{task.title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-12">
        <div className="text-right flex flex-col items-end">
          <div className="text-5xl font-mono font-bold tracking-tighter tabular-nums text-indigo-400">
            {formatTime(seconds)}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Meta Total: {task.plannedMinutes}m
          </div>
        </div>

        <button 
          onClick={onFinish}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-[1.25rem] font-bold flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/10 active:scale-95 group"
        >
          <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-xl">Concluir</span>
        </button>
      </div>
    </div>
  );
};
