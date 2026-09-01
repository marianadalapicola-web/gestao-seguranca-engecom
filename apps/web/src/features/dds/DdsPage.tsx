import { EntityListPage } from '../../components/entity/EntityListPage';
import { formatDate } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface Dds {
  id: string;
  date: string;
  theme: string;
  participantsCount: number | null;
  site: { name: string } | null;
  sector: { name: string } | null;
  responsible: { name: string } | null;
}

const config: ModuleConfig<Dds> = {
  key: 'dds',
  apiPath: '/dds',
  title: 'Diálogos Diários de Segurança (DDS)',
  subtitle: 'Registro dos DDS realizados com as equipes.',
  singularLabel: 'DDS',
  searchPlaceholder: 'Pesquisar por tema...',
  defaultSortBy: 'date',
  defaultSortDir: 'desc',
  emptyDescription: 'Comece registrando o primeiro DDS.',
  getTitle: (r) => r.theme,
  attachmentsEnabled: true,
  columns: [
    { key: 'date', header: 'Data', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'theme', header: 'Tema' },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
    { key: 'responsible', header: 'Responsável', hideOnMobile: true, render: (r) => r.responsible?.name ?? '—' },
    { key: 'participantsCount', header: 'Participantes', render: (r) => r.participantsCount ?? '—' },
  ],
  filters: [
    { key: 'siteId', label: 'Obra', type: 'site' },
    { key: 'sectorId', label: 'Setor', type: 'sector' },
  ],
  formFields: [
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'theme', label: 'Tema do DDS', type: 'text', required: true },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'responsibleId', label: 'Responsável', type: 'user' },
    { name: 'participantsCount', label: 'Nº de participantes', type: 'number' },
    { name: 'participants', label: 'Participantes', type: 'textarea', span: 2 },
    { name: 'description', label: 'Descrição', type: 'textarea', span: 2 },
    { name: 'notes', label: 'Observações', type: 'textarea', span: 2 },
  ],
};

export function DdsPage() {
  return <EntityListPage config={config} />;
}
