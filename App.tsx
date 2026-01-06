
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { FocusZone } from './components/FocusZone';
import { Dashboard } from './components/Dashboard';
import { TaskModal } from './components/TaskModal';
import { Task, TaskStatus, TaskPriority, Category, FocusSession } from './types';
import { GoogleGenAI } from "@google/genai";
import { storage } from './lib/storage';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [activeView, setActiveView] = useState<'board' | 'dashboard' | 'ai'>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Persistence
  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  // Task Actions
  const handleOpenNewTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const saveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      // Edit existing
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id ? { ...t, ...taskData } : t
      ));
    } else {
      // Add new
      // FIX: Added scheduledSlots and deadline to satisfy the Task interface requirements
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title || 'Untitled Task',
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

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
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
              return { ...s, endTime: end, durationSeconds: dur };
            }
            return s;
          });
          updatedTask.actualSeconds = updatedTask.sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
        }
        return updatedTask;
      }
      
      if (newStatus === TaskStatus.DOING && t.status === TaskStatus.DOING && t.id !== taskId) {
         const updatedT = { ...t, status: TaskStatus.PAUSED };
         updatedT.sessions = updatedT.sessions.map(s => {
            if (!s.endTime) {
              const end = Date.now();
              const dur = Math.floor((end - s.startTime) / 1000);
              return { ...s, endTime: end, durationSeconds: dur, interrupted: true, pauseReason: 'Switched task' };
            }
            return s;
          });
          updatedT.actualSeconds = updatedT.sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
          return updatedT;
      }

      return t;
    }));
  }, []);

  const activeTask = useMemo(() => tasks.find(t => t.status === TaskStatus.DOING), [tasks]);

  const generateAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const historySummary = tasks.map(t => `${t.title} (${t.category}): Real ${Math.round(t.actualSeconds/60)}m vs Planejado ${t.plannedMinutes}m`).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise meu histórico de produtividade do FocusFlow e dê 3 dicas práticas para melhorar meu foco: ${historySummary}`,
        config: { systemInstruction: "Você é um mentor de produtividade sênior focado em TDAH e gestão de tempo moderna. Seja direto e motivador em Português do Brasil." }
      });
      // Correct usage of .text property
      setAiInsight(response.text || 'Não foi possível gerar insights no momento.');
    } catch (err) {
      setAiInsight('Erro ao conectar com a IA. Verifique sua chave API.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTask && (
          <FocusZone task={activeTask} onFinish={() => updateTaskStatus(activeTask.id, TaskStatus.DONE)} />
        )}

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'board' && (
            <KanbanBoard 
              tasks={tasks} 
              onStatusChange={updateTaskStatus} 
              onAddTaskClick={handleOpenNewTaskModal}
              onEditTask={handleOpenEditTaskModal}
              onDeleteTask={deleteTask}
            />
          )}

          {activeView === 'dashboard' && (
            <Dashboard tasks={tasks} />
          )}

          {activeView === 'ai' && (
            <div className="max-w-4xl mx-auto py-12">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-100">
                <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <span className="text-indigo-600">✨</span> Insights de Produtividade (AI)
                </h2>
                <button 
                  onClick={generateAiInsight}
                  disabled={isAiLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {isAiLoading ? 'Analisando Fluxo...' : 'Gerar Nova Análise'}
                </button>
                {aiInsight && (
                  <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-900 whitespace-pre-wrap leading-relaxed">
                    {aiInsight}
                  </div>
                )}
                {!aiInsight && !isAiLoading && (
                  <p className="mt-8 text-slate-500 italic text-center">
                    Clique no botão acima para receber dicas personalizadas baseadas no seu histórico real.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {isTaskModalOpen && (
        <TaskModal 
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }} 
          onSubmit={saveTask}
          taskToEdit={editingTask || undefined}
        />
      )}
    </div>
  );
};

export default App;
