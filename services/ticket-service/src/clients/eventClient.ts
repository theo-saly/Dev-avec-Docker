export interface EventDTO {
    id: string;
    title: string;
    capacity: number;
}

// Interroge event-service en transmettant l'en-tête Authorization reçu.
// Renvoie null si l'événement n'existe pas (404), lève une erreur sinon.
export async function getEvent(
    eventId: string,
    authorization: string,
): Promise<EventDTO | null> {
    const baseUrl =
        process.env.EVENT_SERVICE_URL || 'http://event-service:3002';
    const response = await fetch(
        `${baseUrl}/events/${encodeURIComponent(eventId)}`,
        { headers: { Authorization: authorization } },
    );

    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`event-service a répondu ${response.status}`);
    }
    return (await response.json()) as EventDTO;
}
