import { useQuery } from '@tanstack/react-query';
import { getResourceAllocation } from '../api/portfolio';

interface ResourceAllocation {
  id: number;
  name: string;
  email: string;
  taskCount: number;
  projectCount: number;
}

const useResourceAllocation = () => {
  return useQuery<ResourceAllocation[]>({
    queryKey: ['resourceAllocation'],
    queryFn: getResourceAllocation,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data
      .filter(user => user.taskCount > 0) // Only show users with tasks
      .sort((a, b) => b.taskCount - a.taskCount) // Sort by task count descending
  });
};

export default useResourceAllocation;