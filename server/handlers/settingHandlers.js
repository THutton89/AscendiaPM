// settingHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleGetSettings(userId, category, specificUserId) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];
  if (!organizationId) {
    throw new Error('User is not part of any organization');
  }

  let query = "SELECT * FROM app_settings WHERE organization_id = ?";
  const params = [organizationId];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  if (specificUserId) {
    query += " AND user_id = ?";
    params.push(specificUserId);
  }

  query += " ORDER BY category, key";

  const result = db.exec(query, params);
  return result[0] ? result[0].values.map(row => ({
    id: row[0],
    category: row[2],
    key: row[3],
    value: JSON.parse(row[4]),
    user_id: row[5],
    created_at: row[6],
    updated_at: row[7]
  })) : [];
}

async function handleSaveSetting(userId, setting) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Get user's organization
  let organizationId = null;
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (userResult[0] && userResult[0].values.length > 0) {
    organizationId = userResult[0].values[0][0];
  }

  db.run("INSERT INTO app_settings (organization_id, category, key, value, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    organizationId,
    setting.category,
    setting.key,
    JSON.stringify(setting.value),
    userId,
    now,
    now
  ]);

  return { id: db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] };
}

async function handleUpdateSetting(id, setting) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  db.run("UPDATE app_settings SET value = ?, updated_at = ? WHERE id = ?", [
    JSON.stringify(setting.value),
    now,
    id
  ]);

  return { success: true };
}

async function handleDeleteSetting(id) {
  const db = await getDatabase();
  db.run("DELETE FROM app_settings WHERE id = ?", [id]);
  return { success: true };
}

module.exports = {
  handleGetSettings,
  handleSaveSetting,
  handleUpdateSetting,
  handleDeleteSetting
};