import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BrainCircuit,
  Settings,
  Clock,
  Code,
  Key
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/team', icon: Users, label: 'Team' },
    { path: '/ai-features', icon: BrainCircuit, label: 'AI Assistant' },
    { path: '/sandbox', icon: Code, label: 'Code Sandbox' },
    { path: '/time-tracking', icon: Clock, label: 'Time Tracking' },
    { path: '/meetings', icon: Users, label: 'Meetings' },
    { path: '/api-keys', icon: Key, label: 'API Keys' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
      </div>
      <nav className="sidebar-nav">
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
  );
};

export { Sidebar };
