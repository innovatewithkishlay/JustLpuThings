import { pool } from './src/config/db';

async function migrate() {
    try {
        console.log('Starting migration: Adding is_active to semesters...');

        // 1. Add column
        await pool.query(`
            ALTER TABLE semesters 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false
        `);

        // 2. Set baseline active semesters (1, 2, 4)
        await pool.query(`
            UPDATE semesters 
            SET is_active = true 
            WHERE number IN (1, 2, 4)
        `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
