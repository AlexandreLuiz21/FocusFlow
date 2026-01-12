import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, CheckCircle, ShieldAlert, ShieldCheck, Target, PauseCircle, AlertTriangle } from 'lucide-react';
import { Task } from '../types';

interface FocusZoneProps {
  task: Task;
  onFinish: () => void;
  onPause: () => void;
}

export const FocusZone: React.FC<FocusZoneProps> = ({ task, onFinish, onPause }) => {
  const [elapsedInCurrentSession, setElapsedInCurrentSession] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    const currentSession = task.sessions.find(s => !s.endTime);
    if (currentSession) {
      const elapsed = Math.floor((Date.now() - currentSession.startTime) / 1000);
      setElapsedInCurrentSession(elapsed);
    }

    const interval = setInterval(() => {
      setElapsedInCurrentSession(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [task.id, task.sessions]);

  // Cálculo do tempo restante global para a meta planejada
  const totalSecondsPlanned = task.plannedMinutes * 60;
  const totalSecondsAccumulated = task.actualSeconds + elapsedInCurrentSession;
  const remainingSeconds = totalSecondsPlanned - totalSecondsAccumulated;
  const isOvertime = remainingSeconds < 0;

  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota Lá (A5)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Áudio não pôde ser reproduzido:", e);
    }
  };

  useEffect(() => {
    if (remainingSeconds <= 0 && !hasAlertedRef.current) {
      playAlertSound();
      hasAlertedRef.current = true;
    }
    if (remainingSeconds > 0) {
      hasAlertedRef.current = false;
    }
  }, [remainingSeconds]);

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
    const absoluteSecs = Math.abs(totalSecs);
    const hrs = Math.floor(absoluteSecs / 3600);
    const mins = Math.floor((absoluteSecs % 3600) / 60);
    const secs = absoluteSecs % 60;
    const sign = totalSecs < 0 ? '-' : '';
    return `${sign}${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((totalSecondsAccumulated / totalSecondsPlanned) * 100, 100);

  return (
    <div className={`px-8 py-5 flex items-center justify-between shadow-2xl relative z-40 border-b transition-colors duration-500 animate-in slide-in-from-top ${isOvertime ? 'bg-red-950 border-red-500/30' : 'bg-slate-900 border-white/5'}`}>
      <div className="flex items-center gap-8">
        <div className="relative group">
          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center relative overflow-hidden ${isOvertime ? 'border-red-900' : 'border-slate-800'}`}>
            <div 
              className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${isOvertime ? 'bg-red-500/40' : 'bg-indigo-500/40'}`}
              style={{ height: `${progress}%` }}
            />
            <Target className={`w-7 h-7 relative z-10 ${isOvertime ? 'text-red-400' : 'text-indigo-400'}`} />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border ${isOvertime ? 'bg-red-500/20 border-red-500/30' : 'bg-indigo-500/20 border-indigo-500/30'}`}>
               <span className={`h-2 w-2 rounded-full animate-pulse ${isOvertime ? 'bg-red-500' : 'bg-indigo-500'}`}></span>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${isOvertime ? 'text-red-300' : 'text-indigo-300'}`}>
                 {isOvertime ? 'Tempo Excedido' : 'Sessão Ativa'}
               </span>
            </div>
            
            {isOvertime && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 animate-bounce">
                <AlertTriangle className="w-3.5 h-3.5" /> ATRASADO
              </div>
            )}

            {!isOvertime && isOnSchedule === true && (
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> FOCO PLANEJADO
               </div>
            )}
          </div>
          <h2 className={`font-bold text-2xl truncate max-w-xl tracking-tight text-white/90 ${isOvertime ? 'text-red-100' : ''}`}>{task.title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right flex flex-col items-end mr-4">
          <div className={`text-5xl font-mono font-bold tracking-tighter tabular-nums ${isOvertime ? 'text-red-500' : 'text-indigo-400'}`}>
            {formatTime(remainingSeconds)}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            {isOvertime ? 'Tempo Extra Decorrido' : `Restam de ${task.plannedMinutes}m`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onPause}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-4 rounded-[1.25rem] font-bold flex items-center gap-2 transition-all active:scale-95 border border-white/5"
          >
            <PauseCircle className="w-5 h-5" />
            <span>Pausar</span>
          </button>
          
          <button 
            onClick={onFinish}
            className={`${isOvertime ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-500 hover:bg-emerald-400'} text-white px-8 py-4 rounded-[1.25rem] font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95 group`}
          >
            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Concluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};