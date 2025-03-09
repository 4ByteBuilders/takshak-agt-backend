import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserService from '../services/user.service';
import { CustomError } from '../utils/CustomError';

class UserController {
    static create = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.user;
        const userExists = await UserService.checkUser({ id });

        if (userExists) {
            res.status(409);
            return;
        }

        const user = await UserService.create({ id });
        if (!user) {
            throw new CustomError('Error creating user', 400);
        }
        res.status(201).json({ message: "User Created Successfully", user });
    });

    static checkNumber = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const hasPhoneNumber = await UserService.checkNumber({ id: userId });
        res.status(200).send(hasPhoneNumber);
    });

    static updatePhone = asyncHandler(async (req: Request, res: Response) => {
        const { phoneNumber } = req.body;
        const id = req.user.id;
        const user = await UserService.updatePhone({ id, phoneNumber });
        if (!user) {
            throw new CustomError('User not found', 404);
        }
        res.status(200).json({ message: "Phone Number Updated Successfully", user });
    });
}

export default UserController;