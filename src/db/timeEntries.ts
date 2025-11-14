import { TimeEntry } from '../types';
import { api } from '../utils/api';

export const timeEntriesDb = {
  create: async (entry: Omit<TimeEntry, 'id' | 'created_at'>) => {
    const result = await api('create-time-entry', entry);
    return result;
  },

  getByTask: async (taskId: number): Promise<TimeEntry[]> => {
    const result = await api('get-time-entries-by-task', { taskId });
    return result || [];
  },

  getByUser: async (userId: number): Promise<any[]> => {
    const result = await api('get-time-entries-by-user');
    return result || [];
  },

  getUserWorkload: async (userId: number, days = 7): Promise<any[]> => {
    const result = await api('get-user-workload', { days });
    return result || [];
  },

  getProjectTimeTracking: async (projectId: number): Promise<any[]> => {
    const result = await api('get-project-time-tracking', { projectId });
    return result || [];
  }
};
