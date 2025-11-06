import React from 'react';
import TimeTracker from '../components/TimeTracker';
import TimeTrackingReports from '../components/TimeTrackingReports';
import { useAuth } from '../context/AuthContext';

const TimeTrackingPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Time Tracking</h2>
      <TimeTracker taskId={0} userId={user.id} />
      <TimeTrackingReports userId={user.id} />
    </div>
  );
};

export default TimeTrackingPage;