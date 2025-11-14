// handlers/sprintHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateSprint(userId, sprintData) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  db.run(
    `INSERT INTO sprints (
      name,
      description,
      project_id,
      organization_id,
      start_date,
      end_date,
      status,
      goal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sprintData.name,
      sprintData.description || null,
      sprintData.project_id,
      organizationId,
      sprintData.start_date,
      sprintData.end_date,
      sprintData.status || 'planned',
      sprintData.goal || null
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const newId = result[0].values[0][0];
  await saveDatabase();

  return { success: true, data: { id: newId, ...sprintData } };
}

async function handleGetSprints(userId, projectId = null) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  let query = 'SELECT * FROM sprints WHERE organization_id = ?';
  let params = [organizationId];

  if (projectId) {
    query += ' AND project_id = ?';
    params.push(projectId);
  }

  query += ' ORDER BY start_date DESC';

  const result = db.exec(query, params);
  const sprints = [];

  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const sprint = {};
      columns.forEach((col, i) => {
        sprint[col] = row[i];
      });
      sprints.push(sprint);
    });
  }

  return { success: true, data: sprints };
}

async function handleGetActiveSprint(userId, projectId) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  const result = db.exec(
    `SELECT * FROM sprints
     WHERE organization_id = ?
       AND project_id = ?
       AND status = 'active'
       AND start_date <= date('now')
       AND end_date >= date('now')
     ORDER BY start_date DESC
     LIMIT 1`,
    [organizationId, projectId]
  );

  if (result.length > 0 && result[0].values.length > 0) {
    const { columns, values } = result[0];
    const sprint = {};
    columns.forEach((col, i) => {
      sprint[col] = values[0][i];
    });
    return { success: true, data: sprint };
  }

  return { success: true, data: null };
}

async function handleUpdateSprint(userId, sprintId, updates) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  values.push(sprintId);
  values.push(organizationId);

  db.run(
    `UPDATE sprints SET ${fields.join(', ')} WHERE id = ? AND organization_id = ?`,
    values
  );

  await saveDatabase();
  return { success: true };
}

async function handleDeleteSprint(userId, sprintId) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  db.run('DELETE FROM sprints WHERE id = ? AND organization_id = ?', [sprintId, organizationId]);
  await saveDatabase();
  return { success: true };
}

module.exports = {
  handleCreateSprint,
  handleGetSprints,
  handleGetActiveSprint,
  handleUpdateSprint,
  handleDeleteSprint
};