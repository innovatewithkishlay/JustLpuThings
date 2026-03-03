import { pool } from './src/config/db';

async function check() {
    try {
        const colleges = await pool.query('SELECT * FROM colleges');
        console.log('Colleges:', colleges.rows);

        const semesters = await pool.query('SELECT * FROM semesters');
        console.log('Semesters:', semesters.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
