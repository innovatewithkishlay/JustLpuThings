import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL + "?sslmode=verify-full"
});

async function run() {
    await client.connect();

    console.log("Updating PENDING materials to ACTIVE...");
    const res = await client.query("UPDATE materials SET status = 'ACTIVE' WHERE status = 'PENDING'");
    console.log(`Updated ${res.rowCount} materials.`);

    await client.end();
}

run().catch(console.error);
