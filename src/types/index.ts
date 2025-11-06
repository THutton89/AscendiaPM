export interface Task {
  id: number;
  project_id: number | null;
  sprint_id: number | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  codeSnippet?: string;
  codeLanguage?: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  completion?: number;

}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'guest';
  availability_hours: number;
  notification_settings?: {
    emailOnMention?: boolean;
    inAppNotifications?: boolean;
  };
  created_at: string;
}

export interface TimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  hours_spent: number;
  date: string;
  description: string | null;
  created_at: string;
  user_name?: string;
  task_title?: string;
}

export interface TaskAssignment {
  task_id: number;
  user_id: number;
  assigned_at: string;
}

export interface Workload {
  total_hours: number;
  date: string;
}

export interface Sprint {
  id: number;
  name: string;
  project_id: number;
  start_date: string;
  end_date: string;
  goal?: string;
  created_at: string;
}

export interface Comment {
  id?: number;
  task_id: number;
  user_id: number;
  content: string;
  mentions?: number[];
  created_at?: string;
  user_name?: string;
}

export interface Meeting {
  id?: number;
  title: string;
  description?: string;
  project_id?: number | null;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_link?: string | null;
  organizer_id: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  created_at?: string;
  organizer_name?: string;
}

export interface MeetingParticipant {
  meeting_id: number;
  user_id: number;
  status: 'pending' | 'accepted' | 'declined';
  user_name?: string;
}

export interface MeetingNote {
  id?: number;
  meeting_id: number;
  user_id: number;
  content: string;
  created_at?: string;
  user_name?: string;
}

export interface MeetingRecording {
  id?: number;
  meeting_id: number;
  recording_url?: string;
  transcript?: string;
  duration?: number;
  created_at?: string;
  status: 'recording' | 'completed' | 'failed';
}
