// handlers/commentHandlers.js
const { handleDbQuery } = require('./generalHandlers'); // Use the generic query handler

async function handleCreateComment(comment) {
  await handleDbQuery(`
    INSERT INTO comments (task_id, user_id, content, mentions)
    VALUES (?, ?, ?, ?)
  `, [
    comment.task_id,
    comment.user_id,
    comment.content,
    JSON.stringify(comment.mentions || [])
  ]);

  // Get the inserted comment
  const result = await handleDbQuery(`
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = last_insert_rowid()
  `, []);

  return result[0];
}

async function handleGetComments(taskId) {
  const result = await handleDbQuery(`
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE task_id = ?
    ORDER BY created_at ASC
  `, [taskId]);
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