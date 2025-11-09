const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createProject: (projectData) => ipcRenderer.invoke('create-project', projectData),

  // NEW - Correct
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', { sql, params }),
  // AI Team related APIs
  dispatchAITask: (taskType, input) => ipcRenderer.invoke('dispatch-ai-task', taskType, input),
  // LM Studio related APIs
  getLmstudioConfig: () => ipcRenderer.invoke('get-lmstudio-config'),
  saveLmstudioConfig: (config) => ipcRenderer.invoke('save-lmstudio-config', config),
  testLmstudioConnection: () => ipcRenderer.invoke('lmstudio-test-connection'),
  getLmstudioSummary: (prompt) => ipcRenderer.invoke('lmstudio-get-summary'),
  getAvailableModels: () => ipcRenderer.invoke('lmstudio-get-available-models'),
  getAgentConfig: () => ipcRenderer.invoke('get-agent-config'),
  saveAgentConfig: (config) => ipcRenderer.invoke('save-agent-config', config),
  createCommit: (message) => ipcRenderer.invoke('create-commit', { message }),
  sendCode: (code) => ipcRenderer.send('receive-code', code),
  onRequestCode: (callback) => ipcRenderer.on('request-code', callback),
  removeRequestCodeListener: (callback) => ipcRenderer.removeListener('request-code', callback),
  // Git related APIs
  gitStore: (type, content) => ipcRenderer.invoke('git-store', type, content),
  gitRead: (oid) => ipcRenderer.invoke('git-read', oid),
  // Bug related APIs
  createBug: (bug) => ipcRenderer.invoke('create-bug', bug),
  getBug: (oid) => ipcRenderer.invoke('get-bug', oid),
  updateBug: (data) => ipcRenderer.invoke('update-bug', data),
  listBugs: () => ipcRenderer.invoke('list-bugs'),
  // Auth related APIs
  signup: (data) => ipcRenderer.invoke('signup', data),
  login: (data) => ipcRenderer.invoke('login', data),
  logout: (userId) => ipcRenderer.invoke('logout', userId),
  googleOAuthSignin: () => ipcRenderer.invoke('google-oauth-signin'),
  // User management APIs
  getUsers: () => ipcRenderer.invoke('get-users'),
  // API Key management APIs
  createApiKey: (data) => ipcRenderer.invoke('create-api-key', data),
  getApiKeys: (userId) => ipcRenderer.invoke('get-api-keys', userId),
  deleteApiKey: (id) => ipcRenderer.invoke('delete-api-key', id),
  // Settings APIs
  getSettings: (params) => ipcRenderer.invoke('get-settings', params),
  saveSetting: (setting) => ipcRenderer.invoke('save-setting', setting),
  updateSetting: (params) => ipcRenderer.invoke('update-setting', params),
  deleteSetting: (id) => ipcRenderer.invoke('delete-setting', id),
  // Project management APIs
  createProject: (project, options) => ipcRenderer.invoke('create-project', project, options),
  getProjects: (options) => ipcRenderer.invoke('get-projects', options),
  updateProject: (project, options) => ipcRenderer.invoke('update-project', project, options),
  deleteProject: (projectId, options) => ipcRenderer.invoke('delete-project', projectId, options),
  // Task management APIs
  createTask: (task) => ipcRenderer.invoke('create-task', task),
  updateTask: (data) => ipcRenderer.invoke('update-task', data),
  getTasks: (projectId) => ipcRenderer.invoke('get-tasks', projectId),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
});