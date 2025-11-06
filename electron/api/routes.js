// api/routes.js

// Import all handlers
const { handleDbQuery } = require('../handlers/generalHandlers');
const { handleCreateProject, handleGetProjects, handleUpdateProject, handleDeleteProject } = require('../handlers/projectHandlers');
const { handleGetUsers } = require('../handlers/userHandlers');
const { handleSignup, handleLogin, handleGoogleOAuthSignin, handleValidateEmail, handleCheckEmailExists } = require('../handlers/authHandlers');
const { handleCreateTask, handleGetTasks, handleUpdateTask, handleDeleteTask } = require('../handlers/taskHandlers');
const { handleDispatchAITask, handleGetLmStudioConfig, handleSaveLmStudioConfig, handleTestLmStudioConnection, handleGetLmStudioSummary, handleGetAvailableModels } = require('../handlers/aiHandlers');
const { handleCreateComment, handleGetComments, handleDeleteComment } = require('../handlers/commentHandlers');
const { handleGitStore, handleGitRead, handleCreateBug, handleGetBug, handleUpdateBug, handleListBugs } = require('../handlers/bugHandlers');
const { handleGetSettings, handleSaveSetting, handleUpdateSetting, handleDeleteSetting } = require('../handlers/settingHandlers');

const { handleCreateApiKey, handleGetApiKeys, handleDeleteApiKey } = require('../handlers/apikeyHandlers');
const { handleGetAppointments, handleCreateAppointment, handleUpdateAppointment, handleDeleteAppointment } = require('../handlers/schedulingHandlers');

