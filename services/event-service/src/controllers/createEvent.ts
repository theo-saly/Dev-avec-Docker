import db from '../persistence';
import { v4 as uuid } from 'uuid';
import { validateEvent } from './validation';

export default async (req, res) => {
    const error = validateEvent(req.body);
    if (error) return res.status(400).json({ error });

    const event = {
        id: uuid(),
        title: req.body.title,
        description: req.body.description,
        venue: req.body.venue,
        startsAt: new Date(req.body.startsAt),
        capacity: req.body.capacity,
        priceCents: req.body.priceCents ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await db.storeEvent(event);
    res.status(201).send(event);
};
