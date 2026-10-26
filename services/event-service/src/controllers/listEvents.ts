import db from '../persistence';

export default async (_req, res) => {
    const events = await db.getEvents();
    res.send(events);
};
