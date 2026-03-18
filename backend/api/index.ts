import app from '../src/app';
import { runStartupMigrations } from '../src/config/migrate';

// Lazy migration runner for serverless environments
let migrationPromise: Promise<boolean> | null = null;

export default async (req: any, res: any) => {
    if (!migrationPromise) {
        migrationPromise = runStartupMigrations();
    }

    await migrationPromise;
    return app(req, res);
};
