
export enum TaskStatus {
  PLANNED = 'PLANNED',
  DOING = 'DOING',
  PAUSED = 'PAUSED',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum Category {
  STUDY = 'STUDY',
  WORK = 'WORK',
  PERSONAL = 'PERSONAL',
  PROJECT = 'PROJECT',
  FREE = 'FREE'
}

export interface ScheduleSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface FocusSession {
  id: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  interrupted: boolean;
  pauseReason?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: TaskPriority;
  status: TaskStatus;
  plannedMinutes: number;
  actualSeconds: number;
  createdAt: number;
  deadline?: number; // Timestamp
  scheduledSlots: ScheduleSlot[];
  sessions: FocusSession[];
}

export interface DailyStats {
  date: string;
  totalFocusedSeconds: number;
  tasksCompleted: number;
}
