import { Request, Response, NextFunction } from "express";
import * as sensorService from "../services/sensorService.js";

// POST /api/sensors
export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { deviceId, timestamp, soilMoistureRaw, soilMoisturePercent } =
            req.body as {
                deviceId?: unknown;
                timestamp?: unknown;
                soilMoistureRaw?: unknown;
                soilMoisturePercent?: unknown;
            };

        // Basic validation
        if (
            typeof deviceId !== "string" ||
            !deviceId ||
            !timestamp ||
            typeof soilMoistureRaw !== "number" ||
            typeof soilMoisturePercent !== "number"
        ) {
            res.status(400).json({
                error:
                    "Missing or invalid fields. Required: deviceId (string), timestamp (ISO string), soilMoistureRaw (number), soilMoisturePercent (number).",
            });
            return;
        }

        const reading = await sensorService.createSensorReading({
            deviceId,
            timestamp: timestamp as string | Date,
            soilMoistureRaw,
            soilMoisturePercent,
        });

        res.status(201).json(reading);
    } catch (err) {
        next(err);
    }
};

// GET /api/sensors
export const getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const deviceId =
            typeof req.query.deviceId === "string" ? req.query.deviceId : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        const result = await sensorService.getAllSensorReadings({
            deviceId,
            limit,
            offset,
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

// GET /api/sensors/:id
export const getById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const rawId = req.params["id"];
        const id = parseInt(Array.isArray(rawId) ? rawId[0] : rawId);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID. Must be a number." });
            return;
        }

        const reading = await sensorService.getSensorReadingById(id);
        if (!reading) {
            res.status(404).json({ error: "Sensor reading not found." });
            return;
        }

        res.status(200).json(reading);
    } catch (err) {
        next(err);
    }
};
