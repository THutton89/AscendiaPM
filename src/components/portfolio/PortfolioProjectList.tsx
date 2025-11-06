import React, { useState } from 'react';
import { ProjectWithStats } from '../../types/project';
import './PortfolioProjectList.css';

interface PortfolioProjectListProps {
  projects: ProjectWithStats[];
}

const PortfolioProjectList = ({ projects }: PortfolioProjectListProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProjectWithStats; direction: 'ascending' | 'descending' } | null>(null);
  const [filter, setFilter] = useState<string>('');

  const requestSort = (key: keyof ProjectWithStats) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedProjects = () => {
    if (!sortConfig) return projects;

    return [...projects].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const getFilteredProjects = () => {
    if (!filter) return getSortedProjects();

    return getSortedProjects().filter(project =>
      project.name.toLowerCase().includes(filter.toLowerCase()) ||
      project.status.toLowerCase().includes(filter.toLowerCase())
    );
  };

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <h2>Projects</h2>
        <input
          type="text"
          placeholder="Filter projects..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="project-filter-input"
        />
      </div>

      <table className="project-list-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('name')}>Project Name</th>
            <th onClick={() => requestSort('status')}>Status</th>
            <th onClick={() => requestSort('completion')}>Completion</th>
            <th onClick={() => requestSort('start_date')}>Start Date</th>
            <th onClick={() => requestSort('end_date')}>End Date</th>
          </tr>
        </thead>
        <tbody>
          {getFilteredProjects().map((project) => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>
                <span className={`status-badge ${project.status}`}>
                  {project.status}
                </span>
              </td>
              <td>
                <div className="completion-bar-container">
                  <div 
                    className="completion-bar"
                    style={{ width: `${project.completion}%` }}
                  />
                  <span className="completion-text">{project.completion}%</span>
                </div>
              </td>
              <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}</td>
              <td>{project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioProjectList;