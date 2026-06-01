
import { Task } from '../types';

const STORAGE_KEY = 'focusflow_tasks';

export const storage = {
  getTasks: (): Task[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading tasks:', e);
      return [];
    }
  },

  saveTasks: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      // Sincronizar silenciosamente com o backend no fundo
      storage.saveTasksToServer(tasks).catch(err => {
        console.warn('Erro ao sincronizar tarefas com o servidor:', err);
      });
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  },

  async fetchTasksFromServer(): Promise<Task[]> {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Falha ao se conectar com bando de dados do servidor');
      }
      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('Fallback para localStorage devido ao erro no servidor:', error);
      return this.getTasks();
    }
  },

  async saveTasksToServer(tasks: Task[]): Promise<boolean> {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });
      return response.ok;
    } catch (error) {
      console.error('Não foi possível salvar dados no servidor:', error);
      return false;
    }
  },

  async fetchTasks(): Promise<Task[]> {
    return this.fetchTasksFromServer();
  },

  async persistTask(task: Task): Promise<void> {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    this.saveTasks(tasks);
  },

  async removeTask(id: string): Promise<void> {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
  }
};

