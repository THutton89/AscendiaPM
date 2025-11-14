// handlers/meetingHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateMeeting(userId, meetingData) {
  console.log('handleCreateMeeting called with:', { userId, meetingData });

  const db = await getDatabase();

  // Get user's organization to get default work hours
  const userResult = db.exec('SELECT organization_id FROM users WHERE id = ?', [userId]);
  if (!userResult[0] || userResult[0].values.length === 0) {
    throw new Error('User not found');
  }
  const organizationId = userResult[0].values[0][0];

  let startTime = meetingData.start_time;
  let endTime = meetingData.end_time;

  if (organizationId) {
    // Get organization work hours
    const orgResult = db.exec(
      'SELECT work_hours_start, work_hours_end FROM organizations WHERE id = ?',
      [organizationId]
    );
    if (orgResult[0] && orgResult[0].values.length > 0) {
      const workHoursStart = orgResult[0].values[0][0];
      const workHoursEnd = orgResult[0].values[0][1];

      // Use work hours as defaults if no specific times provided
      if (!startTime && workHoursStart) {
        // Assume meeting date is provided in some way, or use today's date
        const meetingDate = meetingData.date || new Date().toISOString().split('T')[0];
        startTime = `${meetingDate}T${workHoursStart}:00`;
      }
      if (!endTime && workHoursEnd) {
        const meetingDate = meetingData.date || new Date().toISOString().split('T')[0];
        endTime = `${meetingDate}T${workHoursEnd}:00`;
      }
    }
  }

  // Insert the meeting
  const insertResult = db.run(
    `INSERT INTO meetings (
      organization_id,
      title,
      description,
      start_time,
      end_time,
      location,
      meeting_link,
      organizer_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      organizationId,
      meetingData.title,
      meetingData.description || null,
      startTime,
      endTime,
      meetingData.location || null,
      meetingData.meeting_link || null,
      userId, // Use the actual userId as organizer_id
      meetingData.status || 'scheduled'
    ]
  );

  const meetingId = insertResult.insertId;
  console.log('Meeting inserted with ID:', meetingId);

  // Get the created meeting
  const selectResult = db.exec(
    `SELECT m.*, u.name as organizer_name
     FROM meetings m
     JOIN users u ON m.organizer_id = u.id
     WHERE m.id = ?`,
    [meetingId]
  );

  let meeting = null;
  if (selectResult.length > 0) {
    const { columns, values } = selectResult[0];
    const row = values[0];
    meeting = {};
    columns.forEach((col, i) => {
      meeting[col] = row[i];
    });
  }

  console.log('Retrieved meeting:', meeting);

  await saveDatabase();

  return { success: true, meeting };
}

async function handleGetMeetings(userId, days = 7) {
  console.log('handleGetMeetings called with:', { userId, days });

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
    whereClause = `WHERE m.organization_id = ?
       AND m.start_time BETWEEN datetime('now') AND datetime('now', ? || ' days')`;
    params = [organizationId, days];
  } else {
    // For users without organization, show meetings they organized or are participants in
    whereClause = `WHERE (m.organizer_id = ? OR mp.user_id = ?)
       AND m.organization_id IS NULL
       AND m.start_time BETWEEN datetime('now') AND datetime('now', ? || ' days')`;
    params = [userId, userId, days];
  }

  const result = db.exec(
    `SELECT DISTINCT m.*, u.name as organizer_name
     FROM meetings m
     JOIN users u ON m.organizer_id = u.id
     LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
     ${whereClause}
     ORDER BY m.start_time ASC`,
    params
  );

  const meetings = [];
  if (result.length > 0) {
    const { columns, values } = result[0];
    values.forEach(row => {
      const meeting = {};
      columns.forEach((col, i) => {
        meeting[col] = row[i];
      });
      meetings.push(meeting);
    });
  }

  console.log('Retrieved meetings:', meetings);

  return { success: true, meetings };
}

async function handleAddParticipant(meetingId, userId) {
  console.log('handleAddParticipant called with:', { meetingId, userId });

  const db = await getDatabase();

  db.run(
    `INSERT OR IGNORE INTO meeting_participants (meeting_id, user_id)
     VALUES (?, ?)`,
    [meetingId, userId]
  );

  await saveDatabase();

  console.log('Participant added successfully');

  return { success: true };
}

module.exports = {
  handleCreateMeeting,
  handleGetMeetings,
  handleAddParticipant
};