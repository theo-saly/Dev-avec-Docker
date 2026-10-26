import db from '../persistence';

export default async (req, res) => {
    const event = await db.getEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Événement non trouvé' });
    res.send(event);
};
