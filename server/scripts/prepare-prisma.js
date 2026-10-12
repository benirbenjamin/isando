import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');

const dbUrl = (process.env.DATABASE_URL || '').trim();
const explicitProvider = (process.env.DB_PROVIDER || '').trim().toLowerCase();

let targetProvider = null;

if (explicitProvider === 'mysql' || explicitProvider === 'postgresql' || explicitProvider === 'postgres') {
  targetProvider = explicitProvider === 'mysql' ? 'mysql' : 'postgresql';
} else if (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql:')) {
  targetProvider = 'mysql';
} else if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  targetProvider = 'postgresql';
}

if (!targetProvider) {
  if (dbUrl.includes('mysql')) {
    targetProvider = 'mysql';
  } else if (dbUrl.includes('postgres') || dbUrl.includes('supabase') || dbUrl.includes('neon')) {
    targetProvider = 'postgresql';
  }
}

// Default to mysql if provider couldn't be determined from DATABASE_URL
if (!targetProvider) {
  targetProvider = 'mysql';
}

if (fs.existsSync(schemaPath)) {
  let content = fs.readFileSync(schemaPath, 'utf8');
  const providerRegex = /provider\s*=\s*"(postgresql|mysql)"/;
  if (providerRegex.test(content)) {
    const current = content.match(providerRegex)[1];
    if (current !== targetProvider) {
      content = content.replace(providerRegex, `provider = "${targetProvider}"`);
      fs.writeFileSync(schemaPath, content, 'utf8');
      console.log(`[prepare-prisma] Updated Prisma datasource provider from "${current}" to "${targetProvider}".`);
    } else {
      console.log(`[prepare-prisma] Prisma provider is already set to "${targetProvider}".`);
    }
  }
} else {
  console.warn(`[prepare-prisma] schema.prisma not found at ${schemaPath}`);
}
