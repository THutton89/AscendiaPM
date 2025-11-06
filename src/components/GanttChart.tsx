import React from 'react';
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  AppointmentTooltip,
  AppointmentForm,
  DragDropProvider,
  Toolbar,
  ViewSwitcher,
  DateNavigator,
  TodayButton,
} from '@devexpress/dx-react-scheduler-material-ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { tasksDb } from '../db/tasks';
import { Paper } from '@mui/material';
import { Project, Task } from '../types';

const GanttChart = () => {
  const queryClient = useQueryClient();
  const currentDate = new Date();

  const { data: projects } = useQuery<Project[]>({
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

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: tasksDb.getAll
  });

  // Convert projects and tasks to scheduler appointments
  const appointments = React.useMemo(() => {
    const allAppointments = [];
    
    // Add projects as appointments
    if (projects) {
      projects.forEach(project => {
        if (project.start_date && project.end_date) {
          allAppointments.push({
            id: `project-${project.id}`,
            title: project.name,
            startDate: new Date(project.start_date),
            endDate: new Date(project.end_date),
            type: 'project',
            status: project.status
          });
        }
      });
    }

    // Add tasks as appointments
    if (tasks) {
      tasks.forEach(task => {
        if (task.due_date) {
          // For tasks, we'll use the due date and assume a duration
          const startDate = new Date(task.due_date);
          startDate.setHours(9); // Start at 9 AM
          const endDate = new Date(startDate);
          endDate.setHours(17); // End at 5 PM

          allAppointments.push({
            id: `task-${task.id}`,
            title: task.title,
            startDate,
            endDate,
            type: 'task',
            status: task.status,
            priority: task.priority
          });
        }
      });
    }

    return allAppointments;
  }, [projects, tasks]);

  // Custom appointment component to show different styles for projects and tasks
  interface AppointmentProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    data: any;
    draggable: boolean;
    resources: any;
  }
  const Appointment = ({ children, style, data, ...restProps }: AppointmentProps) => {
    const isProject = data.type === 'project';
    const backgroundColor = isProject
      ? data.status === 'active' ? '#4CAF50' : data.status === 'completed' ? '#2196F3' : '#FFC107'
      : data.priority === 'high' ? '#f44336' : data.priority === 'medium' ? '#FF9800' : '#8BC34A';

    return (
      <Appointments.Appointment
        {...restProps}
        data={data}
        draggable={true}
        resources={[]}
        style={{
          ...style,
          backgroundColor,
          borderRadius: '4px',
        }}
      >
        {children}
      </Appointments.Appointment>
    );
  };

  return (
    <Paper>
      <Scheduler
        data={appointments}
        height={700}
      >
        <ViewState
          defaultCurrentDate={currentDate}
          defaultCurrentViewName="Month"
        />
        <EditingState onCommitChanges={() => {}} />
        <IntegratedEditing />

        <DayView
          startDayHour={9}
          endDayHour={19}
        />
        <WeekView
          startDayHour={9}
          endDayHour={19}
        />
        <MonthView />

        <Toolbar />
        <DateNavigator />
        <TodayButton />
        <ViewSwitcher />

        <Appointments
          appointmentComponent={Appointment}
        />
        <AppointmentTooltip
          showCloseButton
          showOpenButton
        />
        <AppointmentForm />
        <DragDropProvider />
      </Scheduler>
    </Paper>
  );
};

export default GanttChart;
