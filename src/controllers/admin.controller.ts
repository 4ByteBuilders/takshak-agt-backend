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

    static checkAdmin = asyncHandler(async (req: Request, res: Response) => {
        console.log(`Admin ${req.user.email} logged in`);
        res.status(200).send({ isAdmin: true });
    });

    static getAllEvents = asyncHandler(async (req: Request, res: Response) => {
        const events = await AdminService.getAllEvents();
        res.json(events);
    });

    static deleteEvent = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.body;
        if (!eventId) {
            res.status(400);
            throw new Error("Please provide eventId");
        }

        await AdminService.deleteEvent({ eventId });
        res.status(204).send({ message: "Event deleted successfully" });
    });

    static getAllMessages = asyncHandler(async (req: Request, res: Response) => {
        const response = await AdminService.getAllMessages();
        res.status(200).json(response);
    });

    static changeMessageStatus = asyncHandler(async (req: Request, res: Response) => {
        const { messageId, status } = req.body;
        if (!messageId || !status) {
            res.status(400);
            throw new Error('All fields are required');
        }
        const response = await AdminService.changeMessageStatus(messageId, status);
        res.status(200).json(response);
    });

}

export default AdminController;