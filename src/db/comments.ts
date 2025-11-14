import { Comment } from '../types';
import { api } from '../utils/api';

export const createCommentsTable = (db: any) => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      mentions TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id)
  `).run();
};

export const commentsDb = {
  create: async (comment: Omit<Comment, 'id' | 'created_at'>) => {
    const result = await api('db-query', {
      query: `
        INSERT INTO comments (task_id, user_id, content, mentions)
        VALUES (?, ?, ?, ?)
        RETURNING *
      `,
      params: [comment.task_id, comment.user_id, comment.content, JSON.stringify(comment.mentions || [])]
    });
    return result[0];
  },

  getByTask: async (taskId: number): Promise<Comment[]> => {
    const result = await api('db-query', {
      query: `
        SELECT c.*, u.name as user_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE task_id = ?
        ORDER BY created_at ASC
      `,
      params: [taskId]
    });
    return result.map((c: any) => ({
      ...c,
      mentions: JSON.parse(c.mentions || '[]')
    }));
  },

  delete: async (id: number) => {
    await api('db-query', {
      query: `
        DELETE FROM comments WHERE id = ?
      `,
      params: [id]
    });
  },

  getMentionedUsers: async (commentId: number): Promise<number[]> => {
    const result = await api('db-query', {
      query: `
        SELECT mentions FROM comments WHERE id = ?
      `,
      params: [commentId]
    });
    return JSON.parse(result[0]?.mentions || '[]');
  }
};