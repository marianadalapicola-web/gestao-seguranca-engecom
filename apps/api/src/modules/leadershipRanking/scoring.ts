/**
 * Ranking de Liderança — pesos e regras de pontuação.
 *
 * Pesos sugeridos pela ENGECOM (ajustáveis aqui se a empresa oficializar
 * outros valores — o restante do cálculo não precisa mudar):
 *   DDS realizados ............................. 20%
 *   Inspeções realizadas ........................ 20%
 *   Desvios tratados (taxa de resolução) ........ 15%
 *   Planos de ação concluídos no prazo .......... 25%
 *   Incidentes (quanto menos, melhor) ........... 10%
 *   Resultado geral das inspeções gerenciais .... 10%
 *
 * Intencionalmente, "DDS" e "Inspeções" pontuam pela QUANTIDADE realizada
 * (normalizada contra o líder de melhor desempenho do período), enquanto
 * "Desvios tratados" e "Planos no prazo" pontuam pela TAXA de resolução —
 * não pela quantidade de desvios abertos. Isso evita premiar quem apenas
 * registra mais desvios/incidentes, conforme pedido: a qualidade da gestão
 * conta mais do que o volume de ocorrências.
 */
export const RANKING_WEIGHTS = {
  dds: 0.2,
  inspections: 0.2,
  deviationsTreated: 0.15,
  actionPlansOnTime: 0.25,
  incidents: 0.1,
  inspectionResult: 0.1,
} as const;

export type ScoreComponentKey = keyof typeof RANKING_WEIGHTS;

export function classifyScore(score: number): string {
  if (score >= 90) return 'Excelente';
  if (score >= 80) return 'Muito bom';
  if (score >= 70) return 'Bom';
  if (score >= 60) return 'Regular';
  return 'Necessita melhoria';
}

/** Quantidade normalizada contra o melhor valor do grupo no período (0–100). */
export function relativeScore(value: number, groupMax: number): number {
  if (groupMax <= 0) return 0;
  return Math.round(Math.min(1, value / groupMax) * 10000) / 100;
}

/** Taxa numerador/denominador (0–100). Sem exposição (denominador 0) = neutro-positivo. */
export function rateScore(numerator: number, denominator: number): number {
  if (denominator <= 0) return 100;
  return Math.round(Math.min(1, numerator / denominator) * 10000) / 100;
}

export interface ScoreComponent {
  raw: unknown;
  score: number | null;
  weight: number;
}

/**
 * Combina os componentes em uma nota final 0–100. Um componente com score
 * `null` (sem dado aplicável no período — ex.: nenhuma inspeção gerencial
 * na área) é excluído e seu peso é redistribuído proporcionalmente entre os
 * demais, em vez de fabricar um valor ou zerar a nota injustamente.
 */
export function combineScores(components: Record<ScoreComponentKey, ScoreComponent>): number {
  const available = Object.values(components).filter((c) => c.score !== null);
  const totalAvailableWeight = available.reduce((sum, c) => sum + c.weight, 0);
  if (totalAvailableWeight === 0) return 0;

  const weighted = available.reduce((sum, c) => sum + (c.score as number) * (c.weight / totalAvailableWeight), 0);
  return Math.round(weighted * 100) / 100;
}
