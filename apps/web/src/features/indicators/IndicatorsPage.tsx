import { EntityListPage } from '../../components/entity/EntityListPage';
import { formatPeriod } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface Indicator {
  id: string;
  name: string;
  unit: string | null;
  targetValue: number | null;
  resultValue: number | null;
  period: string;
  status: string | null;
  sector: { name: string } | null;
  responsible: { name: string } | null;
}

const config: ModuleConfig<Indicator> = {
  key: 'indicators',
  apiPath: '/indicators',
  title: 'Indicadores',
  subtitle: 'Central de indicadores de segurança do trabalho.',
  singularLabel: 'Indicador',
  searchPlaceholder: 'Pesquisar por nome...',
  defaultSortBy: 'period',
  defaultSortDir: 'desc',
  emptyDescription: 'Cadastre o primeiro indicador para começar a acompanhar a evolução.',
  getTitle: (r) => r.name,
  columns: [
    { key: 'period', header: 'Período', render: (r) => formatPeriod(r.period) },
    { key: 'name', header: 'Indicador' },
    { key: 'targetValue', header: 'Meta', render: (r) => (r.targetValue ?? '—') + (r.unit ? ` ${r.unit}` : '') },
    { key: 'resultValue', header: 'Resultado', render: (r) => (r.resultValue ?? '—') + (r.unit ? ` ${r.unit}` : '') },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
    { key: 'responsible', header: 'Responsável', hideOnMobile: true, render: (r) => r.responsible?.name ?? '—' },
  ],
  filters: [
    { key: 'siteId', label: 'Obra', type: 'site' },
    { key: 'sectorId', label: 'Setor', type: 'sector' },
  ],
  formFields: [
    { name: 'name', label: 'Nome do indicador', type: 'text', required: true, span: 2 },
    { name: 'period', label: 'Período (AAAA-MM)', type: 'text', required: true, placeholder: '2026-01' },
    { name: 'unit', label: 'Unidade', type: 'text', placeholder: '%, un., h...' },
    { name: 'targetValue', label: 'Meta', type: 'number' },
    { name: 'resultValue', label: 'Resultado', type: 'number' },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'responsibleId', label: 'Responsável', type: 'user' },
    { name: 'status', label: 'Status', type: 'text' },
  ],
};

export function IndicatorsPage() {
  return <EntityListPage config={config} />;
}
