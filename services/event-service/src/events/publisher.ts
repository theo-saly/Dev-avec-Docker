import Redis from 'ioredis';

const STREAM_NAME = 'project-events';

let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: 6379,
            retryStrategy: (times) => Math.min(times * 500, 5000),
        });
    }
    return redis;
}

export async function publishEvent(
    eventType: string,
    payload: Record<string, string>,
): Promise<void> {
    try {
        const client = getRedis();
        await client.xadd(
            STREAM_NAME,
            '*',
            'eventType',
            eventType,
            'projectId',
            payload.projectId,
            'projectName',
            payload.projectName || '',
            'ownerId',
            payload.ownerId || '',
            'timestamp',
            new Date().toISOString(),
        );
    } catch (err) {
        console.error(`Erreur publication événement ${eventType}:`, err);
    }
}
