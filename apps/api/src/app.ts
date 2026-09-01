import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/routes';
import usersRoutes from './modules/users/routes';
import sitesRoutes from './modules/sites/routes';
import sectorsRoutes from './modules/sectors/routes';
import ritualsRoutes from './modules/rituals/routes';
import ddsRoutes from './modules/dds/routes';
import inspectionsRoutes from './modules/inspections/routes';
import deviationsRoutes from './modules/deviations/routes';
import incidentsRoutes from './modules/incidents/routes';
import refusalRightsRoutes from './modules/refusalRights/routes';
import managerialInspectionsRoutes from './modules/managerialInspections/routes';
import actionPlansRoutes from './modules/actionPlans/routes';
import indicatorsRoutes from './modules/indicators/routes';
import idsRoutes from './modules/ids/routes';
import notificationsRoutes from './modules/notifications/routes';
import auditRoutes from './modules/audit/routes';
import attachmentsRoutes from './modules/attachments/routes';
import dashboardRoutes from './modules/dashboard/routes';
import reportsRoutes from './modules/reports/routes';
import searchRoutes from './modules/search/routes';
import leadershipRankingRoutes from './modules/leadershipRanking/routes';
import leadersRoutes from './modules/leaders/routes';
import { AVATAR_UPLOAD_ROOT } from './lib/attachmentStorage';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests (curl, server-to-server, the single-service
      // Railway deployment) send no Origin header at all — always allow.
      callback(null, !origin || env.webAppUrls.includes(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!env.isProduction) {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/sectors', sectorsRoutes);
app.use('/api/rituals', ritualsRoutes);
app.use('/api/dds', ddsRoutes);
app.use('/api/inspections', inspectionsRoutes);
app.use('/api/deviations', deviationsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/refusal-rights', refusalRightsRoutes);
app.use('/api/managerial-inspections', managerialInspectionsRoutes);
app.use('/api/action-plans', actionPlansRoutes);
app.use('/api/indicators', indicatorsRoutes);
app.use('/api/ids', idsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/leadership-ranking', leadershipRankingRoutes);
app.use('/api/leaders', leadersRoutes);

// Fotos de perfil: arquivo estático simples (não passa pelo controle de
// permissão por módulo dos anexos — é uma foto de perfil, não um registro
// de segurança). Nomes de arquivo são UUIDs, não previsíveis.
app.use('/api/avatars', express.static(AVATAR_UPLOAD_ROOT));

// In production this single service also serves the built React app, so
// only one deployable unit (+ Postgres) is needed. In development the
// frontend runs on its own Vite dev server (port 5173) instead — this
// block is a no-op there.
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (env.isProduction && fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
