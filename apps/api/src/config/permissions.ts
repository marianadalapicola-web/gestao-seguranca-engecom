/**
 * Single source of truth for Role-Based Access Control.
 *
 * This matrix is consumed by:
 *  - the `authorize()` Express middleware (enforced server-side on every route)
 *  - the `/api/auth/me` response, so the frontend can hide/disable UI accordingly
 *
 * IMPORTANT: the frontend NEVER decides access on its own. It only reflects
 * what this matrix already grants. Every mutating/reading route must call
 * authorize(module, action) — hiding a button is not access control.
 */

export type Role = 'ADMIN' | 'SAFETY_ENGINEER' | 'SAFETY_TECHNICIAN' | 'LEADERSHIP';

export type Module =
  | 'dashboard'
  | 'ids'
  | 'rituals'
  | 'dds'
  | 'inspections'
  | 'deviations'
  | 'incidents'
  | 'refusalRights'
  | 'managerialInspections'
  | 'actionPlans'
  | 'indicators'
  | 'reports'
  | 'notifications'
  | 'users'
  | 'audit'
  | 'config'
  | 'sites'
  | 'sectors'
  | 'attachments'
  | 'search'
  | 'leadershipRanking'
  | 'leaders'
  | 'leaderEvaluations';

export type Action = 'create' | 'read' | 'update' | 'delete';

type ModulePermissions = Record<Action, boolean>;
type RoleMatrix = Record<Module, ModulePermissions>;

const ALL: ModulePermissions = { create: true, read: true, update: true, delete: true };
const READ_ONLY: ModulePermissions = { create: false, read: true, update: false, delete: false };
const NONE: ModulePermissions = { create: false, read: false, update: false, delete: false };
const CRU: ModulePermissions = { create: true, read: true, update: true, delete: false };
const RU: ModulePermissions = { create: false, read: true, update: true, delete: false };

function full(): RoleMatrix {
  return {
    dashboard: ALL,
    ids: ALL,
    rituals: ALL,
    dds: ALL,
    inspections: ALL,
    deviations: ALL,
    incidents: ALL,
    refusalRights: ALL,
    managerialInspections: ALL,
    actionPlans: ALL,
    indicators: ALL,
    reports: ALL,
    notifications: ALL,
    users: ALL,
    audit: ALL,
    config: ALL,
    sites: ALL,
    sectors: ALL,
    attachments: ALL,
    search: ALL,
    leadershipRanking: ALL,
    leaders: ALL,
    leaderEvaluations: ALL,
  };
}

export const PERMISSIONS: Record<Role, RoleMatrix> = {
  // Perfil 1 — Administrador: acesso total, sem restrições.
  ADMIN: full(),

  // Perfil 2 — Engenheira de Segurança: tudo, EXCETO gestão de usuários,
  // auditoria completa e configurações administrativas do sistema.
  SAFETY_ENGINEER: {
    ...full(),
    users: NONE,
    audit: NONE,
    config: READ_ONLY,
  },

  // Perfil 3 — Técnico de Segurança: mesmo nível de acesso da Engenheira de
  // Segurança — tudo, EXCETO gestão de usuários, auditoria completa e
  // configurações administrativas do sistema.
  SAFETY_TECHNICIAN: {
    ...full(),
    users: NONE,
    audit: NONE,
    config: READ_ONLY,
  },

  // Perfil 4 — Liderança: acesso restrito a cadastrar apenas Inspeções e
  // Desvios; os demais registros operacionais (DDS, Rituais) ficam somente
  // leitura para a liderança.
  LEADERSHIP: {
    dashboard: READ_ONLY,
    ids: READ_ONLY,
    rituals: READ_ONLY,
    dds: READ_ONLY,
    inspections: CRU,
    deviations: CRU,
    incidents: NONE,
    refusalRights: NONE,
    managerialInspections: NONE,
    actionPlans: RU,
    indicators: READ_ONLY,
    reports: READ_ONLY,
    notifications: RU,
    users: NONE,
    audit: NONE,
    config: NONE,
    // CRU para permitir digitar uma nova obra/setor direto no formulário
    // de Inspeções/Desvios — ver components/ui/Combobox.tsx no frontend.
    sites: CRU,
    sectors: CRU,
    attachments: CRU,
    search: READ_ONLY,
    leadershipRanking: READ_ONLY,
    // A liderança já compara pontuações de todos os líderes via
    // leadershipRanking (ranking público). O cadastro/gestão de líderes fica
    // fora do alcance desse perfil, mas o próprio líder pode ler suas
    // avaliações (nunca as de outro líder — restrição aplicada no
    // controller, não apenas por este módulo) para acompanhar seu
    // desempenho.
    leaders: NONE,
    leaderEvaluations: READ_ONLY,
  },
};

export function hasPermission(role: Role, module: Module, action: Action): boolean {
  const matrix = PERMISSIONS[role];
  if (!matrix) return false;
  return Boolean(matrix[module]?.[action]);
}

export function getPermissionsForRole(role: Role): RoleMatrix {
  return PERMISSIONS[role];
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  SAFETY_ENGINEER: 'Engenheira de Segurança',
  SAFETY_TECHNICIAN: 'Técnico de Segurança',
  LEADERSHIP: 'Liderança',
};
