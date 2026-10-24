import Redis from 'ioredis';
import { writeLog } from '../logger';
import { sendEmailNotification } from '../mailer';

const STREAMS = ['ticket-events', 'event-events'];
const GROUP = 'notif-group';
const CONSUMER_NAME = 'notification-consumer-1';

async function ensureConsumerGroups(redis: Redis): Promise<void> {
    for (const stream of STREAMS) {
        try {
            await redis.xgroup('CREATE', stream, GROUP, '0', 'MKSTREAM');
            console.log(`Consumer group "${GROUP}" créé sur "${stream}"`);
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('BUSYGROUP')) {
                console.log(`Consumer group "${GROUP}" existe déjà`);
            } else {
                throw err;
            }
        }
    }
}

export function parseFields(fields: string[]): Record<string, string> {
    const event: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
        event[fields[i]] = fields[i + 1];
    }
    return event;
}

export async function startConsumer(): Promise<void> {
    const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
        retryStrategy: (times) => Math.min(times * 500, 5000),
    });

    await ensureConsumerGroups(redis);
    console.log('Écoute des événements sur Redis Streams...');

    while (true) {
        try {
            const results = (await redis.xreadgroup(
                'GROUP',
                GROUP,
                CONSUMER_NAME,
                'COUNT',
                '10',
                'BLOCK',
                2000,
                'STREAMS',
                ...STREAMS,
                ...STREAMS.map(() => '>'),
            )) as [string, [string, string[]][]][] | null;

            for (const [stream, messages] of results ?? []) {
                for (const [messageId, fields] of messages) {
                    const event = parseFields(fields);
                    writeLog(event);
                    await sendEmailNotification(event);
                    await redis.xack(stream, GROUP, messageId);
                }
            }
        } catch (err) {
            console.error('Erreur lecture Redis Stream:', err);
            await new Promise((r) => setTimeout(r, 3000));
        }
    }
}
