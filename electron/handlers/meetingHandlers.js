// handlers/meetingHandlers.js
const { getDatabase, saveDatabase } = require('../database');

async function handleCreateMeeting(userId, meetingData) {
  console.log('handleCreateMeeting called with:', { userId, meetingData });

  const db = await getDatabase();

  // Insert the meeting
  const insertResult = db.run(
    `INSERT INTO meetings (
      title,
      description,
      start_time,
      end_time,
      location,
      meeting_link,
      organizer_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meetingData.title,
      meetingData.description || null,
      meetingData.start_time,
      meetingData.end_time,
      meetingData.location || null,
      meetingData.meeting_link || null,
      meetingData.organizer_id,
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

  const result = db.exec(
    `SELECT DISTINCT m.*, u.name as organizer_name
     FROM meetings m
     JOIN users u ON m.organizer_id = u.id
     JOIN meeting_participants mp ON m.id = mp.meeting_id
     WHERE mp.user_id = ?
       AND m.start_time BETWEEN datetime('now') AND datetime('now', ? || ' days')
     ORDER BY m.start_time ASC`,
    [userId, days]
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