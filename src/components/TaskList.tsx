import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/tasks";
import { Task } from "../types";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";

interface TaskListProps {
  projectId: number;
}

const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'created_at'>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    project_id: projectId,
    sprint_id: null,
    estimated_hours: 0,
    actual_hours: 0,
  });

  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const result = await tasksApi.getByProject(projectId);
      return result || [];
    },
    enabled: typeof projectId === 'number',
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at'>) => {
      const result = await tasksApi.create(task);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setIsCreatingTask(false);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        project_id: projectId,
        sprint_id: null,
        estimated_hours: 0,
        actual_hours: 0,
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, task }: { id: number; task: Partial<Task> }) => {
      const result = await tasksApi.update(id, task);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setEditingTask(null);
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await tasksApi.delete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(newTask);
  };

  if (isLoading) return <div>Loading tasks...</div>;
  if (isError) return <div>Error loading tasks</div>;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <button
          onClick={() => setIsCreatingTask(true)}
          className="flex items-center px-3 py-1 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          New Task
        </button>
      </div>

      {isCreatingTask && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white rounded-md shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 bg-slate-800 text-emerald-300"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sprint ID</label>
              <input
                type="number"
                value={newTask.sprint_id || ''}
                onChange={(e) => setNewTask({
                  ...newTask,
                  sprint_id: e.target.value ? parseInt(e.target.value) : null
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreatingTask(false)}
              className="px-3 py-1 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

{tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-md shadow-sm">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{task.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
              </div>

              {task.description && (
                <p className="mt-2 text-sm text-gray-600">{task.description}</p>
              )}

              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <select
                    value={task.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Task['status'];
                      updateTaskMutation.mutate({
                        id: task.id,
                        task: { status: newStatus }
                      });
                    }}
                    className="text-sm rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  {task.sprint_id && (
                    <span className="text-sm text-blue-600">
                      Sprint: {task.sprint_id}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`text-sm ${
                      new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      Due: {format(new Date(task.due_date), "MMM d, yyyy")}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (editingTask === task.id) {
                        setEditingTask(null);
                        setEditTaskData({});
                      } else {
                        setEditingTask(task.id);
                        setEditTaskData({
                          title: task.title,
                          description: task.description,
                          priority: task.priority,
                          due_date: task.due_date,
                          sprint_id: task.sprint_id,
                        });
                      }
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        deleteTaskMutation.mutate(task.id);
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingTask === task.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h5 className="font-medium mb-3">Edit Task</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={editTaskData.title || ''}
                        onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        value={editTaskData.priority || 'medium'}
                        onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value as Task['priority'] })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={editTaskData.description || ''}
                        onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sprint ID</label>
                      <input
                        type="number"
                        value={editTaskData.sprint_id || ''}
                        onChange={(e) => setEditTaskData({
                          ...editTaskData,
                          sprint_id: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        value={editTaskData.due_date || ''}
                        onChange={(e) => setEditTaskData({ ...editTaskData, due_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setEditTaskData({});
                      }}
                      className="px-3 py-1 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        updateTaskMutation.mutate({
                          id: task.id,
                          task: editTaskData
                        });
                      }}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No tasks found for this project.</p>
      )}
    </div>
  );
};

export default TaskList;