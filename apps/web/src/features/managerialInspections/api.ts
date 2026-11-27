import { api } from '../../lib/api';
import type { PaginatedResponse } from '../../types';

export interface ChecklistItem {
  item: string;
  weight: number;
  conforme: boolean | null;
  observacao?: string;
}

export interface ManagerialInspection {
  id: string;
  date: string;
  team: string | null;
  sectorId: string | null;
  sector: { id: string; name: string } | null;
  checklist: ChecklistItem[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: string | null;
  nonConformities: string | null;
  notes: string | null;
  createdBy: { name: string } | null;
}

export interface ListParams {
  search?: string;
  sectorId?: string;
  page?: number;
  pageSize?: number;
}

export async function listManagerialInspections(params: ListParams): Promise<PaginatedResponse<ManagerialInspection>> {
  const { data } = await api.get('/managerial-inspections', { params });
  return data;
}

export async function getManagerialInspection(id: string): Promise<ManagerialInspection> {
  const { data } = await api.get(`/managerial-inspections/${id}`);
  return data.item;
}

export interface ManagerialInspectionPayload {
  date: string;
  team?: string;
  sectorId?: string;
  checklist: ChecklistItem[];
  nonConformities?: string;
  notes?: string;
}

export async function createManagerialInspection(payload: ManagerialInspectionPayload) {
  const { data } = await api.post('/managerial-inspections', payload);
  return data.item as ManagerialInspection;
}

export async function updateManagerialInspection(id: string, payload: Partial<ManagerialInspectionPayload>) {
  const { data } = await api.patch(`/managerial-inspections/${id}`, payload);
  return data.item as ManagerialInspection;
}

export async function deleteManagerialInspection(id: string) {
  await api.delete(`/managerial-inspections/${id}`);
}
