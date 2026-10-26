import db from '../persistence';
import { publishEvent } from '../events/publisher';

export default async (req, res) => {
    const event = await db.getEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Événement non trouvé' });

    await db.removeEvent(req.params.id);
    await publishEvent('event-deleted', {
        eventId: event.id,
        eventTitle: event.title,
    });
    res.sendStatus(204);
};
