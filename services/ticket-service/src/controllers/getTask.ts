import db from '../persistence';

export default async (req, res) => {
    const tasks = await db.getTasks();
    res.send(tasks);
};
