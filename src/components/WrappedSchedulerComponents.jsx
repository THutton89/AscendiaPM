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

export const ViewSwitcher = (props) => (
  <BaseViewSwitcher {...props} />
);

export const IntegratedEditing = (props) => (
  <BaseIntegratedEditing {...props} />
);

export const Scheduler = (props) => (
  <BaseScheduler locale="en-US" firstDayOfWeek={0} {...props} />
);

export const ViewState = ({ 
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

export const EditingState = ({
  onCommitChanges = () => {},
  addedAppointment = {},
  appointmentChanges = {},
  editingAppointment = undefined,
  onRequestAISuggestions = async () => [],
  ...props
}) => {
  const handleCommitChanges = async (changes) => {
    if (changes.added && onRequestAISuggestions) {
      const suggestions = await onRequestAISuggestions(changes.added);
      if (suggestions.length > 0) {
        changes.added = { ...changes.added, ...suggestions[0] };
      }
    }
    onCommitChanges(changes);
  };

  return (
  <BaseEditingState
    onCommitChanges={handleCommitChanges} // Use the wrapper function
    addedAppointment={addedAppointment}
    appointmentChanges={appointmentChanges}
    editingAppointment={editingAppointment}
    {...props}
  />
);
}

export const DayView = ({ 
  startDayHour = 9, 
  endDayHour = 19,
  name = "Day",
  displayName = "Day",
  ...props
}) => (
  <BaseDayView
    startDayHour={startDayHour}
    endDayHour={endDayHour}
    name={name}
    displayName={displayName}
    {...props}
  />
);

export const WeekView = ({ 
  startDayHour = 9, 
  endDayHour = 19,
  name = "Week",
  displayName = "Week",
  intervalCount = 1,
  ...props
}) => (
  <BaseWeekView
    startDayHour={startDayHour}
    endDayHour={endDayHour}
    name={name}
    displayName={displayName}
    intervalCount={intervalCount}
    {...props}
  />
);

export const MonthView = ({
  name = "Month",
  displayName = "Month",
  ...props
}) => (
  <BaseMonthView
    name={name}
    displayName={displayName}
    {...props}
  />
);

export const Toolbar = ({
  rootComponent,
  ...props
}) => {
  const defaultRootComponent = ({ children }) => children;

  return (
    <BaseToolbar
      rootComponent={rootComponent || defaultRootComponent}
      {...props}
    />
  );
};

export const DateNavigator = ({
  openButtonComponent,
  rootComponent,
  ...props
}) => {
  const defaultRootComponent = ({ children }) => children;

  return (
    <BaseDateNavigator
      openButtonComponent={openButtonComponent}
      rootComponent={rootComponent || defaultRootComponent}
      {...props}
    />
  );
};

export const TodayButton = ({
  messages = { today: "Today" },
  rootComponent,
  ...props
}) => {
  const defaultRootComponent = ({ children }) => children;

  return (
    <BaseTodayButton
      messages={messages}
      rootComponent={rootComponent || defaultRootComponent}
      {...props}
    />
  );
};


export const Appointments = ({
  appointmentComponent,
  appointmentContentComponent,
  recurringIconComponent,
  splitIndicatorComponent,
  ...props
}) => {
  const appointmentsProps = { ...props };

  if (appointmentComponent) appointmentsProps.appointmentComponent = appointmentComponent;
  if (appointmentContentComponent) appointmentsProps.appointmentContentComponent = appointmentContentComponent;
  if (recurringIconComponent) appointmentsProps.recurringIconComponent = recurringIconComponent;
  if (splitIndicatorComponent) appointmentsProps.splitIndicatorComponent = splitIndicatorComponent;

  return <BaseAppointments {...appointmentsProps} />;
};

export const AppointmentTooltip = ({
  showCloseButton = true,
  showOpenButton = true,
  showDeleteButton = true,
  commandButtonComponent,
  ...props
}) => {
  // Only pass commandButtonComponent if it's defined
  const tooltipProps = {
    showCloseButton,
    showOpenButton,
    showDeleteButton,
    ...props
  };

  if (commandButtonComponent) {
    tooltipProps.commandButtonComponent = commandButtonComponent;
  }

  return <BaseAppointmentTooltip {...tooltipProps} />;
};

// FIX: Added the component definition 'export const AppointmentForm = ({...}) => {'
export const AppointmentForm = ({
  readOnly,
  messages = {},
  appointmentData,
  onAppointmentDataChange,
  ...props
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  
  return (
    <div>
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
    </div>
  );
};

export const DragDropProvider = ({
  allowDrag = () => true,
  allowResize = () => true,
  ...props
}) => (
  <BaseDragDropProvider
    allowDrag={allowDrag}
    allowResize={allowResize}
    {...props}
  />
);
