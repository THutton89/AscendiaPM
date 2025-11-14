// handlers/authHandlers.js
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { getDatabase, saveDatabase } = require('../database');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handleSignup(data) {
  const db = await getDatabase();
  const { name, email, password, role } = data;

  // For testing/development, use a simple hash if bcrypt fails
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (bcryptError) {
    console.log('bcrypt not available, using simple hash for testing. Error:', bcryptError);
    try {
      // Simple hash for testing purposes only
      const crypto = require('crypto');
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      console.log('Simple hash created successfully');
    } catch (cryptoError) {
      console.log('Even crypto failed:', cryptoError);
      throw new Error('Password hashing failed: both bcrypt and crypto unavailable');
    }
  }

  console.log('Signup attempt for:', { name, email, role });

  try {
    // Check if email already exists
    const existingUser = db.exec('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    console.log('Existing user check result:', existingUser);
    if (existingUser.length > 0 && existingUser[0].values.length > 0) {
      console.log('Email already exists');
      throw new Error('Email already exists');
    }

    console.log('Inserting user...');
    try {
      // Insert new user (organization_id is NULL by default)
      db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
        name,
        email,
        hashedPassword,
        role || 'user',
      ]);
      console.log('User inserted successfully');
    } catch (insertError) {
      console.log('Insert failed:', insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // In sql.js, get the last insert ID using SELECT last_insert_rowid()
    const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
    console.log('Last insert ID result:', lastIdResult);

    if (!lastIdResult || lastIdResult.length === 0 || !lastIdResult[0].values || lastIdResult[0].values.length === 0) {
      console.log('Failed to get last insert ID');
      throw new Error('Failed to insert user');
    }

    const insertId = lastIdResult[0].values[0][0];
    console.log('Insert successful, ID:', insertId);

    console.log('Retrieving created user...');
    // Retrieve the created user
    const userResult = db.exec('SELECT id, name, email, role, organization_id FROM users WHERE email = ?', [email]);
    console.log('User retrieval result:', userResult);

    await saveDatabase();

    if (userResult.length > 0 && userResult[0].values.length > 0) {
      const row = userResult[0].values[0];
      console.log('User created successfully:', row);

      const user = {
        id: row[0],
        name: row[1],
        email: row[2],
        role: row[3],
        organizationId: row[4]
      };

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      return { user, token };
    }
    console.log('Could not retrieve created user');
    throw new Error('Could not retrieve created user');
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    throw new Error(`Could not create account: ${error.message}`);
  }
}

async function handleLogin(data) {
  const db = await getDatabase();
  const { email, password } = data;

  // Validate email format
  const emailValidation = await handleValidateEmail(email);
  if (!emailValidation.valid) {
    throw new Error(emailValidation.error);
  }

  try {
    const userResult = db.exec('SELECT id, name, email, password, role FROM users WHERE email = ?', [email]);
    if (!userResult[0] || userResult[0].values.length === 0) {
      throw new Error('Invalid credentials');
    }
    const userRow = userResult[0].values[0];
    let isValid;
    try {
      isValid = await bcrypt.compare(password, userRow[3]); // password is at index 3
    } catch (bcryptError) {
      console.log('bcrypt not available for comparison, using simple hash check');
      // For testing, check against simple hash
      const simpleHash = require('crypto').createHash('sha256').update(password).digest('hex');
      isValid = simpleHash === userRow[3];
    }

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const user = {
      id: userRow[0],
      name: userRow[1],
      email: userRow[2],
      role: userRow[4]
    };

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    return { user, token };
  } catch (error) {
    throw error;
  }
}

// Initialize Google OAuth client
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3069/api/auth/google/callback';

if (!googleClientId || !googleClientSecret) {
  console.error('Google OAuth credentials not set! Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
}

const oauth2Client = new OAuth2Client({
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  redirectUri: redirectUri
});

// Initialize GitHub OAuth
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const githubRedirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3069/api/auth/github/callback';

if (!githubClientId || !githubClientSecret) {
  console.warn('GitHub OAuth credentials not set. GitHub integration will not work.');
}

async function handleGoogleOAuthSignin() {
  try {
    console.log('Google OAuth client config:', {
      clientId: googleClientId ? '***' + googleClientId.slice(-10) : 'NOT SET',
      clientSecret: googleClientSecret ? '***SET***' : 'NOT SET',
      redirectUri: redirectUri
    });

    if (!googleClientId) {
      throw new Error('Google Client ID not configured');
    }

    // Generate the Google OAuth URL manually to avoid PKCE issues
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    console.log('Generated OAuth URL:', authorizationUrl);

    return {
      success: true,
      authUrl: authorizationUrl
    };
  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    return {
      success: false,
      error: `Failed to generate Google OAuth URL: ${error.message}`
    };
  }
}

async function handleGoogleOAuthCallback(code) {
  try {
    console.log('Exchanging code for tokens...');
    console.log('Code:', code);
    console.log('Client ID:', googleClientId);
    console.log('Redirect URI:', redirectUri);

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received:', { access_token: '***', refresh_token: tokens.refresh_token ? '***' : null });
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const userInfoResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    );

    const googleUser = userInfoResponse.data;

    // Check if user exists in database
    const db = await getDatabase();
    const existingUserResult = db.exec(
      'SELECT * FROM users WHERE google_id = ?',
      [googleUser.id]
    );

    let user;
    if (existingUserResult.length > 0 && existingUserResult[0].values.length > 0) {
      // User exists, update tokens
      const existingUser = existingUserResult[0].values[0];
      db.run(
        'UPDATE users SET access_token = ?, refresh_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [tokens.access_token, tokens.refresh_token || null, existingUser[0]]
      );

      user = {
        id: existingUser[0],
        name: existingUser[1],
        email: existingUser[2],
        role: existingUser[4],
        googleId: existingUser[5],
        avatarUrl: existingUser[6]
      };
    } else {
      // Create new user (organization_id is NULL by default)
      const insertResult = db.run(
        'INSERT INTO users (name, email, google_id, access_token, refresh_token, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
        [
          googleUser.name,
          googleUser.email,
          googleUser.id,
          tokens.access_token,
          tokens.refresh_token || null,
          googleUser.picture || null
        ]
      );

      const userId = insertResult.insertId || insertResult.lastID;

      user = {
        id: userId,
        name: googleUser.name,
        email: googleUser.email,
        role: 'user',
        googleId: googleUser.id,
        avatarUrl: googleUser.picture || null,
        organizationId: null
      };
    }

    await saveDatabase();

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    return {
      success: true,
      user: user,
      token: token
    };
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return {
      success: false,
      error: 'Failed to authenticate with Google'
    };
  }
}

async function handleGitHubOAuthSignin() {
  try {
    console.log('GitHub OAuth client config:', {
      clientId: githubClientId ? '***' + githubClientId.slice(-10) : 'NOT SET',
      clientSecret: githubClientSecret ? '***SET***' : 'NOT SET',
      redirectUri: githubRedirectUri
    });

    if (!githubClientId) {
      throw new Error('GitHub Client ID not configured');
    }

    const scopes = ['user:email', 'repo', 'read:user'].join(' ');

    const params = new URLSearchParams({
      client_id: githubClientId,
      redirect_uri: githubRedirectUri,
      scope: scopes,
      response_type: 'code',
      allow_signup: 'true'
    });

    const authorizationUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    console.log('Generated GitHub OAuth URL:', authorizationUrl);

    return {
      success: true,
      authUrl: authorizationUrl
    };
  } catch (error) {
    console.error('GitHub OAuth URL generation error:', error);
    return {
      success: false,
      error: `Failed to generate GitHub OAuth URL: ${error.message}`
    };
  }
}

async function handleGitHubOAuthCallback(code) {
  try {
    console.log('Exchanging GitHub code for tokens...');

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code: code,
        redirect_uri: githubRedirectUri
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const { access_token, token_type } = tokenResponse.data;

    if (!access_token) {
      throw new Error('No access token received from GitHub');
    }

    console.log('GitHub access token received');

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `${token_type} ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const githubUser = userResponse.data;

    // Get user emails
    const emailsResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `${token_type} ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const primaryEmail = emailsResponse.data.find(email => email.primary)?.email || githubUser.email;

    // Check if user exists in database
    const db = await getDatabase();
    const existingUserResult = db.exec(
      'SELECT * FROM users WHERE github_id = ?',
      [githubUser.id]
    );

    let user;
    if (existingUserResult.length > 0 && existingUserResult[0].values.length > 0) {
      // User exists, just update timestamp
      const existingUser = existingUserResult[0].values[0];
      db.run('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existingUser[0]]);

      user = {
        id: existingUser[0],
        name: existingUser[1],
        email: existingUser[2],
        role: existingUser[4],
        githubId: existingUser[5], // github_id column
        avatarUrl: existingUser[6] // avatar_url column
      };
    } else {
      // Create new user (organization_id is NULL by default)
      const insertResult = db.run(
        'INSERT INTO users (name, email, github_id, avatar_url) VALUES (?, ?, ?, ?)',
        [
          githubUser.name || githubUser.login,
          primaryEmail,
          githubUser.id,
          githubUser.avatar_url
        ]
      );

      const userId = insertResult.insertId || insertResult.lastID;

      user = {
        id: userId,
        name: githubUser.name || githubUser.login,
        email: primaryEmail,
        role: 'user',
        githubId: githubUser.id,
        avatarUrl: githubUser.avatar_url,
        organizationId: null
      };
    }

    await saveDatabase();

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    return {
      success: true,
      user: user,
      token: token
    };
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return {
      success: false,
      error: `Failed to authenticate with GitHub: ${error.message}`
    };
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function handleValidateEmail(email) {
  try {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }
    const isValidFormat = validateEmail(email);
    if (!isValidFormat) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function handleCheckEmailExists(email) {
  const db = await getDatabase();
  try {
    if (!email || typeof email !== 'string') {
      return { exists: false, error: 'Email is required' };
    }
    const result = db.exec('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    const exists = result.length > 0 && result[0].values.length > 0;
    return { exists };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function handleLogout(userId) {
  console.log(`User ${userId} logged out`);

  // Here you could add additional logout logic like:
  // - Invalidating user sessions
  // - Logging logout events
  // - Cleaning up temporary data
  // - Updating user last_logout timestamp

  try {
    const db = await getDatabase();
    // Update user's last logout time
    db.run('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
    await saveDatabase();

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Don't fail logout just because logging failed
    return { success: true };
  }
}

module.exports = {
  handleSignup,
  handleLogin,
  handleGoogleOAuthSignin,
  handleGoogleOAuthCallback,
  handleGitHubOAuthSignin,
  handleGitHubOAuthCallback,
  handleValidateEmail,
  handleCheckEmailExists,
  handleLogout
};