import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  action: 'create' | 'read' | 'update' | 'delete' | 'comment';
  resource: 'wbs' | 'tasks' | 'budget' | 'risks' | 'stakeholders' | 'status_reports' | 'scope_changes';
}

export const PERMISSIONS_KEY = 'permissions';
export const CheckPermissions = (action: RequiredPermission['action'], resource: RequiredPermission['resource']) =>
  SetMetadata(PERMISSIONS_KEY, { action, resource });
