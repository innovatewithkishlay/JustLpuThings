// run_migration_15.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const sql = `
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_read_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_messages_reply_unread ON messages(id) WHERE reply_read_at IS NULL AND admin_reply IS NOT NULL;
`;

async function run() {
    try {
        await client.connect();
        console.log('[migration] Connected to database.');
        await client.query(sql);
        console.log('[migration] Migration 15 (reply_read_at) applied successfully.');
    } catch (err) {
        console.error('[migration] Error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
