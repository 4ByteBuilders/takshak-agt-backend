import dotenv from 'dotenv';
import express from 'express';
import eventRouter from './routes/event.routes';
import { errorHandler } from './middlewares/error.middleware';
dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
}
);
app.use('/event', eventRouter);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Live on http://localhost:${PORT}`);
});