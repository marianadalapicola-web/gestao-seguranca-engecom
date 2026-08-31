import clsx from 'clsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field } from '../ui/Field';
import { Input, Select, Textarea } from '../ui/Input';
import { Combobox } from '../ui/Combobox';
import { api } from '../../lib/api';
import { useSectors, useSites, useUsersDirectory } from '../../hooks/useReferenceData';
import type { FieldConfig } from './types';

export type FormValues = Record<string, string>;
export type FormErrors = Record<string, string>;

export function validateFields(fields: FieldConfig[], values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.required && (!value || value.trim() === '')) {
      errors[field.name] = 'Campo obrigatório.';
      continue;
    }
    if (field.type === 'number' && value && Number.isNaN(Number(value))) {
      errors[field.name] = 'Informe um número válido.';
    }
  }
  return errors;
}

export function EntityForm({
  fields,
  values,
  errors,
  onChange,
  disabled,
}: {
  fields: FieldConfig[];
  values: FormValues;
  errors: FormErrors;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
}) {
  const { data: sites } = useSites();
  const { data: sectors } = useSectors(values.siteId || undefined);
  const { data: users } = useUsersDirectory();
  const queryClient = useQueryClient();

  const createSite = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/sites', { name });
      queryClient.invalidateQueries({ queryKey: ['reference', 'sites'] });
      return { id: data.site.id, name: data.site.name };
    },
  });

  const createSector = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/sectors', { name, siteId: values.siteId || undefined });
      queryClient.invalidateQueries({ queryKey: ['reference', 'sectors'] });
      return { id: data.sector.id, name: data.sector.name };
    },
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => {
        const commonProps = {
          hasError: !!errors[field.name],
          disabled,
        };
        const wrapperClass = field.span === 2 ? 'sm:col-span-2' : undefined;

        let control: React.ReactNode;

        if (field.type === 'textarea') {
          control = (
            <Textarea
              {...commonProps}
              value={values[field.name] ?? ''}
              placeholder={field.placeholder}
              onChange={(e) => onChange(field.name, e.target.value)}
            />
          );
        } else if (field.type === 'select') {
          control = (
            <Select {...commonProps} value={values[field.name] ?? ''} onChange={(e) => onChange(field.name, e.target.value)}>
              <option value="">Selecione...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          );
        } else if (field.type === 'site') {
          control = (
            <Combobox
              {...commonProps}
              value={values[field.name] ?? ''}
              options={sites ?? []}
              onSelect={(id) => onChange(field.name, id)}
              onCreate={(name) => createSite.mutateAsync(name)}
              placeholder="Digite ou selecione a obra/unidade..."
            />
          );
        } else if (field.type === 'sector') {
          control = (
            <Combobox
              {...commonProps}
              value={values[field.name] ?? ''}
              options={sectors ?? []}
              onSelect={(id) => onChange(field.name, id)}
              onCreate={(name) => createSector.mutateAsync(name)}
              placeholder="Digite ou selecione o setor..."
            />
          );
        } else if (field.type === 'user') {
          const filtered = field.userRoleFilter ? users?.filter((u) => field.userRoleFilter!.includes(u.role)) : users;
          control = (
            <Select {...commonProps} value={values[field.name] ?? ''} onChange={(e) => onChange(field.name, e.target.value)}>
              <option value="">Selecione a pessoa...</option>
              {filtered?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          );
        } else {
          control = (
            <Input
              {...commonProps}
              type={field.type === 'number' ? 'number' : field.type}
              placeholder={field.placeholder}
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
            />
          );
        }

        return (
          <Field
            key={field.name}
            label={field.label}
            required={field.required}
            error={errors[field.name]}
            hint={field.helperText}
            className={clsx(wrapperClass)}
          >
            {control}
          </Field>
        );
      })}
    </div>
  );
}
