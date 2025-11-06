import { TimeEntry } from '../types';

export const timeEntriesDb = {
  create: async (entry: Omit<TimeEntry, 'id' | 'created_at'>) => {
    await window.electronAPI.dbQuery(`
      INSERT INTO time_entries (task_id, user_id, hours_spent, date, description)
      VALUES (?, ?, ?, ?, ?)
    `, [entry.task_id, entry.user_id, entry.hours_spent, entry.date, entry.description]);

    // Get the inserted entry
    const result = await window.electronAPI.dbQuery(`
      SELECT te.*, u.name as user_name
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      WHERE te.id = last_insert_rowid()
    `, []);
    return result[0];
  },

  getByTask: async (taskId: number): Promise<TimeEntry[]> => {
    const result = await window.electronAPI.dbQuery(`
      SELECT te.*, u.name as user_name
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      WHERE te.task_id = ?
      ORDER BY te.date DESC
    `, [taskId]);
    return result as TimeEntry[];
  },

  getByUser: async (userId: number): Promise<any[]> => {
    const result = await window.electronAPI.dbQuery(`
      SELECT te.*, t.title as task_title
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      WHERE te.user_id = ?
      ORDER BY te.date DESC
    `, [userId]);
    return result;
  },

  getUserWorkload: async (userId: number, days = 7): Promise<any[]> => {
    const result = await window.electronAPI.dbQuery(`
      SELECT
        SUM(hours_spent) as total_hours,
        date
      FROM time_entries
      WHERE user_id = ?
        AND date BETWEEN datetime('now', '-' || ? || ' days') AND datetime('now')
      GROUP BY date
      ORDER BY date DESC
    `, [userId, days]);
    return result;
  },

  getProjectTimeTracking: async (projectId: number): Promise<any[]> => {
    const result = await window.electronAPI.dbQuery(`
      SELECT
        t.id as task_id,
        t.title as task_title,
        t.estimated_hours,
        SUM(te.hours_spent) as actual_hours
      FROM tasks t
      LEFT JOIN time_entries te ON t.id = te.task_id
      WHERE t.project_id = ?
      GROUP BY t.id
    `, [projectId]);
    return result;
  }
};
