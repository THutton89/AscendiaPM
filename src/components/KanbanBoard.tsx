import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { Task } from '../types';
import { Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { DragDropContext } from 'react-beautiful-dnd';

interface KanbanBoardProps {
  projectId: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      return await tasksApi.getAll({ project_id: projectId });
    }
  });

  if (isLoading) return <div>Loading tasks...</div>;

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, task }: { id: number; task: Partial<Task> }) => {
      return await tasksApi.update(id, task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    updateTaskMutation.mutate({
      id: parseInt(draggableId),
      task: { status: destination.droppableId }
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
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
      </div>
    </DragDropContext>
    
  );
};

export default KanbanBoard;