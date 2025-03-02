import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import AdminService from "../services/admin.service";

class AdminController {
    static create = asyncHandler(async (req: Request, res: Response) => {
        const {
            title,
            venue,
            dateTime,
            totalNumberOfTickets,
            description,
            photoUrls,
            priceOfferings,
        } = req.body;
        if (
            !title ||
            !venue ||
            !dateTime ||
            !totalNumberOfTickets ||
            !description ||
            !photoUrls ||
            !priceOfferings
        ) {
            res.status(400);
            throw new Error("Please provide all required fields");
        }

        if (!Array.isArray(photoUrls) || !Array.isArray(priceOfferings)) {
            res.status(400);
            throw new Error("photoUrls and priceOfferings must be an array");
        }

        if (isNaN(new Date(dateTime).getTime())) {
            res.status(400);
            throw new Error("Invalid date time format");
        }

        const event = await AdminService.create({
            title,
            venue,
            dateTime,
            totalNumberOfTickets,
            description,
            photoUrls,
            priceOfferings,
        });

        res.status(201).json(event);
    });
    
}

export default AdminController;