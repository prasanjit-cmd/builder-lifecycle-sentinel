import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = (await readdir(migrationsDir))
            .filter((file) => file.endsWith('.sql'))
            .sort((a, b) => a.localeCompare(b));
        for (const file of files) {
            const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
            if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
                console.log(`Skipping ${file} (already applied)`);
                continue;
            }
            const sql = await readFile(path.join(migrationsDir, file), 'utf8');
            console.log(`Applying ${file}`);
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
                await client.query('COMMIT');
                console.log(`Applied ${file}`);
            }
            catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        }
    }
    finally {
        await client.end();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
