export function formatMessage(event: Record<string, string>): string {
    const subject = event.eventTitle || event.eventId;

    switch (event.eventType) {
        case 'ticket-booked':
            return `Billet réservé : ${event.quantity} places pour l'événement ${subject} par l'utilisateur ${event.userId}`;

        case 'ticket-cancelled':
            return `Billet annulé : ${event.quantity} places pour l'événement ${event.eventId} (utilisateur ${event.userId})`;

        case 'event-deleted':
            return `Événement supprimé : ${subject}`;

        default:
            return `${event.eventType} | ${JSON.stringify(event)}`;
    }
}
