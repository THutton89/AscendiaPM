import React, { useState, useEffect } from 'react';
import { Paper } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'task' | 'project';
  color: string;
  description?: string;
  startTime?: string; // For meetings with specific times
  endTime?: string; // For meetings with specific times
  allDay?: boolean; // For tasks/projects without specific times
}

type ViewMode = 'month' | 'week' | 'day';

export function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Load organization settings for work hours
  const { data: organization } = useQuery({
    queryKey: ['organization', user?.id],
    queryFn: async () => {
      try {
        const result = await api('get-organization');
        return result?.organization || null;
      } catch (error) {
        console.error('Failed to fetch organization:', error);
        return null;
      }
    },
    enabled: !!user
  });

  // Load meetings, tasks, and projects
  const { data: meetings } = useQuery({
    queryKey: ['meetings', user?.id],
    queryFn: async () => {
      try {
        const result = await api('get-meetings', { days: 365 });
        return result || [];
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        return [];
      }
    },
    enabled: !!user
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await tasksApi.getAll();
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return [];
      }
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        return await projectsApi.getAll();
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
      }
    }
  });

  // Convert all events to calendar events
  const events: CalendarEvent[] = React.useMemo(() => {
    const eventList: CalendarEvent[] = [];

    try {
      // Convert meetings to events
      meetings?.forEach(meeting => {
        if (meeting && meeting.id && meeting.title && meeting.start_time) {
          const startDateTime = new Date(meeting.start_time);
          const endDateTime = new Date(meeting.end_time);

          eventList.push({
            id: `meeting-${meeting.id}`,
            title: `📅 ${meeting.title}`,
            date: startDateTime.toISOString().split('T')[0],
            type: 'meeting',
            color: '#9ACD32', // Yellowish green for meetings
            description: meeting.description || meeting.location,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            allDay: false
          });
        }
      });

      // Convert tasks with due dates to events (all-day)
      tasks?.forEach(task => {
        if (task && task.id && task.title && task.due_date) {
          eventList.push({
            id: `task-${task.id}`,
            title: `📋 ${task.title}`,
            date: task.due_date.split('T')[0],
            type: 'task',
            color: '#65A30D', // Emerald secondary for tasks
            description: task.description,
            allDay: true
          });
        }
      });

      // Convert project start/end dates to events (all-day)
      projects?.forEach(project => {
        if (project && project.id && project.name) {
          if (project.start_date) {
            eventList.push({
              id: `project-start-${project.id}`,
              title: `🚀 ${project.name} - Start`,
              date: project.start_date.split('T')[0],
              type: 'project',
              color: '#F59E0B', // Amber/orange for projects
              description: project.description,
              allDay: true
            });
          }

          if (project.end_date) {
            eventList.push({
              id: `project-end-${project.id}`,
              title: `✅ ${project.name} - Due`,
              date: project.end_date.split('T')[0],
              type: 'project',
              color: '#F59E0B', // Amber/orange for projects
              description: project.description,
              allDay: true
            });
          }
        }
      });
    } catch (error) {
      console.error('Error creating events:', error);
    }

    return eventList;
  }, [meetings, tasks, projects]);

  // Generate calendar days for month view
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Generate week days for week view
  const generateWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)

    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek));
      startOfWeek.setDate(startOfWeek.getDate() + 1);
    }
    return days;
  };

  // Generate hours for day/week views
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const calendarDays = generateCalendarDays(currentDate);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);

      if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      }

      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  // Week View Component
  const WeekView = ({ currentDate, events, onDateClick }: { currentDate: Date; events: CalendarEvent[]; onDateClick: (date: string) => void }) => {
    const weekDays = generateWeekDays(currentDate);
    const hours = generateHours();

    const getEventsForHour = (day: Date, hour: number) => {
      const dayStr = day.toISOString().split('T')[0];
      return events.filter(event => {
        if (event.date !== dayStr) return false;

        if (event.allDay) {
          // Show all-day events at 9 AM
          return hour === 9;
        }

        if (event.startTime) {
          const startHour = new Date(event.startTime).getHours();
          return startHour === hour;
        }

        return false;
      });
    };

    return (
      <div className="week-view">
        {/* Header with days */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="p-2"></div> {/* Empty corner */}
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center font-semibold text-sm">
              <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-lg ${isToday(day) ? 'text-blue-600 font-bold' : ''}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="max-h-96 overflow-y-auto border rounded">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-1 border-b border-gray-100">
              <div className="p-2 text-xs text-gray-500 text-right pr-4">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDays.map((day, dayIndex) => {
                const hourEvents = getEventsForHour(day, hour);

                return (
                  <div
                    key={dayIndex}
                    className="min-h-[40px] p-1 border-l border-gray-100 cursor-pointer hover:bg-gray-50"
                    onClick={() => onDateClick(day.toISOString().split('T')[0])}
                  >
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 mb-1 rounded truncate"
                        style={{ backgroundColor: event.color, color: 'white' }}
                        title={`${event.title}${event.allDay ? ' (All Day)' : event.startTime ? ` (${new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })})` : ''}`}
                      >
                        {event.allDay ? `${event.title} (All Day)` : event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day View Component
  const DayView = ({ currentDate, events, onDateClick }: { currentDate: Date; events: CalendarEvent[]; onDateClick: (date: string) => void }) => {
    const hours = generateHours();
    const dayStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter(event => event.date === dayStr);

    const getEventsForHour = (hour: number) => {
      return dayEvents.filter(event => {
        if (event.allDay) {
          // Show all-day events at 9 AM
          return hour === 9;
        }

        if (event.startTime) {
          const startHour = new Date(event.startTime).getHours();
          return startHour === hour;
        }

        return false;
      });
    };

    return (
      <div className="day-view">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded">
          {hours.map(hour => {
            const hourEvents = getEventsForHour(hour);

            return (
              <div key={hour} className="flex border-b border-gray-100">
                <div className="w-20 p-2 text-xs text-gray-500 text-right pr-4 border-r">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 min-h-[60px] p-2">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-2 mb-1 rounded text-sm"
                      style={{ backgroundColor: event.color, color: 'white' }}
                    >
                      <div className="font-medium">
                        {event.allDay ? `${event.title} (All Day)` : event.title}
                      </div>
                      {event.startTime && !event.allDay && (
                        <div className="text-xs opacity-90">
                          {new Date(event.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                          {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`}
                        </div>
                      )}
                      {event.description && (
                        <div className="text-xs opacity-90 mt-1">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-gray-600">Team calendar and scheduling</p>
      </div>

      <Paper className="p-6">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateDate('prev')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            ‹ Previous
          </button>

          <h2 className="text-xl font-semibold">
            {viewMode === 'month'
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : viewMode === 'week'
              ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            }
          </h2>

          <button
            onClick={() => navigateDate('next')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Next ›
          </button>
        </div>

        {viewMode === 'month' && (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isCurrentMonthDay = isCurrentMonth(date);

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50
                      ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}
                      ${!isCurrentMonthDay ? 'text-gray-400 bg-gray-50' : ''}
                    `}
                    onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                  >
                    <div className="text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded truncate"
                          style={{ backgroundColor: event.color, color: 'white' }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}

                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'week' && (
          <WeekView currentDate={currentDate} events={events} onDateClick={setSelectedDate} />
        )}

        {viewMode === 'day' && (
          <DayView currentDate={currentDate} events={events} onDateClick={setSelectedDate} />
        )}

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold mb-3">
              Events for {new Date(selectedDate).toLocaleDateString()}
            </h3>

            <div className="space-y-2">
              {getEventsForDate(new Date(selectedDate)).map(event => (
                <div
                  key={event.id}
                  className="p-3 rounded-md border-l-4"
                  style={{ borderLeftColor: event.color }}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                  )}
                </div>
              ))}

              {getEventsForDate(new Date(selectedDate)).length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No events scheduled for this date
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode Selector */}
        <div className="mt-6 flex justify-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-md ${viewMode === 'month' ? 'bg-emerald-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-md ${viewMode === 'week' ? 'bg-emerald-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-md ${viewMode === 'day' ? 'bg-emerald-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Day
          </button>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9ACD32' }}></div>
            <span>Meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#65A30D' }}></div>
            <span>Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <span>Projects</span>
          </div>
        </div>
      </Paper>
    </div>
  );
}