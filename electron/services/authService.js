// services/authService.js
const { BrowserWindow } = require('electron');
const http = require('http');
const url = require('url');
const querystring = require('querystring');

const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  redirectUri: 'http://localhost:3001/oauth2callback', // Local HTTP server
  scopes: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
};

// Local HTTP server for OAuth callback
let callbackServer = null;
let authPromiseResolver = null;

function startCallbackServer() {
  if (callbackServer) return;

  callbackServer = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const query = querystring.parse(parsedUrl.query);

    if (parsedUrl.pathname === '/oauth2callback') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body>
            <h1>Authentication Successful!</h1>
            <p>You can close this window now.</p>
            <script>window.close();</script>
          </body>
        </html>
      `);

      if (authPromiseResolver) {
        authPromiseResolver(query);
        authPromiseResolver = null;
      }
    }
  });

  callbackServer.listen(3001, () => {
    console.log('OAuth callback server listening on port 3001');
  });
}

function stopCallbackServer() {
  if (callbackServer) {
    callbackServer.close();
    callbackServer = null;
  }
}

async function openAuthWindowAndGetTokens() {
  return new Promise((resolve, reject) => {
    startCallbackServer();

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleOAuthConfig.clientId)}&` +
      `redirect_uri=${encodeURIComponent(googleOAuthConfig.redirectUri)}&` +
      `scope=${encodeURIComponent(googleOAuthConfig.scopes.join(' '))}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=select_account`;

    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    authPromiseResolver = async (query) => {
      try {
        if (query.error) {
          reject(new Error(query.error));
          return;
        }

        if (query.code) {
          // Exchange authorization code for tokens
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: googleOAuthConfig.clientId,
              client_secret: googleOAuthConfig.clientSecret,
              code: query.code,
              grant_type: 'authorization_code',
              redirect_uri: googleOAuthConfig.redirectUri,
            }),
          });

          const tokens = await tokenResponse.json();

          if (tokens.error) {
            reject(new Error(tokens.error));
            return;
          }

          resolve({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in
          });
        }
      } catch (error) {
        reject(error);
      } finally {
        authWindow.close();
      }
    };

    authWindow.loadURL(authUrl);
    authWindow.show();

    // Timeout after 5 minutes
    setTimeout(() => {
      if (authPromiseResolver) {
        authWindow.close();
        reject(new Error('Authentication timeout'));
        authPromiseResolver = null;
      }
    }, 300000);
  });
}

const googleOAuth = {
  openAuthWindowAndGetTokens
};

module.exports = {
  googleOAuth,
  startCallbackServer,
  stopCallbackServer
};