/**
 * Run once to seed the admin account into the production Neon DB.
 * Usage: npx ts-node seed-admin.ts
 */
import bcrypt from 'bcrypt';
import { pool } from './src/config/db';

async function seedAdmin() {
    const email = 'guddu@lputhing.com';
    const password = 'guddukishu19@';
    const name = 'Guddu Admin';

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'ADMIN')
         ON CONFLICT (email) DO UPDATE
           SET role = 'ADMIN',
               password_hash = EXCLUDED.password_hash
         RETURNING id, email, role`,
        [name, email, hash]
    );

    console.log('✅ Admin user seeded:', result.rows[0]);
    await pool.end();
}

seedAdmin().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
