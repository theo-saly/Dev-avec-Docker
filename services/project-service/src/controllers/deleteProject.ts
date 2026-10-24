import db from '../persistence';

export default async (req, res) => {
    const project = await db.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

    await db.removeProject(req.params.id);
    res.sendStatus(200);
};
