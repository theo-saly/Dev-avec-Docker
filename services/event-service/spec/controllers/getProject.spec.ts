import db from '../../src/persistence';
import getProject from '../../src/controllers/getProject';

jest.mock('../../src/persistence', () => ({
    getProject: jest.fn(),
    getProjects: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

test('récupérer un projet par ID', async () => {
    const project = { id: 'proj-1', name: 'Mon projet', ownerId: 'user-1' };
    (db.getProject as jest.Mock).mockResolvedValue(project);

    const req = { params: { id: 'proj-1' }, query: {} };
    const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await getProject(req, res);

    expect(res.send).toHaveBeenCalledWith(project);
});

test('retourner 404 si projet inexistant', async () => {
    (db.getProject as jest.Mock).mockResolvedValue(undefined);

    const req = { params: { id: 'inexistant' }, query: {} };
    const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await getProject(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
});

test('lister les projets par ownerId', async () => {
    const projects = [
        { id: 'p1', name: 'Projet 1', ownerId: 'user-1' },
        { id: 'p2', name: 'Projet 2', ownerId: 'user-1' },
    ];
    (db.getProjects as jest.Mock).mockResolvedValue(projects);

    const req = { params: {}, query: { ownerId: 'user-1' } };
    const res = { send: jest.fn() };

    await getProject(req, res);

    expect(db.getProjects as jest.Mock).toHaveBeenCalledWith('user-1');
    expect(res.send).toHaveBeenCalledWith(projects);
});
