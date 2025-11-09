// handlers/schedulingHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleGetAppointments(userId, date) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  try {
    const appointments = [];
    const query = date
      ? `SELECT a.*, p.name as project_name, p.color as project_color, u.name as user_name
         FROM appointments a
         LEFT JOIN projects p ON a.project_id = p.id
         LEFT JOIN users u ON a.assigned_user_id = u.id
         WHERE a.organization_id = ? AND date(a.start_date) = ?`
      : `SELECT a.*, p.name as project_name, p.color as project_color, u.name as user_name
         FROM appointments a
         LEFT JOIN projects p ON a.project_id = p.id
         LEFT JOIN users u ON a.assigned_user_id = u.id
         WHERE a.organization_id = ?`;

    const params = date ? [organizationId, date] : [organizationId];
    const result = db.exec(query, params);

    if (result.length > 0) {
      const { columns, values } = result[0];
      values.forEach(row => {
        const appointment = {};
        columns.forEach((col, i) => {
          appointment[col] = row[i];
        });
        appointments.push({
          ...appointment,
          startDate: new Date(appointment.start_date),
          endDate: new Date(appointment.end_date)
        });
      });
    }

    return { success: true, appointments };
  } catch (error) {
    console.error('Error getting appointments:', error);
    return { success: false, error: error.message };
  }
}

async function handleCreateAppointment(userId, appointmentData) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  try {
    db.run(
      `INSERT INTO appointments (organization_id, title, start_date, end_date, assigned_user_id, project_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationId,
        appointmentData.title,
        appointmentData.startDate,
        appointmentData.endDate,
        appointmentData.assignedUserId || userId,
        appointmentData.projectId || null,
        appointmentData.notes || ''
      ]
    );

    const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = lastIdResult[0].values[0][0];

    await saveDatabase();
    return { success: true, id: newId };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message };
  }
}

async function handleUpdateAppointment(userId, appointmentId, updates) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  try {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'startDate') fields.push('start_date = ?');
      else if (key === 'endDate') fields.push('end_date = ?');
      else if (key === 'assignedUserId') fields.push('assigned_user_id = ?');
      else if (key === 'projectId') fields.push('project_id = ?');
      else fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(appointmentId);
    values.push(organizationId);

    db.run(
      `UPDATE appointments SET ${fields.join(', ')} WHERE id = ? AND organization_id = ?`,
      values
    );
    await saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { success: false, error: error.message };
  }
}

async function handleDeleteAppointment(userId, appointmentId) {
  const db = await getDatabase();

  // Get user's organization
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  try {
    db.run('DELETE FROM appointments WHERE id = ? AND organization_id = ?', [appointmentId, organizationId]);
    await saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  handleGetAppointments,
  handleCreateAppointment,
  handleUpdateAppointment,
  handleDeleteAppointment
};