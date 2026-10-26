import db from '../persistence';
import { v4 as uuid } from 'uuid';
import { getEvent } from '../clients/eventClient';
import { publishEvent } from '../events/publisher';

export default async (req, res) => {
    const { eventId, quantity } = req.body ?? {};

    if (typeof eventId !== 'string' || eventId.trim() === '') {
        return res.status(400).json({ error: 'eventId requis' });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return res
            .status(400)
            .json({ error: 'quantity doit être un entier entre 1 et 10' });
    }

    let event;
    try {
        event = await getEvent(eventId, req.headers.authorization);
    } catch {
        return res
            .status(503)
            .json({ error: 'Service des événements indisponible' });
    }
    if (!event) return res.status(404).json({ error: 'Événement non trouvé' });

    const ticket = {
        id: uuid(),
        eventId,
        userId: req.user.id,
        quantity,
        status: 'booked' as const,
        createdAt: new Date(),
    };

    const booked = await db.bookTicket(ticket, event.capacity);
    if (!booked) {
        return res.status(409).json({ error: 'Plus assez de places' });
    }

    await publishEvent('ticket-booked', {
        ticketId: ticket.id,
        eventId,
        eventTitle: event.title,
        userId: String(ticket.userId),
        quantity: String(quantity),
    });
    res.status(201).send(ticket);
};
