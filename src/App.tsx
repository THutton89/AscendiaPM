import React, { Suspense } from 'react';
import '../src/index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Suppress DevExtreme scheduler defaultProps warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' &&
      (args[0].includes('Support for defaultProps will be removed from') ||
       args[0].includes('defaultProps'))) {
    return;
  }
  originalWarn.apply(console, args);
};

// Lazy load all page components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Team = React.lazy(() => import('./pages/Team'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const TimeTrackingPage = React.lazy(() => import('./pages/TimeTrackingPage'));
const MeetingsPage = React.lazy(() => import('./pages/MeetingsPage'));
// const CodeSandboxPage = React.lazy(() => import('./pages/CodeSandboxPage').then(module => ({ default: module.CodeSandboxPage })));
const PortfolioPage = React.lazy(() => import('./pages/Portfolio'));
const AIFeatures = React.lazy(() => import('./pages/AIFeatures'));
const APIKeys = React.lazy(() => import('./pages/APIKeys'));
const Calendar = React.lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const APIDocs = React.lazy(() => import('./pages/APIDocs').then(module => ({ default: module.APIDocs })));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
  </div>
);

const queryClient = new QueryClient();

export function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/api-keys" element={<APIKeys />} />
                        <Route path="/portfolio" element={<PortfolioPage />} />
                        <Route path="/time-tracking" element={<TimeTrackingPage />} />
                        <Route path="/meetings" element={<MeetingsPage />} />
                        <Route path="/ai-features" element={<AIFeatures />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/api-docs" element={<APIDocs />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
      </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
