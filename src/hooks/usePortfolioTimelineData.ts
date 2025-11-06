import { useQuery } from '@tanstack/react-query';
import { getPortfolioProjects } from '../api/portfolio';

interface TimelineProject {
  id: number;
  name: string;
  startDate: string;
  endDate?: string;
  status: string;
}

const usePortfolioTimelineData = () => {
  return useQuery<TimelineProject[]>({
    queryKey: ['portfolioTimeline'],
    queryFn: async () => {
      const projects = await getPortfolioProjects();
      return projects.map(project => ({
        id: project.id,
        name: project.name,
        startDate: project.start_date || new Date().toISOString(),
        endDate: project.end_date,
        status: project.status
      }));
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

export { usePortfolioTimelineData };
export default usePortfolioTimelineData;