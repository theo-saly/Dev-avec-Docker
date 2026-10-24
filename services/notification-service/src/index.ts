import express from 'express';
import { startConsumer } from './events/consumer';

const app = express();
const port = Number(process.env.PORT) || 3004;

app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'notification-service' });
});

app.listen(port, () => {
    console.log(`Notification service listening on port ${port}`);
    startConsumer();
});
