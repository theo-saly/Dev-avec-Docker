import jwt from 'jsonwebtoken';
import type { Server } from 'http';
import app from '../../src/app';

jest.mock('uuid', () => ({ v4: () => 'ticket-id-1' }));

const SECRET = 'test-secret';
let server: Server;
let baseUrl: string;

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
});

test('GET /tickets/me sans token → 401', async () => {
    const res = await fetch(`${baseUrl}/tickets/me`);
    expect(res.status).toBe(401);
});

test('GET /tickets/me avec un autre secret → 401', async () => {
    const bad = jwt.sign({ id: 1, email: 'a@b.c', role: 'standard' }, 'autre');
    const res = await fetch(`${baseUrl}/tickets/me`, {
        headers: { Authorization: `Bearer ${bad}` },
    });
    expect(res.status).toBe(401);
});
