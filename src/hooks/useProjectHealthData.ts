import { useQuery } from '@tanstack/react-query';
import { getProjectHealthData } from '../api/portfolio';

interface ProjectHealthData {
  status: string;
  count: number;
}

const useProjectHealthData = () => {
  return useQuery<ProjectHealthData[]>({
    queryKey: ['projectHealth'],
    queryFn: getProjectHealthData,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

export { useProjectHealthData };
export default useProjectHealthData;