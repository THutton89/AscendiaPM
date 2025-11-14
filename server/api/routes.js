// api/routes.js

// Import all handlers
const { handleDbQuery } = require('../handlers/generalHandlers');
const { handleCreateProject, handleGetProjects, handleUpdateProject, handleDeleteProject } = require('../handlers/projectHandlers');
const { handleGetUsers, handleGetUser, handleCreateUser, handleUpdateUser, handleDeleteUser } = require('../handlers/userHandlers');
const { handleSignup, handleLogin, handleGoogleOAuthSignin, handleGoogleOAuthCallback, handleGitHubOAuthSignin, handleGitHubOAuthCallback, handleValidateEmail, handleCheckEmailExists, handleLogout } = require('../handlers/authHandlers');
const { handleCreateTask, handleGetTasks, handleUpdateTask, handleDeleteTask } = require('../handlers/taskHandlers');
const { handleDispatchAITask, handleGetInferenceServerConfig, handleSaveInferenceServerConfig, handleTestInferenceServerConnection, handleGetInferenceServerSummary, handleGetAvailableModels } = require('../handlers/aiHandlers');
const { handleCreateComment, handleGetComments, handleDeleteComment } = require('../handlers/commentHandlers');
const { handleGitStore, handleGitRead, handleCreateBug, handleGetBug, handleUpdateBug, handleListBugs } = require('../handlers/bugHandlers');
const { handleGetSettings, handleSaveSetting, handleUpdateSetting, handleDeleteSetting } = require('../handlers/settingHandlers');

