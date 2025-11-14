import { api } from '../utils/api';

export interface Sprint {
  id: number;
  name: string;
  project_id: number;
  start_date: string;
  end_date: string;
  goal?: string;
  created_at: string;
}

export const sprintsDb = {
  create: async (sprint: Omit<Sprint, 'id' | 'created_at'>) => {
    await api('db-query', {
      query: `
        INSERT INTO sprints (name, project_id, start_date, end_date, goal)
        VALUES (?, ?, ?, ?, ?)
      `,
      params: [sprint.name, sprint.project_id, sprint.start_date, sprint.end_date, sprint.goal]
    });
  },

  getAll: async (projectId: number) => {
    const result = await api('db-query', {
      query: `
        SELECT * FROM sprints
        WHERE project_id = ?
        ORDER BY start_date DESC
      `,
      params: [projectId]
    });
    return result;
  },

  getActive: async (projectId: number) => {
    const now = new Date().toISOString();
    const result = await api('db-query', {
      query: `
        SELECT * FROM sprints
        WHERE project_id = ?
        AND start_date <= ?
        AND end_date >= ?
        LIMIT 1
      `,
      params: [projectId, now, now]
    });
    return result;
  },

  update: async (id: number, sprint: Partial<Sprint>) => {
    const fields = Object.keys(sprint)
      .map(key => `${key} = ?`)
      .join(', ');

    if (!fields) return;

    const values = Object.values(sprint);
    values.push(id); // Add id at the end for WHERE clause

    await api('db-query', {
      query: `
        UPDATE sprints
        SET ${fields}
        WHERE id = ?
      `,
      params: values
    });
  },

  delete: async (id: number) => {
    await api('db-query', {
      query: 'DELETE FROM sprints WHERE id = ?',
      params: [id]
    });
  }
};