import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import EventService from "../services/event.service";
import redisClient from "../utils/redis";

class EventController {
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

        const event = await EventService.create({
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

    static bookEvent = asyncHandler(async (req: Request, res: Response) => {
        const { eventId, priceOfferingId, quantity } = req.body;
        if (!eventId || !priceOfferingId || !quantity) {
            res.status(400);
            throw new Error('Please provide all required fields');
        }

        if (isNaN(quantity) || quantity <= 0) {
            res.status(400);
            throw new Error('Quantity must be a positive number');
        }

        // ...
    });

}

export default EventController;
