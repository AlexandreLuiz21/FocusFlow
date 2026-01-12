'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { KanbanBoard } from '../components/KanbanBoard';
import { FocusZone } from '../components/FocusZone';
import { Dashboard } from '../components/Dashboard';
import { TaskModal } from '../components/TaskModal';
import { Task, TaskStatus, TaskPriority, Category, FocusSession } from '../types';
import { GoogleGenAI } from "@google/genai";
import { storage } from '../lib/storage';
import { NotificationManager } from '../lib/notifications';
import { Bell, XCircle, Info } from 'lucide-react';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<'board' | 'dashboard' | 'ai'>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const savedTasks = storage.getTasks();
    setTasks(savedTasks);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      storage.saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const checkDeadlines = () => {
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      tasks.forEach(task => {
        if (task.status === TaskStatus.DONE || !task.deadline) return;

        const timeUntilDeadline = task.deadline - now;
        const taskKey = `${task.id}-${task.deadline}`;

        if (timeUntilDeadline < 0 && !notifiedTasksRef.current.has(`${taskKey}-overdue`)) {
          triggerNotification(
            'Tarefa Atrasada!',
            `O prazo para "${task.title}" expirou.`,
            'error',
            task.id
          );
          notifiedTasksRef.current.add(`${taskKey}-overdue`);
        }
        else if (timeUntilDeadline > 0 && timeUntilDeadline < ONE_HOUR && !notifiedTasksRef.current.has(`${taskKey}-approaching`)) {
          triggerNotification(
            'Prazo Próximo',
            `A tarefa "${task.title}" vence em menos de uma hora!`,
            'warning',
            task.id
          );
          notifiedTasksRef.current.add(`${taskKey}-approaching`);
        }
      });
    };

    const interval = setInterval(checkDeadlines, 60000);
    checkDeadlines();

    return () => clearInterval(interval);
  }, [tasks, isLoaded]);

  const triggerNotification = (title: string, message: string, type: 'info' | 'warning' | 'error', taskId?: string) => {
    NotificationManager.send(title, message);
    const id = crypto.randomUUID();
    setAppNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setAppNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  const removeNotification = (id: string) => {
    setAppNotifications(prev => prev.filter(n => n.id !== id));
  };

  const saveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id ? { ...t, ...taskData } : t
      ));
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title || 'Nova Tarefa',
        description: taskData.description || '',
        category: taskData.category || Category.WORK,
        priority: taskData.priority || TaskPriority.MEDIUM,
        status: TaskStatus.PLANNED,
        plannedMinutes: taskData.plannedMinutes || 30,
        actualSeconds: 0,
        createdAt: Date.now(),
        deadline: taskData.deadline,
        scheduledSlots: taskData.scheduledSlots || [],
        sessions: [],
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let updatedTask = { ...t, status: newStatus };
        
        if (newStatus === TaskStatus.DOING) {
          const newSession: FocusSession = {
            id: crypto.randomUUID(),
            startTime: Date.now(),
            durationSeconds: 0,
            interrupted: false
          };
          updatedTask.sessions = [...(updatedTask.sessions || []), newSession];
        } else if (t.status === TaskStatus.DOING) {
          updatedTask.sessions = updatedTask.sessions.map(s => {
            if (!s.endTime) {
              const end = Date.now();
              const dur = Math.floor((end - s.startTime) / 1000);
              return { ...s, endTime: end, durationSeconds: dur, interrupted: newStatus === TaskStatus.PAUSED };
            }
            return s;
          });
          updatedTask.actualSeconds = updatedTask.sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
        }
        return updatedTask;
      }
      return t;
    }));
  }, []);

  const handleGenerateAiInsight = async () => {
    if (tasks.length === 0) {
      setAiInsight("Adicione algumas tarefas para análise.");
      return;
    }
    setIsAiLoading(true);
    setAiInsight('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const summary = tasks.map(t => `- ${t.title}: ${Math.floor(t.actualSeconds/60)}m/${t.plannedMinutes}m`).join('\n');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise minha produtividade baseada nestas tarefas: \n${summary}\n Forneça 3 dicas curtas e acionáveis em Português para melhorar meu foco.`,
      });
      
      const text = response.text || "Sem insights disponíveis no momento.";
      setAiInsight(text);
    } catch (error) {
      console.error("AI Error:", error);
      setAiInsight("Não foi possível consultar a IA. Verifique se a chave de API está configurada corretamente.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const activeTask = useMemo(() => tasks.find(t => t.status === TaskStatus.DOING), [tasks]);

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTask && (
          <FocusZone 
            task={activeTask} 
            onFinish={() => updateTaskStatus(activeTask.id, TaskStatus.DONE)} 
            onPause={() => updateTaskStatus(activeTask.id, TaskStatus.PAUSED)}
          />
        )}

        <div className="fixed top-24 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
          {appNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-animate pointer-events-auto min-w-[320px] max-w-md p-5 rounded-3xl shadow-2xl border flex items-start gap-4 ${
                notification.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                notification.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className={`mt-1 p-2 rounded-xl ${
                notification.type === 'error' ? 'bg-red-500 text-white' :
                notification.type === 'warning' ? 'bg-amber-500 text-white' :
                'bg-indigo-600 text-white'
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm leading-tight mb-1">{notification.title}</h4>
                <p className="text-xs opacity-80 leading-relaxed font-medium">{notification.message}</p>
              </div>
              <button onClick={() => removeNotification(notification.id)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'board' && (
            <KanbanBoard 
              tasks={tasks} 
              onStatusChange={updateTaskStatus} 
              onAddTaskClick={() => setIsTaskModalOpen(true)}
              onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
              onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
            />
          )}

          {activeView === 'dashboard' && <Dashboard tasks={tasks} />}

          {activeView === 'ai' && (
             <div className="max-w-4xl mx-auto py-12">
                <div className="bg-white rounded-3xl p-10 shadow-xl border border-indigo-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl">✨</div>
                    <h2 className="text-3xl font-extrabold text-slate-800">Insights AI</h2>
                  </div>
                  <p className="text-slate-600 mb-8 leading-relaxed">Analise seu comportamento produtivo e receba dicas personalizadas geradas pelo Gemini.</p>
                  <button onClick={handleGenerateAiInsight} disabled={isAiLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center justify-center gap-3">
                    {isAiLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analisando...</> : "Gerar Insights"}
                  </button>
                  {aiInsight && (
                    <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-500">
                      {aiInsight}
                    </div>
                  )}
                </div>
             </div>
          )}
        </div>
      </main>

      {isTaskModalOpen && (
        <TaskModal 
          onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }} 
          onSubmit={saveTask}
          taskToEdit={editingTask || undefined}
        />
      )}
    </div>
  );
}