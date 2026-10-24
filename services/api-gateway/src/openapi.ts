const apiVersion = process.env.API_VERSION || 'v1';

export const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Todo Microservices API',
        version: '2.0.0',
        description:
            'API Gateway exposing versioned auth, project and task endpoints. v1 and v2 coexist — v2 adds a mandatory birthDate field to auth registration.',
    },
    servers: [
        {
            url: '/v1',
            description: 'API v1',
        },
        {
            url: '/v2',
            description: 'API v2 (auth with birthDate)',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            AuthCredentials: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                },
            },
            RegisterPayload: {
                allOf: [
                    { $ref: '#/components/schemas/AuthCredentials' },
                    {
                        type: 'object',
                        required: ['consent'],
                        properties: {
                            consent: { type: 'boolean' },
                        },
                    },
                ],
            },
            RegisterPayloadV2: {
                allOf: [
                    { $ref: '#/components/schemas/AuthCredentials' },
                    {
                        type: 'object',
                        required: ['consent', 'birthDate'],
                        properties: {
                            consent: { type: 'boolean' },
                            birthDate: {
                                type: 'string',
                                format: 'date',
                                example: '1990-01-15',
                            },
                        },
                    },
                ],
            },
            UserResponseV2: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    email: { type: 'string', format: 'email' },
                    consent: { type: 'boolean' },
                    birthDate: { type: 'string', format: 'date' },
                },
            },
            ProjectPayload: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    ownerId: { type: 'string' },
                },
            },
            TaskPayload: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    status: { type: 'string' },
                    projectId: { type: 'string' },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                },
            },
        },
    },
    paths: {
        [`/${apiVersion}/auth/register`]: {
            post: {
                tags: ['Auth'],
                summary: 'Create a user account',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RegisterPayload',
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'User created' },
                    '400': { description: 'Missing fields' },
                    '409': { description: 'Email already exists' },
                },
            },
        },
        [`/${apiVersion}/auth/login`]: {
            post: {
                tags: ['Auth'],
                summary: 'Authenticate a user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthCredentials',
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'JWT token returned' },
                    '401': { description: 'Invalid credentials' },
                },
            },
        },
        [`/${apiVersion}/auth/profile`]: {
            delete: {
                tags: ['Auth'],
                summary: 'Delete the authenticated user account',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'Account deleted' },
                    '401': { description: 'Missing or invalid token' },
                    '404': { description: 'User not found' },
                },
            },
        },
        [`/${apiVersion}/projects`]: {
            get: {
                tags: ['Projects'],
                summary: 'List projects',
                parameters: [
                    {
                        name: 'ownerId',
                        in: 'query',
                        schema: { type: 'string' },
                    },
                ],
                responses: { '200': { description: 'Project list' } },
            },
            post: {
                tags: ['Projects'],
                summary: 'Create a project',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProjectPayload',
                            },
                        },
                    },
                },
                responses: { '201': { description: 'Project created' } },
            },
        },
        [`/${apiVersion}/projects/{id}`]: {
            get: {
                tags: ['Projects'],
                summary: 'Get a project',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '200': { description: 'Project found' },
                    '404': { description: 'Project not found' },
                },
            },
            put: {
                tags: ['Projects'],
                summary: 'Update a project',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProjectPayload',
                            },
                        },
                    },
                },
                responses: { '200': { description: 'Project updated' } },
            },
            delete: {
                tags: ['Projects'],
                summary: 'Delete a project',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: { '200': { description: 'Project deleted' } },
            },
        },
        [`/${apiVersion}/tasks`]: {
            get: {
                tags: ['Tasks'],
                summary: 'List tasks',
                responses: { '200': { description: 'Task list' } },
            },
            post: {
                tags: ['Tasks'],
                summary: 'Create a task',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TaskPayload',
                            },
                        },
                    },
                },
                responses: { '201': { description: 'Task created' } },
            },
        },
        [`/${apiVersion}/tasks/by-project`]: {
            get: {
                tags: ['Tasks'],
                summary: 'List tasks for a project',
                parameters: [
                    {
                        name: 'projectId',
                        in: 'query',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: { '200': { description: 'Task list' } },
            },
        },
        '/v2/auth/register': {
            post: {
                tags: ['Auth v2'],
                summary: 'Create a user account (v2 — birthDate required)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RegisterPayloadV2',
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'User created',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponseV2',
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Missing fields (including birthDate)',
                    },
                    '409': { description: 'Email already exists' },
                },
            },
        },
        '/v2/auth/login': {
            post: {
                tags: ['Auth v2'],
                summary: 'Authenticate a user (v2)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthCredentials',
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'JWT token returned' },
                    '401': { description: 'Invalid credentials' },
                },
            },
        },
        '/v2/auth/profile': {
            delete: {
                tags: ['Auth v2'],
                summary: 'Delete the authenticated user account (v2)',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'Account deleted' },
                    '401': { description: 'Missing or invalid token' },
                    '404': { description: 'User not found' },
                },
            },
        },
        '/v2/auth/users/{id}': {
            get: {
                tags: ['Auth v2'],
                summary: 'Get a user by id (v2 — includes birthDate)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'User found',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponseV2',
                                },
                            },
                        },
                    },
                    '400': { description: 'Invalid id' },
                    '404': { description: 'User not found' },
                },
            },
        },
        [`/${apiVersion}/tasks/{id}`]: {
            put: {
                tags: ['Tasks'],
                summary: 'Update a task',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TaskPayload',
                            },
                        },
                    },
                },
                responses: { '200': { description: 'Task updated' } },
            },
            delete: {
                tags: ['Tasks'],
                summary: 'Delete a task',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: { '200': { description: 'Task deleted' } },
            },
        },
    },
};
