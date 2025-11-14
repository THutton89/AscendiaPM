const API_BASE_URL = 'http://localhost:3069';

// Simple authentication token for testing
// In a real application, you would get this from a login process
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// Map IPC call names to HTTP endpoints and methods
const endpointMap: Record<string, { method: string; url: string }> = {
  // General
  'db-query': { method: 'POST', url: '/api/db-query' },

  // Projects
  'create-project': { method: 'POST', url: '/api/projects' },
  'get-projects': { method: 'GET', url: '/api/projects' },
  'update-project': { method: 'PUT', url: '/api/projects/:id' },
  'delete-project': { method: 'DELETE', url: '/api/projects/:id' },

  // Meetings
  'create-meeting': { method: 'POST', url: '/api/meetings' },
  'get-meetings': { method: 'GET', url: '/api/meetings' },
  'add-meeting-participant': { method: 'POST', url: '/api/meetings/:meetingId/participants' },

  // Sprints
  'create-sprint': { method: 'POST', url: '/api/sprints' },
  'get-sprints': { method: 'GET', url: '/api/sprints' },
  'get-active-sprint': { method: 'GET', url: '/api/sprints/active' },
  'update-sprint': { method: 'PUT', url: '/api/sprints/:id' },
  'delete-sprint': { method: 'DELETE', url: '/api/sprints/:id' },

  // Time Tracking
  'create-time-entry': { method: 'POST', url: '/api/time-entries' },
  'get-time-entries-by-task': { method: 'GET', url: '/api/time-entries/task/:taskId' },
  'get-time-entries-by-user': { method: 'GET', url: '/api/time-entries/user' },
  'get-user-workload': { method: 'GET', url: '/api/time-entries/workload' },
  'get-project-time-tracking': { method: 'GET', url: '/api/time-entries/project/:projectId' },

  // Users
  'get-users': { method: 'GET', url: '/api/users' },
  'get-user': { method: 'GET', url: '/api/users/:id' },
  'create-user': { method: 'POST', url: '/api/users' },
  'update-user': { method: 'PUT', url: '/api/users/:id' },
  'delete-user': { method: 'DELETE', url: '/api/users/:id' },
  'assign-user-to-task': { method: 'POST', url: '/api/tasks/assign' },
  'remove-user-from-task': { method: 'POST', url: '/api/tasks/unassign' },
  'get-user-tasks': { method: 'GET', url: '/api/users/:id/tasks' },
  'search-users': { method: 'GET', url: '/api/users/search' },
  'get-mention-suggestions': { method: 'GET', url: '/api/users/mention-suggestions' },
  'update-notification-settings': { method: 'PUT', url: '/api/users/:id/notification-settings' },
  'find-user-by-google-id': { method: 'GET', url: '/api/users/google/:id' },
  'create-google-user': { method: 'POST', url: '/api/users/google' },
  'update-google-tokens': { method: 'PUT', url: '/api/users/:id/google-tokens' },


  // Auth
  'signup': { method: 'POST', url: '/api/auth/signup' },
  'login': { method: 'POST', url: '/api/auth/login' },
  'logout': { method: 'POST', url: '/api/auth/logout' },
  'google-oauth-signin': { method: 'POST', url: '/api/auth/google-signin' },
  'github-oauth-signin': { method: 'POST', url: '/api/auth/github-signin' },

  // Tasks
  'create-task': { method: 'POST', url: '/api/tasks' },
  'get-tasks': { method: 'GET', url: '/api/tasks' },
  'update-task': { method: 'PUT', url: '/api/tasks/:id' },
  'delete-task': { method: 'DELETE', url: '/api/tasks/:id' },

  // Comments
  'create-comment': { method: 'POST', url: '/api/comments' },
  'get-comments': { method: 'GET', url: '/api/comments/:taskId' },
  'delete-comment': { method: 'DELETE', url: '/api/comments/:id' },

  // AI & Inference Server
  'dispatch-ai-task': { method: 'POST', url: '/api/ai/dispatch-task' },
  'get-inference-server-config': { method: 'GET', url: '/api/ai/inference/config' },
  'save-inference-server-config': { method: 'POST', url: '/api/ai/inference/config' },
  'inference-server-test-connection': { method: 'POST', url: '/api/ai/inference/test-connection' },
  'inference-server-get-summary': { method: 'POST', url: '/api/ai/inference/summary' },
  'inference-server-get-available-models': { method: 'GET', url: '/api/ai/inference/models' },

  // Embedding Service
  'get-embedding-config': { method: 'GET', url: '/api/ai/embedding/config' },
  'save-embedding-config': { method: 'POST', url: '/api/ai/embedding/config' },
  'generate-embedding': { method: 'POST', url: '/api/ai/embedding/generate' },
  'store-embedding': { method: 'POST', url: '/api/ai/embedding/store' },
  'get-embeddings': { method: 'GET', url: '/api/ai/embedding' },
  'semantic-search': { method: 'POST', url: '/api/ai/embedding/search' },
  'embed-content': { method: 'POST', url: '/api/ai/embedding/content' },
  'transcribe-audio': { method: 'POST', url: '/api/ai/transcribe' },

  'get-agent-config': { method: 'GET', url: '/api/ai/agent/config' },
  'save-agent-config': { method: 'POST', url: '/api/ai/agent/config' },


  // Bugs
  'create-bug': { method: 'POST', url: '/api/bugs' },
  'get-bug': { method: 'GET', url: '/api/bugs/:oid' },
  'update-bug': { method: 'PUT', url: '/api/bugs/:oid' },
  'list-bugs': { method: 'GET', url: '/api/bugs' },

  // API Keys
  'create-api-key': { method: 'POST', url: '/api/api-keys' },
  'get-api-keys': { method: 'GET', url: '/api/api-keys' },
  'delete-api-key': { method: 'DELETE', url: '/api/api-keys/:id' },

  // Settings
  'get-settings': { method: 'GET', url: '/api/settings' },
  'save-setting': { method: 'POST', url: '/api/settings' },
  'update-setting': { method: 'PUT', url: '/api/settings/:id' },
  'delete-setting': { method: 'DELETE', url: '/api/settings/:id' },

  // Organizations
  'get-organization': { method: 'GET', url: '/api/organizations' },
  'create-organization': { method: 'POST', url: '/api/create-organization' },
  'update-organization': { method: 'POST', url: '/api/update-organization' },
  'get-organization-members': { method: 'GET', url: '/api/organizations/members' },
  'invite-user-to-organization': { method: 'POST', url: '/api/invite-user-to-organization' },
  'update-user-role': { method: 'POST', url: '/api/update-user-role' },
  'remove-user-from-organization': { method: 'POST', url: '/api/remove-user-from-organization' },

  // Git
  'git-store': { method: 'POST', url: '/api/git/store' },
  'git-read': { method: 'GET', url: '/api/git/read/:oid' },
  'project-store': { method: 'POST', url: '/api/projects' },
  'project-get': { method: 'GET', url: '/api/projects/:oid' },
  'task-store': { method: 'POST', url: '/api/tasks' },
  'task-get': { method: 'GET', url: '/api/tasks/:oid' },
  'user-store': { method: 'POST', url: '/api/users' },
  'user-get': { method: 'GET', url: '/api/users/:oid' },
  'create-commit': { method: 'POST', url: '/api/git/commit' },
  'read-code-sandbox': { method: 'GET', url: '/api/code-sandbox' },

  // GitHub Integration
  'github-repos': { method: 'GET', url: '/api/github/repos' },
  'github-commit': { method: 'POST', url: '/api/github/commit' },
  'github-repos-contents': { method: 'GET', url: '/api/github/repos/:owner/:repo/contents' },
  'github-repos-pull': { method: 'POST', url: '/api/github/repos/:owner/:repo/pull' },

};

