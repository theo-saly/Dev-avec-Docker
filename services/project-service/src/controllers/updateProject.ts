import db from '../persistence';
import { publishEvent } from '../events/publisher';

interface TaskDTO {
    id: string;
    status: string;
}

const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL;

export default async (req, res) => {
    const project = await db.getProject(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Projet non trouvé' });
    }

    const newStatus = req.body.status || project.status;

    if (newStatus === 'cloturé' && project.status !== 'cloturé') {
        try {
            const response = await fetch(
                `${TASK_SERVICE_URL}/tasks/by-project?projectId=${req.params.id}`,
            );
            if (!response.ok) {
                return res
                    .status(503)
                    .json({ error: 'Service des tâches indisponible' });
            }
            const tasks = (await response.json()) as TaskDTO[];

            if (tasks.length === 0) {
                return res
                    .status(400)
                    .json({ error: 'Aucune tâche dans ce projet' });
            }

            const allDone = tasks.every((t) => t.status === 'terminé');
            if (!allDone) {
                return res.status(400).json({
                    error: 'Toutes les tâches doivent être terminées pour clôturer le projet',
                });
            }
        } catch {
            return res
                .status(503)
                .json({ error: 'Service des tâches indisponible' });
        }
    }

    await db.updateProject(req.params.id, {
        name: req.body.name || project.name,
        description: req.body.description || project.description,
        status: newStatus,
        echeance: req.body.echeance || project.echeance,
        ownerId: project.ownerId,
        updatedAt: new Date(),
    });

    if (newStatus === 'cloturé' && project.status !== 'cloturé') {
        await publishEvent('ProjectCompleted', {
            projectId: req.params.id,
            projectName: project.name,
            ownerId: project.ownerId,
        });
    }

    const updated = await db.getProject(req.params.id);
    res.send(updated);
};
