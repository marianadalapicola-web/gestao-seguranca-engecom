import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ChecklistItem } from './api';

function triState(value: boolean | null): string {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return 'na';
}
function fromTriState(value: string): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

export function ChecklistEditor({
  items,
  onChange,
  disabled,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  disabled?: boolean;
}) {
  function updateItem(index: number, patch: Partial<ChecklistItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function addItem() {
    onChange([...items, { item: '', weight: 1, conforme: null, observacao: '' }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden sm:grid grid-cols-[1fr_80px_120px_1fr_32px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-500)] px-1">
        <span>Item verificado</span>
        <span>Peso</span>
        <span>Conforme?</span>
        <span>Observação</span>
        <span />
      </div>
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_1fr_32px] gap-2 items-start bg-[var(--color-surface)] rounded-md p-2">
          <Input
            value={item.item}
            placeholder="Ex.: Uso correto de EPI"
            disabled={disabled}
            onChange={(e) => updateItem(index, { item: e.target.value })}
          />
          <Input
            type="number"
            min={0}
            value={item.weight}
            disabled={disabled}
            onChange={(e) => updateItem(index, { weight: Number(e.target.value) })}
          />
          <select
            value={triState(item.conforme)}
            disabled={disabled}
            onChange={(e) => updateItem(index, { conforme: fromTriState(e.target.value) })}
            className="rounded-md border border-[var(--color-border-strong)] bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]"
          >
            <option value="true">Conforme</option>
            <option value="false">Não conforme</option>
            <option value="na">N/A</option>
          </select>
          <Input
            value={item.observacao ?? ''}
            placeholder="Observação"
            disabled={disabled}
            onChange={(e) => updateItem(index, { observacao: e.target.value })}
          />
          {!disabled && (
            <button onClick={() => removeItem(index)} className="text-[var(--color-danger-600)] hover:text-[var(--color-danger-700)] justify-self-end sm:justify-self-center mt-2">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <Button variant="outline" size="sm" onClick={addItem} className="self-start">
          <Plus size={14} /> Adicionar item ao checklist
        </Button>
      )}
    </div>
  );
}
