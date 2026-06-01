import { NextRequest, NextResponse } from 'next/server';
import { readTasks, writeTasks } from '../../../lib/server/db';
import { Task } from '../../../types';

export async function GET() {
  try {
    const tasks = readTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Erro na API GET /api/tasks:', error);
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tasks = body.tasks as Task[];
    
    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Formato inválido. "tasks" deve ser um array.' }, { status: 400 });
    }

    const success = writeTasks(tasks);
    if (!success) {
      throw new Error('Não foi possível salvar os dados no arquivo');
    }

    return NextResponse.json({ success: true, count: tasks.length });
  } catch (error) {
    console.error('Erro na API POST /api/tasks:', error);
    return NextResponse.json({ error: 'Erro ao salvar tarefas' }, { status: 500 });
  }
}
