import { migrate } from './runner';

const direction = process.argv[2] === 'down' ? 'down' : 'up';

migrate(direction)
    .then(() => {
        console.log(`Project migrations ${direction} completed`);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
