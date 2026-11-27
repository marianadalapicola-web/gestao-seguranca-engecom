import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginatedResponse } from '../types';

interface UseServerTableOptions<T> {
  queryKey: string;
  fetcher: (params: Record<string, string | number | undefined>) => Promise<PaginatedResponse<T>>;
  initialSortBy?: string;
  initialSortDir?: 'asc' | 'desc';
  pageSize?: number;
  extraParams?: Record<string, string | undefined>;
}

export function useServerTable<T>({
  queryKey,
  fetcher,
  initialSortBy,
  initialSortDir = 'desc',
  pageSize = 20,
  extraParams,
}: UseServerTableOptions<T>) {
  const [search, setSearchState] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      search: search || undefined,
      ...filters,
      ...extraParams,
      sortBy,
      sortDir,
      page,
      pageSize,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, filters, extraParams, sortBy, sortDir, page, pageSize]
  );

  const query = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => fetcher(params),
    placeholderData: (prev) => prev,
  });

  function setSearch(value: string) {
    setSearchState(value);
    setPage(1);
  }

  function updateFilter(key: string, value: string) {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    setPage(1);
  }

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  }

  function clearFilters() {
    setFilters({});
    setSearchState('');
    setPage(1);
  }

  const hasActiveFilters = search.length > 0 || Object.keys(filters).length > 0;

  return {
    search,
    setSearch,
    filters,
    updateFilter,
    sortBy,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    clearFilters,
    hasActiveFilters,
    query,
  };
}
