import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../../database/migrations');

const runMigrations = async () => {
  console.log('--- Running Supabase / Postgres Migrations ---');
  try {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Applying migration: ${file}...`);
      await connection.unsafe(sql);
      console.log(`✓ Applied ${file}`);
    }

    console.log('All migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await connection.end();
  }
};

runMigrations();
