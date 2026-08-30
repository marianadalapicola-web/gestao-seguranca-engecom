import { api } from '../../lib/api';

export interface DashboardFilters {
  siteId?: string;
  sectorId?: string;
  responsibleId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardSummary {
  ids: { value: number | null; target: number | null; period: string; classification: string | null } | null;
  dds: number;
  rituals: number;
  inspections: number;
  deviations: { total: number; open: number; resolved: number };
  incidents: number;
  refusalRights: number;
  actionPlans: { open: number; overdue: number };
  compliancePercentage: number | null;
}

export async function fetchDashboardSummary(filters: DashboardFilters): Promise<DashboardSummary> {
  const { data } = await api.get('/dashboard/summary', { params: filters });
  return data;
}

export interface EvolutionPoint {
  period: string;
  dds: number;
  rituals: number;
  inspections: number;
  deviations: number;
}

export async function fetchDashboardEvolution(filters: DashboardFilters, months = 6): Promise<EvolutionPoint[]> {
  const { data } = await api.get('/dashboard/evolution', { params: { ...filters, months } });
  return data.items;
}

export interface SectorPerformance {
  sectorId: string;
  sectorName: string;
  deviations: number;
  resolved: number;
  inspections: number;
  performance: number | null;
}

export async function fetchDashboardBySector(filters: DashboardFilters): Promise<SectorPerformance[]> {
  const { data } = await api.get('/dashboard/by-sector', { params: filters });
  return data.items;
}
