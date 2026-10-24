import fs from 'fs';
import path from 'path';

const LOG_FILE = process.env.LOG_FILE || '/app/logs/notifications.log';

function ensureLogDir(): void {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function formatNotification(event: Record<string, string>): string {
    const timestamp = event.timestamp || new Date().toISOString();

    switch (event.eventType) {
        case 'ProjectCompleted':
            return `[${timestamp}] NOTIFICATION → Utilisateur ${event.ownerId} : Le projet "${event.projectName}" (${event.projectId}) est terminé. Félicitations !`;

        case 'TaskReopened':
            return `[${timestamp}] NOTIFICATION → Tâche réouverte : La tâche ${event.taskId} du projet ${event.projectId} a été réouverte (${event.oldStatus} → ${event.newStatus}). Attention, le projet ne peut plus être clôturé.`;

        case 'TaskCompleted':
            return `[${timestamp}] EVENT → Tâche terminée : La tâche ${event.taskId} du projet ${event.projectId} est passée à "terminé" (${event.oldStatus} → ${event.newStatus}).`;

        default:
            return `[${timestamp}] EVENT → ${event.eventType} | ${JSON.stringify(event)}`;
    }
}

export function writeLog(event: Record<string, string>): void {
    ensureLogDir();

    const line = formatNotification(event) + '\n';

    fs.appendFileSync(LOG_FILE, line, 'utf-8');
    console.log(line.trim());
}
