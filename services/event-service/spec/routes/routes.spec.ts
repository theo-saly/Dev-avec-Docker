import jwt from 'jsonwebtoken';
import type { Server } from 'http';
import app from '../../src/app';

jest.mock('uuid', () => ({ v4: () => 'event-id-1' }));

const SECRET = 'test-secret';
let server: Server;
let baseUrl: string;

const token = (role: string) =>
    jwt.sign({ id: 1, email: 'a@b.c', role }, SECRET, { expiresIn: '1h' });

beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    await new Promise<void>((resolve) => {
        server = app.listen(0, () => resolve());
    });
    baseUrl = `http://localhost:${(server.address() as any).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

test('GET /health sans token → 200', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
});

test('GET /events sans token → 401', async () => {
    const res = await fetch(`${baseUrl}/events`);
    expect(res.status).toBe(401);
});

test('POST /events avec un token standard → 403', async () => {
    const res = await fetch(`${baseUrl}/events`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token('standard')}`,
            'Content-Type': 'application/json',
        },
        body: '{}',
    });
    expect(res.status).toBe(403);
});

test('POST /events admin puis GET /events → événement listé', async () => {
    const created = await fetch(`${baseUrl}/events`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token('admin')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: 'Concert',
            description: 'd',
            venue: 'v',
            startsAt: '2026-12-01T20:00:00Z',
            capacity: 10,
        }),
    });
    expect(created.status).toBe(201);

    const list = await fetch(`${baseUrl}/events`, {
        headers: { Authorization: `Bearer ${token('standard')}` },
    });
    expect(list.status).toBe(200);
    expect(((await list.json()) as any[]).length).toBe(1);
});
