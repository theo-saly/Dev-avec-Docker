import express, { Request, Response } from 'express';
import { openApiDocument } from './openapi';

const app = express();
const port = Number(process.env.PORT || 3005);
const apiVersion = process.env.API_VERSION || 'v1';
const isDevelopment = process.env.NODE_ENV !== 'production';

const serviceUrls = {
    auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    projects: process.env.PROJECT_SERVICE_URL || 'http://project-service:3002',
    tasks: process.env.TASK_SERVICE_URL || 'http://task-service:3003',
};

type ServiceName = keyof typeof serviceUrls;

const serviceByResource: Record<string, ServiceName> = {
    auth: 'auth',
    projects: 'projects',
    tasks: 'tasks',
};

app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: apiVersion,
        services: Object.keys(serviceUrls),
    });
});

if (isDevelopment) {
    app.get('/openapi.json', (_req, res) => {
        res.json(openApiDocument);
    });

    app.get('/docs', (_req, res) => {
        res.type('html').send(`<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Todo Microservices API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui'
            });
        };
    </script>
</body>
</html>`);
    });
}

app.use(`/:version/:resource{/*path}`, async (req: Request, res: Response) => {
    const version = String(req.params.version);
    const resource = String(req.params.resource);

    if (!/^v\d+$/.test(version)) {
        return res.status(400).json({
            error: `Version invalide : ${version}. Utilisez v1, v2, etc.`,
        });
    }

    const serviceName = serviceByResource[resource];

    if (!serviceName) {
        return res.status(404).json({
            error: `Unknown API resource: ${resource}`,
        });
    }

    const upstreamBase = new URL(serviceUrls[serviceName]);
    const rawTail = String(req.params['path'] ?? '');
    const safeTail = rawTail
        .split('/')
        .filter(
            (segment) =>
                segment.length > 0 && segment !== '.' && segment !== '..',
        )
        .map((segment) => encodeURIComponent(segment))
        .join('/');

    // v1 : on garde le comportement d'origine (pas de préfixe de version côté service)
    // v2+ : on transmet le préfixe de version pour que le service puisse router
    const versionPrefix = version === apiVersion ? '' : `/${version}`;
    const targetUrl = new URL(
        `${versionPrefix}/${serviceName}${safeTail ? `/${safeTail}` : ''}`,
        upstreamBase,
    );
    const query = new URLSearchParams(
        req.query as Record<string, string>,
    ).toString();
    if (query) {
        targetUrl.search = query;
    }

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: forwardHeaders(req),
            body: shouldForwardBody(req.method)
                ? JSON.stringify(req.body ?? {})
                : undefined,
        });

        res.status(response.status);
        response.headers.forEach((value, key) => {
            if (!['content-encoding', 'content-length'].includes(key)) {
                res.setHeader(key, value);
            }
        });

        const body = await response.arrayBuffer();
        res.send(Buffer.from(body));
    } catch (error) {
        console.error(`Gateway proxy error for ${targetUrl.toString()}`, error);
        res.status(502).json({ error: 'Bad gateway' });
    }
});

app.use((_req, res) => {
    res.status(404).json({
        error: `Use /${apiVersion}/auth, /${apiVersion}/projects or /${apiVersion}/tasks (v2 also supported)`,
    });
});

app.listen(port, () => {
    console.log(`API Gateway listening on port ${port} with /${apiVersion}`);
});

function forwardHeaders(req: Request): Headers {
    const headers = new Headers();
    const authorization = req.header('authorization');

    headers.set('content-type', 'application/json');
    headers.set('accept', req.header('accept') || 'application/json');

    if (authorization) {
        headers.set('authorization', authorization);
    }

    return headers;
}

function shouldForwardBody(method: string): boolean {
    return !['GET', 'HEAD', 'DELETE'].includes(method.toUpperCase());
}
