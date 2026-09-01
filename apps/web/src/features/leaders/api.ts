import { api } from '../../lib/api';
import type { UserStatus } from '../../types';

export interface LeaderSectorRef {
  id: string;
  name: string;
}

export interface Leader {
  id: string;
  name: string;
  email: string | null;
  hasSystemAccess: boolean;
  position: string | null;
  status: UserStatus;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  sectorsLed: LeaderSectorRef[];
}

export interface ListLeadersParams {
  search?: string;
  sectorId?: string;
  status?: string;
}

export async function listLeaders(params: ListLeadersParams = {}): Promise<Leader[]> {
  const { data } = await api.get('/leaders', { params });
  return data.items;
}

export async function getLeader(id: string): Promise<Leader> {
  const { data } = await api.get(`/leaders/${id}`);
  return data.leader;
}

export interface CreateLeaderPayload {
  name: string;
  position?: string;
  hasSystemAccess: boolean;
  email?: string;
  password?: string;
}

export async function createLeader(payload: CreateLeaderPayload): Promise<Leader> {
  const { data } = await api.post('/leaders', payload);
  return data.leader;
}

export interface UpdateLeaderPayload {
  name?: string;
  position?: string | null;
  status?: UserStatus;
  hasSystemAccess?: boolean;
  email?: string;
  password?: string;
}

export async function updateLeader(id: string, payload: UpdateLeaderPayload): Promise<Leader> {
  const { data } = await api.patch(`/leaders/${id}`, payload);
  return data.leader;
}

export async function deleteLeader(id: string): Promise<void> {
  await api.delete(`/leaders/${id}`);
}

export interface LeaderEvaluation {
  id: string;
  leaderId: string;
  evaluatorId: string;
  date: string;
  leadershipScore: number;
  communicationScore: number;
  safetyCommitmentScore: number;
  notes: string | null;
  createdAt: string;
  evaluator: { id: string; name: string };
}

export async function listLeaderEvaluations(leaderId: string): Promise<LeaderEvaluation[]> {
  const { data } = await api.get(`/leaders/${leaderId}/evaluations`);
  return data.items;
}

export interface CreateEvaluationPayload {
  date?: string;
  leadershipScore: number;
  communicationScore: number;
  safetyCommitmentScore: number;
  notes?: string;
}

export async function createLeaderEvaluation(leaderId: string, payload: CreateEvaluationPayload): Promise<LeaderEvaluation> {
  const { data } = await api.post(`/leaders/${leaderId}/evaluations`, payload);
  return data.evaluation;
}
