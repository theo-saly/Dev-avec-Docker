import express from 'express';
import { startConsumer } from './events/consumer';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'notification-service' });
});

app.listen(3004, () => {
    console.log('Notification service listening on port 3004');
    startConsumer();
});
