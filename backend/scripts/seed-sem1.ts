import { pool } from '../src/config/db';
import process from 'process';

async function seed() {
    console.log('🌱 Starting seed for Semester 1 and MTH165...');

    try {
        const firstCollege = await pool.query('SELECT id FROM colleges LIMIT 1');
        if (firstCollege.rows.length === 0) {
            console.error('❌ No college found in database. Please ensure colleges table is seeded.');
            process.exit(1);
        }
        const collegeId = firstCollege.rows[0].id;
        console.log(`📍 Found College ID: ${collegeId}`);

        // Upsert Semester 1
        const semResult = await pool.query(
            'INSERT INTO semesters (college_id, number) VALUES ($1, 1) ON CONFLICT (college_id, number) DO UPDATE SET number = EXCLUDED.number RETURNING id',
            [collegeId]
        );
        const semId = semResult.rows[0].id;
        console.log(`✅ Semester 1 ensures (ID: ${semId})`);

        // Upsert MTH165 for Semester 1
        await pool.query(
            'INSERT INTO subjects (semester_id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (semester_id, slug) DO UPDATE SET name = EXCLUDED.name',
            [semId, 'Mathematics', 'mth165']
        );
        console.log('✅ MTH165 subject ensures for Semester 1');

        console.log('🏁 Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
