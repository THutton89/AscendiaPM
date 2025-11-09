// handlers/projectHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateProject(userId, projectData) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  db.run(
    `INSERT INTO projects (organization_id, user_id, name, description, status, start_date, end_date, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      organizationId,
      userId,
      projectData.name,
      projectData.description || null,
      projectData.status || 'active',
      projectData.start_date || null,
      projectData.end_date || null,
      projectData.color || '#2196F3'
    ]
  );

  // Get the last insert ID using sql.js method
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const newId = lastIdResult[0].values[0][0];

  await saveDatabase();

  return { success: true, id: newId };
}

async function handleGetProjects(userId) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  let hasCreatedAt = false;
  try {
    db.exec('SELECT created_at FROM projects LIMIT 1');
    hasCreatedAt = true;
  } catch (err) {
    hasCreatedAt = false;
  }

  const query = hasCreatedAt
    ? 'SELECT id, name, description, status, start_date, end_date, created_at FROM projects WHERE organization_id = ?'
    : 'SELECT id, name, description, status, start_date, end_date FROM projects WHERE organization_id = ?';

  const result = db.exec(query, [organizationId]);
  const projects = [];
  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const project = {};
      columns.forEach((col, i) => {
        project[col] = row[i];
      });
      if (!hasCreatedAt) {
        project.created_at = new Date().toISOString();
      }
      projects.push(project);
    });
  }

  return { success: true, projects };
}

async function handleUpdateProject(userId, data) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  const { id, ...updates } = data;
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  values.push(id);
  values.push(organizationId);

  db.run(
    `UPDATE projects SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND organization_id = ?`,
    [...values.slice(0, -2), new Date().toISOString(), id, organizationId]
  );
  await saveDatabase();
  return { success: true };
}

async function handleDeleteProject(userId, projectId) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  db.run('DELETE FROM projects WHERE id = ? AND organization_id = ?', [projectId, organizationId]);
  await saveDatabase();
  return { success: true };
}

module.exports = {
  handleCreateProject,
  handleGetProjects,
  handleUpdateProject,
  handleDeleteProject
};