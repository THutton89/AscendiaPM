export type Permission =
  | 'create_project'
  | 'delete_project'
  | 'edit_project'
  | 'create_sprint'
  | 'delete_sprint'
  | 'edit_sprint'
  | 'create_task'
  | 'delete_task'
  | 'edit_task'
  | 'assign_task'
  | 'view_all_tasks'
  | 'edit_time_entries'
  | 'manage_users'
  | 'manage_roles'
  | 'view_reports'
  | 'edit_code'
  | 'log_time'
  | 'manage_meetings';

export type Role = 'admin' | 'manager' | 'member' | 'guest';

export interface RolePermissions {
  [role: string]: Permission[];
}