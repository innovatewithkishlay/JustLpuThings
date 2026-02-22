import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function runMigrations() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const files = fs.readdirSync(MIGRATIONS_DIR).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                const filePath = path.join(MIGRATIONS_DIR, file);
                const sql = fs.readFileSync(filePath, 'utf8');

                console.log(`Executing migration: ${file}...`);
                await client.query(sql);
                console.log(`✓ Migration ${file} applied successfully.`);
            }
        }

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

runMigrations();
