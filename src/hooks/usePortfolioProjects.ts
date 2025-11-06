import { useQuery } from '@tanstack/react-query';
import { getPortfolioProjects } from '../api/portfolio';
import { Project } from '../types/project';

interface PortfolioProject {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date?: string;
  end_date?: string;
  completion: number;
  created_at?: string;
}

const usePortfolioProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['portfolioProjects'],
    queryFn: async () => {
      const projects = await getPortfolioProjects();
      return projects.map((project: PortfolioProject) => ({
        ...project,
        created_at: project.created_at || new Date().toISOString(),
        status: project.status as Project['status']
      }));
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

export { usePortfolioProjects };