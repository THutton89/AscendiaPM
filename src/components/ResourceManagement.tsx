import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersDb } from '../db/users';
import { timeEntriesDb } from '../db/timeEntries';
import { User, Workload } from '../types';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface UserWithWorkload extends User {
  workload: Workload[];
}

const ResourceManagement = () => {
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: usersDb.getAll
  });

  const { data: workloadData } = useQuery<UserWithWorkload[]>({
    queryKey: ['workload'],
    queryFn: async (): Promise<UserWithWorkload[]> => {
      if (!users) return [];
      const workloads = await Promise.all(
        users.map(async (user) => {
          const weeklyWorkload = await timeEntriesDb.getUserWorkload(user.id);
          return {
            ...user,
            workload: weeklyWorkload
          };
        })
      );
      return workloads as UserWithWorkload[];
    },
    enabled: !!users
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Resource Workload</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workloadData?.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <span className={`px-2 py-1 text-sm rounded ${
                user.availability_hours > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.availability_hours}h/week
              </span>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={user.workload}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                    formatter={(value) => [`${value}h`, 'Hours']}
                  />
                  <Bar dataKey="total_hours" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Weekly Target: {user.availability_hours}h</span>
                <span>
                  Utilization: {Math.round((user.workload?.[0]?.total_hours || 0) / user.availability_hours * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceManagement;
