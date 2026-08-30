interface ChecklistItem {
  item: string;
  weight: number;
  conforme: boolean | null;
  observacao?: string | null;
}

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: string;
}

/**
 * Weighted checklist scoring for inspeções gerenciais/cruzadas.
 * Items marked "não aplicável" (conforme = null) are excluded from both
 * the achieved and the possible score. Classification bands are a
 * reasonable operational default — ENGECOM can adjust the thresholds once
 * an official standard is provided, without needing a schema change.
 */
export function computeChecklistScore(checklist: ChecklistItem[]): ScoreResult {
  let totalScore = 0;
  let maxScore = 0;

  for (const entry of checklist) {
    if (entry.conforme === null || entry.conforme === undefined) continue;
    maxScore += entry.weight;
    if (entry.conforme) totalScore += entry.weight;
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  let classification = 'Crítico';
  if (percentage >= 90) classification = 'Excelente';
  else if (percentage >= 75) classification = 'Bom';
  else if (percentage >= 60) classification = 'Regular';

  return { totalScore, maxScore, percentage: Math.round(percentage * 100) / 100, classification };
}
