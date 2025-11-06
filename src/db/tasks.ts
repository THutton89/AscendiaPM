import { Task } from '../types';

export const tasksDb = {
  create: async (task: Omit<Task, 'id' | 'created_at'>) => {
    const result = await window.electronAPI.dbQuery(`
      INSERT INTO tasks (project_id, sprint_id, title, description, status, priority, due_date)
      VALUES (@project_id, @sprint_id, @title, @description, @status, @priority, @due_date)
      RETURNING *
    `, [task]);
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

    const result = await window.electronAPI.dbQuery(query, params);
    return result as Task[];
  },

  getById: async (id: number): Promise<Task> => {
    const result = await window.electronAPI.dbQuery('SELECT * FROM tasks WHERE id = ?', [id]);
    return result[0];
  },

  update: async (id: number, task: Partial<Task>): Promise<Task> => {
    const updates = Object.entries(task)
      .map(([key]) => `${key} = @${key}`)
      .join(', ');
    const result = await window.electronAPI.dbQuery(`
      UPDATE tasks
      SET ${updates}
      WHERE id = @id
      RETURNING *
    `, [{ ...task, id }]);
     return result[0];
  },

  delete: async (id: number) => {
    await window.electronAPI.dbQuery('DELETE FROM tasks WHERE id = ?', [id]);
  },

  getByProject: async (projectId: number): Promise<Task[]> => {
    const result = await window.electronAPI.dbQuery('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
    return result as Task[];
  }
};
