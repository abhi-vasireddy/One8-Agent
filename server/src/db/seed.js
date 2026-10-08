import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedsDir = path.resolve(__dirname, '../../../database/seeds');

const runSeeds = async () => {
  console.log('--- Seeding Supabase / Postgres Database ---');
  try {
    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Executing seed: ${file}...`);
      await connection.unsafe(sql);
      console.log(`✓ Executed ${file}`);
    }

    console.log('Database seeding finished successfully!');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await connection.end();
  }
};

runSeeds();
