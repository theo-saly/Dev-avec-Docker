import db from '../persistence';

export default async (req, res) => {
    await db.removeTask(req.params.id);
    res.sendStatus(200);
};
