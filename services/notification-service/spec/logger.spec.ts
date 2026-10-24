import fs from 'fs';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    appendFileSync: jest.fn(),
}));

import { writeLog } from '../src/logger';

beforeEach(() => {
    jest.clearAllMocks();
});

test('TaskCompleted est loggé correctement', () => {
    writeLog({
        eventType: 'TaskCompleted',
        taskId: 'task-1',
        projectId: 'proj-1',
        oldStatus: 'en cours',
        newStatus: 'terminé',
        timestamp: '2026-03-19T12:00:00.000Z',
    });

    const written = (fs.appendFileSync as jest.Mock).mock.calls[0][1] as string;
    expect(written).toContain('Tâche terminée');
    expect(written).toContain('task-1');
    expect(written).toContain('terminé');
});

test('TaskReopened notifie la réouverture', () => {
    writeLog({
        eventType: 'TaskReopened',
        taskId: 'task-2',
        projectId: 'proj-1',
        oldStatus: 'terminé',
        newStatus: 'en cours',
        timestamp: '2026-03-19T12:00:00.000Z',
    });

    const written = (fs.appendFileSync as jest.Mock).mock.calls[0][1] as string;
    expect(written).toContain('réouverte');
    expect(written).toContain('task-2');
});

test('ProjectCompleted notifie la fin du projet', () => {
    writeLog({
        eventType: 'ProjectCompleted',
        projectId: 'proj-1',
        projectName: 'Mon projet',
        ownerId: 'user-1',
        timestamp: '2026-03-19T12:00:00.000Z',
    });

    const written = (fs.appendFileSync as jest.Mock).mock.calls[0][1] as string;
    expect(written).toContain('terminé');
    expect(written).toContain('Mon projet');
    expect(written).toContain('user-1');
});

test('événement inconnu est loggé en JSON', () => {
    writeLog({
        eventType: 'UnknownEvent',
        data: 'test',
        timestamp: '2026-03-19T12:00:00.000Z',
    });

    const written = (fs.appendFileSync as jest.Mock).mock.calls[0][1] as string;
    expect(written).toContain('UnknownEvent');
});
