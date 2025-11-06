import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { meetingsDb } from '../db/meetings';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle, XCircle, MapPin, Edit, Trash2, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingsDb.getById(Number(id))
  });

  const { data: attendees } = useQuery({
    queryKey: ['meetingAttendees', id],
    queryFn: () => meetingsDb.getAttendees(Number(id))
  });

  const { data: notes } = useQuery({
    queryKey: ['meetingNotes', id],
    queryFn: () => meetingsDb.getNotes(Number(id))
  });

  if (isLoading) return <div className="p-4">Loading meeting details...</div>;
  if (!meeting) return <div className="p-4">Meeting not found</div>;

  const handleDelete = async () => {
    await meetingsDb.delete(meeting.id);
    navigate('/meetings');
  };

  const agendaNote = notes?.find(note => note.content.startsWith('AGENDA:'));
  const agendaItems = agendaNote?.content.replace('AGENDA:', '').split('\n').filter(Boolean) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{meeting.title}</h2>
          {meeting.description && (
            <p className="text-gray-600 mt-2">{meeting.description}</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          {user?.id === meeting.organizer_id && (
            <>
              <button 
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                onClick={() => navigate(`/meetings/edit/${meeting.id}`)}
              >
                <Edit className="inline w-4 h-4 mr-1" />
                Edit
              </button>
              <button 
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                onClick={handleDelete}
              >
                <Trash2 className="inline w-4 h-4 mr-1" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-lg mb-3">Meeting Details</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                <span>{format(parseISO(meeting.start_time), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-500" />
                <span>
                  {format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
                </span>
              </div>
              {meeting.location && (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                  <span>{meeting.location}</span>
                </div>
              )}
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-500" />
                <span>Organized by {meeting.organizer_name}</span>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-sm rounded-full ${
                  meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  meeting.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {meeting.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-lg mb-3">Attendees</h3>
            <div className="space-y-2">
              {attendees?.length > 0 ? (
                attendees.map(attendee => (
                  <div key={attendee.user_id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                      {attendee.user_name?.charAt(0)}
                    </div>
                    <span>{attendee.user_name}</span>
                    <span className="ml-auto text-sm text-gray-500">
                      {attendee.status === 'accepted' ? (
                        <CheckCircle className="inline w-4 h-4 text-green-500" />
                      ) : attendee.status === 'declined' ? (
                        <XCircle className="inline w-4 h-4 text-red-500" />
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No attendees yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-lg mb-3">Agenda</h3>
            {agendaItems.length > 0 ? (
              <ul className="space-y-2">
                {agendaItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <ClipboardList className="w-4 h-4 mt-1 mr-2 text-gray-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No agenda items</p>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-lg mb-3">Notes</h3>
            {notes?.filter(n => !n.content.startsWith('AGENDA:')).length > 0 ? (
              <div className="space-y-4">
                {notes
                  .filter(n => !n.content.startsWith('AGENDA:'))
                  .map(note => (
                    <div key={note.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                          {note.user_name?.charAt(0)}
                        </div>
                        <span className="font-medium">{note.user_name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {format(parseISO(note.created_at!), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="whitespace-pre-line">{note.content}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">No notes yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;