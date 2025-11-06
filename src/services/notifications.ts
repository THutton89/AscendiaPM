import { api } from '../utils/api';

export async function sendMentionNotification(
  userId: number,
  commentId: number,
  taskId: number
) {
  try {
    await api('create-notification', {
      userId,
      type: 'mention',
      content: `You were mentioned in a comment on task #${taskId}`,
      metadata: { commentId, taskId },
      isRead: false
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}