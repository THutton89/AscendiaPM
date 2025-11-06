import { User } from '../types';

export const usersDb = {
  create: async (user: Omit<User, 'id' | 'created_at'>) => {
    const sql = `
      INSERT INTO users (name, email, role)
      VALUES (@name, @email, @role)
      RETURNING *
    `;
    const result = await window.electronAPI.dbQuery(sql, user);
    return result[0];
  },

  getAll: async (): Promise<User[]> => {
    const result = await window.electronAPI.dbQuery('SELECT * FROM users ORDER BY name ASC');
    return result as User[];
  },

  getById: async (id: number): Promise<User> => {
    const result = await window.electronAPI.dbQuery('SELECT * FROM users WHERE id = ?', [id]);
    return result[0];
  },

  update: async (id: number, user: Partial<User>): Promise<User> => {
    const updates = Object.entries(user)
      .map(([key]) => `${key} = @${key}`)
      .join(', ');
    const sql = `
      UPDATE users 
      SET ${updates}
      WHERE id = @id
      RETURNING *
    `;
    const result = await window.electronAPI.dbQuery(sql, { ...user, id });
    return result[0];
  },

  assignToTask: async (taskId: number, userId: number) => {
    const sql = `
      INSERT INTO task_assignments (task_id, user_id)
      VALUES (?, ?)
    `;
    await window.electronAPI.dbQuery(sql, [taskId, userId]);
  },

  removeFromTask: async (taskId: number, userId: number) => {
    const sql = `
      DELETE FROM task_assignments
      WHERE task_id = ? AND user_id = ?
    `;
    await window.electronAPI.dbQuery(sql, [taskId, userId]);
  },

  getUserTasks: async (userId: number): Promise<any[]> => {
    const sql = `
      SELECT t.* FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      WHERE ta.user_id = ?
      ORDER BY t.due_date ASC
    `;
    return await window.electronAPI.dbQuery(sql, [userId]);
  },

  search: async (query: string): Promise<User[]> => {
    const sql = `
      SELECT * FROM users
      WHERE name LIKE ? OR email LIKE ?
      ORDER BY name ASC
    `;
    const result = await window.electronAPI.dbQuery(sql, [`%${query}%`, `%${query}%`]);
    return result as User[];
  },

  getMentionSuggestions: async (query: string): Promise<Array<{id: number, name: string, email: string}>> => {
    const sql = `
      SELECT id, name, email FROM users
      WHERE name LIKE ? OR email LIKE ?
      ORDER BY name ASC
      LIMIT 5
    `;
    return await window.electronAPI.dbQuery(sql, [`%${query}%`, `%${query}%`]);
  },

  updateNotificationSettings: async (userId: number, settings: {
    emailOnMention?: boolean;
    inAppNotifications?: boolean;
  }) => {
    const sql = `
      UPDATE users
      SET notification_settings = json_set(
        COALESCE(notification_settings, '{}'),
        '$.emailOnMention', @emailOnMention,
        '$.inAppNotifications', @inAppNotifications
      )
      WHERE id = @userId
    `;
    await window.electronAPI.dbQuery(sql, {
      userId,
      emailOnMention: settings.emailOnMention ?? false,
      inAppNotifications: settings.inAppNotifications ?? true
    });
  },

  // Google OAuth specific functions
  findByGoogleId: async (googleId: string): Promise<User | null> => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM users WHERE google_id = ?', [googleId]);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      return null;
    }
  },

  createGoogleUser: async (googleUserData: {
    googleId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    accessToken: string;
    refreshToken?: string;
  }): Promise<User> => {
    const sql = `
      INSERT INTO users (
        name, email, google_id, google_access_token, google_refresh_token,
        avatar_url, auth_provider, role, created_at, updated_at
      )
      VALUES (@name, @email, @googleId, @accessToken, @refreshToken,
              @avatarUrl, 'google', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await window.electronAPI.dbQuery(sql, {
      name: googleUserData.name,
      email: googleUserData.email,
      googleId: googleUserData.googleId,
      accessToken: googleUserData.accessToken,
      refreshToken: googleUserData.refreshToken || null,
      avatarUrl: googleUserData.avatarUrl || null
    });
    return result[0];
  },

  updateGoogleTokens: async (userId: number, accessToken: string, refreshToken?: string): Promise<void> => {
    const sql = `
      UPDATE users
      SET google_access_token = @accessToken,
          google_refresh_token = @refreshToken,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @userId
    `;
    await window.electronAPI.dbQuery(sql, {
      userId,
      accessToken,
      refreshToken: refreshToken || null
    });
  }
};