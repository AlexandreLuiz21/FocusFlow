
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteModalProps {
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ taskTitle, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-3">
            Excluir tarefa?
          </h2>
          <p className="text-slate-500 leading-relaxed mb-8">
            Tem certeza que deseja excluir a tarefa <span className="font-bold text-slate-700">"{taskTitle}"</span>? Esta ação não pode ser desfeita.
          </p>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-4 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
