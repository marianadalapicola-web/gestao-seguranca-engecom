import {
  LayoutDashboard,
  Gauge,
  Megaphone,
  MessageSquare,
  ClipboardCheck,
  AlertTriangle,
  Siren,
  HandMetal,
  ClipboardList,
  ListChecks,
  BarChart3,
  FileText,
  Bell,
  UserCog,
  History,
  Settings,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKey } from '../types';

export interface NavItem {
  label: string;
  path: string;
  module: ModuleKey;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', module: 'dashboard', icon: LayoutDashboard },
  { label: 'IDS', path: '/ids', module: 'ids', icon: Gauge },
  { label: 'Rituais', path: '/rituais', module: 'rituals', icon: Megaphone },
  { label: 'DDS', path: '/dds', module: 'dds', icon: MessageSquare },
  { label: 'Inspeções', path: '/inspecoes', module: 'inspections', icon: ClipboardCheck },
  { label: 'Desvios', path: '/desvios', module: 'deviations', icon: AlertTriangle },
  { label: 'Incidentes', path: '/incidentes', module: 'incidents', icon: Siren },
  { label: 'Direito de Recusa', path: '/direito-de-recusa', module: 'refusalRights', icon: HandMetal },
  { label: 'Inspeção Gerencial/Cruzada', path: '/inspecao-gerencial', module: 'managerialInspections', icon: ClipboardList },
  { label: 'Planos de Ação', path: '/planos-de-acao', module: 'actionPlans', icon: ListChecks },
  { label: 'Indicadores', path: '/indicadores', module: 'indicators', icon: BarChart3 },
  { label: 'Ranking de Liderança', path: '/ranking-lideranca', module: 'leadershipRanking', icon: Trophy },
  { label: 'Relatórios', path: '/relatorios', module: 'reports', icon: FileText },
  { label: 'Notificações', path: '/notificacoes', module: 'notifications', icon: Bell },
  { label: 'Usuários', path: '/usuarios', module: 'users', icon: UserCog },
  { label: 'Auditoria', path: '/auditoria', module: 'audit', icon: History },
  { label: 'Configurações', path: '/configuracoes', module: 'config', icon: Settings },
];
