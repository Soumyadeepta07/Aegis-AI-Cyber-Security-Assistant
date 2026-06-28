import { PrismaClient } from '@prisma/client';
import dbConfig from './config.json';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export function getDbMode() {
  const provider = dbConfig.provider || 'sqlite';
  return {
    isSqlite: provider === 'sqlite',
    provider,
  };
}
