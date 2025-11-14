import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { api } from '../utils/api';
import { BarChart3, Users, Calendar, CheckSquare } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        return await projectsApi.getAll();
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
      }
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await tasksApi.getAll();
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return [];
      }
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await api('get-users');
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
  });

  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const totalTasks = tasks?.length || 0;
  const teamMembers = users?.length || 0;

  const tasksDueToday = tasks?.filter(task => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  }).length || 0;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-heading">Project Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <div >
              <BarChart3 className="dashboard-stat-icon" />
            </div>
            <div className="ml-4">
              <p className="dashboard-stat-label">Active Projects</p>
              <h3 className="dashboard-stat-value">{activeProjects}</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <div >
              <CheckSquare className="dashboard-stat-icon" />
            </div>
            <div className="ml-4">
              <p className="dashboard-stat-label">Completed Tasks</p>
              <h3 className="dashboard-stat-value">{completedTasks}/{totalTasks}</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <div >
              <Calendar className="dashboard-stat-icon" />
            </div>
            <div className="ml-4">
              <p className="dashboard-stat-label">Tasks Due Today</p>
              <h3 className="dashboard-stat-value">{tasksDueToday}</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <div >
              <Users className="dashboard-stat-icon" />
            </div>
            <div className="ml-4">
              <p className="dashboard-stat-label">Team Members</p>
              <h3 className="dashboard-stat-value">{teamMembers}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="dashboard-table-container">
        <div className="p-6">
          <h2 className="dashboard-table-heading">Recent Projects</h2>
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr >
                  <th >Project Name</th>
                  <th >Status</th>
                  <th >Tasks</th>
                  <th >Due Date</th>
                </tr>
              </thead>
              <tbody>
                {projects?.slice(0, 5).map((project) => (
                  <tr key={project.id} >
                    <td >{project.name}</td>
                    <td >
                      <span className={`project-card-status ${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td >
                      {tasks?.filter(t => t.project_id === project.id).length || 0}
                    </td>
                    <td >
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Task Overview */}
      <div className="dashboard-task-overview">
        <div className="p-6">
          <h2 className="dashboard-task-overview-heading">Task Overview</h2>
          <div className="dashboard-task-status-grid">
            {['todo', 'in_progress', 'done'].map((status) => (
              <div key={status} className="dashboard-task-status-card">
                <h3 className="dashboard-task-status-label">
                  {status.replace('_', ' ')}
                </h3>
                <p className="dashboard-task-status-count">
                  {tasks?.filter(t => t.status === status).length || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
