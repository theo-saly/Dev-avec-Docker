import db from '../persistence';

export default async (req, res) => {
    const tickets = await db.getByUser(req.user.id);
    res.send(tickets);
};
