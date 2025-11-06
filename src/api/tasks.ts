import { Task } from '../types';

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
    const result = await window.electronAPI.createTask(task);
    if (!result.success) throw new Error(result.error);
    return mapApiTaskToTask({ ...task, id: result.id! });
  },

  getAll: async (filter?: { project_id?: number; sprint_id?: number }): Promise<Task[]> => {
    const projectId = filter?.project_id;
    const result = await window.electronAPI.getTasks(projectId);
    if (!result.success) throw new Error(result.error);
    
    let tasks = (result.tasks || []).map(mapApiTaskToTask);
    if (filter?.sprint_id !== undefined) {
      // Note: sprint filtering would need API support since it's not in the response
      throw new Error('Filtering by sprint_id requires API support');
    }
    return tasks;
  },

  getById: async (id: number): Promise<Task> => {
    const result = await window.electronAPI.getTasks();
    if (!result.success) throw new Error(result.error);
    const task = result.tasks?.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    return mapApiTaskToTask(task);
  },

  update: async (id: number, updates: Partial<Task>): Promise<Task> => {
    const result = await window.electronAPI.updateTask({ id, updates });
    if (!result.success) throw new Error(result.error);
    const task = await tasksApi.getById(id);
    return task;
  },

  delete: async (id: number): Promise<void> => {
    const result = await window.electronAPI.deleteTask(id);
    if (!result.success) throw new Error(result.error);
  },

  getByProject: async (projectId: number): Promise<Task[]> => {
    const result = await window.electronAPI.getTasks(projectId);
    if (!result.success) throw new Error(result.error);
    return (result.tasks || []).map(mapApiTaskToTask);
  }
};