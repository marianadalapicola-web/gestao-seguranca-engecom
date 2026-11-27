import { app } from './app';
import { env } from './config/env';
import { runActionPlanAlerts } from './modules/actionPlans/alerts';

const server = app.listen(env.port, () => {
  console.log(`ENGECOM Segurança API rodando na porta ${env.port} [${env.nodeEnv}]`);
});

const ALERTS_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
runActionPlanAlerts().catch((err) => console.error('runActionPlanAlerts (startup) failed:', err));
setInterval(() => {
  runActionPlanAlerts().catch((err) => console.error('runActionPlanAlerts (interval) failed:', err));
}, ALERTS_INTERVAL_MS);

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
