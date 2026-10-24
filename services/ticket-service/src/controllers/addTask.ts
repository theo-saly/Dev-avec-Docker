import db from '../persistence';
import { v4 as uuid } from 'uuid';

export default async (req, res) => {
    const task = {
        id: uuid(),
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        echeance: req.body.echeance,
        projectId: req.body.projectId,
        createdAt: new Date(),
    };

    await db.storeTask(task);
    res.send(task);
};
