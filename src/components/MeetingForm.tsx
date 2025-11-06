import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meetingsDb } from '../db/meetings';
import { usersDb } from '../db/users';
import { Calendar, Clock, Users, MapPin, X, Check, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MeetingFormProps {
  organizerId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MeetingForm: React.FC<MeetingFormProps> = ({ organizerId, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [meetingType, setMeetingType] = useState<'online' | 'physical'>('online');
  const [physicalLocation, setPhysicalLocation] = useState('');
  const [participants, setParticipants] = useState<number[]>([]);
  const [invitationMethod, setInvitationMethod] = useState<'team' | 'email' | 'text'>('team');
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitationPhone, setInvitationPhone] = useState('');
  const [enableVideoCall, setEnableVideoCall] = useState(false);

  const queryClient = useQueryClient();

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersDb.getAll()
  });

  const { mutate: createMeeting, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      if (!startDate) throw new Error('Start date is required');

      const startDateTime = new Date(startDate);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);

      const endDateTime = new Date(startDate);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);

      // Generate Jitsi room URL if video call is enabled
      let meetingLink = null;
      if (enableVideoCall) {
        // Create a unique room name based on meeting title and timestamp
        const roomName = `${title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_${Date.now()}`;
        meetingLink = `https://meet.jit.si/${roomName}`;
      }

      // Determine location based on meeting type
      const location = meetingType === 'online' ? 'Online' : (physicalLocation || 'Physical Location');

      // First create the meeting
      console.log('Creating meeting with data:', {
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location,
        meeting_link: meetingLink,
        organizer_id: organizerId,
        status: 'scheduled'
      });

      const meeting = await meetingsDb.create({
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location,
        meeting_link: meetingLink,
        organizer_id: organizerId,
        status: 'scheduled'
      });

      console.log('Meeting created:', meeting);

      if (!meeting || !meeting.id) {
        throw new Error('Failed to create meeting - no meeting ID returned');
      }

      // Add organizer as participant automatically
      await meetingsDb.addParticipant(meeting.id, organizerId);
      console.log('Added organizer as participant');

      // Then add other participants
      if (participants.length > 0) {
        await Promise.all(
          participants.map(userId =>
            meetingsDb.addParticipant(meeting.id, userId)
          )
        );
        console.log('Added additional participants:', participants);
      }

      return meeting;
    },
    onSuccess: async () => {
      // Small delay to ensure database operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Invalidate all upcomingMeetings queries (with any parameters)
      queryClient.invalidateQueries({ queryKey: ['upcomingMeetings'], exact: false });
      // Also invalidate meetings queries for calendar
      queryClient.invalidateQueries({ queryKey: ['meetings'], exact: false });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMeeting();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Schedule New Meeting</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <div className="flex space-x-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Type</label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="online"
                name="meetingType"
                value="online"
                checked={meetingType === 'online'}
                onChange={(e) => setMeetingType(e.target.value as 'online' | 'physical')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="online" className="ml-2 text-sm font-medium text-gray-700">
                Online Meeting
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="physical"
                name="meetingType"
                value="physical"
                checked={meetingType === 'physical'}
                onChange={(e) => setMeetingType(e.target.value as 'online' | 'physical')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="physical" className="ml-2 text-sm font-medium text-gray-700">
                Physical Location
              </label>
            </div>

            {meetingType === 'physical' && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">Location Address</label>
                <input
                  type="text"
                  value={physicalLocation}
                  onChange={(e) => setPhysicalLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter physical address or location"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Future enhancement: Embedded Google Maps for location selection
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableVideoCall"
            checked={enableVideoCall}
            onChange={(e) => setEnableVideoCall(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableVideoCall" className="ml-2 flex items-center text-sm font-medium text-gray-700">
            <Video className="w-4 h-4 mr-1" />
            Enable Video Call
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
          <div className="space-y-4">
            {/* Current Participants */}
            {participants.map(userId => {
              const user = allUsers?.find(u => u.id === userId);
              return (
                <div key={userId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">
                    {user ? `${user.name} (${user.email})` : `Team Member #${userId}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setParticipants(prev => prev.filter(id => id !== userId))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Invitation Method Selector */}
            <div className="border rounded p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Participants</label>
              <select
                value={invitationMethod}
                onChange={(e) => setInvitationMethod(e.target.value as 'team' | 'email' | 'text')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-3"
              >
                <option value="team">Add Team Member</option>
                <option value="email">Invite by Email</option>
                <option value="text">Invite by Text Message</option>
              </select>

              {/* Team Member Selection */}
              {invitationMethod === 'team' && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Select team member:</p>
                  <select
                    onChange={(e) => {
                      const userId = parseInt(e.target.value);
                      if (userId && !participants.includes(userId)) {
                        setParticipants(prev => [...prev, userId]);
                        (e.target as HTMLSelectElement).value = ''; // Reset selection
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a team member...</option>
                    {allUsers?.filter(user => user.id !== organizerId).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email Invitation */}
              {invitationMethod === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={invitationEmail}
                      onChange={(e) => setInvitationEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Invitation will include:</strong><br />
                      Meeting details + app download link: <a href="https://huttonaerographics.ca" target="_blank" rel="noopener noreferrer" className="underline">huttonaerographics.ca</a>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (invitationEmail) {
                        // TODO: Implement email sending
                        alert(`Invitation sent to ${invitationEmail} with app download link: https://huttonaerographics.ca`);
                        setInvitationEmail('');
                        setInvitationMethod('team');
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Send Email Invitation
                  </button>
                </div>
              )}

              {/* Text Message Invitation */}
              {invitationMethod === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={invitationPhone}
                      onChange={(e) => setInvitationPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Text message will include:</strong><br />
                      Meeting details + app download link: <a href="https://huttonaerographics.ca" target="_blank" rel="noopener noreferrer" className="underline">huttonaerographics.ca</a>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (invitationPhone) {
                        // TODO: Implement SMS sending
                        alert(`Text invitation sent to ${invitationPhone} with app download link: https://huttonaerographics.ca`);
                        setInvitationPhone('');
                        setInvitationMethod('team');
                      }
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Send Text Invitation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="inline w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Check className="inline w-4 h-4 mr-1" />
            {isCreating ? 'Scheduling...' : 'Schedule Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingForm;