// handlers/projectHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateProject(userId, projectData) {
  const db = await getDatabase();
  const result = db.run(
    `INSERT INTO projects (user_id, name, description, status, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      projectData.name,
      projectData.description,
      projectData.status || 'active',
      projectData.start_date,
      projectData.end_date
    ]
  );

  const newId = result.insertId;
  await saveDatabase();

  return { success: true, id: newId };
}

async function handleGetProjects(userId) {
  const db = await getDatabase();
  let hasCreatedAt = false;
  try {
    db.exec('SELECT created_at FROM projects LIMIT 1');
    hasCreatedAt = true;
  } catch (err) {
    hasCreatedAt = false;
  }

  const query = hasCreatedAt
    ? 'SELECT id, name, description, status, start_date, end_date, created_at FROM projects WHERE user_id = ?'
    : 'SELECT id, name, description, status, start_date, end_date FROM projects WHERE user_id = ?';

  const result = db.exec(query, [userId]);
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
  const { id, ...updates } = data;
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  values.push(id);
  values.push(userId);

  db.run(
    `UPDATE projects SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND user_id = ?`,
    [...values.slice(0, -2), new Date().toISOString(), id, userId]
  );
  await saveDatabase();
  return { success: true };
}

async function handleDeleteProject(userId, projectId) {
  const db = await getDatabase();
  db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
  await saveDatabase();
  return { success: true };
}

module.exports = {
  handleCreateProject,
  handleGetProjects,
  handleUpdateProject,
  handleDeleteProject
};