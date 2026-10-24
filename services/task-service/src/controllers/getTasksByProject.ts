import db from '../persistence';

export default async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) {
        return res.status(400).json({ error: 'projectId requis' });
    }
    const tasks = await db.getTasksByProject(projectId as string);
    res.send(tasks);
};
