import { useParams } from 'react-router-dom';
import { CodeSandbox } from '../components/CodeSandbox';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { ProtectedRoute } from '../components/ProtectedRoute';

export function CodeSandboxPage() {
  const { taskId } = useParams<{ taskId: string }>();

  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await api('get-task', taskId);
      return response.task;
    }
  });

  return (
    <ProtectedRoute requiredPermission="edit_code">
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            {taskId ? `Code Sandbox: ${task?.title || 'Task Sandbox'}` : 'Code Playground'}
          </h2>
        </div>
        <div className="flex-1">
          <CodeSandbox
            taskId={taskId}
            initialCode={task?.codeSnippet || ''}
            language={task?.codeLanguage || 'javascript'}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}