// Wrapper to handle async/await errors in Express
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// This function receives the app and auth middleware from server.js
function registerApiRoutes(apiApp, auth) {

  // Health Check
  apiApp.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Ascendia PM API is running' });
  });

  // General
  apiApp.post('/api/db-query', auth, wrap(async (req, res) => {
    const { sql, params } = req.body;
    const result = await handleDbQuery(sql, params);
    res.json(result);
  }));

  // Projects
  apiApp.post('/api/projects', auth, wrap(async (req, res) => {
    const result = await handleCreateProject(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/projects', auth, wrap(async (req, res) => {
    const result = await handleGetProjects(req.auth.userId);
    res.json(result);
  }));
  apiApp.put('/api/projects/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateProject(req.auth.userId, { id: req.params.id, ...req.body });
    res.json(result);
  }));
  apiApp.delete('/api/projects/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteProject(req.auth.userId, req.params.id);
    res.json(result);
  }));

  // Users
  apiApp.get('/api/users', auth, wrap(async (req, res) => {
    const result = await handleGetUsers();
    res.json(result);
  }));

  // Auth (Note: Signup/Login are NOT protected by `auth` middleware)
  apiApp.post('/api/auth/signup', wrap(async (req, res) => {
    const result = await handleSignup(req.body);
    res.json(result);
  }));
  apiApp.post('/api/auth/login', wrap(async (req, res) => {
    const result = await handleLogin(req.body);
    res.json(result);
  }));
  apiApp.post('/api/auth/google-signin', wrap(async (req, res) => {
    const result = await handleGoogleOAuthSignin();
    res.json(result);
  }));
  apiApp.post('/api/auth/validate-email', wrap(async (req, res) => {
    const { email } = req.body;
    const result = await handleValidateEmail(email);
    res.json(result);
  }));
  apiApp.post('/api/auth/check-email', wrap(async (req, res) => {
    const { email } = req.body;
    const result = await handleCheckEmailExists(email);
    res.json(result);
  }));

  // Tasks
  apiApp.post('/api/tasks', auth, wrap(async (req, res) => {
    const result = await handleCreateTask(req.body);
    res.json(result);
  }));
  apiApp.get('/api/tasks', auth, wrap(async (req, res) => {
    const result = await handleGetTasks(req.query.projectId);
    res.json(result);
  }));
  apiApp.put('/api/tasks/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateTask({ id: req.params.id, updates: req.body });
    res.json(result);
  }));
  apiApp.delete('/api/tasks/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteTask(req.params.id);
    res.json(result);
  }));

  // AI
  apiApp.post('/api/ai/dispatch-task', auth, wrap(async (req, res) => {
    const { taskType, input } = req.body;
    const result = await handleDispatchAITask(taskType, input);
    res.json(result);
  }));
  apiApp.get('/api/ai/lmstudio/config', auth, wrap(async (req, res) => {
    const result = await handleGetLmStudioConfig();
    res.json(result);
  }));
  apiApp.post('/api/ai/lmstudio/config', auth, wrap(async (req, res) => {
    const result = await handleSaveLmStudioConfig(req.body);
    res.json(result);
  }));
  apiApp.post('/api/ai/lmstudio/test-connection', auth, wrap(async (req, res) => {
    const result = await handleTestLmStudioConnection();
    res.json(result);
  }));
  apiApp.post('/api/ai/lmstudio/summary', auth, wrap(async (req, res) => {
    const result = await handleGetLmStudioSummary(req.body);
    res.json(result);
  }));
  apiApp.get('/api/ai/lmstudio/models', auth, wrap(async (req, res) => {
    const result = await handleGetAvailableModels();
    res.json(result);
  }));

  // Comments
  apiApp.post('/api/comments', auth, wrap(async (req, res) => {
    const result = await handleCreateComment(req.body);
    res.json(result);
  }));
  apiApp.get('/api/comments/:taskId', auth, wrap(async (req, res) => {
    const result = await handleGetComments(req.params.taskId);
    res.json(result);
  }));
  apiApp.delete('/api/comments/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteComment(req.params.id);
    res.json(result);
  }));

  // Git & Bugs
  apiApp.post('/api/git/store', auth, wrap(async (req, res) => {
    const { type, content } = req.body;
    const result = await handleGitStore(type, content);
    res.json(result);
  }));
  apiApp.get('/api/git/read/:oid', auth, wrap(async (req, res) => {
    const result = await handleGitRead(req.params.oid);
    res.json(result);
  }));
  apiApp.post('/api/bugs', auth, wrap(async (req, res) => {
    const result = await handleCreateBug(req.body);
    res.json(result);
  }));
  apiApp.get('/api/bugs/:oid', auth, wrap(async (req, res) => {
    const result = await handleGetBug(req.params.oid);
    res.json(result);
  }));
  apiApp.put('/api/bugs/:oid', auth, wrap(async (req, res) => {
    const result = await handleUpdateBug(req.params.oid, req.body);
    res.json(result);
  }));
  apiApp.get('/api/bugs', auth, wrap(async (req, res) => {
    const result = await handleListBugs();
    res.json(result);
  }));

  // Settings
  apiApp.get('/api/settings', auth, wrap(async (req, res) => {
    const { category, userId } = req.query;
    const result = await handleGetSettings(category, userId);
    res.json(result);
  }));
  apiApp.post('/api/settings', auth, wrap(async (req, res) => {
    const result = await handleSaveSetting(req.body);
    res.json(result);
  }));
  apiApp.put('/api/settings/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateSetting(req.params.id, req.body);
    res.json(result);
  }));
  apiApp.delete('/api/settings/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteSetting(req.params.id);
    res.json(result);
  }));

  // API Keys
  apiApp.post('/api/api-keys', auth, wrap(async (req, res) => {
    const result = await handleCreateApiKey(req.body);
    res.json(result);
  }));
  apiApp.get('/api/api-keys', auth, wrap(async (req, res) => {
    const result = await handleGetApiKeys(req.query.userId);
    res.json(result);
  }));
  apiApp.delete('/api/api-keys/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteApiKey(req.params.id);
    res.json(result);
  }));

  // Appointments
  apiApp.get('/api/appointments', auth, wrap(async (req, res) => {
    const { date } = req.query;
    const result = await handleGetAppointments(date);
    res.json(result);
  }));
  apiApp.post('/api/appointments', auth, wrap(async (req, res) => {
    const result = await handleCreateAppointment({ ...req.body, assignedUserId: req.auth.userId });
    res.json(result);
  }));
  apiApp.put('/api/appointments/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateAppointment(req.params.id, req.body);
    res.json(result);
  }));
  apiApp.delete('/api/appointments/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteAppointment(req.params.id);
    res.json(result);
  }));

  // Error handler
  apiApp.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  });
}

module.exports = registerApiRoutes;