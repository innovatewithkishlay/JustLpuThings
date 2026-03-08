import { pool } from './src/config/db';

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'semesters'
        `);
        console.log('Semesters Table Columns:');
        console.table(res.rows);

        const statusRes = await pool.query('SELECT * FROM semesters LIMIT 5');
        console.log('\nSemesters Table Sample Data:');
        console.table(statusRes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
