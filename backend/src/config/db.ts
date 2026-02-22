import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

// Monkey-patch pool.query for Slow Query Monitoring
const originalQuery = pool.query;
pool.query = async function (this: any, ...args: any[]): Promise<any> {
    const start = Date.now();
    try {
        const res: any = await originalQuery.apply(this, args as any);
        const duration = Date.now() - start;
        const queryName = typeof args[0] === 'string' ? args[0].substring(0, 60).replace(/\n/g, ' ') + '...' : 'Query';

        if (duration > 2000) {
            console.error(`[DB:ERROR] Extremely Slow Query (${duration}ms): ${queryName} | Rows: ${res.rowCount}`);
        } else if (duration > 500) {
            console.warn(`[DB:WARN] Slow Query (${duration}ms): ${queryName} | Rows: ${res.rowCount}`);
        }
        return res;
    } catch (err) {
        throw err;
    }
};

// We expose a health check function instead of executing it on module load immediately,
// which prevents crashes during build/test steps if DB isn't up, unless explicitly called.
export const checkDbConnection = async () => {
    try {
        await pool.query('SELECT 1');
        logger.info('✅ Database connection established');
        return true;
    } catch (err) {
        logger.error({ err }, '❌ Database connection failed');
        return false;
    }
};
