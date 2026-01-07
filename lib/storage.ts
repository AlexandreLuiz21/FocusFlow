
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
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  },

  async fetchTasks(): Promise<Task[]> {
    return this.getTasks();
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
