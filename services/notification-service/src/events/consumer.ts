import Redis from 'ioredis';
import { writeLog } from '../logger';
import { sendEmailNotification } from '../mailer';

const STREAMS = [
    { name: 'task-events', group: 'notif-task-group' },
    { name: 'project-events', group: 'notif-project-group' },
];
const CONSUMER_NAME = 'notification-consumer-1';

async function ensureConsumerGroups(redis: Redis): Promise<void> {
    for (const stream of STREAMS) {
        try {
            await redis.xgroup(
                'CREATE',
                stream.name,
                stream.group,
                '0',
                'MKSTREAM',
            );
            console.log(
                `Consumer group "${stream.group}" créé sur "${stream.name}"`,
            );
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('BUSYGROUP')) {
                console.log(`Consumer group "${stream.group}" existe déjà`);
            } else {
                throw err;
            }
        }
    }
}

function parseFields(fields: string[]): Record<string, string> {
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
            const results = await redis.xreadgroup(
                'GROUP',
                STREAMS[0].group,
                CONSUMER_NAME,
                'COUNT',
                '10',
                'BLOCK',
                2000,
                'STREAMS',
                STREAMS[0].name,
                '>',
            );

            if (results) {
                for (const [, messages] of results as [
                    string,
                    [string, string[]][],
                ][]) {
                    for (const [messageId, fields] of messages) {
                        const event = parseFields(fields);
                        writeLog(event);
                        await sendEmailNotification(event);
                        await redis.xack(
                            STREAMS[0].name,
                            STREAMS[0].group,
                            messageId,
                        );
                    }
                }
            }

            const projectResults = await redis.xreadgroup(
                'GROUP',
                STREAMS[1].group,
                CONSUMER_NAME,
                'COUNT',
                '10',
                'BLOCK',
                2000,
                'STREAMS',
                STREAMS[1].name,
                '>',
            );

            if (projectResults) {
                for (const [, messages] of projectResults as [
                    string,
                    [string, string[]][],
                ][]) {
                    for (const [messageId, fields] of messages) {
                        const event = parseFields(fields);
                        writeLog(event);
                        await sendEmailNotification(event);
                        await redis.xack(
                            STREAMS[1].name,
                            STREAMS[1].group,
                            messageId,
                        );
                    }
                }
            }
        } catch (err) {
            console.error('Erreur lecture Redis Stream:', err);
            await new Promise((r) => setTimeout(r, 3000));
        }
    }
}
