import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import PolicyService from '../services/policy.service';

class PolicyController {
    static createMessage = asyncHandler(async (req: Request, res: Response) => {
        const { name, email, message } = req.body;
        const user = req.user;
        if (!name || !email || !message) {
            res.status(400);
            throw new Error('All fields are required');
        }
        const response = await PolicyService.createMessage(name, email, message, user.id);
        res.status(201).json(response);
    });
}

export default PolicyController;