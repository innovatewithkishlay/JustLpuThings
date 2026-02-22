import { pool } from '../../config/db';
import { redis } from '../../config/redis';
import { R2Service } from '../storage/r2.service';

export class AccessService {

    static async requestAccess(slug: string, userId: string, ip: string | undefined, userAgent: string | undefined) {
        const cacheKey = `material:meta:${slug}`;

        // 1. Check Redis for Cached metadata
        let metadataStr = await redis.get(cacheKey) as string | null;
        let metadata: { id: string, file_key: string };

        if (metadataStr) {
            metadata = typeof metadataStr === 'string' ? JSON.parse(metadataStr) : metadataStr;
        } else {
            // 2. Cache miss -> Hit Postgres
            const result = await pool.query(
                "SELECT id, file_key FROM materials WHERE slug = $1 AND status = 'ACTIVE'",
                [slug]
            );

            if (!result.rows.length) {
                throw { statusCode: 404, message: 'Material not found' };
            }

            metadata = result.rows[0];

            // Cache minimal metadata struct (TTL 60s)
            await redis.set(cacheKey, JSON.stringify(metadata), { ex: 60 });
        }

        // 3. Log telemetry asynchronously via Redis Queue
        const eventPayload = JSON.stringify({
            userId,
            materialId: metadata.id,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        });

        redis.lpush('analytics_queue', eventPayload).catch(e => console.error('Silent drop on analytics enqueue', e));

        // 4. Compute R2 Signed URL natively
        const signedUrl = await R2Service.generateSignedUrl(metadata.file_key, 120);

        return { url: signedUrl };
    }
}
