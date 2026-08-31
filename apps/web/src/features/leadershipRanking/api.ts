import { api } from '../../lib/api';

export type PeriodPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface RankingFilters {
  period?: PeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  sectorId?: string;
  siteId?: string;
}

export const PERIOD_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Ano' },
  { value: 'custom', label: 'Personalizado' },
];

export type ScoreComponentKey =
  | 'dds'
  | 'inspections'
  | 'deviationsTreated'
  | 'actionPlansOnTime'
  | 'incidents'
  | 'inspectionResult';

export const SCORE_COMPONENT_LABELS: Record<ScoreComponentKey, string> = {
  dds: 'DDS realizados',
  inspections: 'Inspeções realizadas',
  deviationsTreated: 'Desvios tratados',
  actionPlansOnTime: 'Planos de ação no prazo',
  incidents: 'Incidentes',
  inspectionResult: 'Resultado das inspeções gerenciais',
};

export interface ScoreComponentView {
  raw: number | null;
  score: number | null;
  weight: number;
}

export interface LeaderMetrics {
  ddsCount: number;
  inspectionsCount: number;
  deviationsFound: number;
  deviationsResolved: number;
  deviationsResolutionRate: number;
  actionPlansDue: number;
  actionPlansOnTime: number;
  actionPlansOnTimeRate: number;
  actionPlansOverdue: number;
  incidentsCount: number;
  managerialInspectionAvgPercentage: number | null;
}

export interface LeaderRankingEntry {
  userId: string;
  name: string;
  position: number;
  sectorNames: string[];
  siteNames: string[];
  score: number;
  classification: string;
  metrics: LeaderMetrics;
  scoreBreakdown: Record<ScoreComponentKey, ScoreComponentView>;
  evolution: 'up' | 'down' | 'same' | 'new';
  positionDelta: number;
  previousPosition: number | null;
  previousScore: number | null;
}

export interface RankingResponse {
  items: LeaderRankingEntry[];
  hasSufficientData: boolean;
  range: { from: string; to: string };
}

export interface RankingSummaryResponse {
  hasSufficientData: boolean;
  top: LeaderRankingEntry[];
  bestEvolution: { name: string; delta: number } | null;
}

export interface ScoreHistoryPoint {
  period: string;
  score: number | null;
}

export interface LeaderDetailResponse extends LeaderRankingEntry {
  history: ScoreHistoryPoint[];
}

function buildParams(filters: RankingFilters) {
  return {
    period: filters.period ?? 'month',
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sectorId: filters.sectorId,
    siteId: filters.siteId,
  };
}

export async function fetchLeadershipRanking(filters: RankingFilters): Promise<RankingResponse> {
  const { data } = await api.get('/leadership-ranking', { params: buildParams(filters) });
  return data;
}

export async function fetchLeadershipRankingSummary(filters: RankingFilters): Promise<RankingSummaryResponse> {
  const { data } = await api.get('/leadership-ranking/summary', { params: buildParams(filters) });
  return data;
}

export async function fetchLeaderDetail(userId: string, filters: RankingFilters): Promise<LeaderDetailResponse> {
  const { data } = await api.get(`/leadership-ranking/${userId}`, { params: buildParams(filters) });
  return data;
}
