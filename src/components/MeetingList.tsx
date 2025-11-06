import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { meetingsDb } from '../db/meetings';
import { Calendar, Clock, Users, CheckCircle, XCircle, MapPin, Video, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import VideoCall from './VideoCall';

interface MeetingListProps {
  userId: number;
  days?: number;
}

const MeetingList: React.FC<MeetingListProps> = ({ userId, days = 7 }) => {
  const navigate = useNavigate();
  const [activeVideoCall, setActiveVideoCall] = useState<{meetingId: number, roomName: string} | null>(null);

  const { data: meetings, isLoading, error } = useQuery({
    queryKey: ['upcomingMeetings', userId, days],
    queryFn: async () => {
      const now = new Date();
      const future = new Date(now);
      future.setDate(now.getDate() + days);
      console.log(`MeetingList querying meetings for user ${userId} from ${now.toISOString()} to ${future.toISOString()}`);
      const result = await meetingsDb.getUpcoming(userId, days);
      console.log('MeetingList query result:', result);
      return result;
    }
  });

  if (isLoading) return <div className="p-4">Loading meetings...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading meetings: {error.message}</div>;
  if (!meetings?.length) {
    return (
      <div className="p-4">
        <div className="text-gray-600 mb-2">No upcoming meetings found.</div>
        <div className="text-sm text-gray-500">
          Meetings are shown for the next {days} days. Try creating a meeting or adjusting the date range.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        Found {meetings.length} meeting(s) for user {userId} (next {days} days)
      </div>
      {meetings.map((meeting) => (
        <div key={meeting.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{meeting.title}</h3>
              {meeting.description && (
                <p className="text-gray-600 mt-1">{meeting.description}</p>
              )}
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
              meeting.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {meeting.status.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              {format(parseISO(meeting.start_time), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              {format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
            </div>
            {meeting.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {meeting.location}
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              Organized by {meeting.organizer_name}
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            {meeting.meeting_link && (
              <button
                className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                onClick={() => {
                  // Extract room name from Jitsi URL
                  const url = new URL(meeting.meeting_link);
                  const roomName = url.pathname.substring(1); // Remove leading slash
                  setActiveVideoCall({ meetingId: meeting.id, roomName });
                }}
              >
                <Video className="inline w-4 h-4 mr-1" />
                Join Video Call
              </button>
            )}
            <button
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              onClick={() => navigate(`/meetings/${meeting.id}`)}
            >
              View Details
            </button>
            <button className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
              <CheckCircle className="inline w-4 h-4 mr-1" />
              Accept
            </button>
            <button className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
              <XCircle className="inline w-4 h-4 mr-1" />
              Decline
            </button>
          </div>
        </div>
      ))}

      {/* Video Call Modal */}
      {activeVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 relative">
            <button
              onClick={() => setActiveVideoCall(null)}
              className="absolute top-4 right-4 z-10 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <VideoCall
              meetingId={activeVideoCall.meetingId}
              roomName={activeVideoCall.roomName}
              onEndCall={() => setActiveVideoCall(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;