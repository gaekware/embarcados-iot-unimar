import { Router } from "express";
import * as sensorController from "../controllers/sensorController.js";

const router = Router();

// POST /api/sensors  — ESP32 sends data here
router.post("/", sensorController.create);

// GET /api/sensors   — list all (supports ?deviceId= &limit= &offset=)
router.get("/", sensorController.getAll);

// GET /api/sensors/:id — single reading by PK
router.get("/:id", sensorController.getById);

export default router;
