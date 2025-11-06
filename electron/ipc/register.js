// ipc/register.js
const { ipcMain } = require('electron');
const { app } = require('electron');
const path = require('path');
const git = require('isomorphic-git');
const fs = require('fs');

// Import all handlers and services
const { handleDbQuery } = require('../handlers/generalHandlers');
const { handleCreateProject, handleGetProjects, handleUpdateProject, handleDeleteProject } = require('../handlers/projectHandlers');
const { handleCreateMeeting, handleGetMeetings, handleAddParticipant } = require('../handlers/meetingHandlers');
const { handleGetUsers } = require('../handlers/userHandlers');
const { handleSignup, handleLogin, handleGoogleOAuthSignin, handleLogout } = require('../handlers/authHandlers');
const { handleCreateTask, handleGetTasks, handleUpdateTask, handleDeleteTask } = require('../handlers/taskHandlers');
const {
  handleDispatchAITask,
  handleGetInferenceServerConfig,
  handleSaveInferenceServerConfig,
  handleTestInferenceServerConnection,
  handleGetInferenceServerSummary,
  handleGetAvailableModels,
  handleGetEmbeddingConfig,
  handleSaveEmbeddingConfig,
  handleGenerateEmbedding,
  handleStoreEmbedding,
  handleGetEmbeddings,
  handleSemanticSearch,
  handleEmbedContent,
  handleTranscribeAudio
} = require('../handlers/aiHandlers');
const { handleCreateComment, handleGetComments, handleDeleteComment } = require('../handlers/commentHandlers');
const { handleCreateBug, handleGetBug, handleUpdateBug, handleListBugs } = require('../handlers/bugHandlers');
const { handleCreateApiKey, handleGetApiKeys, handleDeleteApiKey } = require('../handlers/apikeyHandlers');
const { handleGetSettings, handleSaveSetting, handleUpdateSetting, handleDeleteSetting } = require('../handlers/settingHandlers');

// API Key authentication middleware
async function authenticateApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('API key required');
  }

  // Allow test API key for development
  if (apiKey === 'test-api-key-123') {
    return {
      apiKeyId: 1,
      userId: 1,
      active: 1
    };
  }

  // For development, accept any non-empty API key
  // TODO: Implement proper API key validation
  return {
    apiKeyId: 1,
    userId: 1,
    active: 1
  };

  /*
  const { getDatabase } = require('../database');
  const db = await getDatabase();

  // For now, use simplified authentication without user_id column
  // This allows the system to work with existing databases
  try {
    const result = db.exec('SELECT id FROM api_keys WHERE key = ? AND active = 1', [apiKey]);

    if (result.length === 0 || result[0].values.length === 0) {
      throw new Error('Invalid or inactive API key');
    }

    const row = result[0].values[0];
    return {
      apiKeyId: row[0],
      userId: 1, // Default user ID for now
      active: 1
    };
  } catch (error) {
    console.error('API key authentication error:', error.message);
    throw new Error(`Authentication failed: ${error.message}`);
  }
  */
}

