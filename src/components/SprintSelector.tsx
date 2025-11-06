import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sprintsDb } from '../db/sprints';
import type { Sprint } from '../types';
import { ChevronDown, PlusIcon } from 'lucide-react';

interface SprintSelectorProps {
  projectId: number;
  currentSprintId?: number;
  onSelect: (sprintId?: number) => void;
}

const SprintSelector: React.FC<SprintSelectorProps> = ({ 
  projectId, 
  currentSprintId,
  onSelect 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '',
    start_date: '',
    end_date: '',
    goal: '',
    project_id: projectId
  });

  const handleCreateSprint = async () => {
    try {
      setIsCreating(true);
      await sprintsDb.create(newSprint);
      setShowCreateModal(false);
      setNewSprint({
        name: '',
        start_date: '',
        end_date: '',
        goal: '',
        project_id: projectId
      });
      onSelect(); // Refresh sprints list
    } catch (error) {
      console.error('Failed to create sprint:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const { data: sprints, isLoading } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const result = await sprintsDb.getAll(projectId);
      return result || [];
    }
  });

  if (isLoading) return <div>Loading sprints...</div>;

  return (
    <div className="sprint-selector">
      <div className="flex items-center space-x-2">
        <select
          value={currentSprintId || ''}
          onChange={(e) => onSelect(e.target.value ? parseInt(e.target.value) : undefined)}
          className="border rounded px-3 py-1"
        >
          <option value="">Backlog</option>
          {sprints?.map(sprint => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name} ({sprint.start_date} - {sprint.end_date})
            </option>
          ))}
        </select>
        
        <button
          className="p-1 text-gray-500 hover:text-gray-700"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="w-4 h-4" />
        </button>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-medium mb-4">Create New Sprint</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sprint Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newSprint.name}
                    onChange={(e) => setNewSprint({...newSprint, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={newSprint.start_date}
                      onChange={(e) => setNewSprint({...newSprint, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={newSprint.end_date}
                      onChange={(e) => setNewSprint({...newSprint, end_date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal (Optional)
                  </label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={3}
                    value={newSprint.goal || ''}
                    onChange={(e) => setNewSprint({...newSprint, goal: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                  onClick={handleCreateSprint}
                  disabled={!newSprint.name || !newSprint.start_date || !newSprint.end_date}
                >
                  {isCreating ? 'Creating...' : 'Create Sprint'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintSelector;