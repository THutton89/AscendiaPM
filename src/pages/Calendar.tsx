import React, { useState, useEffect } from 'react';
import { Paper } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { meetingsDb } from '../db/meetings';
import { tasksDb } from '../db/tasks';
import { projectsApi } from '../api/projects';
import { usersDb } from '../db/users';
import { useAuth } from '../context/AuthContext';
import {
  Scheduler,
  ViewState,
  DayView,
  WeekView,
  MonthView,
  Toolbar,
  DateNavigator,
  TodayButton,
  ViewSwitcher,
  Appointments,
  AppointmentTooltip,
  AppointmentForm,
  DragDropProvider,
  EditingState,
  IntegratedEditing,
} from '../components/WrappedSchedulerComponents';
import { Resources, GroupingPanel } from '@devexpress/dx-react-scheduler-material-ui';
import { GroupingState, IntegratedGrouping } from '@devexpress/dx-react-scheduler';

interface Appointment {
  id: string | number;
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  projectId?: number;
  assignedUserId?: number;
  userName?: string;
  projectName?: string;
  projectColor?: string;
  resourceId?: number; // Add resource ID for team member assignment
}

export function Calendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentViewName, setCurrentViewName] = useState('Week');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [addedAppointment, setAddedAppointment] = useState<Appointment | {}>({});
  const [appointmentChanges, setAppointmentChanges] = useState({});

  // Load meetings, tasks, and projects
  const { data: meetings } = useQuery({
    queryKey: ['meetings', user?.id],
    queryFn: () => user ? meetingsDb.getUpcoming(user.id, 365) : [],
    enabled: !!user
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksDb.getAll()
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll()
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersDb.getAll()
  });

  // Create resources (team members) - always create, even if empty
  const resources = React.useMemo(() => {
    if (!users || users.length === 0) {
      return [{
        fieldName: 'resourceId',
        title: 'Team Member',
        instances: []
      }];
    }

    return [{
      fieldName: 'resourceId',
      title: 'Team Member',
      instances: users.map((user, index) => ({
        id: user.id,
        text: user.name || user.email || `User ${user.id}`,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Generate different colors
      }))
    }];
  }, [users]);

  // Convert all events to appointments
  const appointments: Appointment[] = React.useMemo(() => {
    const appointmentList: Appointment[] = [];
    let userIndex = 0; // For distributing appointments among users

    try {
      // Convert meetings to appointments
      meetings?.forEach(meeting => {
        if (meeting && meeting.id && meeting.title && meeting.start_time && meeting.end_time) {
          // Assign to organizer if available, otherwise distribute among users (if any)
          const assignedUserId = meeting.organizer_id || (users && users.length > 0 ? users[userIndex % users.length]?.id : undefined);
          if (users && users.length > 0) userIndex++;

          appointmentList.push({
            id: `meeting-${meeting.id}`,
            title: `📅 ${meeting.title}`,
            startDate: new Date(meeting.start_time),
            endDate: new Date(meeting.end_time),
            notes: meeting.description || meeting.location,
            projectColor: '#3B82F6', // Blue for meetings
            resourceId: assignedUserId
          });
        }
      });

      // Convert tasks with due dates to appointments
      tasks?.forEach(task => {
        if (task && task.id && task.title && task.due_date) {
          const project = projects?.find(p => p.id === task.project_id);
          // Distribute among available users (if any)
          const assignedUserId = users && users.length > 0 ? users[userIndex % users.length]?.id : undefined;
          if (users && users.length > 0) userIndex++;

          appointmentList.push({
            id: `task-${task.id}`,
            title: `📋 ${task.title}`,
            startDate: new Date(task.due_date),
            endDate: new Date(task.due_date),
            notes: task.description,
            projectId: task.project_id,
            projectName: project?.name,
            projectColor: '#10B981', // Green for tasks
            resourceId: assignedUserId
          });
        }
      });

      // Convert project start/end dates to appointments
      projects?.forEach(project => {
        if (project && project.id && project.name) {
          if (project.start_date) {
            const assignedUserId = users && users.length > 0 ? users[userIndex % users.length]?.id : undefined;
            if (users && users.length > 0) userIndex++;

            appointmentList.push({
              id: `project-start-${project.id}`,
              title: `🚀 ${project.name} - Start`,
              startDate: new Date(project.start_date),
              endDate: new Date(project.start_date),
              notes: project.description,
              projectColor: '#8B5CF6', // Purple for projects
              resourceId: assignedUserId
            });
          }

          if (project.end_date) {
            const assignedUserId = users && users.length > 0 ? users[userIndex % users.length]?.id : undefined;
            if (users && users.length > 0) userIndex++;

            appointmentList.push({
              id: `project-end-${project.id}`,
              title: `✅ ${project.name} - Due`,
              startDate: new Date(project.end_date),
              endDate: new Date(project.end_date),
              notes: project.description,
              projectColor: '#8B5CF6', // Purple for projects
              resourceId: assignedUserId
            });
          }
        }
      });
    } catch (error) {
      console.error('Error creating appointments:', error);
    }

    console.log('Created appointments:', appointmentList.length);
    console.log('Appointment data:', appointmentList.slice(0, 5)); // Log first 5 appointments
    console.log('Available users:', users?.length || 0);
    return appointmentList;
  }, [meetings, tasks, projects, users]);

  const commitChanges = async ({ added, changed, deleted }: any) => {
    try {
      if (added && user) {
        // Create a new meeting
        const meetingData = {
          title: added.title || 'New Meeting',
          description: added.notes || '',
          start_time: added.startDate.toISOString(),
          end_time: added.endDate.toISOString(),
          location: added.location || null,
          meeting_link: null,
          organizer_id: user.id,
          status: 'scheduled' as const
        };

        const newMeeting = await meetingsDb.create(meetingData);

        // Add the organizer as a participant
        await meetingsDb.addParticipant(newMeeting.id, user.id);

        // Refresh the meetings queries
        queryClient.invalidateQueries({ queryKey: ['meetings'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['upcomingMeetings'], exact: false });

        console.log('Meeting created successfully:', newMeeting);
      }

      if (changed) {
        console.log('Meeting changes:', changed);
        // TODO: Implement updating existing meetings
      }

      if (deleted) {
        console.log('Meeting deletions:', deleted);
        // TODO: Implement deleting meetings
      }
    } catch (error) {
      console.error('Error saving calendar changes:', error);
    }
  };

  const appointmentComponent = (props: any) => {
    const { children, style, data, ...restProps } = props;
    const appointment = data as Appointment;

    // Handle undefined appointment data
    if (!appointment) {
      return (
        <div
          {...restProps}
          style={{
            ...style,
            backgroundColor: '#3174ad',
            borderRadius: '8px',
            border: 'none',
          }}
        >
          {children || (
            <div style={{ padding: '8px', color: 'white', fontSize: '14px' }}>
              Loading...
            </div>
          )}
        </div>
      );
    }

    const backgroundColor = appointment.projectColor || '#3174ad';

    return (
      <div
        {...restProps}
        style={{
          ...style,
          backgroundColor,
          borderRadius: '8px',
          border: 'none',
        }}
      >
        {children || (
          <div style={{ padding: '8px', color: 'white', fontSize: '14px' }}>
            {appointment.title || 'Untitled'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Monthly Calendar</h1>
        <p className="text-gray-600">Overview of team appointments across the month</p>
      </div>

      <Paper>
        <Scheduler data={appointments} height={600}>
          <ViewState
            currentDate={currentDate}
            currentViewName={currentViewName}
            onCurrentDateChange={setCurrentDate}
            onCurrentViewNameChange={setCurrentViewName}
          />

          <EditingState
            onCommitChanges={commitChanges}
            addedAppointment={addedAppointment}
            appointmentChanges={appointmentChanges}
            editingAppointment={editingAppointment}
          />

          <IntegratedEditing />

          {/* Grouping components must come after ViewState and editing */}
          {resources && resources[0]?.instances?.length > 0 && appointments.some(apt => apt.resourceId) && (
            <>
              <GroupingState
                grouping={[{ resourceName: 'resourceId' }]}
                groupByDate={() => false}
              />
              <IntegratedGrouping />
            </>
          )}

          <DayView startDayHour={8} endDayHour={18} />
          <WeekView startDayHour={8} endDayHour={18} />
          <MonthView />

          <Toolbar />
          <DateNavigator />
          <TodayButton />
          <ViewSwitcher />

          {/* Appointments must come before Resources */}
          <Appointments appointmentComponent={appointmentComponent} />
          <AppointmentTooltip showOpenButton showDeleteButton />
          {/* <AppointmentForm /> */}

          {/* Resources and GroupingPanel after Appointments */}
          {resources && resources[0]?.instances?.length > 0 && appointments.some(apt => apt.resourceId) && (
            <>
              <Resources
                data={resources}
                mainResourceName="resourceId"
              />
              <GroupingPanel />
            </>
          )}

          <DragDropProvider />
        </Scheduler>
      </Paper>
    </div>
  );
}