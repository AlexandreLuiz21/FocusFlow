import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Repeat, Sparkles } from 'lucide-react';
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
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    startTime: '06:30',
    endTime: '07:30',
    days: 'all' // 'all', 'weekdays'
  });

  useEffect(() => {
    if (taskToEdit) {
      let deadlineStr = '';
      if (taskToEdit.deadline) {
        const d = new Date(taskToEdit.deadline);
        deadlineStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        category: taskToEdit.category,
        priority: taskToEdit.priority,
        plannedMinutes: taskToEdit.plannedMinutes,
        deadline: deadlineStr,
      });
      setSlots(taskToEdit.scheduledSlots || []);
    }
  }, [taskToEdit]);

  const generateRecurringSlots = () => {
    if (!formData.deadline) {
      alert("Defina um Prazo Final (Deadline) antes de gerar a agenda recorrente.");
      return;
    }

    const start = new Date(recurringConfig.startDate + 'T00:00:00');
    const [deadYear, deadMonth, deadDay] = formData.deadline.split('-').map(Number);
    const end = new Date(deadYear, deadMonth - 1, deadDay);

    const newSlots: ScheduleSlot[] = [];
    let current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

      if (recurringConfig.days === 'all' || (recurringConfig.days === 'weekdays' && isWeekday)) {
        newSlots.push({
          id: crypto.randomUUID(),
          date: current.toISOString().split('T')[0],
          startTime: recurringConfig.startTime,
          endTime: recurringConfig.endTime
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (confirm(`Isso irá gerar ${newSlots.length} horários na sua agenda. Deseja prosseguir?`)) {
      setSlots(prev => [...prev, ...newSlots]);
      setShowRecurring(false);
    }
  };

  const addSlot = () => {
    const today = new Date();
    const newSlot: ScheduleSlot = {
      id: crypto.randomUUID(),
      date: today.toISOString().split('T')[0],
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
    
    let deadlineTimestamp: number | undefined = undefined;
    if (formData.deadline) {
      const [year, month, day] = formData.deadline.split('-').map(Number);
      deadlineTimestamp = new Date(year, month - 1, day).getTime();
    }
    
    onSubmit({
      ...formData,
      deadline: deadlineTimestamp,
      scheduledSlots: slots
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 flex-shrink-0">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {taskToEdit ? 'Editar Meta' : 'Nova Meta & Agenda'}
            </h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Configure prazos e rotinas de execução</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">O que precisa ser feito?</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Ex: Estudar Livro de PL/SQL"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Prazo Final (Deadline)
                </label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-800 focus:border-indigo-500 outline-none font-medium"
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Notas e Contexto</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 min-h-[118px] resize-none font-medium"
                  placeholder="Ex: Terminar até o dia 06/02/2026 lendo 10 páginas/dia..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Categoria</label>
                <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 focus:border-indigo-500 outline-none font-medium" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}>
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Prioridade</label>
                <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 focus:border-indigo-500 outline-none font-medium" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}>
                  {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 ml-1">Meta Diária (min)</label>
                <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 focus:border-indigo-500 outline-none font-mono font-bold" value={formData.plannedMinutes} onChange={e => setFormData({...formData, plannedMinutes: parseInt(e.target.value) || 0})}/>
              </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Planejamento da Agenda
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowRecurring(!showRecurring)} className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">
                  <Repeat className="w-4 h-4" />
                  Gerar Recorrente
                </button>
                <button type="button" onClick={addSlot} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showRecurring && (
              <div className="bg-indigo-600 p-6 rounded-[2rem] text-white space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <span className="font-bold">Gerador de Rotina Diária</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-70 uppercase">Início</label>
                    <input type="date" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none" value={recurringConfig.startDate} onChange={e => setRecurringConfig({...recurringConfig, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-70 uppercase">Hora Início</label>
                    <input type="time" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none" value={recurringConfig.startTime} onChange={e => setRecurringConfig({...recurringConfig, startTime: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-70 uppercase">Hora Fim</label>
                    <input type="time" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none" value={recurringConfig.endTime} onChange={e => setRecurringConfig({...recurringConfig, endTime: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-70 uppercase">Frequência</label>
                    <select className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none" value={recurringConfig.days} onChange={e => setRecurringConfig({...recurringConfig, days: e.target.value})}>
                      <option value="all" className="text-slate-900">Todos os dias</option>
                      <option value="weekdays" className="text-slate-900">Segunda a Sexta</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={generateRecurringSlots} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-xl">
                  Gerar Agenda Completa até {formData.deadline || 'o prazo'}
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
              {slots.map((slot) => (
                <div key={slot.id} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Data</label>
                    <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={slot.date} onChange={e => updateSlot(slot.id, 'date', e.target.value)} />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
                    <input type="time" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={slot.startTime} onChange={e => updateSlot(slot.id, 'startTime', e.target.value)} />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
                    <input type="time" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={slot.endTime} onChange={e => updateSlot(slot.id, 'endTime', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeSlot(slot.id)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {slots.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm italic">
                  Nenhum horário agendado ainda.
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex-shrink-0">
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]">
              {taskToEdit ? 'Salvar Alterações' : 'Criar Meta & Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};