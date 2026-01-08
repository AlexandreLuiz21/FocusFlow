import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { DeleteModal } from './DeleteModal';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAddTaskClick: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onStatusChange, 
  onAddTaskClick,
  onEditTask,
  onDeleteTask
}) => {
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const columns = [
    { id: TaskStatus.PLANNED, title: 'Planejado', color: 'bg-slate-100' },
    { id: TaskStatus.DOING, title: 'Em Execução', color: 'bg-indigo-100' },
    { id: TaskStatus.PAUSED, title: 'Pausado', color: 'bg-amber-100' },
    { id: TaskStatus.DONE, title: 'Concluído', color: 'bg-emerald-100' },
  ];

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
      case TaskPriority.HIGH: return 'text-red-600 bg-red-50';
      case TaskPriority.MEDIUM: return 'text-amber-600 bg-amber-50';
      case TaskPriority.LOW: return 'text-emerald-600 bg-emerald-50';
    }
  };

  const formatDate = (ts: number) => {
    // Usar data local para evitar problemas de fuso horário UTC
    const date = new Date(ts);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const isOverdue = (deadline?: number) => {
    if (!deadline) return false;
    // Considera atrasado apenas se já passou o final do dia do prazo
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate.getTime() < now.getTime();
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <>
      <div className="flex gap-6 h-full min-w-max pb-8">
        {columns.map(col => (
          <div key={col.id} className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">{col.title}</h3>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              {col.id === TaskStatus.PLANNED && (
                <button 
                  onClick={onAddTaskClick}
                  className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div 
              className={`flex-1 rounded-3xl p-3 space-y-3 overflow-y-auto transition-colors duration-300 ${col.color}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = e.dataTransfer.getData('taskId');
                onStatusChange(taskId, col.id);
              }}
            >
              {tasks.filter(t => t.status === col.id).map(task => {
                const overdue = isOverdue(task.deadline);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 mb-2 line-clamp-2 leading-snug text-lg">
                      {task.title}
                    </h4>
                    
                    {/* Deadline Indicator */}
                    {task.deadline && (
                      <div className={`flex items-center gap-1.5 mb-3 text-[11px] font-bold transition-colors ${overdue && task.status !== TaskStatus.DONE ? 'text-red-500' : 'text-slate-400'}`}>
                        <Calendar className="w-4 h-4" />
                        <span>Prazo: {formatDate(task.deadline)}</span>
                        {overdue && task.status !== TaskStatus.DONE && <AlertCircle className="w-3.5 h-3.5 animate-pulse" />}
                      </div>
                    )}

                    <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                      {task.description || 'Sem descrição definida.'}
                    </p>

                    {/* Scheduled Slots */}
                    {task.scheduledSlots && task.scheduledSlots.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {task.scheduledSlots.slice(0, 2).map(s => (
                          <span key={s.id} className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-indigo-100">
                            <Clock className="w-3 h-3" />
                            {s.date.split('-').slice(1).reverse().join('/')} {s.startTime}
                          </span>
                        ))}
                        {task.scheduledSlots.length > 2 && <span className="text-[10px] text-slate-400 font-bold self-center">+{task.scheduledSlots.length - 2}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg uppercase">
                        {task.category}
                      </span>
                      <span className="text-[11px] font-extrabold text-indigo-600 tabular-nums">
                        {Math.floor(task.actualSeconds / 60)} / {task.plannedMinutes} min
                      </span>
                    </div>
                  </div>
                );
              })}

              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="h-32 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center text-slate-400 text-sm italic p-6 text-center leading-relaxed">
                  Solte tarefas aqui para organizar seu fluxo
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {taskToDelete && (
        <DeleteModal 
          taskTitle={taskToDelete.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setTaskToDelete(null)}
        />
      )}
    </>
  );
};