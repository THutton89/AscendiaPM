// handlers/authHandlers.js
const bcrypt = require('bcrypt');
const axios = require('axios');
const { getDatabase, saveDatabase } = require('../database');
const { googleOAuth } = require('../services/authService');

async function handleSignup(data) {
  const db = await getDatabase();
  const { name, email, password, role } = data;
  const hashedPassword = await bcrypt.hash(password, 10);

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
    // Insert new user
    db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      name,
      email,
      hashedPassword,
      role,
    ]);

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
    const userResult = db.exec('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    console.log('User retrieval result:', userResult);

    await saveDatabase();

    if (userResult.length > 0 && userResult[0].values.length > 0) {
      const row = userResult[0].values[0];
      console.log('User created successfully:', row);
      return {
        id: row[0],
        name: row[1],
        email: row[2],
        role: row[3]
      };
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
    const isValid = await bcrypt.compare(password, userRow[3]); // password is at index 3
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const user = {
      id: userRow[0],
      name: userRow[1],
      email: userRow[2],
      role: userRow[4]
    };

    return { user };
  } catch (error) {
    throw error;
  }
}

async function handleGoogleOAuthSignin() {
  const db = await getDatabase();
  try {
    if (!googleOAuth) {
      throw new Error('Google OAuth not initialized. Please check your configuration.');
    }

    const result = await googleOAuth.openAuthWindowAndGetTokens();

    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${result.access_token}`
      }
    });

    const profile = profileResponse.data;
    console.log('Google OAuth profile:', profile);
    console.log('Checking for existing user with google_id:', profile.id);
    const dbResult = db.exec('SELECT id, name, email, google_id, avatar_url, auth_provider, role FROM users WHERE google_id = ?', [profile.id]);
    let existingUser = null;
    if (dbResult.length > 0 && dbResult[0].values.length > 0) {
      const row = dbResult[0].values[0];
      existingUser = {
        id: row[0],
        name: row[1],
        email: row[2],
        google_id: row[3],
        avatar_url: row[4],
        auth_provider: row[5],
        role: row[6]
      };
      console.log('Existing user found:', existingUser);
    } else {
      console.log('No existing user found');
    }

    let user;
    if (existingUser) {
      db.run(
        `UPDATE users SET google_access_token = ?, google_refresh_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [result.access_token, result.refresh_token || null, existingUser.id]
      );
      user = existingUser;
    } else {
      const nameValue = profile.name || profile.email || 'Unknown';
      console.log('Inserting user with name:', nameValue, 'email:', profile.email);
      db.run(`
        INSERT INTO users (
          name, email, google_id, google_access_token, google_refresh_token,
          avatar_url, auth_provider, role, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'google', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        nameValue,
        profile.email,
        profile.id,
        result.access_token,
        result.refresh_token || null,
        profile.picture || null
      ]);

      const insertResult = db.exec('SELECT last_insert_rowid() as id');
      const newId = insertResult[0].values[0][0];

      user = {
        id: newId,
        name: profile.name,
        email: profile.email,
        google_id: profile.id,
        avatar_url: profile.picture,
        auth_provider: 'google',
        role: 'user'
      };
    }

    await saveDatabase();
    return { success: true, user };

  } catch (error) {
    return { success: false, error: error.message };
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
  handleValidateEmail,
  handleCheckEmailExists,
  handleLogout
};