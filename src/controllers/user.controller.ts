import {Router, Request, Response} from 'express';
import asyncHandler from 'express-async-handler';
import UserService from '../services/user.service';

class UserController {
    static create = asyncHandler(async (req : Request, res : Response) => {
        const {email, phoneNumber} = req.body;
        const user = await UserService.create({email, phoneNumber});
        if(!user){
            res.status(404).json({message: 'User not found'});
            return;
        }
        res.status(201).json({message : "User Created Successfully", user});
    });
}

export default UserController;