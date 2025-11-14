// handlers/taskHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateTask(userId, task) {
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

  db.run(
    `INSERT INTO tasks (organization_id, project_id, sprint_id, title, description, status, priority, due_date, estimated_hours, actual_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      organizationId,
      task.project_id || task.projectId,
      task.sprint_id || null,
      task.title,
      task.description || '',
      task.status || 'todo',
      task.priority || 'medium',
      task.due_date || null,
      task.estimated_hours || 0,
      task.actual_hours || 0
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const lastId = result[0].values[0][0];
  await saveDatabase();
  return { success: true, id: lastId };
}

async function handleUpdateTask(data) {
  const db = await getDatabase();
  const { id, updates, userId } = data;

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

  values.push(id);

  // Build WHERE clause based on whether user has organization or not
  let whereClause, whereParams;
  if (organizationId) {
    whereClause = 'WHERE id = ? AND organization_id = ?';
    whereParams = [id, organizationId];
  } else {
    whereClause = 'WHERE id = ? AND organization_id IS NULL AND user_id = ?';
    whereParams = [id, userId];
  }

  db.run(
    `UPDATE tasks SET ${fields.join(', ')} ${whereClause}`,
    [...values.slice(0, -1), ...whereParams]
  );
  await saveDatabase();
  return { success: true };
}

async function handleGetTasks(projectId, userId) {
  const db = await getDatabase();

  // Get user's organization (can be NULL)
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  // Build WHERE clause based on whether user has organization or not
  let whereClause, params;
  if (organizationId) {
    whereClause = projectId
      ? 'WHERE project_id = ? AND organization_id = ?'
      : 'WHERE organization_id = ?';
    params = projectId ? [projectId, organizationId] : [organizationId];
  } else {
    whereClause = projectId
      ? 'WHERE project_id = ? AND organization_id IS NULL'
      : 'WHERE organization_id IS NULL';
    params = projectId ? [projectId] : [];
  }

  const query = `SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC`;
  const result = db.exec(query, params);

  const tasks = [];
  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const task = {};
      columns.forEach((col, i) => {
        task[col] = row[i];
      });
      tasks.push(task);
    });
  }

  return { success: true, tasks };
}

async function handleDeleteTask(id, userId) {
  const db = await getDatabase();

  // Get user's organization (can be NULL)
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  // Build WHERE clause based on whether user has organization or not
  let whereClause, whereParams;
  if (organizationId) {
    whereClause = 'WHERE id = ? AND organization_id = ?';
    whereParams = [id, organizationId];
  } else {
    whereClause = 'WHERE id = ? AND organization_id IS NULL';
    whereParams = [id];
  }

  db.run(`DELETE FROM tasks ${whereClause}`, whereParams);
  await saveDatabase();
  return { success: true };
}

module.exports = {
  handleCreateTask,
  handleUpdateTask,
  handleGetTasks,
  handleDeleteTask
};