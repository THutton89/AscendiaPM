// handlers/userHandlers.js
const { getDatabase } = require('../database');

async function handleGetUsers() {
  const db = await getDatabase();
  const result = db.exec('SELECT id, name, email FROM users');
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

module.exports = {
  handleGetUsers
};