// Wrapper for handlers that require API key authentication
function withApiKeyAuth(handler) {
  return async (event, ...args) => {
    try {
      // Extract API key from args or event
      const apiKey = args[args.length - 1]?.apiKey || event?.apiKey;
      if (!apiKey) {
        throw new Error('API key required for this operation');
      }

      const auth = await authenticateApiKey(apiKey);

      // Add authenticated user info to the event
      event.auth = auth;

      return await handler(event, ...args);
    } catch (error) {
      console.error('API key authentication failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  };
}

const { lmStudioConfig } = require('../services/lmStudioService');
const gitService = require('../services/gitService');

function registerIpcHandlers() {
  console.log('Registering IPC handlers...');

  // General
  ipcMain.handle('db-query', (event, { sql, params }) => handleDbQuery(sql, params));

  // Projects
  ipcMain.handle('create-project', withApiKeyAuth((event, data) => handleCreateProject(event.auth.userId, data)));
  ipcMain.handle('get-projects', withApiKeyAuth((event) => handleGetProjects(event.auth.userId)));
  ipcMain.handle('update-project', withApiKeyAuth((event, data) => handleUpdateProject(event.auth.userId, data)));
  ipcMain.handle('delete-project', withApiKeyAuth((event, id) => handleDeleteProject(event.auth.userId, id)));

  // Meetings
  ipcMain.handle('create-meeting', (event, data) => handleCreateMeeting(data.organizer_id, data));
  ipcMain.handle('get-meetings', (event, { userId, days }) => handleGetMeetings(userId, days));
  ipcMain.handle('add-meeting-participant', (event, { meetingId, userId }) => handleAddParticipant(meetingId, userId));

  // Users
  ipcMain.handle('get-users', () => handleGetUsers());

  // Auth
  ipcMain.handle('signup', (event, data) => handleSignup(data));
  ipcMain.handle('login', (event, data) => handleLogin(data));
  ipcMain.handle('logout', (event, userId) => handleLogout(userId));
  ipcMain.handle('google-oauth-signin', () => handleGoogleOAuthSignin());

  // Tasks
  ipcMain.handle('create-task', (event, data) => handleCreateTask(data));
  ipcMain.handle('get-tasks', (event, projectId) => handleGetTasks(projectId));
  ipcMain.handle('update-task', (event, data) => handleUpdateTask(data));
  ipcMain.handle('delete-task', (event, id) => handleDeleteTask(id));

  // Comments
  ipcMain.handle('create-comment', (event, data) => handleCreateComment(data));
  ipcMain.handle('get-comments', (event, taskId) => handleGetComments(taskId));
  ipcMain.handle('delete-comment', (event, id) => handleDeleteComment(id));

  // AI & Inference Server
  ipcMain.handle('dispatch-ai-task', (event, taskType, input) => handleDispatchAITask(taskType, input));
  ipcMain.handle('get-inference-server-config', () => handleGetInferenceServerConfig());
  ipcMain.handle('save-inference-server-config', (event, config) => handleSaveInferenceServerConfig(config));
  ipcMain.handle('inference-server-test-connection', () => handleTestInferenceServerConnection());
  ipcMain.handle('inference-server-get-summary', (event, data) => handleGetInferenceServerSummary(data));
  ipcMain.handle('inference-server-get-available-models', () => handleGetAvailableModels());

  // Embedding Service
  ipcMain.handle('get-embedding-config', () => handleGetEmbeddingConfig());
  ipcMain.handle('save-embedding-config', (event, config) => handleSaveEmbeddingConfig(config));
  ipcMain.handle('generate-embedding', (event, text) => handleGenerateEmbedding(text));
  ipcMain.handle('store-embedding', (event, data) => handleStoreEmbedding(event.auth?.userId || 1, data.contentType, data.contentId, data.contentText, data.embedding));
  ipcMain.handle('get-embeddings', (event, params) => handleGetEmbeddings(event.auth?.userId || 1, params?.contentType, params?.limit));
  ipcMain.handle('semantic-search', (event, params) => handleSemanticSearch(event.auth?.userId || 1, params.query, params.contentType, params.limit));
  ipcMain.handle('embed-content', (event, data) => handleEmbedContent(event.auth?.userId || 1, data.contentType, data.contentId, data.contentText));
  ipcMain.handle('transcribe-audio', (event, audioData) => handleTranscribeAudio(audioData));
  
  ipcMain.handle('get-agent-config', async () => {
    const { getDatabase } = require('../database');
    const db = await getDatabase();
    try {
      const result = db.exec('SELECT agent_type, model_name FROM agent_config');
      const config = {};
      if (result.length > 0) {
        result[0].values.forEach(row => {
          config[row[0]] = row[1];
        });
      }
      return config;
    } catch (err) {
      console.error('Failed to get agent config:', err);
      throw err;
    }
  });

  ipcMain.handle('save-agent-config', async (event, { agentType, modelName }) => {
    const { getDatabase, saveDatabase } = require('../database');
    const db = await getDatabase();
    try {
      db.run(
        `INSERT OR REPLACE INTO agent_config (agent_type, model_name)
         VALUES (?, ?)`,
        [agentType, modelName]
      );
      await saveDatabase();
      return { success: true };
    } catch (err) {
      console.error('Failed to save agent config:', err);
      throw err;
    }
  });

  // LMStudio calls now use Inference Server
  ipcMain.handle('lmstudio-get-config', () => handleGetInferenceServerConfig());
  ipcMain.handle('lmstudio-update-config', (event, newConfig) => handleSaveInferenceServerConfig(newConfig));
  ipcMain.handle('lmstudio-test-connection', () => handleTestInferenceServerConnection());
  ipcMain.handle('lmstudio-get-summary', (event, data) => handleGetInferenceServerSummary(data));
  ipcMain.handle('lmstudio-get-available-models', () => handleGetAvailableModels());

  // Bugs
  ipcMain.handle('create-bug', (event, bug) => handleCreateBug(bug));
  ipcMain.handle('get-bug', (event, oid) => handleGetBug(oid));
  ipcMain.handle('update-bug', (event, { oid, updates }) => handleUpdateBug(oid, updates));
  ipcMain.handle('list-bugs', () => handleListBugs());

  // API Keys
  ipcMain.handle('create-api-key', (event, data) => handleCreateApiKey(data));
  ipcMain.handle('get-api-keys', (event, userId) => handleGetApiKeys(userId));
  ipcMain.handle('delete-api-key', (event, id) => handleDeleteApiKey(id));

  // Settings
  ipcMain.handle('get-settings', (event, { category, userId }) => handleGetSettings(category, userId));
  ipcMain.handle('save-setting', (event, setting) => handleSaveSetting(setting));
  ipcMain.handle('update-setting', (event, { id, setting }) => handleUpdateSetting(id, setting));
  ipcMain.handle('delete-setting', (event, id) => handleDeleteSetting(id));

  // Git
  ipcMain.handle('git-store', async (event, type, content) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    return await gitService.storeGitObject(repoPath, type, JSON.stringify(content));
  });

  ipcMain.handle('git-read', async (event, oid) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    const content = await gitService.readGitObject(repoPath, oid);
    return JSON.parse(content);
  });
  
  ipcMain.handle('project-store', async (event, project) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    return await gitService.storeProject(repoPath, project);
  });

  ipcMain.handle('project-get', async (event, oid) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    return await gitService.getProject(repoPath, oid);
  });

  ipcMain.handle('task-store', async (event, task) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    return await gitService.storeTask(repoPath, task);
  });

  ipcMain.handle('task-get', async (event, oid) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    return await gitService.getTask(repoPath, oid);
  });

  ipcMain.handle('user-store', async (event, user) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    return await gitService.storeUser(repoPath, user);
  });

  ipcMain.handle('user-get', async (event, oid) => {
    const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
    return await gitService.getUser(repoPath, oid);
  });

  ipcMain.handle('create-commit', async (event, { message }) => {
    const repoPath = await gitService.initGitRepo();
    const oid = await git.commit({
      fs,
      dir: repoPath,
      author: { name: 'Focal User', email: 'user@focal.local' },
      message,
    });
    return oid;
  });

  ipcMain.handle('read-code-sandbox', (event) => {
    return new Promise((resolve) => {
      ipcMain.once('receive-code', (event, code) => {
        resolve(code);
      });
      event.sender.send('request-code');
    });
  });

  console.log('IPC handlers registered.');
}

module.exports = {
  registerIpcHandlers
};