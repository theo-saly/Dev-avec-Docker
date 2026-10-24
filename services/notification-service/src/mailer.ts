import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || '465');
const SMTP_SECURE =
    (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_RECIPIENT = process.env.SMTP_RECIPIENT || SMTP_USER;
const AUTH_SERVICE_URL =
    process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const PROJECT_SERVICE_URL =
    process.env.PROJECT_SERVICE_URL || 'http://project-service:3002';

function isMailEnabled(): boolean {
    return Boolean(
        SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM && SMTP_RECIPIENT,
    );
}

const transporter = isMailEnabled()
    ? nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: {
              user: SMTP_USER,
              pass: SMTP_PASS,
          },
      })
    : null;

function buildSubject(event: Record<string, string>): string {
    switch (event.eventType) {
        case 'ProjectCompleted':
            return `Projet cloture: ${event.projectName || event.projectId || 'Sans nom'}`;
        case 'TaskReopened':
            return `Tache rouverte: ${event.taskId || 'Inconnue'}`;
        case 'TaskCompleted':
            return `Tache terminee: ${event.taskId || 'Inconnue'}`;
        default:
            return `Notification evenement: ${event.eventType || 'Inconnu'}`;
    }
}

function buildText(event: Record<string, string>): string {
    const timestamp = event.timestamp || new Date().toISOString();

    switch (event.eventType) {
        case 'ProjectCompleted':
            return `Bonjour,\n\nLe projet "${event.projectName}" (${event.projectId}) est maintenant cloture.\nDate: ${timestamp}\n\nCordialement,\nKanban Notification Service`;
        case 'TaskReopened':
            return `Bonjour,\n\nLa tache ${event.taskId} du projet ${event.projectId} a ete rouverte (${event.oldStatus} -> ${event.newStatus}).\nDate: ${timestamp}\n\nCordialement,\nKanban Notification Service`;
        case 'TaskCompleted':
            return `Bonjour,\n\nLa tache ${event.taskId} du projet ${event.projectId} est terminee (${event.oldStatus} -> ${event.newStatus}).\nDate: ${timestamp}\n\nCordialement,\nKanban Notification Service`;
        default:
            return `Bonjour,\n\nUn nouvel evenement a ete recu: ${event.eventType}.\nPayload: ${JSON.stringify(event)}\nDate: ${timestamp}\n\nCordialement,\nKanban Notification Service`;
    }
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildHtml(event: Record<string, string>): string {
    const timestamp = event.timestamp || new Date().toISOString();
    const safeTimestamp = escapeHtml(timestamp);

    let title = 'Notification';
    let message = `Nouvel evenement recu: ${event.eventType || 'Inconnu'}.`;

    if (event.eventType === 'ProjectCompleted') {
        title = 'Projet cloture';
        message = `Le projet "${event.projectName || 'Sans nom'}" est maintenant cloture.`;
    }

    if (event.eventType === 'TaskCompleted') {
        title = 'Tache terminee';
        message = `La tache ${event.taskId || 'Inconnue'} est passee en statut "termine".`;
    }

    if (event.eventType === 'TaskReopened') {
        title = 'Tache rouverte';
        message = `La tache ${event.taskId || 'Inconnue'} a ete rouverte.`;
    }

    const lines: string[] = [];
    if (event.projectId)
        lines.push(
            `<li><strong>Projet:</strong> ${escapeHtml(event.projectId)}</li>`,
        );
    if (event.taskId)
        lines.push(
            `<li><strong>Tache:</strong> ${escapeHtml(event.taskId)}</li>`,
        );
    lines.push(`<li><strong>Date:</strong> ${safeTimestamp}</li>`);

    return `
<div style="margin:0;padding:24px;background:#f3f6fa;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:24px;">
        <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">${escapeHtml(title)}</h2>
        <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(message)}</p>
        <ul style="margin:0 0 16px 18px;padding:0;line-height:1.6;">
            ${lines.join('')}
        </ul>
        <p style="margin:0;color:#6b7280;font-size:13px;">Kanban Notification Service</p>
    </div>
</div>`;
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }

        return (await response.json()) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function looksLikeEmail(value: string): boolean {
    return value.includes('@');
}

async function lookupEmailByUserId(userId: string): Promise<string> {
    const parsed = Number(userId);
    if (!Number.isFinite(parsed)) {
        return '';
    }

    const payload = await fetchJson(
        `${AUTH_SERVICE_URL}/auth/users/${encodeURIComponent(String(parsed))}`,
    );
    const email = typeof payload?.email === 'string' ? payload.email : '';
    return email;
}

async function lookupOwnerIdByProjectId(projectId: string): Promise<string> {
    const payload = await fetchJson(
        `${PROJECT_SERVICE_URL}/projects/${encodeURIComponent(projectId)}`,
    );
    const ownerId = typeof payload?.ownerId === 'string' ? payload.ownerId : '';
    return ownerId;
}

async function resolveRecipient(
    event: Record<string, string>,
): Promise<string> {
    if (event.ownerEmail) return event.ownerEmail;
    if (event.email) return event.email;

    if (event.ownerId) {
        if (looksLikeEmail(event.ownerId)) {
            return event.ownerId;
        }

        const resolvedEmail = await lookupEmailByUserId(event.ownerId);
        if (resolvedEmail) return resolvedEmail;
    }

    if (event.projectId) {
        const ownerId = await lookupOwnerIdByProjectId(event.projectId);
        if (ownerId) {
            if (looksLikeEmail(ownerId)) {
                return ownerId;
            }

            const resolvedEmail = await lookupEmailByUserId(ownerId);
            if (resolvedEmail) return resolvedEmail;
        }
    }

    return SMTP_RECIPIENT || '';
}

export async function sendEmailNotification(
    event: Record<string, string>,
): Promise<void> {
    if (!transporter) {
        return;
    }

    const to = await resolveRecipient(event);
    if (!to) {
        console.warn(
            "SMTP: aucun destinataire disponible pour l'evenement",
            event.eventType,
        );
        return;
    }

    try {
        await transporter.sendMail({
            from: SMTP_FROM,
            to,
            subject: buildSubject(event),
            text: buildText(event),
            html: buildHtml(event),
        });
    } catch (err) {
        console.error('SMTP: echec envoi e-mail', err);
    }
}
