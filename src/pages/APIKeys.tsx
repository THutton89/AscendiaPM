 import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import './Settings.css';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface ApiKey {
  id: number;
  key: string;
  name: string;
  user_id: number;
  active: number;
  created_at: string;
  last_used_at?: string;
}

const APIKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await api('get-api-keys');
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      setStatus('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setStatus('Please enter a name for the API key');
      return;
    }

    if (!user?.id) {
      setStatus('You must be logged in to create API keys');
      return;
    }

    setIsCreating(true);
    setStatus('Creating API key...');

    try {
      const result = await api('create-api-key', {
        name: newKeyName.trim(),
        userId: user.id
      });

      setApiKeys(prev => [...prev, {
        ...result,
        user_id: result.userId,
        active: 1,
        created_at: new Date().toISOString()
      }]);
      setNewKeyName('');
      setShowCreateForm(false);
      setStatus('API key created successfully');

      // Show the full key temporarily
      setTimeout(() => {
        setStatus('');
      }, 5000);
    } catch (error) {
      console.error('Failed to create API key:', error);
      setStatus('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await api('delete-api-key', { id });
      setApiKeys(prev => prev.filter(key => key.id !== id));
      setStatus('API key deleted successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      setStatus('Failed to delete API key');
    }
  };

  const handleCopyApiKey = async (apiKey: ApiKey) => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setStatus(`API key "${apiKey.name}" copied to clipboard`);

      // Reveal the full key temporarily
      setRevealedKeys(prev => new Set(prev).add(apiKey.id));
      setTimeout(() => {
        setRevealedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(apiKey.id);
          return newSet;
        });
      }, 10000); // Hide after 10 seconds

      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
      setStatus('Failed to copy API key');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  if (isLoading) return <div className="settings-container">Loading...</div>;

  return (
    <div className="settings-container">
      <h1>API Keys</h1>

      <div className="settings-section">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            Manage your API keys for accessing the application programmatically.
          </p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create New API Key'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-2">Create New API Key</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Enter API key name"
                className="flex-1 p-2 border rounded focus:border-blue-300 focus:ring focus:ring-blue-200"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateApiKey()}
              />
              <button
                onClick={handleCreateApiKey}
                disabled={isCreating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {status && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            status.includes('success') ? 'bg-green-100 text-green-800' :
            status.includes('Failed') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {status}
          </div>
        )}

        <div className="settings-form">
          {apiKeys.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No API keys found. Create your first API key above.</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600 font-mono">
                          {revealedKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                        </p>
                        <button
                          onClick={() => handleCopyApiKey(apiKey)}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Copy API key"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(apiKey.created_at).toLocaleDateString()}
                        {apiKey.last_used_at && (
                          <span className="ml-4">
                            Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIKeys;