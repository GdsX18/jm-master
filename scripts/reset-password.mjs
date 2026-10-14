// Redefine a senha de um usuário do painel e desbloqueia a conta.
// Uso: node scripts/reset-password.mjs <email> [nova-senha]
// Sem a nova senha, gera uma senha forte aleatória e mostra no terminal.

import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

// Mesmo formato de src/lib/password.ts
function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

const [email, providedPassword] = process.argv.slice(2);

if (!email) {
  console.error('Uso: node scripts/reset-password.mjs <email> [nova-senha]');
  process.exit(1);
}

if (providedPassword && providedPassword.length < 8) {
  console.error('A senha deve ter pelo menos 8 caracteres.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    console.error(`Usuário ${email} não encontrado.`);
    process.exitCode = 1;
    return;
  }

  const password = providedPassword || randomBytes(12).toString('base64url');

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashPassword(password), isBlocked: false },
  });

  console.log(`\nSenha de ${user.email} (${user.role}) redefinida.`);
  if (!providedPassword) {
    console.log(`Nova senha: ${password}`);
    console.log('Guarde em um gerenciador de senhas — ela não fica salva em lugar nenhum.\n');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
