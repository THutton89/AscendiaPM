import { Project } from '../types/project';
import { api } from '../utils/api';

const mapApiProjectToProject = (apiProject: any): Project => {
  const project: Project = {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description || null,
    start_date: apiProject.start_date || null,
    end_date: apiProject.end_date || null,
    status: apiProject.status as 'active' | 'completed' | 'on_hold',
    created_at: apiProject.created_at || new Date().toISOString(),
    completion: 0 // Default value, will be calculated client-side
  };

  // Only set completion if it exists in the API response
  if ('completion' in apiProject && typeof apiProject.completion === 'number') {
    project.completion = apiProject.completion;
  }

  return project;
};

// For now, using a test API key. In production, this should come from user auth
const getApiKey = () => 'test-api-key-123';

export const projectsApi = {
  create: async (project: Omit<Project, 'id' | 'created_at' | 'completion'>) => {
    const result = await api('create-project', {
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      apiKey: getApiKey()
    });
    return mapApiProjectToProject(result);
  },

  getAll: async (): Promise<Project[]> => {
    const result = await api('get-projects', { apiKey: getApiKey() });
    return result.map(mapApiProjectToProject);
  },

  getById: async (id: number): Promise<Project> => {
    const result = await api('get-projects', { apiKey: getApiKey() });
    const project = result.find((p: any) => p.id === id);
    if (!project) throw new Error('Project not found');
    return mapApiProjectToProject(project);
  },

  update: async (id: number, updates: Partial<Project>): Promise<Project> => {
    const result = await api('update-project', {
      id,
      ...updates,
      apiKey: getApiKey()
    });
    return mapApiProjectToProject(result);
  },

  delete: async (id: number): Promise<void> => {
    await api('delete-project', { id, apiKey: getApiKey() });
  },

  getStats: async (id: number) => {
    const result = await api('get-project-stats', { id, apiKey: getApiKey() });
    return result;
  }
};