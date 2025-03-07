import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/CustomError";
import logger from "../utils/logger";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        error: err.message,
        stack: err.stack,
    });
    const statusCode = err instanceof CustomError ? err.statusCode : 500;

    res.status(statusCode).json({
        error: err.message,
        stack: process.env.NODE_ENV === "production" ? {} : err.stack,
    });
};

export { errorHandler };