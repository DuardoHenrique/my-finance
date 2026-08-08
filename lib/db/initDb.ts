import { neon } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

export async function initPostgresDatabase() {
  if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
    console.log('No valid DATABASE_URL found. Skipping PostgreSQL initialization.');
    return false;
  }

  try {
    const sql = neon(databaseUrl);

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `;

    // Create assets table
    await sql`
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        ticker TEXT NOT NULL,
        quantity TEXT NOT NULL,
        average_price TEXT NOT NULL,
        currency TEXT NOT NULL,
        category TEXT NOT NULL,
        portfolio TEXT NOT NULL
      );
    `;

    console.log('PostgreSQL tables ensured successfully in Neon DB.');

    // Migrate local JSON users if table is empty
    const localUsersPath = path.join(process.cwd(), 'lib', 'db', 'users.json');
    try {
      const data = await fs.readFile(localUsersPath, 'utf8');
      const localUsers = JSON.parse(data);
      for (const u of localUsers) {
        await sql`
          INSERT INTO users (id, name, email, password_hash, created_at)
          VALUES (${u.id}, ${u.name}, ${u.email}, ${u.passwordHash}, ${u.createdAt})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    } catch {}

    // Migrate local JSON assets if table is empty
    const localAssetsPath = path.join(process.cwd(), 'lib', 'db', 'data.json');
    try {
      const data = await fs.readFile(localAssetsPath, 'utf8');
      const localAssets = JSON.parse(data);
      for (const a of localAssets) {
        await sql`
          INSERT INTO assets (id, user_id, name, ticker, quantity, average_price, currency, category, portfolio)
          VALUES (${a.id}, ${a.userId || null}, ${a.name}, ${a.ticker}, ${a.quantity}, ${a.averagePrice}, ${a.currency}, ${a.category}, ${a.portfolio})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    } catch {}

    return true;
  } catch (err) {
    console.error('Failed to initialize PostgreSQL DB:', err);
    return false;
  }
}
