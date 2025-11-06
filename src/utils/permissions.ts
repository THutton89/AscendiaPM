import { Permission, Role, RolePermissions } from '../types/permissions';

export const rolePermissions: RolePermissions = {
  admin: [
    'create_project',
    'delete_project',
    'edit_project',
    'create_sprint',
    'delete_sprint',
    'edit_sprint',
    'create_task',
    'delete_task',
    'edit_task',
    'assign_task',
    'view_all_tasks',
    'edit_time_entries',
    'manage_users',
    'manage_roles',
    'view_reports',
    'edit_code'
  ],
  manager: [
    'create_project',
    'edit_project',
    'create_sprint',
    'edit_sprint',
    'create_task',
    'edit_task',
    'assign_task',
    'view_all_tasks',
    'edit_time_entries',
    'view_reports',
    'edit_code'
  ],
  member: [
    'create_task',
    'edit_task',
    'view_all_tasks'
  ],
  guest: [
    'view_all_tasks'
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getUserPermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? [];
}