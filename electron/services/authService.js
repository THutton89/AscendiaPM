// services/authService.js
const ElectronGoogleOAuth2 = require('electron-google-oauth2').default;

const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
};

let googleOAuth;
try {
  console.log('Initializing Google OAuth...');
  googleOAuth = new ElectronGoogleOAuth2(
    googleOAuthConfig.clientId,
    googleOAuthConfig.clientSecret,
    googleOAuthConfig.scopes,
    { successRedirectURL: googleOAuthConfig.redirectUri }
  );
  console.log('Google OAuth initialized successfully');
} catch (error) {
  console.error('Failed to initialize Google OAuth:', error);
}

module.exports = {
  googleOAuth
};