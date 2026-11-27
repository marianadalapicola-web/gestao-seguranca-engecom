import type { ReactNode } from 'react';
import type { Column } from '../ui/DataTable';
import type { Action, ModuleKey } from '../../types';

export type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'number' | 'select' | 'site' | 'sector' | 'user';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  placeholder?: string;
  span?: 1 | 2;
  helperText?: string;
  userRoleFilter?: string[];
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'site' | 'sector' | 'user';
  options?: FieldOption[];
}

export interface ModuleConfig<T = Record<string, unknown>> {
  key: ModuleKey;
  apiPath: string;
  title: string;
  subtitle?: string;
  singularLabel: string;
  searchPlaceholder: string;
  columns: Column<T>[];
  filters?: FilterConfig[];
  formFields: FieldConfig[];
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  emptyTitle?: string;
  emptyDescription?: string;
  getTitle: (record: T) => string;
  attachmentsEnabled?: boolean;
  extraActions?: (record: T) => ReactNode;
  requiredAction?: Action;
}
