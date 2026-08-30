import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Role, SelectOption } from '../types';

export interface SectorOption extends SelectOption {
  siteId: string | null;
}

export interface DirectoryUser {
  id: string;
  name: string;
  role: Role;
}

export function useSites() {
  return useQuery({
    queryKey: ['reference', 'sites'],
    queryFn: async () => {
      const { data } = await api.get<{ items: SelectOption[] }>('/sites');
      return data.items;
    },
    staleTime: 5 * 60_000,
  });
}

export function useSectors(siteId?: string) {
  return useQuery({
    queryKey: ['reference', 'sectors', siteId],
    queryFn: async () => {
      const { data } = await api.get<{ items: SectorOption[] }>('/sectors', { params: siteId ? { siteId } : undefined });
      return data.items;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUsersDirectory() {
  return useQuery({
    queryKey: ['reference', 'users-directory'],
    queryFn: async () => {
      const { data } = await api.get<{ items: DirectoryUser[] }>('/users/directory');
      return data.items;
    },
    staleTime: 5 * 60_000,
  });
}
