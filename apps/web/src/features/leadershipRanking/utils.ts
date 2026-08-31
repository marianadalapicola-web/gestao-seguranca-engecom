export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export function classificationVariant(classification: string): BadgeVariant {
  switch (classification) {
    case 'Excelente':
      return 'success';
    case 'Muito bom':
      return 'brand';
    case 'Bom':
      return 'info';
    case 'Regular':
      return 'warning';
    default:
      return 'danger';
  }
}

export function medalFor(position: number): string | null {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return null;
}

export function evolutionIcon(evolution: 'up' | 'down' | 'same' | 'new'): string {
  if (evolution === 'up') return '⬆️';
  if (evolution === 'down') return '⬇️';
  if (evolution === 'same') return '➡️';
  return '✨';
}

export function evolutionLabel(evolution: 'up' | 'down' | 'same' | 'new', positionDelta: number): string {
  if (evolution === 'up') return `Subiu ${Math.abs(positionDelta)} posição${Math.abs(positionDelta) > 1 ? 'ões' : ''}`;
  if (evolution === 'down') return `Caiu ${Math.abs(positionDelta)} posição${Math.abs(positionDelta) > 1 ? 'ões' : ''}`;
  if (evolution === 'same') return 'Manteve a posição';
  return 'Novo no ranking';
}
