import { pool } from '../src/config/db';

async function main() {
    try {
        console.log('Enabling Semester 6 in the database...');
        const res = await pool.query('UPDATE semesters SET is_active = true WHERE number = 6 RETURNING *');
        console.log('Update result:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
