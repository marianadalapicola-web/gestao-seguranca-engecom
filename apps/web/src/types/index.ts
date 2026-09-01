export type Role = 'ADMIN' | 'SAFETY_ENGINEER' | 'SAFETY_TECHNICIAN' | 'LEADERSHIP';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export type ModuleKey =
  | 'dashboard'
  | 'ids'
  | 'rituals'
  | 'dds'
  | 'inspections'
  | 'deviations'
  | 'incidents'
  | 'refusalRights'
  | 'managerialInspections'
  | 'actionPlans'
  | 'indicators'
  | 'reports'
  | 'notifications'
  | 'users'
  | 'audit'
  | 'config'
  | 'sites'
  | 'sectors'
  | 'attachments'
  | 'search'
  | 'leadershipRanking'
  | 'leaders'
  | 'leaderEvaluations';

export type Action = 'create' | 'read' | 'update' | 'delete';

export type PermissionMatrix = Record<ModuleKey, Record<Action, boolean>>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  status: UserStatus;
  position: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  permissions: PermissionMatrix;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SelectOption {
  id: string;
  name: string;
}

export interface PersonRef {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Attachment {
  id: string;
  module: string;
  recordId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  SAFETY_ENGINEER: 'Engenheira de Segurança',
  SAFETY_TECHNICIAN: 'Técnico de Segurança',
  LEADERSHIP: 'Liderança',
};

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
