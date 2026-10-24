import fs from 'fs';
import path from 'path';
import { formatMessage } from './messages';

const LOG_FILE = process.env.LOG_FILE || '/app/logs/notifications.log';

function ensureLogDir(): void {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function writeLog(event: Record<string, string>): void {
    const timestamp = event.timestamp || new Date().toISOString();
    const line = `[${timestamp}] NOTIFICATION → ${formatMessage(event)}`;

    console.log(line);

    try {
        ensureLogDir();
        fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8');
    } catch (err) {
        console.error("Impossible d'écrire dans le fichier de log:", err);
    }
}
