import { api } from '../../lib/api';
import type { PaginatedResponse, Role, UserStatus } from '../../types';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  status: UserStatus;
  position: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ListUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedResponse<ManagedUser>> {
  const { data } = await api.get('/users', { params });
  return data;
}

export async function getUser(id: string): Promise<ManagedUser> {
  const { data } = await api.get(`/users/${id}`);
  return data.user;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  position?: string;
}

export async function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const { data } = await api.post('/users', payload);
  return data.user;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
  position?: string;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.user;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
