import { Task } from '../types';
import { api } from '../utils/api';

const mapApiTaskToTask = (apiTask: any): Task => ({
  id: apiTask.id,
  project_id: apiTask.project_id || null,
  sprint_id: null, // Default value since API doesn't return this
  title: apiTask.title,
  description: apiTask.description || null,
  status: apiTask.status as 'todo' | 'in_progress' | 'done',
  priority: apiTask.priority as 'low' | 'medium' | 'high',
  due_date: apiTask.due_date || null,
  estimated_hours: 0, // Default value
  actual_hours: 0, // Default value
  created_at: apiTask.created_at || new Date().toISOString()
});

export const tasksApi = {
  create: async (task: Omit<Task, 'id' | 'created_at'>) => {
    const result = await api('create-task', task);
    return mapApiTaskToTask(result);
  },

  getAll: async (filter?: { project_id?: number; sprint_id?: number }): Promise<Task[]> => {
    const params: any = {};
    if (filter?.project_id) {
      params.project_id = filter.project_id;
    }
    const result = await api('get-tasks', params);

    let tasks = result.map(mapApiTaskToTask);
    if (filter?.sprint_id !== undefined) {
      // Note: sprint filtering would need API support since it's not in the response
      throw new Error('Filtering by sprint_id requires API support');
    }
    return tasks;
  },

  getById: async (id: number): Promise<Task> => {
    const result = await api('get-tasks');
    const task = result.find((t: any) => t.id === id);
    if (!task) throw new Error('Task not found');
    return mapApiTaskToTask(task);
  },

  update: async (id: number, updates: Partial<Task>): Promise<Task> => {
    const result = await api('update-task', { id, ...updates });
    return mapApiTaskToTask(result);
  },

  delete: async (id: number): Promise<void> => {
    await api('delete-task', { id });
  },

  getByProject: async (projectId: number): Promise<Task[]> => {
    const result = await api('get-tasks', { project_id: projectId });
    return result.map(mapApiTaskToTask);
  }
};