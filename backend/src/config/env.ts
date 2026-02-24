import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z
        .string()
        .default('3000')
        .transform((val) => Number(val)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_VERSION: z.string().default('1.0.0'),
    FRONTEND_URL: z.string().url(),

    JWT_ACCESS_EXPIRES: z.string(),
    JWT_REFRESH_EXPIRES: z.string(),

    RATE_LIMIT_PUBLIC: z.string().transform(Number),
    RATE_LIMIT_AUTH: z.string().transform(Number),
    RATE_LIMIT_ACCESS: z.string().transform(Number),
    RATE_LIMIT_ADMIN: z.string().transform(Number),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    DATABASE_URL: z.string().url(),

    REDIS_URL: z.string().url(),
    REDIS_TOKEN: z.string(),

    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),

    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),

    // Google OAuth (optional — set before using Google Sign-In)
    GOOGLE_CLIENT_ID: z.string().default(''),
    GOOGLE_CLIENT_SECRET: z.string().default(''),
    GOOGLE_CALLBACK_URL: z.string().default('http://localhost:8000/api/v1/auth/callback/google'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 4));
    process.exit(1);
}

export const env = _env.data;
