import db from '../persistence';

export default async (req, res) => {
    if (req.params.id) {
        const project = await db.getProject(req.params.id);
        if (!project)
            return res.status(404).json({ error: 'Projet non trouvé' });
        return res.send(project);
    }
    const ownerId = (req.query.ownerId as string) || 'default';
    const projects = await db.getProjects(ownerId);
    res.send(projects);
};
