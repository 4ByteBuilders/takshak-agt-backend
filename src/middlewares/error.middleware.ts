import { Request, Response, NextFunction } from 'express';

interface Error {
    message: string;
    stack?: string;
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        error: err.message,
        stack: process.env.NODE_ENV === "production" ? {} : err.stack,
    });
};

export { errorHandler };