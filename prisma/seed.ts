import fs from 'fs';
import path from 'path';

// Load environment variables before instantiating PrismaClient
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  const fallbackPath = path.join(__dirname, '../.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(fallbackPath)) {
    content = fs.readFileSync(fallbackPath, 'utf8');
  }
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const val = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  });

  if (!process.env.LOCAL_DATABASE_URL) {
    process.env.LOCAL_DATABASE_URL = 'file:./dev.db';
  }
}
loadEnv();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CVES = [
  {
    cveId: 'CVE-2021-44228',
    severity: 'critical',
    description: 'Apache Log4j2 2.0-beta9 through 2.15.0 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints.',
    mitigation: 'Upgrade to Apache Log4j 2.15.0 or set system property log4j2.formatMsgNoLookups=true.',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-44228', 'https://github.com/advisories/GHSA-j2ge-g243-5887'],
  },
  {
    cveId: 'CVE-2014-0160',
    severity: 'high',
    description: 'The (1) TLS and (2) DTLS implementations in OpenSSL 1.0.1 before 1.0.1g do not properly handle Heartbeat Extension packets, which allows remote attackers to obtain sensitive information from process memory (Heartbleed).',
    mitigation: 'Upgrade to OpenSSL 1.0.1g or compile OpenSSL with -DOPENSSL_NO_HEARTBEATS.',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2014-0160', 'https://heartbleed.com'],
  },
  {
    cveId: 'CVE-2017-0144',
    severity: 'critical',
    description: 'The SMBv1 server in Microsoft Windows Vista SP2, Windows 7 SP1, Windows 8.1, Windows RT 8.1, Windows 10 Gold, 1511, and 1607, Windows Server 2008 SP2 and R2 SP1, Windows Server 2012 Gold and R2, and Windows Server 2016 allows remote attackers to execute arbitrary code via crafted packets (EternalBlue).',
    mitigation: 'Apply MS17-010 security update or disable SMBv1 protocols.',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2017-0144'],
  },
  {
    cveId: 'CVE-2023-38831',
    severity: 'high',
    description: 'RARLAB WinRAR before 6.23 allows attackers to execute arbitrary code because a device-specific file extension validation failure occurs when processing archives.',
    mitigation: 'Upgrade WinRAR to 6.23 or newer versions.',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-38831'],
  },
  {
    cveId: 'CVE-2024-3094',
    severity: 'critical',
    description: 'Malicious code was discovered in the upstream tarballs of xz, starting with version 5.6.0, which compromises sshd authentication and allows remote code execution.',
    mitigation: 'Downgrade xz-utils to version 5.4.x or upgrade to fixed Linux distribution patches.',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-3094'],
  }
];

async function main() {
  console.log('Seeding database users and CVEs...');
  
  const passwordHash = bcrypt.hashSync('password123', 10);
  
  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aicyber.com' },
    update: {},
    create: {
      name: 'Admin Security',
      email: 'admin@aicyber.com',
      password: passwordHash,
      role: 'admin',
      emailVerified: true,
    },
  });
  console.log('Upserted Admin User:', admin.email);

  // Upsert Admin Account
  await prisma.account.upsert({
    where: { id: 'admin_account_id' },
    update: {
      accountId: admin.id,
      providerId: 'credential',
      password: passwordHash,
    },
    create: {
      id: 'admin_account_id',
      accountId: admin.id,
      providerId: 'credential',
      userId: admin.id,
      password: passwordHash,
    }
  });
  console.log('Upserted Admin Account credentials');

  // Upsert User
  const user = await prisma.user.upsert({
    where: { email: 'user@aicyber.com' },
    update: {},
    create: {
      name: 'Standard User',
      email: 'user@aicyber.com',
      password: passwordHash,
      role: 'user',
      emailVerified: true,
    },
  });
  console.log('Upserted User User:', user.email);

  // Upsert User Account
  await prisma.account.upsert({
    where: { id: 'user_account_id' },
    update: {
      accountId: user.id,
      providerId: 'credential',
      password: passwordHash,
    },
    create: {
      id: 'user_account_id',
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
    }
  });
  console.log('Upserted User Account credentials');

  // Upsert CVEs
  for (const cve of DEFAULT_CVES) {
    await prisma.cVE.upsert({
      where: { cveId: cve.cveId },
      update: {
        severity: cve.severity,
        description: cve.description,
        mitigation: cve.mitigation,
        references: JSON.stringify(cve.references),
      },
      create: {
        cveId: cve.cveId,
        severity: cve.severity,
        description: cve.description,
        mitigation: cve.mitigation,
        references: JSON.stringify(cve.references),
      },
    });
    console.log(`Seeded CVE: ${cve.cveId}`);
  }
  
  console.log('Database seeding successfully completed.');
}

main()
  .catch((e) => {
    console.error('Seeding process encountered an error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
