import db from '../persistence';
import { v4 as uuid } from 'uuid';

export default async (req, res) => {
    const project = {
        id: uuid(),
        name: req.body.name,
        description: req.body.description,
        status: req.body.status || 'à faire',
        echeance: req.body.echeance,
        ownerId: req.user?.id || req.body.ownerId || 'default',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await db.storeProject(project);
    res.status(201).send(project);
};
