import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesDb } from '../db/timeEntries';
import { usersDb } from '../db/users';
import { format } from 'date-fns';
import { Clock, Plus, X, Calendar, AlignLeft, Users } from 'lucide-react';
import { TimeEntry, User } from '../types';

interface TimeTrackerProps {
  taskId: number;
  userId: number;
}

const TimeTracker = ({ taskId, userId }: TimeTrackerProps) => {
  const queryClient = useQueryClient();
  const [isLogging, setIsLogging] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timeEntry, setTimeEntry] = useState({
    user_id: userId, // Default to current user
    hours_spent: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });
  const [selectedTimerUser, setSelectedTimerUser] = useState(userId); // User for timer tracking

  const { data: timeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', taskId],
    queryFn: () => timeEntriesDb.getByTask(taskId)
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersDb.getAll()
  });

  const logTimeMutation = useMutation({
    mutationFn: async () => await timeEntriesDb.create({
      task_id: taskId,
      ...timeEntry
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', taskId] });
      setIsLogging(false);
      setTimeEntry({
        user_id: userId,
        hours_spent: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logTimeMutation.mutate();
  };

  const totalHours = timeEntries?.reduce((sum, entry) => sum + entry.hours_spent, 0) || 0;

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      setTimeEntry(prev => ({
        ...prev,
        user_id: selectedTimerUser, // Use selected user for timer
        hours_spent: timerSeconds / 3600
      }));
    } else {
      setIsTimerRunning(true);
      setTimerSeconds(0);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-emerald-300">Time Tracking</h3>
        </div>
        <div className="flex space-x-2">
          {/* Team Member Selector for Timer */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <select
              value={selectedTimerUser}
              onChange={(e) => setSelectedTimerUser(parseInt(e.target.value))}
              className="text-sm px-2 py-1 border border-gray-300 rounded bg-white"
              disabled={isTimerRunning} // Don't allow changing user while timer is running
            >
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleTimer}
            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md ${
              isTimerRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
          </button>
          {!isLogging && (
            <button
              onClick={() => setIsLogging(true)}
              className="flex items-center px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 shadow-sm hover:shadow-md shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Time
            </button>
          )}
        </div>
      </div>

      {isLogging && (
        <div className="relative">
          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setIsLogging(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  Hours Spent
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={timeEntry.hours_spent}
                  onChange={(e) => setTimeEntry({ ...timeEntry, hours_spent: parseFloat(e.target.value) })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-200 bg-slate-800 text-emerald-300"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Date
                </label>
                <input
                  type="date"
                  value={timeEntry.date}
                  onChange={(e) => setTimeEntry({ ...timeEntry, date: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-200 bg-slate-800 text-emerald-300"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  Team Member
                </label>
                <select
                  value={timeEntry.user_id}
                  onChange={(e) => setTimeEntry({ ...timeEntry, user_id: parseInt(e.target.value) })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-200 bg-slate-800 text-emerald-300"
                  required
                >
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <AlignLeft className="w-4 h-4 mr-2 text-gray-400" />
                  Description
                </label>
                <textarea
                  value={timeEntry.description}
                  onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200"
                  rows={2}
                  placeholder="What did you work on?"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsLogging(false)}
                className="px-4 py-2 text-sm font-medium text-emerald-300 bg-slate-800 border border-emerald-600 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-500">Total Hours</span>
          <span className="text-lg font-semibold text-emerald-400">{totalHours}h</span>
        </div>
        
        <div className="space-y-3">
          {timeEntries?.map((entry) => (
            <div 
              key={entry.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.user_name}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                    {entry.description && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs">{entry.description}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded-full shadow-sm">
                {entry.hours_spent}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
