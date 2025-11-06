import { useQuery } from '@tanstack/react-query';
import { getPortfolioSummary } from '../api/portfolio';

interface PortfolioSummary {
  totalProjects: number;
  projectsOnTrack: number;
  projectsAtRisk: number;
  overallCompletion: number;
}

const usePortfolioSummaryData = () => {
  return useQuery<PortfolioSummary>({
    queryKey: ['portfolioSummary'],
    queryFn: getPortfolioSummary,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

export { usePortfolioSummaryData };