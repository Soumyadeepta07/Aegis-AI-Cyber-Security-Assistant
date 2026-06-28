const fs = require('fs');
const path = require('path');
const net = require('net');
const { execSync } = require('child_process');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  const fallbackPath = path.join(__dirname, '../.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
    console.log('Found .env.local');
  } else if (fs.existsSync(fallbackPath)) {
    content = fs.readFileSync(fallbackPath, 'utf8');
    console.log('Found .env');
  } else {
    console.log('No .env or .env.local found');
  }

  const env = { ...process.env };
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const val = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  });
  return env;
}

function parseMysqlUrl(url) {
  try {
    // mysql://user:password@host:port/database
    if (!url.startsWith('mysql://')) return null;
    const cleanUrl = url.substring(8);
    const parts = cleanUrl.split('@');
    if (parts.length < 2) return null;
    const hostPortDb = parts[1].split('/')[0];
    const hostPort = hostPortDb.split(':');
    const host = hostPort[0];
    const port = hostPort[1] ? parseInt(hostPort[1]) : 3306;
    return { host, port };
  } catch (e) {
    return null;
  }
}

function testConnection(host, port) {
  return new Promise((resolve) => {
    console.log(`Probing TCP connection to MySQL at ${host}:${port}...`);
    const socket = new net.Socket();
    socket.setTimeout(1500); // 1.5 seconds timeout
    socket.on('connect', () => {
      socket.destroy();
      console.log('MySQL server is online!');
      resolve(true);
    });
    socket.on('error', (err) => {
      console.log(`MySQL probe failed: ${err.message}`);
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      console.log('MySQL probe timed out.');
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  const env = loadEnv();
  const mysqlUrl = env.DATABASE_URL;
  let useMysql = false;

  if (mysqlUrl) {
    const mysqlTarget = parseMysqlUrl(mysqlUrl);
    if (mysqlTarget) {
      useMysql = await testConnection(mysqlTarget.host, mysqlTarget.port);
    } else {
      console.log('Invalid MySQL connection string format in DATABASE_URL.');
    }
  } else {
    console.log('DATABASE_URL is not configured for MySQL.');
  }

  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error(`Error: Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  let schema = fs.readFileSync(schemaPath, 'utf8');
  let provider = 'sqlite';
  let urlEnvVar = 'LOCAL_DATABASE_URL';

  if (useMysql) {
    provider = 'mysql';
    urlEnvVar = 'DATABASE_URL';
    console.log('Switching Prisma Schema to MySQL mode.');
  } else {
    console.log('Switching Prisma Schema to SQLite fallback mode.');
    // Make sure LOCAL_DATABASE_URL is set in environment so Prisma CLI can read it
    if (!process.env.LOCAL_DATABASE_URL && !env.LOCAL_DATABASE_URL) {
      const defaultSqlitePath = 'file:./dev.db';
      process.env.LOCAL_DATABASE_URL = defaultSqlitePath;
      console.log(`Setting default LOCAL_DATABASE_URL: ${defaultSqlitePath}`);
    } else if (env.LOCAL_DATABASE_URL) {
      process.env.LOCAL_DATABASE_URL = env.LOCAL_DATABASE_URL;
    }
  }

  // Double check process env for database url so generate doesn't complain
  if (useMysql && mysqlUrl) {
    process.env.DATABASE_URL = mysqlUrl;
  }

  // Rewrite schema
  schema = schema.replace(/provider\s*=\s*"[^"]+"/, `provider = "${provider}"`);
  schema = schema.replace(/url\s*=\s*env\("[^"]+"\)/, `url = env("${urlEnvVar}")`);
  if (!useMysql) {
    schema = schema.replace(/@db\.Text/g, '');
  }
  fs.writeFileSync(schemaPath, schema, 'utf8');

  // Write runtime config JSON
  const configDir = path.join(__dirname, '../src/lib/db');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  const configPath = path.join(configDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify({ provider }, null, 2), 'utf8');
  console.log(`Updated database runtime config at: ${configPath}`);

  // Run Prisma Client Generation
  try {
    console.log('Running npx prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma Client generated successfully.');

    // If SQLite is active, run db push to ensure schema is synchronized
    if (!useMysql) {
      console.log('SQLite mode active. Synchronizing local database schema...');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      console.log('SQLite schema synchronized successfully.');
    }
  } catch (err) {
    const isLockError = err.message.includes('EPERM') || err.message.includes('operation not permitted') || err.message.includes('EBUSY');
    if (isLockError && fs.existsSync(path.join(__dirname, '../node_modules/.prisma/client'))) {
      console.warn('\n⚠️ Prisma Client is locked by another running process but already exists. Skipping regeneration to avoid Windows lock conflicts.\n');
    } else {
      console.error('Failed to prepare Prisma Client:', err.message);
      process.exit(1);
    }
  }
}

main();
