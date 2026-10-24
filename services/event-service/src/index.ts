import db from './persistence';
import app from './app';

const port = Number(process.env.PORT) || 3002;

db.init()
    .then(() => {
        app.listen(port, () =>
            console.log(`Event service listening on port ${port}`),
        );
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
