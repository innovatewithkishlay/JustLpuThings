import { Redis } from '@upstash/redis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis({
    url: env.REDIS_URL,
    token: env.REDIS_TOKEN,
});

export const checkRedisConnection = async () => {
    try {
        await redis.ping();
        logger.info('✅ Redis connection established');
        return true;
    } catch (err) {
        logger.error({ err }, '❌ Redis connection failed');
        return false;
    }
};
