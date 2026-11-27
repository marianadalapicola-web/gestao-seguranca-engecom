import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { api } from '../../lib/api';
import { useSites, useSectors } from '../../hooks/useReferenceData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Select } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';

interface ReportModule {
  key: string;
  title: string;
}

export function ReportsPage() {
  const { data: modules, isLoading } = useQuery({
    queryKey: ['reports', 'modules'],
    queryFn: async () => {
      const { data } = await api.get<{ items: ReportModule[] }>('/reports/modules');
      return data.items;
    },
  });

  const { data: sites } = useSites();
  const { data: sectors } = useSectors();

  const [moduleKey, setModuleKey] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [siteId, setSiteId] = useState('');
  const [sectorId, setSectorId] = useState('');

  function buildUrl(format: 'csv' | 'xlsx' | 'pdf') {
    const params = new URLSearchParams({ format });
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (siteId) params.set('siteId', siteId);
    if (sectorId) params.set('sectorId', sectorId);
    return `/api/reports/${moduleKey}/export?${params.toString()}`;
  }

  function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    if (!moduleKey) return;
    window.open(buildUrl(format), '_blank');
  }

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Exportação de dados dos módulos de segurança em Excel, CSV ou PDF." />

      <Card>
        <CardHeader title="Gerar relatório" />
        <CardBody className="flex flex-col gap-4">
          {isLoading ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Módulo" required>
                <Select value={moduleKey} onChange={(e) => setModuleKey(e.target.value)}>
                  <option value="">Selecione...</option>
                  {modules?.map((m) => (
                    <option key={m.key} value={m.key}>{m.title}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Obra">
                <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                  <option value="">Todas</option>
                  {sites?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Setor">
                <Select value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
                  <option value="">Todos</option>
                  {sectors?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="De">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-md border border-[var(--color-border-strong)] px-2 py-2 text-sm" />
                </Field>
                <Field label="Até">
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-md border border-[var(--color-border-strong)] px-2 py-2 text-sm" />
                </Field>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button variant="secondary" disabled={!moduleKey} onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet size={15} /> Exportar Excel
            </Button>
            <Button variant="secondary" disabled={!moduleKey} onClick={() => handleExport('csv')}>
              <FileText size={15} /> Exportar CSV
            </Button>
            <Button variant="secondary" disabled={!moduleKey} onClick={() => handleExport('pdf')}>
              <Printer size={15} /> Exportar / Imprimir PDF
            </Button>
          </div>
          {!moduleKey && <p className="text-xs text-[var(--color-ink-500)]">Selecione um módulo para habilitar a exportação.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
