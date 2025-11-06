interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  completion?: number;
}

interface ProjectWithStats extends Project {
  completion?: number;
  task_count?: number;
  overdue_count?: number;
}

export { Project, ProjectWithStats };