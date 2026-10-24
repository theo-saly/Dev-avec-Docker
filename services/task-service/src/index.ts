import express from 'express';
import db from './persistence';
import routes from './routes/routes';

const app = express();

app.use(express.json());

routes(app);

db.init()
    .then(() => {
        app.listen(3003, () => console.log('Listening on port 3003'));
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown);
