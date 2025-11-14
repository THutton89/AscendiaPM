import { User } from '../types';
import { api } from '../utils/api';
 
 export const usersDb = {
  create: (user: Omit<User, 'id' | 'created_at'>) => api('create-user', user),
  getAll: (): Promise<User[]> => api('get-users'),
  getById: (id: number): Promise<User> => api('get-user', { id }),
  update: (id: number, user: Partial<User>) => api('update-user', { id, ...user }),
  delete: (id: number) => api('delete-user', { id }),

  assignToTask: (taskId: number, userId: number) => api('assign-user-to-task', { taskId, userId }),
  removeFromTask: (taskId: number, userId: number) => api('remove-user-from-task', { taskId, userId }),
  getUserTasks: (userId: number): Promise<any[]> => api('get-user-tasks', { userId }),
  search: (query: string): Promise<User[]> => api('search-users', { query }),
  getMentionSuggestions: (query: string): Promise<Array<{id: number, name: string, email: string}>> => api('get-mention-suggestions', { query }),
  updateNotificationSettings: (userId: number, settings: {
    emailOnMention?: boolean;
    inAppNotifications?: boolean;
  }) => api('update-notification-settings', { userId, settings }),
  findByGoogleId: (googleId: string): Promise<User | null> => api('find-user-by-google-id', { googleId }),
  createGoogleUser: (googleUserData: {
    googleId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    accessToken: string;
    refreshToken?: string;
  }): Promise<User> => api('create-google-user', googleUserData),
  updateGoogleTokens: (userId: number, accessToken: string, refreshToken?: string): Promise<void> => api('update-google-tokens', { userId, accessToken, refreshToken }),
};