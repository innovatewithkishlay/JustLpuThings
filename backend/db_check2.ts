import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL + "?sslmode=verify-full"
});

async function run() {
    await client.connect();

    console.log("Fetching all materials with status...");
    const res = await client.query("SELECT id, title, status FROM materials");
    console.table(res.rows);

    await client.end();
}

run().catch(console.error);
