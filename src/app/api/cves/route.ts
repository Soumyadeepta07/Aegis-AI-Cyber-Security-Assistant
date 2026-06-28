import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDbMode } from '@/lib/db/prisma';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const severity = searchParams.get('severity') || 'all';

    const { provider } = getDbMode();

    // Auto Seed Real Database if empty
    const count = await prisma.cVE.count();
    if (count === 0) {
      console.log('[CVE Database] Seeding default CVE entries...');
      await prisma.cVE.createMany({
        data: DEFAULT_CVES.map(c => ({
          cveId: c.cveId,
          severity: c.severity,
          description: c.description,
          mitigation: c.mitigation,
          references: JSON.stringify(c.references)
        }))
      });
    }

    // Query Builder
    const whereClause: any = {};
    if (severity && severity !== 'all') {
      whereClause.severity = severity.toLowerCase();
    }
    if (query) {
      whereClause.OR = [
        { cveId: { contains: query } },
        { description: { contains: query } },
        { mitigation: { contains: query } },
      ];
    }

    const cvesList = await prisma.cVE.findMany({
      where: whereClause,
      orderBy: { cveId: 'desc' }
    });

    // Parse references JSON
    const parsedCves = cvesList.map(c => {
      let referencesArray = [];
      try {
        referencesArray = JSON.parse(c.references);
      } catch (e) {
        referencesArray = [];
      }
      return {
        id: c.id,
        cveId: c.cveId,
        severity: c.severity,
        description: c.description,
        mitigation: c.mitigation,
        references: referencesArray,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      cves: parsedCves,
      dbMode: provider,
    });
  } catch (e: any) {
    console.error('CVE database API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
