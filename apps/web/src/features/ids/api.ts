import { api } from '../../lib/api';

export interface IdsRecord {
  id: string;
  period: string;
  value: number | null;
  target: number | null;
  classification: string | null;
  notes: string | null;
  percentAchieved?: number | null;
}

export interface IdsSummary {
  current: (IdsRecord & { percentAchieved: number | null }) | null;
  previous: IdsRecord | null;
  history: IdsRecord[];
}

export interface IdsConfig {
  id: string;
  formulaDescription: string | null;
  weights: Record<string, number> | null;
}

export async function fetchIdsSummary(): Promise<IdsSummary> {
  const { data } = await api.get('/ids/summary');
  return data;
}

export async function fetchIdsRecords(): Promise<{ items: IdsRecord[] }> {
  const { data } = await api.get('/ids/records');
  return data;
}

export async function fetchIdsConfig(): Promise<IdsConfig> {
  const { data } = await api.get('/ids/config');
  return data.config;
}

export async function updateIdsConfig(payload: { formulaDescription?: string }): Promise<IdsConfig> {
  const { data } = await api.patch('/ids/config', payload);
  return data.config;
}

export async function upsertIdsRecord(payload: { period: string; value?: number; target?: number; notes?: string }): Promise<IdsRecord> {
  const { data } = await api.put('/ids/records', payload);
  return data.item;
}

export async function deleteIdsRecord(id: string): Promise<void> {
  await api.delete(`/ids/records/${id}`);
}
