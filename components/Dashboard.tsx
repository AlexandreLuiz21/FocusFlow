import React from 'react';
import { Task, Category, TaskStatus } from '../types';

interface DashboardProps {
  tasks: Task[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  const totalSeconds = tasks.reduce((acc, t) => acc + t.actualSeconds, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  
  const categoryStats = Object.values(Category).map(cat => ({
    name: cat,
    seconds: tasks.filter(t => t.category === cat).reduce((acc, t) => acc + t.actualSeconds, 0)
  }));

  const maxSeconds = Math.max(...categoryStats.map(s => s.seconds), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Tempo Total em Foco" 
          value={`${totalMinutes} min`} 
          subtitle="Nas últimas 24 horas"
          color="indigo"
        />
        <StatCard 
          title="Tarefas Concluídas" 
          value={completedTasks.toString()} 
          subtitle={`De um total de ${tasks.length}`}
          color="emerald"
        />
        <StatCard 
          title="Produtividade Média" 
          value={`${tasks.length > 0 ? Math.round((completedTasks/tasks.length)*100) : 0}%`} 
          subtitle="Taxa de finalização"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Foco por Categoria</h3>
          <div className="space-y-6">
            {categoryStats.map(stat => (
              <div key={stat.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 capitalize">{stat.name}</span>
                  <span className="text-slate-400 font-mono">{Math.floor(stat.seconds / 60)} min</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(stat.seconds / maxSeconds) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Execução vs. Planejado</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {tasks.filter(t => t.status === TaskStatus.DONE).map(task => {
              const diff = (task.actualSeconds / 60) - task.plannedMinutes;
              const isOver = diff > 0;
              return (
                <div key={task.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                    <p className="text-xs text-slate-400">Pla: {task.plannedMinutes}m | Rea: {Math.floor(task.actualSeconds / 60)}m</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isOver ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isOver ? `+${Math.round(diff)}m` : `${Math.round(diff)}m`}
                  </span>
                </div>
              );
            })}
            {tasks.filter(t => t.status === TaskStatus.DONE).length === 0 && (
              <p className="text-center text-slate-400 italic py-12">Nenhuma tarefa concluída para exibir métricas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, subtitle: string, color: string }> = ({ title, value, subtitle, color }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 group hover:border-indigo-200 transition-colors">
    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    <p className={`text-4xl font-extrabold text-${color}-600 mb-1 tracking-tighter tabular-nums`}>{value}</p>
    <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
  </div>
);