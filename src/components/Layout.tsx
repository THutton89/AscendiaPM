import { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Project } from '../types/project';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BrainCircuit,
  Settings,
  Clock,
  Calendar,
  LogOut,
  FileText,
  Code,
  Shield,
  ScrollText,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/team', icon: Users, label: 'Team' },
    { path: '/calendar', icon: Calendar, label: 'Monthly Calendar' },
    { path: '/ai-features', icon: BrainCircuit, label: 'AI Features' },
    // { path: '/sandbox', icon: Code, label: 'Code Sandbox' },
    { path: '/time-tracking', icon: Clock, label: 'Time Tracking' },
    { path: '/meetings', icon: Users, label: 'Meetings' },
    { path: '/api-docs', icon: FileText, label: 'API Docs' },
    { path: '/privacy-policy', icon: Shield, label: 'Privacy Policy' },
    { path: '/terms-of-service', icon: ScrollText, label: 'Terms of Service' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleSaveProject = () => {
    console.log('[Save Project] Button clicked');
    const projects = queryClient.getQueryData(['projects']);
    const tasks = queryClient.getQueryData(['tasks']);
    const users = queryClient.getQueryData(['users']);

    console.log('[Save Project] Retrieved data counts:', {
      projects: Array.isArray(projects) ? projects.length : 0,
      tasks: Array.isArray(tasks) ? tasks.length : 0,
      users: Array.isArray(users) ? users.length : 0
    });

    const projectData = {
      projects,
      tasks,
      users,
    };

    console.log('[Save Project] Prepared data:', projectData);

    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = () => {
    console.log('[Load Project] Button clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const projectData = JSON.parse(e.target?.result as string);
          queryClient.setQueryData(['projects'], projectData.projects);
          queryClient.setQueryData(['tasks'], projectData.tasks);
          queryClient.setQueryData(['users'], projectData.users);
          console.log('Project loaded!');
        };
        reader.readAsText(file);
      }
    };
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="flex items-center space-x-2 px-4 py-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AX</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Axsendia PM</h2>
          </div>
        </div>
        <nav className="sidebar-nav-grid">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`sidebar-nav-item ${isActive(path) ? 'active' : ''}`}
            >
              <Icon className={`sidebar-nav-item-icon ${isActive(path) ? 'active' : ''}`} />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="main-content">
        <header className="app-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">Axsendia PM</h1>
              <div className="flex items-center space-x-2 flex-shrink-0" style={{ flexWrap: 'nowrap', minWidth: 'fit-content' }}>
                {user && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <span>Welcome, {user.name}</span>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200 whitespace-nowrap"
                      style={{ flexShrink: 0 }}
                      title="Sign out"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
                <button
                  className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors duration-200 whitespace-nowrap"
                  style={{ flexShrink: 0 }}
                  onClick={handleSaveProject}
                >
                  Save Project
                </button>
                <button
                  className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors duration-200 whitespace-nowrap"
                  style={{ flexShrink: 0 }}
                  onClick={handleLoadProject}
                >
                  Load Project
                </button>
                <button
                  className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors duration-200 whitespace-nowrap shadow-lg shadow-emerald-500/25"
                  style={{ flexShrink: 0 }}
                  onClick={handleNewProject}
                >
                  New Project
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="app-main">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );

  function handleNewProject() {
    queryClient.clear();
    localStorage.removeItem('projectData');
    console.log('New project created!');
  }
}