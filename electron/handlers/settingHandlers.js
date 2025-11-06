// settingHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleGetSettings(category, userId) {
  const db = await getDatabase();
  let query = "SELECT * FROM app_settings WHERE 1=1";
  const params = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  if (userId) {
    query += " AND user_id = ?";
    params.push(userId);
  }

  query += " ORDER BY category, key";

  const result = db.exec(query, params);
  return result[0] ? result[0].values.map(row => ({
    id: row[0],
    category: row[1],
    key: row[2],
    value: row[3],
    user_id: row[4],
    created_at: row[5],
    updated_at: row[6]
  })) : [];
}

async function handleSaveSetting(setting) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  db.run("INSERT INTO app_settings (category, key, value, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [
    setting.category,
    setting.key,
    JSON.stringify(setting.value),
    setting.user_id || null,
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