export async function api(endpoint: string, data?: any) {
  console.log(`API call to ${endpoint} with data:`, data);

  // Get the HTTP method and URL for the endpoint
  const endpointInfo = endpointMap[endpoint];
  if (!endpointInfo) {
    console.error(`Unknown endpoint: ${endpoint}`);
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  let { method, url } = endpointInfo;

  // Replace placeholders in the URL with actual values from data
  if (data) {
    // Handle URL parameters
    if (url.includes(':id') && data.id) {
      url = url.replace(':id', data.id);
    }
    if (url.includes(':oid') && data.oid) {
      url = url.replace(':oid', data.oid);
    }
    if (url.includes(':taskId') && data.taskId) {
      url = url.replace(':taskId', data.taskId);
    }
    if (url.includes(':meetingId') && data.meetingId) {
      url = url.replace(':meetingId', data.meetingId);
    }
    if (url.includes(':userId') && data.userId) {
      url = url.replace(':userId', data.userId);
    }
  }

  let fullUrl = `${API_BASE_URL}${url}`;
  let body: string | undefined;

  // For GET requests, append query parameters to the URL
  if (method === 'GET' && data) {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }
    if (queryParams.toString()) {
      fullUrl += `?${queryParams.toString()}`;
    }
  } else if (data) {
    // For other requests, send data in the request body
    body = JSON.stringify(data);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token is available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API call failed for ${endpoint}:`, errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log(`API response from ${endpoint}:`, responseData);

    // Handle the server's response format
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      if (responseData.success) {
        // Extract the actual data array from the response
        const result = { ...responseData };
        delete result.success;

        // Return the data array directly (not wrapped in an object)
        if (result.projects !== undefined) {
          console.log(`Extracting projects data from response:`, result.projects);
          return result.projects;
        }
        if (result.tasks !== undefined) {
          console.log(`Extracting tasks data from response:`, result.tasks);
          return result.tasks;
        }
        if (result.data !== undefined) {
          console.log(`Extracting data from response:`, result.data);
          return result.data;
        }
        if (result.users !== undefined) {
          console.log(`Extracting users data from response:`, result.users);
          return result.users;
        }
        if (result.meetings !== undefined) {
          console.log(`Extracting meetings data from response:`, result.meetings);
          return result.meetings;
        }
        if (result.sprints !== undefined) {
          console.log(`Extracting sprints data from response:`, result.sprints);
          return result.sprints;
        }
        if (result.time_entries !== undefined) {
          console.log(`Extracting time entries data from response:`, result.time_entries);
          return result.time_entries;
        }

        // If no known data field, return the result object
        console.log(`Extracting data from response:`, result);
        return result;
      } else {
        throw new Error(responseData.error || 'API call failed');
      }
    }

    // If no success field, return the data directly
    return responseData;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}