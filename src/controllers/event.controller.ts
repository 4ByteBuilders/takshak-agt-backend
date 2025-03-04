import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import EventService from "../services/event.service";

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

    if (!Array.isArray(priceOfferings)) {
      res.status(400);
      throw new Error("priceOfferings must be an array");
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

  static getLatestEvent = asyncHandler(async (req: Request, res: Response) => {
    const event = await EventService.getLatestEvent();

    if (event) {
      event.photoUrls = typeof event.photoUrls === "string"
        ? JSON.parse(event.photoUrls)
        : event.photoUrls;
    }
    if (event) {
      res.status(200).json(event);
    }
    else {
      res.status(404).json({ message: 'No upcoming events found' });
    }
  });

}

export default EventController;
