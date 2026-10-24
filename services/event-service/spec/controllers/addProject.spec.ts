import db from '../../src/persistence';
import addProject from '../../src/controllers/addProject';
import { v4 as uuid } from 'uuid';

jest.mock('uuid', () => ({ v4: jest.fn() }));

jest.mock('../../src/persistence', () => ({
    storeProject: jest.fn(),
}));

test('use case 1 : créer un projet', async () => {
    const id = 'project-id-123';
    (uuid as jest.Mock).mockReturnValue(id);

    const req = {
        body: {
            title: 'Mon projet Kanban',
            description: 'Un projet de test',
            status: 'à faire',
            echeance: '2026-04-01',
        },
        user: { id: 'user-1' },
    };
    const res = { send: jest.fn(), status: jest.fn().mockReturnThis() };

    await addProject(req, res);

    expect(db.storeProject as jest.Mock).toHaveBeenCalledTimes(1);
    const stored = (db.storeProject as jest.Mock).mock.calls[0][0];
    expect(stored.id).toBe(id);
    expect(stored.ownerId).toBe('user-1');
    expect(res.status).toHaveBeenCalledWith(201);
});
