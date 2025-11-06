import { useState } from 'react';
import Button from './Button';
import Card from './Card';
import { UserAutocomplete } from './UserAutocomplete';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sendMentionNotification } from '../services/notifications';
import { api } from '../utils/api';

interface TaskCommentsProps {
  taskId: number;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [mentions, setMentions] = useState<number[]>([]);

  const { data: comments, refetch } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const response = await api('get-comments', taskId);
      return response.comments;
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      const { comment } = await api('create-comment', {
        content: newComment,
        taskId,
        mentions
      });

      // Send notifications to mentioned users
      if (mentions?.length > 0) {
        mentions.forEach(userId => {
          sendMentionNotification(userId, comment.id, taskId);
        });
      }
    },
    onSuccess: () => {
      setNewComment('');
      setMentions([]);
      refetch();
    }
  });

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      <div className="space-y-4">
        {comments?.map(comment => (
          <div key={comment.id} className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{comment.user_name}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded"
          rows={3}
        />
        <div className="mt-2">
          <UserAutocomplete
            onSelect={(userId) => {
              setMentions([...mentions, userId]);
              setNewComment(`${newComment} @${userId} `);
            }}
          />
        </div>
        <div className="flex justify-end mt-2">
          <Button 
            onClick={() => createCommentMutation.mutate()}
            disabled={!newComment.trim() || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </Card>
  );
}