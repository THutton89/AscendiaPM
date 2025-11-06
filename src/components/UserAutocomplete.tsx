import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

interface UserAutocompleteProps {
  onSelect: (userId: number) => void;
}

export function UserAutocomplete({ onSelect }: UserAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api('getUsers');
      return response.users || [];
    }
  });

  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelect = (user: any) => {
    onSelect(user.id);
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true);
        }}
        placeholder="@mention someone..."
        className="w-full p-2 border rounded"
      />
      {showDropdown && filteredUsers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(user)}
            >
              {user.name} ({user.email})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}