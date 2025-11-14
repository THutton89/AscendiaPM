import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { PlusIcon, UserIcon, Mail, Shield, Clock, Trash2 } from 'lucide-react';
import ResourceManagement from '../components/ResourceManagement';
import { api } from '../utils/api';
import './Team.css';

const Team = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member' as User['role'],
    availability_hours: 40
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await api('get-users');
      console.log('Users data:', result);
      return result as User[];
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (user: Omit<User, 'id' | 'created_at'> & { password: string }) => {
      const result = await api('create-user', user);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreating(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'member',
        availability_hours: 40
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, user }: { id: number; user: Partial<User> }) => {
      const result = await api('update-user', { id, ...user });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await api('delete-user', { id });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     createUserMutation.mutate(newUser);
   };

   const handleRoleChange = (userId: number, newRole: User['role']) => {
     updateUserMutation.mutate({ id: userId, user: { role: newRole } });
   };

   const handleAvailabilityChange = (userId: number, hours: number) => {
     updateUserMutation.mutate({ id: userId, user: { availability_hours: hours } });
   };

  const handleDelete = (userId: number) => {
   if (window.confirm('Are you sure you want to delete this user?')) {
     deleteUserMutation.mutate(userId);
   }
  };

  return (
    <div className="team-container">
      <h1 className="team-heading">Team Members</h1>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowResources(!showResources)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Clock className="w-4 h-4 mr-2" />
            {showResources ? 'Show Team' : 'Show Resources'}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {showResources ? (
        <ResourceManagement />
      ) : (
        <>
          {isCreating && (
            <form onSubmit={handleSubmit} className="team-card">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Weekly Availability (hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={newUser.availability_hours}
                    onChange={(e) => setNewUser({ ...newUser, availability_hours: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
                >
                  Add Member
                </button>
              </div>
            </form>
          )}

          <div className="team-list">
            {users?.map((user) => (
              <div key={user.id} className="team-card">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <h2 className="team-card-heading">{user.name}</h2>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-1 text-gray-500" />
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                          className="text-sm border-none bg-transparent focus:ring-0"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                        <input
                          type="number"
                          min="0"
                          max="168"
                          value={user.availability_hours}
                          onChange={(e) => handleAvailabilityChange(user.id, parseInt(e.target.value))}
                          className="w-16 text-sm border-gray-300 rounded-md"
                        />
                        <span className="ml-1 text-sm text-gray-500">hours/week</span>
                      </div>
                    </div>
                     <button
                       onClick={() => handleDelete(user.id)}
                       className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                     >
                       <Trash2 className="w-4 h-4 mr-1" />
                       Remove
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Team;
