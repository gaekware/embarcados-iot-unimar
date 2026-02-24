import express from "express";
import cors from "cors";
import sensorRoutes from "./routes/sensorRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import yaml from "yaml";

const file = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = yaml.parse(file)

const app = express();

// --- Middleware ---
app.use(cors()); // Allow all origins (needed for ESP32 via ngrok)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
// --- Health check ---
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Swagger Docs ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Routes ---
app.use("/api/sensors", sensorRoutes);

// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found." });
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

export default app;
