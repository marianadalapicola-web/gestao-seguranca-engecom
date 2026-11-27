import { api } from '../../lib/api';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}
export interface SearchGroup {
  module: string;
  label: string;
  items: SearchResultItem[];
}

export async function globalSearch(term: string): Promise<{ groups: SearchGroup[] }> {
  const { data } = await api.get('/search', { params: { q: term } });
  return data;
}
