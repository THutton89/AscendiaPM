import { Meeting, MeetingParticipant, MeetingNote, MeetingRecording } from '../types';
import { api } from '../utils/api';

export const meetingsDb = {
  create: async (meeting: Omit<Meeting, 'id' | 'created_at'>) => {
    // Insert the meeting
    const insertResult = await api('db-query', {
      query: `
        INSERT INTO meetings (
          title,
          description,
          start_time,
          end_time,
          location,
          meeting_link,
          organizer_id,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        meeting.title,
        meeting.description || null,
        meeting.start_time,
        meeting.end_time,
        meeting.location || null,
        meeting.meeting_link || null,
        meeting.organizer_id,
        meeting.status
      ]
    });

    const meetingId = insertResult[0]?.insertId;
    console.log('Meeting inserted with ID:', meetingId);

    // Get the inserted meeting
    const result = await api('db-query', {
      query: `
        SELECT m.*, u.name as organizer_name
        FROM meetings m
        JOIN users u ON m.organizer_id = u.id
        WHERE m.id = ?
      `,
      params: [meetingId]
    });

    console.log('Retrieved meeting:', result[0]);
    return result[0];
  },

  getById: async (id: number): Promise<Meeting> => {
    const result = await api('db-query', {
      query: `
        SELECT m.*, u.name as organizer_name
        FROM meetings m
        JOIN users u ON m.organizer_id = u.id
        WHERE m.id = ?
      `,
      params: [id]
    });
    return result[0];
  },

  getByProject: async (projectId: number): Promise<Meeting[]> => {
    const result = await api('db-query', {
      query: `
        SELECT m.*, u.name as organizer_name
        FROM meetings m
        JOIN users u ON m.organizer_id = u.id
        WHERE m.project_id = ?
        ORDER BY m.start_time DESC
      `,
      params: [projectId]
    });
    return result;
  },

  getUpcoming: async (userId: number, days = 7): Promise<Meeting[]> => {
    const result = await api('get-meetings', { days });
    return result || [];
  },

  addParticipant: async (meetingId: number, userId: number) => {
    await api('db-query', {
      query: `
        INSERT OR IGNORE INTO meeting_participants (meeting_id, user_id)
        VALUES (?, ?)
      `,
      params: [meetingId, userId]
    });
  },

  updateParticipantStatus: async (meetingId: number, userId: number, status: string) => {
    await api('db-query', {
      query: `
        UPDATE meeting_participants
        SET status = ?
        WHERE meeting_id = ? AND user_id = ?
      `,
      params: [status, meetingId, userId]
    });
  },

  addNote: async (note: Omit<MeetingNote, 'id' | 'created_at'>) => {
    const result = await api('db-query', {
      query: `
        INSERT INTO meeting_notes (meeting_id, user_id, content)
        VALUES (?, ?, ?)
        RETURNING *
      `,
      params: [note.meeting_id, note.user_id, note.content]
    });
    return result[0];
  },

  getNotes: async (meetingId: number): Promise<MeetingNote[]> => {
    const result = await api('db-query', {
      query: `
        SELECT mn.*, u.name as user_name
        FROM meeting_notes mn
        JOIN users u ON mn.user_id = u.id
        WHERE mn.meeting_id = ?
        ORDER BY mn.created_at DESC
      `,
      params: [meetingId]
    });
    return result;
  },

  getAttendees: async (meetingId: number): Promise<MeetingParticipant[]> => {
    const result = await api('db-query', {
      query: `
        SELECT mp.*, u.name as user_name
        FROM meeting_participants mp
        JOIN users u ON mp.user_id = u.id
        WHERE mp.meeting_id = ?
      `,
      params: [meetingId]
    });
    return result;
  },

  delete: async (id: number) => {
    await api('db-query', {
      query: `
        DELETE FROM meetings
        WHERE id = ?
      `,
      params: [id]
    });
  },

  // Recording and transcription functions
  startRecording: async (meetingId: number) => {
    await api('db-query', {
      query: `
        INSERT INTO meeting_recordings (meeting_id, status)
        VALUES (?, 'recording')
      `,
      params: [meetingId]
    });

    const result = await api('db-query', {
      query: `
        SELECT id FROM meeting_recordings WHERE meeting_id = ? AND status = 'recording' ORDER BY created_at DESC LIMIT 1
      `,
      params: [meetingId]
    });
    return result[0];
  },

  stopRecording: async (recordingId: number, recordingUrl?: string, duration?: number) => {
    await api('db-query', {
      query: `
        UPDATE meeting_recordings
        SET status = 'completed', recording_url = ?, duration = ?
        WHERE id = ?
      `,
      params: [recordingUrl || null, duration || null, recordingId]
    });
  },

  saveTranscript: async (recordingId: number, transcript: string) => {
    await api('db-query', {
      query: `
        UPDATE meeting_recordings
        SET transcript = ?
        WHERE id = ?
      `,
      params: [transcript, recordingId]
    });
  },

  getRecordings: async (meetingId: number): Promise<MeetingRecording[]> => {
    const result = await api('db-query', {
      query: `
        SELECT * FROM meeting_recordings
        WHERE meeting_id = ?
        ORDER BY created_at DESC
      `,
      params: [meetingId]
    });
    return result;
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    // This would integrate with a transcription service like OpenAI Whisper
    // For now, return a placeholder
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("This is a placeholder transcript. In a real implementation, this would be generated by a speech-to-text service like OpenAI Whisper or Google Speech-to-Text.");
      }, 2000);
    });
  }
};