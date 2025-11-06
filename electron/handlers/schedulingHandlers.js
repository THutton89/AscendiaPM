// handlers/schedulingHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleGetAppointments(date) {
  const db = await getDatabase();
  try {
    const appointments = [];
    const query = date
      ? `SELECT a.*, p.name as project_name, p.color as project_color, u.name as user_name
         FROM appointments a
         LEFT JOIN projects p ON a.project_id = p.id
         LEFT JOIN users u ON a.assigned_user_id = u.id
         WHERE date(a.start_date) = ?`
      : `SELECT a.*, p.name as project_name, p.color as project_color, u.name as user_name
         FROM appointments a
         LEFT JOIN projects p ON a.project_id = p.id
         LEFT JOIN users u ON a.assigned_user_id = u.id`;

    const params = date ? [date] : [];
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

async function handleCreateAppointment(appointmentData) {
  const db = await getDatabase();
  try {
    const result = db.run(
      `INSERT INTO appointments (title, start_date, end_date, assigned_user_id, project_id, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        appointmentData.title,
        appointmentData.startDate,
        appointmentData.endDate,
        appointmentData.assignedUserId,
        appointmentData.projectId || null,
        appointmentData.notes || ''
      ]
    );

    await saveDatabase();
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message };
  }
}

async function handleUpdateAppointment(id, updates) {
  const db = await getDatabase();
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
    values.push(id);

    db.run(
      `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    await saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { success: false, error: error.message };
  }
}

async function handleDeleteAppointment(id) {
  const db = await getDatabase();
  try {
    db.run('DELETE FROM appointments WHERE id = ?', [id]);
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