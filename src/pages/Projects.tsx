import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { Project } from '../types';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, PlusIcon, LayoutGrid, List } from 'lucide-react';
import TaskList from "../components/TaskList";
import KanbanBoard from "../components/KanbanBoard";
import ScrumBoard from "../components/ScrumBoard";
import "./Projects.css";

const Projects = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'scrum'>('list');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active' as const
  });

  // Query for projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        console.log('Fetching projects in Projects.tsx');
        const projects = await projectsApi.getAll();
        console.log('Projects fetched in Projects.tsx:', projects);
        return projects || []; // Ensure we always return an array
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
      }
    }
  });

  // Mutation for creating projects
  const createProjectMutation = useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'created_at'>) => {
      const result = await projectsApi.create(project);
      return result;
    },
    onMutate: async (newProject) => {
      console.log('Creating project with data:', newProject);
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects']);

      // Optimistically update to the new value
      queryClient.setQueryData(['projects'], (old: Project[] | undefined) => [
        ...(old || []),
        { ...newProject, id: Date.now(), created_at: new Date() }, // Generate temporary ID and timestamp
      ]);

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onSuccess: (result) => {
      console.log('Project created successfully:', result);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreating(false);
      setNewProject({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'active'
      });
      console.log('Projects after creation:', queryClient.getQueryData(['projects']));
    },
    onError: (error, newProject, context) => {
      console.error('Failed to create project:', error);
      setIsCreating(false);
      queryClient.setQueryData(['projects'], context?.previousProjects);
      console.log('Projects after error:', queryClient.getQueryData(['projects']));
      // Add error handling UI here
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    console.log('[Create Project] Form submitted');
    console.log('[Create Project] Form data:', {
      name: newProject.name,
      description: newProject.description,
      start_date: newProject.start_date,
      end_date: newProject.end_date,
      status: newProject.status
    });
    e.preventDefault();
    createProjectMutation.mutate(newProject);
  };

  const toggleProject = (projectId: number) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  if (isLoading) return <div>Loading projects...</div>;

  return (
    <div className="projects-container">
      <div className="flex justify-between items-center mb-6">
       <div className="flex items-center space-x-4">
         <h1 className="text-2xl font-bold">Projects</h1>
         <div className="flex bg-gray-100 rounded-md p-1">
           <button
             onClick={() => {
               console.log('List view button clicked');
               setViewMode('list');
             }}
             className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
             title="List View"
           >
             <List className="w-4 h-4" />
           </button>
           <button
             onClick={() => {
               console.log('Kanban view button clicked');
               setViewMode('kanban');
             }}
             className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
             title="Kanban View"
           >
             <LayoutGrid className="w-4 h-4" />
           </button>
           <button
             onClick={() => {
               console.log('Scrum view button clicked');
               setViewMode('scrum');
             }}
             className={`p-2 rounded ${viewMode === 'scrum' ? 'bg-white shadow-sm' : ''}`}
             title="Scrum View"
           >
             <LayoutGrid className="w-4 h-4" />
           </button>
         </div>
       </div>
        <button
          onClick={() => {
            console.log('Create Project button clicked');
            setIsCreating(true);
          }}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Name</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 bg-slate-800 text-emerald-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={newProject.start_date}
                onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={newProject.end_date}
                onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
              onClick={() => console.log('Create project form submitted')}
            >
              Create Project
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {projects?.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="p-4 border-b cursor-pointer hover:bg-gray-50"
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {expandedProjects.has(project.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                </div>
                <span className={`project-card-status ${project.status}`}>
                  {project.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {project.description}
              </div>
              <div className="mt-2 text-sm text-gray-500 flex space-x-4">
                {project.start_date && (
                  <span>Start: {format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                )}
                {project.end_date && (
                  <span>End: {format(new Date(project.end_date), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
            
            {expandedProjects.has(project.id) && (
              <div className="p-4 bg-gray-50">
                {viewMode === 'list' ? (
                  <TaskList projectId={project.id} />
                ) : (
                  viewMode === 'kanban' ? (
                    <KanbanBoard projectId={project.id} />
                  ) : (
                    <ScrumBoard projectId={project.id} />
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
