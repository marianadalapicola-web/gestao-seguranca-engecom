/**
 * Seed script — intentionally minimal.
 *
 * Per the project's data policy, this system must never ship with fabricated
 * business records (fake rituals, DDS, deviations, etc.) used just to make
 * the UI look populated. The only thing seeded here is the first
 * Administrator account, without which nobody could log in at all.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin@engecom.com.br').toLowerCase();
  const name = process.env.ADMIN_SEED_NAME ?? 'Administrador ENGECOM';
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMe123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Usuário administrador já existe: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
  });

  console.log(`[seed] Administrador criado: ${email}`);
  console.log('[seed] IMPORTANTE: altere a senha padrão assim que possível.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
