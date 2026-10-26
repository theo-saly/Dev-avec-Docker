import db from '../persistence';
import { validateEvent } from './validation';

export default async (req, res) => {
    const event = await db.getEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Événement non trouvé' });

    const error = validateEvent(req.body, true);
    if (error) return res.status(400).json({ error });

    await db.updateEvent(req.params.id, {
        ...event,
        title: req.body.title ?? event.title,
        description: req.body.description ?? event.description,
        venue: req.body.venue ?? event.venue,
        startsAt: req.body.startsAt
            ? new Date(req.body.startsAt)
            : event.startsAt,
        capacity: req.body.capacity ?? event.capacity,
        priceCents: req.body.priceCents ?? event.priceCents,
        updatedAt: new Date(),
    });

    const updated = await db.getEvent(req.params.id);
    res.send(updated);
};
