import prisma from "../prisma.js";

export interface CreateSensorReadingDTO {
    deviceId: string;
    timestamp: string | Date;
    soilMoistureRaw: number;
    soilMoisturePercent: number;
}

export interface GetSensorReadingsFilter {
    deviceId?: string;
    limit?: number;
    offset?: number;
}

export const createSensorReading = async (data: CreateSensorReadingDTO) => {
    return prisma.sensorReading.create({
        data: {
            deviceId: data.deviceId,
            timestamp: new Date(data.timestamp),
            soilMoistureRaw: data.soilMoistureRaw,
            soilMoisturePercent: data.soilMoisturePercent,
        },
    });
};

export const getAllSensorReadings = async ({
    deviceId,
    limit = 50,
    offset = 0,
}: GetSensorReadingsFilter = {}) => {
    const where = deviceId ? { deviceId } : {};

    const [total, readings] = await prisma.$transaction([
        prisma.sensorReading.count({ where }),
        prisma.sensorReading.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take: limit,
            skip: offset,
        }),
    ]);

    return { total, readings };
};

export const getSensorReadingById = async (id: number) => {
    return prisma.sensorReading.findUnique({ where: { id } });
};
