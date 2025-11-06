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
  create: (sprint: Omit<Sprint, 'id' | 'created_at'>) => window.electronAPI.dbQuery(`
    INSERT INTO sprints (name, project_id, start_date, end_date, goal)
    VALUES (@name, @project_id, @start_date, @end_date, @goal)
  `, [sprint]),

  getAll: (projectId: number) => window.electronAPI.dbQuery(`
    SELECT * FROM sprints
    WHERE project_id = ?
    ORDER BY start_date DESC
  `, [projectId]),

  getActive: (projectId: number) => {
    const now = new Date().toISOString();
    return window.electronAPI.dbQuery(`
      SELECT * FROM sprints
      WHERE project_id = ?
      AND start_date <= ?
      AND end_date >= ?
      LIMIT 1
    `, [projectId, now, now]);
  },

  update: (id: number, sprint: Partial<Sprint>) => {
    const fields = Object.keys(sprint)
      .map(key => `${key} = @${key}`)
      .join(', ');
    
    if (!fields) return Promise.resolve();

    return window.electronAPI.dbQuery(`
      UPDATE sprints
      SET ${fields}
      WHERE id = @id
    `, [{ ...sprint, id }]);
  },

  delete: (id: number) => window.electronAPI.dbQuery('DELETE FROM sprints WHERE id = ?', [id])
};