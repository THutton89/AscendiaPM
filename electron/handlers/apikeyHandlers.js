// handlers/apiKeyHandlers.js
const { getDatabase, saveDatabase } = require('../database');
const crypto = require('crypto');

async function handleCreateApiKey({ name, userId }) {
  const db = await getDatabase();
  const apiKey = crypto.randomBytes(32).toString('hex');

  db.run("INSERT INTO api_keys (key, name, user_id) VALUES (?, ?, ?)", [
    apiKey,
    name,
    userId
  ]);
  await saveDatabase();
  return {
    id: db.exec("SELECT last_insert_rowid() as id")[0].values[0][0],
    key: apiKey,
    name,
    userId
  };
}

async function handleGetApiKeys(userId) {
  const db = await getDatabase();
  let query = "SELECT id, key, name, user_id, active, created_at, last_used_at FROM api_keys WHERE 1=1";
  const params = [];

  if (userId) {
    query += " AND user_id = ?";
    params.push(userId);
  }
  query += " ORDER BY created_at DESC";

  const result = db.exec(query, params);
  return result[0] ? result[0].values.map(row => ({
    id: row[0],
    key: row[1],
    name: row[2],
    user_id: row[3],
    active: row[4],
    created_at: row[5],
    last_used_at: row[6]
  })) : [];
}

async function handleDeleteApiKey(id) {
  const db = await getDatabase();
  db.run("DELETE FROM api_keys WHERE id = ?", [id]);
  await saveDatabase();
  return { success: true };
}

module.exports = {
  handleCreateApiKey,
  handleGetApiKeys,
  handleDeleteApiKey
};
