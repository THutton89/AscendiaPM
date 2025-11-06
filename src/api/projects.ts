import { Project } from '../types/project';

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
    const result = await window.electronAPI.createProject({
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date
    }, { apiKey: getApiKey() });
    if (!result.success) throw new Error(result.error);
    return mapApiProjectToProject({ ...project, id: result.id! });
  },

  getAll: async (): Promise<Project[]> => {
    const result = await window.electronAPI.getProjects({ apiKey: getApiKey() });
    if (!result.success) throw new Error(result.error);
    return (result.projects || []).map(mapApiProjectToProject);
  },

  getById: async (id: number): Promise<Project> => {
    const result = await window.electronAPI.getProjects({ apiKey: getApiKey() });
    if (!result.success) throw new Error(result.error);
    const project = result.projects?.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    return mapApiProjectToProject(project);
  },

  update: async (id: number, updates: Partial<Project>): Promise<Project> => {
    const result = await window.electronAPI.updateProject({
      id,
      updates
    }, { apiKey: getApiKey() });
    if (!result.success) throw new Error(result.error);
    const project = await projectsApi.getById(id);
    return project;
  },

  delete: async (id: number): Promise<void> => {
    const result = await window.electronAPI.deleteProject(id, { apiKey: getApiKey() });
    if (!result.success) throw new Error(result.error);
  },

  getStats: async (id: number) => {
    const result = await window.electronAPI.getProjectStats(id, { apiKey: getApiKey() });
    if (!result.success) throw new Error(result.error);
    return result.stats;
  }
};