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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<'board' | 'dashboard' | 'ai'>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

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
              return { ...s, endTime: end, durationSeconds: dur };
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
      setAiInsight("Adicione algumas tarefas para que eu possa analisar seu fluxo de trabalho!");
      return;
    }

    setIsAiLoading(true);
    setAiInsight('');

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const taskSummary = tasks.map(t => 
        `- ${t.title} [${t.category}]: ${Math.floor(t.actualSeconds / 60)} min realizados de ${t.plannedMinutes} min planejados. Status: ${t.status}`
      ).join('\n');

      const prompt = `Você é um Consultor de Produtividade Sênior. Analise o seguinte backlog de tarefas e forneça 3 insights acionáveis para melhorar o foco e a gestão do tempo:\n\n${taskSummary}\n\nResponda em Português do Brasil, de forma encorajadora e técnica.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiInsight(result.text || "Não foi possível gerar insights no momento.");
    } catch (error) {
      console.error("AI Insight error:", error);
      setAiInsight("Ocorreu um erro ao consultar o oráculo da produtividade. Verifique sua conexão.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const activeTask = useMemo(() => tasks.find(t => t.status === TaskStatus.DOING), [tasks]);

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
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
              onAddTaskClick={() => setIsTaskModalOpen(true)}
              onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
              onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
            />
          )}

          {activeView === 'dashboard' && <Dashboard tasks={tasks} />}

          {activeView === 'ai' && (
             <div className="max-w-4xl mx-auto py-12">
                <div className="bg-white rounded-3xl p-10 shadow-xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                      <span className="text-3xl">✨</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">FocusFlow AI Insights</h2>
                      <p className="text-slate-500 font-medium">Análise inteligente do seu comportamento produtivo</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-slate-600 leading-relaxed">
                      Utilizamos inteligência artificial para analisar suas tarefas, categorias e tempos de execução para fornecer recomendações personalizadas.
                    </p>

                    <button 
                      onClick={handleGenerateAiInsight}
                      disabled={isAiLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      {isAiLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Analisando seu fluxo...
                        </>
                      ) : (
                        "Gerar Insights Agora"
                      )}
                    </button>

                    {aiInsight && (
                      <div className="mt-8 p-8 bg-slate-50 rounded-3xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
                        <div className="prose prose-slate max-w-none">
                          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {aiInsight}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
};

export default App;