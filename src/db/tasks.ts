import { Task } from '../types';
import { api } from '../utils/api';

export const tasksDb = {
  create: async (task: Omit<Task, 'id' | 'created_at'>) => {
    const result = await api('db-query', {
      query: `
        INSERT INTO tasks (project_id, sprint_id, title, description, status, priority, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `,
      params: [task.project_id, task.sprint_id, task.title, task.description, task.status, task.priority, task.due_date]
    });
    return result[0];
  },

  getAll: async (arg?: { queryKey: readonly unknown[] } | { project_id?: number; sprint_id?: number }): Promise<Task[]> => {
    let query = 'SELECT * FROM tasks';
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Type predicate to check for QueryFunctionContext
    const isQueryContext = (obj: any): obj is { queryKey: readonly unknown[] } =>
      obj && 'queryKey' in obj;

    // Extract filter based on input type
    let filter: { project_id?: number; sprint_id?: number } | undefined;
    if (arg) {
      filter = isQueryContext(arg)
        ? (arg.queryKey[1] as { project_id?: number; sprint_id?: number } | undefined)
        : arg;
    }

    if (filter?.project_id !== undefined) {
      whereClauses.push('project_id = ?');
      params.push(filter.project_id);
    }
    if (filter?.sprint_id !== undefined) {
      whereClauses.push('sprint_id = ?');
      params.push(filter.sprint_id);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await api('db-query', { query, params });
    return result as Task[];
  },

  getById: async (id: number): Promise<Task> => {
    const result = await api('db-query', {
      query: 'SELECT * FROM tasks WHERE id = ?',
      params: [id]
    });
    return result[0];
  },

  update: async (id: number, task: Partial<Task>): Promise<Task> => {
    const fields = Object.keys(task).map(key => `${key} = ?`).join(', ');
    const values = Object.values(task);
    values.push(id); // Add id at the end for WHERE clause

    const result = await api('db-query', {
      query: `
        UPDATE tasks
        SET ${fields}
        WHERE id = ?
        RETURNING *
      `,
      params: values
    });
     return result[0];
  },

  delete: async (id: number) => {
    await api('db-query', {
      query: 'DELETE FROM tasks WHERE id = ?',
      params: [id]
    });
  },

  getByProject: async (projectId: number): Promise<Task[]> => {
    const result = await api('db-query', {
      query: 'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC',
      params: [projectId]
    });
    return result as Task[];
  }
};
