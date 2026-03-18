import app from '../src/app';
import { runStartupMigrations } from '../src/config/migrate';

// Lazy migration runner for serverless environments
let migrationPromise: Promise<boolean> | null = null;

export default async (req: any, res: any) => {
    try {
        if (!migrationPromise) {
            console.log('[VERCEL:BOOT] Initializing migration & app...');
            migrationPromise = runStartupMigrations();
        }

        const success = await migrationPromise;
        if (!success) {
            console.error('[VERCEL:BOOT] Migration failed, but attempting to serve...');
        }

        return app(req, res);
    } catch (err) {
        console.error('[VERCEL:FATAL] Initialization failed:', err);
        return res.status(500).json({
            success: false,
            error: 'Serverless Initialization failed',
            details: err instanceof Error ? err.message : String(err)
        });
    }
};
