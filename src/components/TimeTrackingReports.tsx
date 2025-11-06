import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeEntriesDb } from '../db/timeEntries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Clock, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface TimeTrackingReportsProps {
  userId: number;
  projectId?: number;
  days?: number;
}

const TimeTrackingReports: React.FC<TimeTrackingReportsProps> = ({ 
  userId, 
  projectId,
  days = 30 
}) => {
  const { data: timeData, isLoading } = useQuery({
    queryKey: ['timeTracking', userId, days],
    queryFn: () => timeEntriesDb.getUserWorkload(userId, days)
  });

  const { data: projectTimeData } = useQuery({
    queryKey: ['projectTimeTracking', projectId],
    queryFn: () => projectId ? timeEntriesDb.getProjectTimeTracking(projectId) : null,
    enabled: !!projectId
  });

  if (isLoading) return <div className="p-4">Loading time tracking data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Time Tracking Reports
        </h3>
        <button className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
          <Download className="w-4 h-4 mr-1" />
          Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h4 className="font-medium mb-4">Daily Hours (Last {days} Days)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_hours" fill="#84CC16" name="Hours Worked" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {projectTimeData && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="font-medium mb-4">Project Time Allocation</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estimated</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectTimeData.map((task) => (
                  <tr key={task.task_id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{task.task_title}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{task.estimated_hours || 0}h</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{task.actual_hours || 0}h</td>
                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                      (task.actual_hours || 0) > (task.estimated_hours || 0) 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {((task.actual_hours || 0) - (task.estimated_hours || 0)).toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingReports;