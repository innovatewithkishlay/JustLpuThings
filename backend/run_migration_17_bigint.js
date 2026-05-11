// run_migration_17_bigint.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const sql = `
-- 1. Upgrade time_spent in material_progress to BIGINT
ALTER TABLE material_progress ALTER COLUMN time_spent TYPE BIGINT;

-- 2. Upgrade time_spent_increment in user_reading_history to BIGINT
ALTER TABLE user_reading_history ALTER COLUMN time_spent_increment TYPE BIGINT;

-- 3. Just in case, upgrade any other potentially large counters
-- (colleges/semesters/subjects counts are small, so they are fine)
`;

async function run() {
    try {
        await client.connect();
        console.log('[migration] Connected to database.');
        await client.query(sql);
        console.log('[migration] Migration 17 (upgrade to BIGINT) applied successfully.');
    } catch (err) {
        console.error('[migration] Error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
