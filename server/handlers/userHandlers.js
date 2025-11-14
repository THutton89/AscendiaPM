// handlers/userHandlers.js
const { getDatabase, saveDatabase } = require('../database');
const bcrypt = require('bcrypt');

async function handleGetUsers() {
  const db = await getDatabase();
  const result = db.exec('SELECT id, name, email, role, organization_id, created_at FROM users');
  if (result.length === 0) {
    return { success: true, data: [] };
  }
  const { columns, values } = result[0];
  const users = values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
  return { success: true, data: users };
}

async function handleGetUser(userId) {
  const db = await getDatabase();
  const result = db.exec('SELECT id, name, email, role, organization_id, created_at FROM users WHERE id = ?', [userId]);
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('User not found');
  }
  const { columns, values } = result[0];
  const user = {};
  columns.forEach((col, i) => {
    user[col] = values[0][i];
  });
  return { success: true, data: user };
}

async function handleCreateUser(userData) {
  const db = await getDatabase();
  const { name, email, password, role, organization_id } = userData;

  // Check if email already exists
  const existingUser = db.exec('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existingUser.length > 0 && existingUser[0].values.length > 0) {
    throw new Error('Email already exists');
  }

  // Hash password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (bcryptError) {
    console.log('bcrypt not available, using simple hash for testing');
    const crypto = require('crypto');
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  }

  db.run(
    'INSERT INTO users (name, email, password, role, organization_id) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashedPassword, role || 'member', organization_id]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const newId = result[0].values[0][0];
  await saveDatabase();

  return { success: true, data: { id: newId, name, email, role: role || 'member' } };
}

async function handleUpdateUser(userId, updates) {
  const db = await getDatabase();
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'password') {
      // Hash password if updating
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(value, 10);
      } catch (bcryptError) {
        const crypto = require('crypto');
        hashedPassword = crypto.createHash('sha256').update(value).digest('hex');
      }
      fields.push('password = ?');
      values.push(hashedPassword);
    } else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  values.push(userId);
  db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  await saveDatabase();

  return { success: true };
}

async function handleDeleteUser(userId) {
  const db = await getDatabase();
  db.run('DELETE FROM users WHERE id = ?', [userId]);
  await saveDatabase();
  return { success: true };
}

module.exports = {
  handleGetUsers,
  handleGetUser,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser
};