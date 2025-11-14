import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { Task } from '../types';
import SprintSelector from './SprintSelector';
import { Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { DragDropContext } from 'react-beautiful-dnd';

interface ScrumBoardProps {
  projectId: number;
  sprintId?: number;
}
const ScrumBoard: React.FC<ScrumBoardProps> = React.memo(({ projectId }) => {
  const queryClient = useQueryClient();
  const [currentSprintId, setCurrentSprintId] = useState<number | undefined>();
  
  
  // Get tasks for current sprint or backlog
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks', projectId, currentSprintId],
    queryFn: async () => {
      try {
        // For now, just get all tasks for the project
        // Sprint filtering will be implemented when sprint APIs are available
        const result = await tasksApi.getByProject(projectId);
        return result || [];
      } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
    }
  });

  // TODO: Implement sprint API
  // Get all sprints for the project
  const { data: sprints, error: sprintsError } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      // Temporarily return empty array until sprint API is implemented
      return [];
    }
  });

  if (tasksLoading) return <div>Loading tasks...</div>;
  if (tasksError) return <div className="text-red-500">Error loading tasks: {tasksError.message}</div>;
  if (sprintsError) return <div className="text-red-500">Error loading sprints: {sprintsError.message}</div>;

  const columns = useMemo(() => [
    { id: 'backlog', title: 'Backlog' },
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ], []);

  // TODO: Implement sprint API
  // Set default to active sprint if none selected
  useEffect(() => {
    if (!currentSprintId) {
      // Temporarily disabled until sprint API is implemented
      // sprintsDb.getActive(projectId).then(sprint => {
      //   if (sprint) setCurrentSprintId(sprint.id);
      // }).catch(error => {
      //   console.error('Error fetching active sprint:', error);
      // });
    }
  }, [projectId, currentSprintId]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, task }: { id: number; task: Partial<Task> }) => {
      try {
        const result = await tasksApi.update(id, task);
        return result;
      } catch (error) {
        console.error('Error updating task:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, currentSprintId] });
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      // Could add user notification here
    }
  });

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const taskId = parseInt(draggableId);
    if (isNaN(taskId)) {
      console.error('Invalid task ID:', draggableId);
      return;
    }

    updateTaskMutation.mutate({
      id: taskId,
      task: {
        status: destination.droppableId,
        sprint_id: destination.droppableId === 'backlog' ? null : currentSprintId
      }
    });
  }, [currentSprintId, updateTaskMutation]);

  return (
    <div className="scrum-board">
      <div className="sprint-header flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {currentSprintId ? 'Current Sprint' : 'Backlog'}
        </h2>
        <SprintSelector
          projectId={projectId}
          currentSprintId={currentSprintId}
          onSelect={setCurrentSprintId}
        />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4">
          {columns.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 bg-gray-100 rounded-lg p-4"
                >
                  <h3 className="font-medium mb-4">{column.title}</h3>
                  {tasks
                    ?.filter(task => task.status === column.id)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 mb-3 rounded shadow-sm"
                          >
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
});

ScrumBoard.displayName = 'ScrumBoard';

export default ScrumBoard;