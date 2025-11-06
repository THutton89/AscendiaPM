import React from 'react';
import MeetingList from '../components/MeetingList';
import MeetingForm from '../components/MeetingForm';
import { useAuth } from '../context/AuthContext';

const MeetingsPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meetings</h2>
        <MeetingForm organizerId={user.id} />
      </div>
      <MeetingList userId={user.id} />
    </div>
  );
};

export default MeetingsPage;