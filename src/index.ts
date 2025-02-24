import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT;

app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}`);
});