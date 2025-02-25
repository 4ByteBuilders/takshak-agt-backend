import dotenv from 'dotenv';
import express from 'express';
import eventRouter from './routes/event.routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/event', eventRouter);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});