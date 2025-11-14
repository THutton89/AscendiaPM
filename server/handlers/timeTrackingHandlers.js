// handlers/timeTrackingHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateTimeEntry(userId, entryData) {
  const db = await getDatabase();

  db.run(
    `INSERT INTO time_entries (task_id, user_id, hours_spent, date, description)
     VALUES (?, ?, ?, ?, ?)`,
    [entryData.task_id, userId, entryData.hours_spent, entryData.date, entryData.description || null]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const newId = result[0].values[0][0];

  // Get the created entry with user info
  const entryResult = db.exec(
    `SELECT te.*, u.name as user_name
     FROM time_entries te
     JOIN users u ON te.user_id = u.id
     WHERE te.id = ?`,
    [newId]
  );

  if (entryResult.length > 0 && entryResult[0].values.length > 0) {
    const { columns, values } = entryResult[0];
    const entry = {};
    columns.forEach((col, i) => {
      entry[col] = values[0][i];
    });
    return { success: true, data: entry };
  }

  return { success: true, data: { id: newId } };
}

async function handleGetTimeEntriesByTask(userId, taskId) {
  const db = await getDatabase();

  const result = db.exec(
    `SELECT te.*, u.name as user_name
     FROM time_entries te
     JOIN users u ON te.user_id = u.id
     WHERE te.task_id = ?
     ORDER BY te.date DESC`,
    [taskId]
  );

  const entries = [];
  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const entry = {};
      columns.forEach((col, i) => {
        entry[col] = row[i];
      });
      entries.push(entry);
    });
  }

  return { success: true, data: entries };
}

async function handleGetTimeEntriesByUser(userId) {
  const db = await getDatabase();

  const result = db.exec(
    `SELECT te.*, t.title as task_title
     FROM time_entries te
     JOIN tasks t ON te.task_id = t.id
     WHERE te.user_id = ?
     ORDER BY te.date DESC`,
    [userId]
  );

  const entries = [];
  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const entry = {};
      columns.forEach((col, i) => {
        entry[col] = row[i];
      });
      entries.push(entry);
    });
  }

  return { success: true, data: entries };
}

async function handleGetUserWorkload(userId, days = 7) {
  const db = await getDatabase();

  const result = db.exec(
    `SELECT
       SUM(hours_spent) as total_hours,
       date
     FROM time_entries
     WHERE user_id = ?
       AND date BETWEEN datetime('now', '-' || ? || ' days') AND datetime('now')
     GROUP BY date
     ORDER BY date DESC`,
    [userId, days]
  );

  const workload = [];
  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const entry = {};
      columns.forEach((col, i) => {
        entry[col] = row[i];
      });
      workload.push(entry);
    });
  }

  return { success: true, data: workload };
}

async function handleGetProjectTimeTracking(userId, projectId) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  const result = db.exec(
    `SELECT
       t.id as task_id,
       t.title as task_title,
       t.estimated_hours,
       SUM(te.hours_spent) as actual_hours
     FROM tasks t
     LEFT JOIN time_entries te ON t.id = te.task_id
     WHERE t.project_id = ? AND t.organization_id = ?
     GROUP BY t.id`,
    [projectId, organizationId]
  );

  const tracking = [];
  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const entry = {};
      columns.forEach((col, i) => {
        entry[col] = row[i];
      });
      tracking.push(entry);
    });
  }

  return { success: true, data: tracking };
}

module.exports = {
  handleCreateTimeEntry,
  handleGetTimeEntriesByTask,
  handleGetTimeEntriesByUser,
  handleGetUserWorkload,
  handleGetProjectTimeTracking
};