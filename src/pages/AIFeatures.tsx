import React, { useState, useEffect } from 'react';
import { lmStudioClient } from '../utils/lmStudioClient';
import { AgentCard } from '../components/AgentCard';
import { Search, FileText, MessageSquare, CheckSquare } from 'lucide-react';

export default function AIFeatures() {
  const [connectionStatus, setConnectionStatus] = useState<'idle'|'connecting'|'connected'|'error'>('idle');
  const [error, setError] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState<'idle'|'processing'|'completed'|'error'>('idle');

  const agents = [
    {
      name: 'Analyst Agent',
      tasks: ['risk-assessment', 'resource-allocation'],
    },
    {
      name: 'Documentation Agent',
      tasks: ['release-notes', 'meeting-summaries'],
    },
    {
      name: 'QA Agent',
      tasks: ['test-case-generation', 'workflow-analysis'],
    },
    {
      name: 'Process Agent',
      tasks: ['standup-prep', 'visual-analysis'],
    },
  ];

  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('connecting');
      try {
        console.log('Testing LM Studio connection...');
        const result = await lmStudioClient.testConnection();
        console.log('Connection result:', result);
        setConnectionStatus(result.success ? 'connected' : 'error');
        setError(result.success ? null : result.error || 'Connection failed');
        if (!result.success) {
          console.error('LM Studio connection failed:', result.error);
        }
      } catch (err) {
        setConnectionStatus('error');
        setError('Failed to connect to LM Studio');
      }
    };
    checkConnection();
  }, []);

  const handleDispatchTask = async (taskType: string, params: string) => {
    return window.electronAPI.dispatchAITask(taskType, params);
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await window.electronAPI.semanticSearch({
        query: searchQuery,
        limit: 10
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Semantic search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEmbedAllContent = async () => {
    setEmbeddingStatus('processing');
    try {
      // Embed all projects
      const projectsResponse = await window.electronAPI.getProjects();
      if (projectsResponse.success && projectsResponse.projects) {
        for (const project of projectsResponse.projects) {
          await window.electronAPI.embedContent({
            contentType: 'project',
            contentId: project.id,
            contentText: `${project.name} ${project.description || ''}`
          });
        }
      }

      // Embed all tasks
      const tasksResponse = await window.electronAPI.getTasks();
      if (tasksResponse.success && tasksResponse.tasks) {
        for (const task of tasksResponse.tasks) {
          await window.electronAPI.embedContent({
            contentType: 'task',
            contentId: task.id,
            contentText: `${task.title} ${task.description || ''}`
          });
        }
      }

      // Embed all comments using dbQuery
      const commentsResponse = await window.electronAPI.dbQuery('SELECT id, content FROM comments');
      if (commentsResponse && Array.isArray(commentsResponse)) {
        for (const comment of commentsResponse) {
          await window.electronAPI.embedContent({
            contentType: 'comment',
            contentId: comment.id,
            contentText: comment.content
          });
        }
      }

      setEmbeddingStatus('completed');
    } catch (error) {
      console.error('Embedding failed:', error);
      setEmbeddingStatus('error');
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'project': return <FileText size={16} />;
      case 'task': return <CheckSquare size={16} />;
      case 'comment': return <MessageSquare size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const connectionStatusColors = {
    idle: 'bg-gray-200',
    connecting: 'bg-yellow-200',
    connected: 'bg-green-200',
    error: 'bg-red-200'
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agentic AI Workflow</h1>
        <div className={`px-3 py-1 rounded-full text-sm ${connectionStatusColors[connectionStatus]}`}>
          {connectionStatus.toUpperCase()}
        </div>
      </div>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.name}
            agentName={agent.name}
            tasks={agent.tasks}
            onDispatchTask={handleDispatchTask}
          />
        ))}
      </div>

      {/* Semantic Search Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Semantic Search</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across your projects, tasks, and content..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
            />
            <button
              onClick={handleSemanticSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search size={16} />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleEmbedAllContent}
              disabled={embeddingStatus === 'processing'}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {embeddingStatus === 'processing' ? 'Embedding...' : 'Embed Content'}
            </button>
          </div>

          {embeddingStatus !== 'idle' && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              embeddingStatus === 'completed' ? 'bg-green-100 text-green-800' :
              embeddingStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {embeddingStatus === 'processing' && 'Processing content embeddings...'}
              {embeddingStatus === 'completed' && 'Content embeddings completed!'}
              {embeddingStatus === 'error' && 'Failed to embed content'}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Search Results:</h3>
              {searchResults.map((result, index) => (
                <div key={result.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-gray-500 mt-1">
                      {getContentIcon(result.content_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {result.content_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          Similarity: {(result.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {result.content_text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {result.content_id} • Created: {new Date(result.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No results found. Try embedding your content first, or try a different search query.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}