
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { Category, TaskPriority, Task, ScheduleSlot } from '../types';

interface TaskModalProps {
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  taskToEdit?: Task;
}

export const TaskModal: React.FC<TaskModalProps> = ({ onClose, onSubmit, taskToEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: Category.WORK,
    priority: TaskPriority.MEDIUM,
    plannedMinutes: 30,
    deadline: '',
  });

  const [slots, setSlots] = useState<ScheduleSlot[]>([]);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        category: taskToEdit.category,
        priority: taskToEdit.priority,
        plannedMinutes: taskToEdit.plannedMinutes,
        deadline: taskToEdit.deadline ? new Date(taskToEdit.deadline).toISOString().split('T')[0] : '',
      });
      setSlots(taskToEdit.scheduledSlots || []);
    }
  }, [taskToEdit]);

  const addSlot = () => {
    const newSlot: ScheduleSlot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00'
    };
    setSlots([...slots, newSlot]);
  };

  const updateSlot = (id: string, field: keyof ScheduleSlot, value: string) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSubmit({
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline).getTime() : undefined,
      scheduledSlots: slots
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {taskToEdit ? 'Editar Meta' : 'Nova Meta & Plano'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">O que precisa ser feito?</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Ex: Finalizar protótipo do App"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Prazo Final (Deadline)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-5 py-3 text-slate-800 focus:border-indigo-500 outline-none font-medium"
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Detalhes</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 min-h-[118px] resize-none font-medium"
                  placeholder="Notas adicionais..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Categoria</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 focus:border-indigo-500 outline-none appearance-none font-medium"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Category})}
                >
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Prioridade</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 focus:border-indigo-500 outline-none appearance-none font-medium"
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                >
                  {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Esforço Total (min)</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 focus:border-indigo-500 outline-none font-mono font-bold"
                  value={formData.plannedMinutes}
                  onChange={e => setFormData({...formData, plannedMinutes: parseInt(e.target.value) || 0})}
                />
              </div>
          </div>

          {/* Agenda de Execução */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Agenda de Execução
                </h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Quando você vai trabalhar nisso?</p>
              </div>
              <button 
                type="button"
                onClick={addSlot}
                className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agendar Horário
              </button>
            </div>

            <div className="space-y-3">
              {slots.map((slot) => (
                <div key={slot.id} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Data</label>
                    <input 
                      type="date"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                      value={slot.date}
                      onChange={e => updateSlot(slot.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
                    <input 
                      type="time"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                      value={slot.startTime}
                      onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
                    <input 
                      type="time"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                      value={slot.endTime}
                      onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {slots.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm italic">
                  Sem horários agendados. Adicione um slot para organizar sua semana.
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex-shrink-0">
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              {taskToEdit ? 'Salvar Plano' : 'Criar Meta & Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
