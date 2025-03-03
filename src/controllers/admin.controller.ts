import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import AdminService from "../services/admin.service";

class AdminController {
    static createEvent = asyncHandler(async (req: Request, res: Response) => {
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

        if (typeof photoUrls !== 'object' || !Array.isArray(priceOfferings)) {
            res.status(400);
            throw new Error("photoUrls must be an object and priceOfferings must be an array");
        }

        if (isNaN(new Date(dateTime).getTime())) {
            res.status(400);
            throw new Error("Invalid date time format");
        }

        const event = await AdminService.createEvent({
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