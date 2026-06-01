import fs from 'fs';
import path from 'path';
import { Task } from '../../types';

// Determinamos um caminho perseverante para o nosso banco de dados JSON interno
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ tasks: [] }, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Falha ao inicializar banco de dados interno:', error);
  }
}

export function readTasks(): Task[] {
  try {
    initDb();
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.tasks || [];
  } catch (error) {
    console.error('Falha ao ler tarefas do banco de dados interno:', error);
    return [];
  }
}

export function writeTasks(tasks: Task[]): boolean {
  try {
    initDb();
    const data = JSON.stringify({ tasks, updatedAt: Date.now() }, null, 2);
    fs.writeFileSync(DB_FILE, data, 'utf-8');
    return true;
  } catch (error) {
    console.error('Falha ao escrever tarefas no banco de dados interno:', error);
    return false;
  }
}
