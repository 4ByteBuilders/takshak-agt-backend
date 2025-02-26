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
    const { eventId, priceOfferingId, quantity, userId } = req.body;
    if (!eventId || !priceOfferingId || !quantity) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    if (isNaN(quantity) || quantity <= 0) {
      res.status(400);
      throw new Error("Quantity must be a positive number");
    }
    const ticketIds = await EventService.bookEvent({
      eventId,
      priceOfferingId,
      quantity,
      userId,
    });
    res.json(ticketIds);
  });

  static viewEvent = asyncHandler(async (req : Request, res : Response) => {
    const eventId = req.query.eventId;

    if(!eventId){
      res.status(400);
      throw new Error("Please provide eventId");
    }

    const eventData = await EventService.viewEvent({eventId});

    if(!eventData){
      throw new Error("Event not found");
    }

    res.json(eventData);

  });

}

export default EventController;
