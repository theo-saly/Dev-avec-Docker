import db from '../persistence';
import { getEvent } from '../clients/eventClient';

export default async (req, res) => {
    let event;
    try {
        event = await getEvent(req.params.id, req.headers.authorization);
    } catch {
        return res
            .status(503)
            .json({ error: 'Service des événements indisponible' });
    }
    if (!event) return res.status(404).json({ error: 'Événement non trouvé' });

    const booked = await db.countBooked(req.params.id);
    res.send({
        capacity: event.capacity,
        booked,
        remaining: Math.max(event.capacity - booked, 0),
    });
};
