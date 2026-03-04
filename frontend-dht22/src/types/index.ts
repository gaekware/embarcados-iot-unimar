export interface SensorData {
    id: number;
    deviceId: string;
    timestamp: string;
    soilMoistureRaw: number;
    soilMoisturePercent: number;
    createdAt: string;
}

export interface PaginatedResponse {
    total: number;
    readings: SensorData[];
}
