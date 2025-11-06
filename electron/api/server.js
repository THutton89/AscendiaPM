// api/server.js
const express = require('express');
const cors = require('cors');
const { getDatabase, saveDatabase } = require('../database');
const registerApiRoutes = require('./routes');

const apiApp = express();
const apiPort = process.env.API_PORT || 3069;
let apiServer;

apiApp.use(cors());
apiApp.use(express.json());

// Authentication Middleware
async function authenticateRequest(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket?.remoteAddress || 'unknown';

  if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
    return next();
  }
  if (clientIP.startsWith('192.168.') ||
      clientIP.startsWith('10.') ||
      (clientIP.startsWith('172.') && parseInt(clientIP.split('.')[1]) >= 16 && parseInt(clientIP.split('.')[1]) <= 31)) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!apiKey) {
    return res.status(401).json({
      error: 'Access denied. Must be on local network or provide valid API key.',
      clientIP: clientIP
    });
  }

  const auth = await isValidApiKey(apiKey);
  if (!auth) {
    return res.status(403).json({
      error: 'Invalid API key',
      clientIP: clientIP
    });
  }

  // Add authenticated user info to the request
  req.auth = auth;
  next();
}

async function isValidApiKey(apiKey) {
  try {
    // Allow test API key for development
    if (apiKey === 'test-api-key-123') {
      return {
        apiKeyId: 1,
        userId: 1,
        active: 1
      };
    }

    const db = await getDatabase();
    const result = db.exec('SELECT id, user_id FROM api_keys WHERE key = ? AND active = 1', [apiKey]);
    if (result[0] && result[0].values.length > 0) {
      const row = result[0].values[0];
      const apiKeyId = row[0];
      const userId = row[1] || 1; // Default to user 1 if no user_id

      // Update last_used_at
      db.run('UPDATE api_keys SET last_used_at = ? WHERE id = ?', [
        new Date().toISOString(),
        apiKeyId
      ]);
      await saveDatabase();

      return {
        apiKeyId,
        userId,
        active: 1
      };
    }
    return null;
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

// Register all routes
registerApiRoutes(apiApp, authenticateRequest);

// Server start/stop functions
function startAPIServer() {
  apiServer = apiApp.listen(apiPort, () => {
    console.log(`Ascendia PM API server running on port ${apiPort}`);
  });
}

function stopAPIServer() {
  if (apiServer) {
    apiServer.close();
    console.log('API server stopped');
  }
}

module.exports = {
  startAPIServer,
  stopAPIServer
};