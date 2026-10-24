import nodemailer from 'nodemailer';
import { formatMessage } from './messages';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || '465');
const SMTP_SECURE =
    (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_RECIPIENT = process.env.SMTP_RECIPIENT || SMTP_USER;

// SMTP optionnel : sans SMTP_HOST, aucun e-mail n'est envoyé.
const transporter = SMTP_HOST
    ? nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      })
    : null;

export async function sendEmailNotification(
    event: Record<string, string>,
): Promise<void> {
    if (!transporter || !SMTP_RECIPIENT) return;

    try {
        await transporter.sendMail({
            from: SMTP_FROM,
            to: SMTP_RECIPIENT,
            subject: `Billetterie : ${event.eventType}`,
            text: formatMessage(event),
        });
    } catch (err) {
        console.error('SMTP: echec envoi e-mail', err);
    }
}
