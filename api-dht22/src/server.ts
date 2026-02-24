import "dotenv/config";
import app from "./app.js";
import prisma from "./prisma.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function main() {
    try {
        // Verify DB connectivity before accepting requests
        await prisma.$connect();
        console.log("✅ Connected to PostgreSQL via Prisma");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 Sensor endpoint: POST http://localhost:${PORT}/api/sensors`);
            console.log(`📊 Read endpoint:   GET  http://localhost:${PORT}/api/sensors`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to the database:", error);
        process.exit(1);
    }
}

main();
