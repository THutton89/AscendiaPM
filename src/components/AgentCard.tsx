import React, { useState } from 'react';

interface AgentCardProps {
  agentName: string;
  tasks: string[];
  onDispatchTask: (taskType: string, params: string) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agentName, tasks, onDispatchTask }) => {
  const [params, setParams] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDispatch = async (taskType: string) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await onDispatchTask(taskType, params);
      setResult(response);
    } catch (error) {
      console.error(`Error dispatching task ${taskType}:`, error);
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-4 shadow">
      <h2 className="text-xl font-semibold mb-4">{agentName}</h2>
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={3}
        value={params}
        onChange={(e) => setParams(e.target.value)}
        placeholder="Enter additional parameters for the task..."
      />
      <div className="flex flex-wrap gap-2">
        {tasks.map((task) => (
          <button
            key={task}
            className="btn-primary"
            onClick={() => handleDispatch(task)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : task}
          </button>
        ))}
      </div>
      {result && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Task Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};