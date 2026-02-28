import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';

export class R2Service {
    private static _s3Client: S3Client | null = null;

    private static get s3() {
        if (this._s3Client) return this._s3Client;

        if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
            throw new Error('Storage layer credentials are not configured');
        }

        this._s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env.R2_ACCESS_KEY_ID,
                secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            },
        });

        return this._s3Client;
    }

    private static async withRetry<T>(fn: () => Promise<T>, timeoutMs = 10000, retries = 1): Promise<T> {
        let lastErr: any;
        for (let i = 0; i <= retries; i++) {
            try {
                const res = await Promise.race([
                    fn(),
                    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_EXCEEDED')), timeoutMs))
                ]);
                return res as T;
            } catch (err) {
                lastErr = err;
                console.warn(`[R2:WARN] Operation failed (attempt ${i + 1}/${retries + 1}):`, (err as Error).message);
            }
        }
        throw lastErr;
    }

    /**
     * Generates a short-lived signed URL for a given file Key
     */
    static async generateSignedUrl(key: string, expirySeconds: number = 120): Promise<string> {
        try {
            return await this.withRetry(async () => {
                const command = new GetObjectCommand({
                    Bucket: env.R2_BUCKET_NAME as string,
                    Key: key,
                    ResponseContentType: 'application/pdf',
                    ResponseContentDisposition: 'inline',
                    ResponseCacheControl: 'no-store, no-cache, must-revalidate, max-age=0'
                });
                return await getSignedUrl(this.s3, command, { expiresIn: expirySeconds });
            }, 5000, 1);
        } catch (error) {
            console.error('[R2:ERROR] Signed URL generation completely failed', error);
            throw { statusCode: 503, message: 'Storage layer unreachable. Please try again.' };
        }
    }

    /**
     * Uploads a Buffer directly into R2
     */
    static async uploadFile(buffer: Buffer, key: string, contentType: string = 'application/pdf'): Promise<boolean> {
        try {
            await this.withRetry(async () => {
                const command = new PutObjectCommand({
                    Bucket: env.R2_BUCKET_NAME as string,
                    Key: key,
                    Body: buffer,
                    ContentType: contentType,
                });
                await this.s3.send(command);
            }, 10000, 1);
            return true;
        } catch (error) {
            console.error('[R2:ERROR] Upload failed:', error);
            return false;
        }
    }

    /**
     * Deletes a file forcefully from R2
     */
    static async deleteFile(key: string): Promise<boolean> {
        try {
            await this.withRetry(async () => {
                const command = new DeleteObjectCommand({
                    Bucket: env.R2_BUCKET_NAME as string,
                    Key: key,
                });
                await this.s3.send(command);
            }, 10000, 1);
            return true;
        } catch (error) {
            console.error('[R2:ERROR] Delete failed:', error);
            return false;
        }
    }

    /**
     * Retrieves a ReadableStream for a given file Key
     */
    static async getReadableStream(key: string): Promise<any> {
        try {
            return await this.withRetry(async () => {
                const command = new GetObjectCommand({
                    Bucket: env.R2_BUCKET_NAME as string,
                    Key: key,
                });
                const response = await this.s3.send(command);
                return response.Body;
            }, 10000, 1);
        } catch (error) {
            console.error('[R2:ERROR] Failed to get readable stream:', error);
            throw { statusCode: 503, message: 'Storage layer unreachable' };
        }
    }
}
