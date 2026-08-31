export type PeriodPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface PeriodRange {
  from: Date;
  to: Date;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Resolves one of the ranking's period filters ("hoje", "semana", "mês",
 * "trimestre", "ano" ou um intervalo personalizado) into a concrete date
 * range, anchored on the current moment.
 */
export function resolvePeriod(preset: PeriodPreset, customFrom?: string, customTo?: string): PeriodRange {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'week': {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = startOfDay(now);
      monday.setDate(monday.getDate() - diffToMonday);
      return { from: monday, to: endOfDay(now) };
    }
    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(first), to: endOfDay(now) };
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const first = new Date(now.getFullYear(), quarter * 3, 1);
      return { from: startOfDay(first), to: endOfDay(now) };
    }
    case 'year': {
      const first = new Date(now.getFullYear(), 0, 1);
      return { from: startOfDay(first), to: endOfDay(now) };
    }
    case 'custom':
    default: {
      const from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      return { from, to };
    }
  }
}

/** The immediately preceding window of the same duration, used for "evolução". */
export function previousPeriod(range: PeriodRange): PeriodRange {
  const durationMs = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime() - 1);
  const from = new Date(to.getTime() - durationMs);
  return { from, to };
}