const { handleCreateApiKey, handleGetApiKeys, handleDeleteApiKey } = require('../handlers/apikeyHandlers');
const { handleGetAppointments, handleCreateAppointment, handleUpdateAppointment, handleDeleteAppointment } = require('../handlers/schedulingHandlers');
const { handleCreateOrganization, handleGetOrganization, handleUpdateOrganization, handleGetOrganizationMembers, handleInviteUserToOrganization, handleRemoveUserFromOrganization, handleUpdateUserRole } = require('../handlers/organizationHandlers');
const { handleCreateMeeting, handleGetMeetings, handleAddParticipant } = require('../handlers/meetingHandlers');
const { handleCreateSprint, handleGetSprints, handleGetActiveSprint, handleUpdateSprint, handleDeleteSprint } = require('../handlers/sprintHandlers');
const { handleCreateTimeEntry, handleGetTimeEntriesByTask, handleGetTimeEntriesByUser, handleGetUserWorkload, handleGetProjectTimeTracking } = require('../handlers/timeTrackingHandlers');
const { handleGetGitHubRepos, handleCreateGitHubCommit, handleGetGitHubRepoContents, handlePullGitHubRepo } = require('../handlers/gitHandlers');

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
  apiApp.post('/api/users', auth, wrap(async (req, res) => {
    const result = await handleCreateUser(req.body);
    res.json(result);
  }));
  apiApp.get('/api/users', auth, wrap(async (req, res) => {
    const result = await handleGetUsers();
    res.json(result);
  }));
  apiApp.get('/api/users/:id', auth, wrap(async (req, res) => {
    const result = await handleGetUser(req.params.id);
    res.json(result);
  }));
  apiApp.put('/api/users/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateUser(req.params.id, req.body);
    res.json(result);
  }));
  apiApp.delete('/api/users/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteUser(req.params.id);
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
  apiApp.get('/api/auth/google/callback', wrap(async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?error=No authorization code provided`);
    }

    try {
      const result = await handleGoogleOAuthCallback(code);

      if (result.success) {
        // Create a JWT token or session for the user
        // For now, we'll redirect with user data in query params (not secure for production)
        const authData = encodeURIComponent(JSON.stringify({ user: result.user, token: result.token }));
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?success=true&user=${authData}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?error=${encodeURIComponent(result.error)}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?error=${encodeURIComponent('Authentication failed')}`);
    }
  }));
  apiApp.post('/api/auth/github-signin', wrap(async (req, res) => {
    const result = await handleGitHubOAuthSignin();
    res.json(result);
  }));
  apiApp.get('/api/auth/github/callback', wrap(async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?error=No authorization code provided`);
    }

    try {
      const result = await handleGitHubOAuthCallback(code);

      if (result.success) {
        // Create a JWT token or session for the user
        // For now, we'll redirect with user data in query params (not secure for production)
        const authData = encodeURIComponent(JSON.stringify({ user: result.user, token: result.token }));
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?success=true&user=${authData}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?error=${encodeURIComponent(result.error)}`);
      }
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5169'}/login?error=${encodeURIComponent('Authentication failed')}`);
    }
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
  apiApp.post('/api/auth/logout', auth, wrap(async (req, res) => {
    const result = await handleLogout(req.auth.userId);
    res.json(result);
  }));

  // Tasks
  apiApp.post('/api/tasks', auth, wrap(async (req, res) => {
    const result = await handleCreateTask(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/tasks', auth, wrap(async (req, res) => {
    const result = await handleGetTasks(req.query.projectId, req.auth.userId);
    res.json(result);
  }));
  apiApp.put('/api/tasks/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateTask({ id: req.params.id, updates: req.body, userId: req.auth.userId });
    res.json(result);
  }));
  apiApp.delete('/api/tasks/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteTask(req.params.id, req.auth.userId);
    res.json(result);
  }));

  // AI
  apiApp.post('/api/ai/dispatch-task', auth, wrap(async (req, res) => {
    const { taskType, input } = req.body;
    const result = await handleDispatchAITask(taskType, input);
    res.json(result);
  }));
  apiApp.get('/api/ai/inference/config', auth, wrap(async (req, res) => {
    const result = await handleGetInferenceServerConfig();
    res.json(result);
  }));
  apiApp.post('/api/ai/inference/config', auth, wrap(async (req, res) => {
    const result = await handleSaveInferenceServerConfig(req.body);
    res.json(result);
  }));
  apiApp.post('/api/ai/inference/test-connection', auth, wrap(async (req, res) => {
    const result = await handleTestInferenceServerConnection();
    res.json(result);
  }));
  apiApp.post('/api/ai/inference/summary', auth, wrap(async (req, res) => {
    const result = await handleGetInferenceServerSummary(req.body);
    res.json(result);
  }));
  apiApp.get('/api/ai/inference/models', auth, wrap(async (req, res) => {
    const result = await handleGetAvailableModels();
    res.json(result);
  }));

  // Comments
  apiApp.post('/api/comments', auth, wrap(async (req, res) => {
    const result = await handleCreateComment(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/comments/:taskId', auth, wrap(async (req, res) => {
    const result = await handleGetComments(req.auth.userId, req.params.taskId);
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

  // GitHub Integration
  apiApp.get('/api/github/repos', auth, wrap(async (req, res) => {
    const { accessToken } = req.query;
    if (!accessToken) {
      return res.status(400).json({ error: 'GitHub access token required' });
    }
    const result = await handleGetGitHubRepos(accessToken);
    res.json(result);
  }));
  apiApp.post('/api/github/commit', auth, wrap(async (req, res) => {
    const { accessToken, ...commitData } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'GitHub access token required' });
    }
    const result = await handleCreateGitHubCommit(accessToken, commitData);
    res.json(result);
  }));
  apiApp.get('/api/github/repos/:owner/:repo/contents', auth, wrap(async (req, res) => {
    const { owner, repo } = req.params;
    const { path, branch, accessToken } = req.query;
    if (!accessToken) {
      return res.status(400).json({ error: 'GitHub access token required' });
    }
    const result = await handleGetGitHubRepoContents(accessToken, {
      repo: `${owner}/${repo}`,
      path: path || '',
      branch: branch || 'main'
    });
    res.json(result);
  }));
  apiApp.post('/api/github/repos/:owner/:repo/pull', auth, wrap(async (req, res) => {
    const { owner, repo } = req.params;
    const { branch, accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'GitHub access token required' });
    }
    const result = await handlePullGitHubRepo(accessToken, {
      repo: `${owner}/${repo}`,
      branch: branch || 'main'
    });
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
    const result = await handleGetSettings(req.auth.userId, category, userId);
    res.json(result);
  }));
  apiApp.post('/api/settings', auth, wrap(async (req, res) => {
    const result = await handleSaveSetting(req.auth.userId, req.body);
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
    const result = await handleGetAppointments(req.auth.userId, date);
    res.json(result);
  }));
  apiApp.post('/api/appointments', auth, wrap(async (req, res) => {
    const result = await handleCreateAppointment(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.put('/api/appointments/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateAppointment(req.auth.userId, req.params.id, req.body);
    res.json(result);
  }));
  apiApp.delete('/api/appointments/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteAppointment(req.auth.userId, req.params.id);
    res.json(result);
  }));

  // Organizations
  apiApp.post('/api/organizations', auth, wrap(async (req, res) => {
    const result = await handleCreateOrganization(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.post('/api/create-organization', auth, wrap(async (req, res) => {
    const result = await handleCreateOrganization(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/organizations', auth, wrap(async (req, res) => {
    const result = await handleGetOrganization(req.auth.userId);
    res.json(result);
  }));
  apiApp.put('/api/organizations', auth, wrap(async (req, res) => {
    const result = await handleUpdateOrganization(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.post('/api/update-organization', auth, wrap(async (req, res) => {
    const result = await handleUpdateOrganization(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/organizations/members', auth, wrap(async (req, res) => {
    const result = await handleGetOrganizationMembers(req.auth.userId);
    res.json(result);
  }));
  apiApp.post('/api/organizations/invite', auth, wrap(async (req, res) => {
    const result = await handleInviteUserToOrganization(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.delete('/api/organizations/members/:userId', auth, wrap(async (req, res) => {
    const result = await handleRemoveUserFromOrganization(req.auth.userId, req.params.userId);
    res.json(result);
  }));
  apiApp.put('/api/organizations/members/:userId/role', auth, wrap(async (req, res) => {
    const result = await handleUpdateUserRole(req.auth.userId, { ...req.body, userId: req.params.userId });
    res.json(result);
  }));
  apiApp.post('/api/invite-user-to-organization', auth, wrap(async (req, res) => {
    const result = await handleInviteUserToOrganization(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.post('/api/update-user-role', auth, wrap(async (req, res) => {
    const result = await handleUpdateUserRole(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.post('/api/remove-user-from-organization', auth, wrap(async (req, res) => {
    const result = await handleRemoveUserFromOrganization(req.auth.userId, req.body);
    res.json(result);
  }));

  // Meetings
  apiApp.post('/api/meetings', auth, wrap(async (req, res) => {
    const result = await handleCreateMeeting(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/meetings', auth, wrap(async (req, res) => {
    const { days } = req.query;
    const result = await handleGetMeetings(req.auth.userId, days);
    res.json(result);
  }));
  apiApp.post('/api/meetings/:meetingId/participants', auth, wrap(async (req, res) => {
    const result = await handleAddParticipant(req.params.meetingId, req.auth.userId);
    res.json(result);
  }));

  // Sprints
  apiApp.post('/api/sprints', auth, wrap(async (req, res) => {
    const result = await handleCreateSprint(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/sprints', auth, wrap(async (req, res) => {
    const { projectId } = req.query;
    const result = await handleGetSprints(req.auth.userId, projectId);
    res.json(result);
  }));
  apiApp.get('/api/sprints/active', auth, wrap(async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    const result = await handleGetActiveSprint(req.auth.userId, projectId);
    res.json(result);
  }));
  apiApp.put('/api/sprints/:id', auth, wrap(async (req, res) => {
    const result = await handleUpdateSprint(req.auth.userId, req.params.id, req.body);
    res.json(result);
  }));
  apiApp.delete('/api/sprints/:id', auth, wrap(async (req, res) => {
    const result = await handleDeleteSprint(req.auth.userId, req.params.id);
    res.json(result);
  }));

  // Time Tracking
  apiApp.post('/api/time-entries', auth, wrap(async (req, res) => {
    const result = await handleCreateTimeEntry(req.auth.userId, req.body);
    res.json(result);
  }));
  apiApp.get('/api/time-entries/task/:taskId', auth, wrap(async (req, res) => {
    const result = await handleGetTimeEntriesByTask(req.auth.userId, req.params.taskId);
    res.json(result);
  }));
  apiApp.get('/api/time-entries/user', auth, wrap(async (req, res) => {
    const result = await handleGetTimeEntriesByUser(req.auth.userId);
    res.json(result);
  }));
  apiApp.get('/api/time-entries/workload', auth, wrap(async (req, res) => {
    const { days } = req.query;
    const result = await handleGetUserWorkload(req.auth.userId, days || 7);
    res.json(result);
  }));
  apiApp.get('/api/time-entries/project/:projectId', auth, wrap(async (req, res) => {
    const result = await handleGetProjectTimeTracking(req.auth.userId, req.params.projectId);
    res.json(result);
  }));

  // Error handler
  apiApp.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  });
}

module.exports = registerApiRoutes;