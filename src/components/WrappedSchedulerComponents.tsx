import React from 'react';
import { Box, Button } from '@mui/material';
import { AITaskSuggestions } from './AITaskSuggestions';
import { ViewState as BaseViewState, EditingState as BaseEditingState, IntegratedEditing as BaseIntegratedEditing } from '@devexpress/dx-react-scheduler';
import {
  Scheduler as BaseScheduler,
  DayView as BaseDayView,
  WeekView as BaseWeekView,
  MonthView as BaseMonthView,
  Toolbar as BaseToolbar,
  DateNavigator as BaseDateNavigator,
  TodayButton as BaseTodayButton,
  ViewSwitcher as BaseViewSwitcher,
  Appointments as BaseAppointments,
  AppointmentTooltip as BaseAppointmentTooltip,
  AppointmentForm as BaseAppointmentForm,
  DragDropProvider as BaseDragDropProvider
} from '@devexpress/dx-react-scheduler-material-ui';

// Type definitions
interface ViewSwitcherProps {
  [key: string]: any;
}

interface IntegratedEditingProps {
  [key: string]: any;
}

interface SchedulerProps {
  [key: string]: any;
}

interface ViewStateProps {
  currentDate?: Date;
  currentViewName?: string;
  onCurrentDateChange?: (date: Date) => void;
  onCurrentViewNameChange?: (viewName: string) => void;
  [key: string]: any;
}

interface EditingStateProps {
  onCommitChanges?: (changes: any) => void;
  addedAppointment?: any;
  appointmentChanges?: any;
  editingAppointment?: any;
  onRequestAISuggestions?: (appointment: any) => Promise<any[]>;
  [key: string]: any;
}

interface DayViewProps {
  startDayHour?: number;
  endDayHour?: number;
  name?: string;
  displayName?: string;
  [key: string]: any;
}

interface WeekViewProps {
  startDayHour?: number;
  endDayHour?: number;
  name?: string;
  displayName?: string;
  intervalCount?: number;
  [key: string]: any;
}

interface MonthViewProps {
  name?: string;
  displayName?: string;
  [key: string]: any;
}

interface ToolbarProps {
  rootComponent?: React.ComponentType<any>;
  [key: string]: any;
}

interface DateNavigatorProps {
  openButtonComponent?: React.ComponentType<any>;
  [key: string]: any;
}

interface TodayButtonProps {
  messages?: { today: string };
  [key: string]: any;
}

interface AppointmentsProps {
  appointmentComponent?: React.ComponentType<any>;
  appointmentContentComponent?: React.ComponentType<any>;
  recurringIconComponent?: React.ComponentType<any>;
  splitIndicatorComponent?: React.ComponentType<any>;
  [key: string]: any;
}

interface AppointmentTooltipProps {
  showCloseButton?: boolean;
  showOpenButton?: boolean;
  showDeleteButton?: boolean;
  commandButtonComponent?: React.ComponentType<any>;
  [key: string]: any;
}

interface AppointmentFormProps {
  readOnly?: boolean;
  messages?: any;
  appointmentData?: any;
  onAppointmentDataChange?: (appointmentData: any) => void;
  [key: string]: any;
}

interface DragDropProviderProps {
  allowDrag?: () => boolean;
  allowResize?: () => boolean;
  [key: string]: any;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = (props) => (
  <BaseViewSwitcher {...props} />
);

export const IntegratedEditing: React.FC<IntegratedEditingProps> = (props) => (
  <BaseIntegratedEditing {...props} />
);

export const Scheduler: React.FC<SchedulerProps> = (props) => (
  <BaseScheduler locale="en-US" firstDayOfWeek={0} {...props} />
);

export const ViewState: React.FC<ViewStateProps> = ({
  currentDate = new Date(),
  currentViewName = "Month",
  onCurrentDateChange = () => {},
  onCurrentViewNameChange = () => {},
  ...props
}) => (
  <BaseViewState
    currentDate={currentDate}
    currentViewName={currentViewName}
    onCurrentDateChange={onCurrentDateChange}
    onCurrentViewNameChange={onCurrentViewNameChange}
    {...props}
  />
);

export const EditingState: React.FC<EditingStateProps> = ({
  onCommitChanges = () => {},
  addedAppointment = {},
  appointmentChanges = {},
  editingAppointment = undefined,
  onRequestAISuggestions = async () => [],
  ...props
}) => {
  const handleCommitChanges = async (changes: any): Promise<void> => {
    if (changes.added && onRequestAISuggestions) {
      try {
        const suggestions = await onRequestAISuggestions(changes.added);
        if (suggestions.length > 0) {
          changes.added = { ...changes.added, ...suggestions[0] };
        }
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
      }
    }
    onCommitChanges(changes);
  };

  return (
    <BaseEditingState
      onCommitChanges={handleCommitChanges}
      addedAppointment={addedAppointment}
      appointmentChanges={appointmentChanges}
      editingAppointment={editingAppointment}
      {...props}
    />
  );
};

export const DayView: React.FC<DayViewProps> = (props) => (
  <BaseDayView
    startDayHour={9}
    endDayHour={19}
    name="Day"
    displayName="Day"
    {...props}
  />
);

export const WeekView: React.FC<WeekViewProps> = (props) => (
  <BaseWeekView
    startDayHour={9}
    endDayHour={19}
    name="Week"
    displayName="Week"
    intervalCount={1}
    {...props}
  />
);

export const MonthView: React.FC<MonthViewProps> = (props) => (
  <BaseMonthView
    name="Month"
    displayName="Month"
    {...props}
  />
);

export const Toolbar: React.FC<ToolbarProps> = (props) => (
  <BaseToolbar
    rootComponent={({ children }: { children: React.ReactNode }) => <>{children}</>}
    {...props}
  />
);

export const DateNavigator: React.FC<DateNavigatorProps> = (props) => (
  <BaseDateNavigator
    openButtonComponent={() => null}
    {...props}
  />
);

export const TodayButton: React.FC<TodayButtonProps> = (props) => (
  <BaseTodayButton
    messages={{ today: "Today" }}
    {...props}
  />
);

export const Appointments: React.FC<AppointmentsProps> = (props) => (
  <BaseAppointments {...props} />
);

export const AppointmentTooltip: React.FC<AppointmentTooltipProps> = (props) => (
  <BaseAppointmentTooltip
    showCloseButton={true}
    showOpenButton={true}
    showDeleteButton={true}
    {...props}
  />
);

export const AppointmentForm: React.FC<AppointmentFormProps> = (props) => {
  const [showSuggestions, setShowSuggestions] = React.useState<boolean>(false);
  const { readOnly = false, messages = {}, appointmentData, onAppointmentDataChange } = props;

  return (
    <>
      <BaseAppointmentForm
        readOnly={readOnly}
        messages={messages}
        appointmentData={appointmentData}
        onAppointmentDataChange={onAppointmentDataChange}
        {...props}
      />
      {!readOnly && (
        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            {showSuggestions ? 'Hide' : 'Get'} AI Suggestions
          </Button>
          {showSuggestions && appointmentData && (
            <AITaskSuggestions
              taskDescription={appointmentData.title || ''}
              onApplySuggestion={(suggestion) => {
                onAppointmentDataChange({
                  ...appointmentData,
                  ...suggestion
                });
                setShowSuggestions(false);
              }}
            />
          )}
        </Box>
      )}
    </>
  );
};

export const DragDropProvider: React.FC<DragDropProviderProps> = (props) => (
  <BaseDragDropProvider
    allowDrag={() => true}
    allowResize={() => true}
    {...props}
  />
);