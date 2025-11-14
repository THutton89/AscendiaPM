// handlers/commentHandlers.js
const { handleDbQuery } = require('./generalHandlers'); // Use the generic query handler
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateComment(userId, comment) {
  const db = await getDatabase();

  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || !userResult[0].values || userResult[0].values.length === 0) {
    throw new Error('Authenticated user not found or not in an organization.');
  }
  const organizationId = userResult[0].values[0][0];

  if (!organizationId) {
    throw new Error('User is not associated with an organization.');
  }

  db.run(
    `INSERT INTO comments (organization_id, task_id, user_id, content, mentions)
     VALUES (?, ?, ?, ?, ?)`,
    [
      organizationId,
      comment.taskId,
      comment.userId,
      comment.content,
      JSON.stringify(comment.mentions || [])
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const lastId = result[0].values[0][0];
  await saveDatabase();

  // Get the inserted comment
  const newCommentResult = await handleDbQuery(`
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `, [lastId]);

  return newCommentResult[0];
}

async function handleGetComments(userId, taskId) {
  const db = await getDatabase();
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || !userResult[0].values || userResult[0].values.length === 0) {
      throw new Error('Authenticated user not found or not in an organization.');
  }
  const organizationId = userResult[0].values[0][0];

  const result = await handleDbQuery(`
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ? AND c.organization_id = ?
    ORDER BY c.created_at ASC
  `, [taskId, organizationId]);
  return result.map((c) => ({
    ...c,
    mentions: JSON.parse(c.mentions || '[]')
  }));
}

async function handleDeleteComment(id) {
  await handleDbQuery('DELETE FROM comments WHERE id = ?', [id]);
  return { success: true };
}

module.exports = {
  handleCreateComment,
  handleGetComments,
  handleDeleteComment
};