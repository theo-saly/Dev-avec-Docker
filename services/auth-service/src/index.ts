import express from 'express';
import authRouter from './routes/auth';
import authV2Router from './routes/authV2';

const app = express();

app.use(express.json());

app.use('/auth', authRouter);
app.use('/v1/auth', authRouter);
app.use('/v2/auth', authV2Router);

app.listen(3001, () => console.log('Auth service listening on port 3001'));
