import { Project } from '../types';
import { projectsApi } from '../api/projects';
import { tasksDb } from '../db/tasks';
import { usersDb } from '../db/users';

interface TaskAssignment {
  task_id: number;
  user_id: number;
  assigned_at: string;
}

export const getPortfolioSummary = async () => {
  const [projects, tasks] = await Promise.all([
    projectsApi.getAll().catch(() => []),
    tasksDb.getAll()
  ]);

  return {
    totalProjects: projects.length,
    projectsOnTrack: projects.filter(p => 
      p.status === 'active' && (!p.end_date || new Date(p.end_date) > new Date())
    ).length,
    projectsAtRisk: projects.filter(p => 
      p.status === 'active' && p.end_date && new Date(p.end_date) <= new Date()
    ).length,
    overallCompletion: projects.length > 0
      ? Math.round((projects as Project[]).reduce((sum: number, project: Project) => {
          const projectTasks = tasks.filter(t => t.project_id === project.id);
          const completion = projectTasks.length > 0
            ? (projectTasks.filter(t => t.status === 'done').length / projectTasks.length * 100)
            : 0;
          return sum + completion;
        }, 0) / projects.length)
      : 0
  };
};

export const getProjectHealthData = async () => {
  const projects = await projectsApi.getAll().catch(() => []);
  
  const statusCounts = (projects as Project[]).reduce(
    (acc: Record<string, number>, project: Project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count
  }));
};

export const getPortfolioProjects = async () => {
  const [projects, tasks] = await Promise.all([
    projectsApi.getAll().catch(() => []),
    tasksDb.getAll()
  ]);

  return projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completion = projectTasks.length > 0
      ? Math.round((projectTasks.filter(t => t.status === 'done').length / projectTasks.length * 100))
      : 0;
    return {
      ...project,
      completion
    };
  });
};

export const getResourceAllocation = async () => {
  const [users, tasks] = await Promise.all([
    usersDb.getAll(),
    tasksDb.getAll()
  ]);

  const taskAssignments = await window.electronAPI.dbQuery(`
    SELECT task_id, user_id, assigned_at FROM task_assignments
  `) as unknown as TaskAssignment[];

  return users.map(user => {
    const userTaskIds = taskAssignments
      .filter(ta => ta.user_id === user.id)
      .map(ta => ta.task_id);
    
    const userTasks = tasks.filter(t => 
      userTaskIds.includes(t.id)
    );
    
    const userProjectIds = [...new Set(
      userTasks.map(t => t.project_id).filter(Boolean)
    )];

    return {
      ...user,
      taskCount: userTasks.length,
      projectCount: userProjectIds.length
    };
  });
};