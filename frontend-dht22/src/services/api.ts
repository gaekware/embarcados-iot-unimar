import axios from 'axios';
import type { PaginatedResponse, SensorData } from '../types';

// Use the environment variable if available, otherwise default to localhost pointing to Node.js backend
// Usually, we proxy it in Vite or point directly if CORS is enabled.
const API_URL = import.meta.env.VITE_API_URL || 'https://saint-pack-endorsed-stickers.trycloudflare.com';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getSensorData = async (
    offset: number = 0,
    limit: number = 50,
    deviceId?: string
): Promise<PaginatedResponse> => {
    const params: Record<string, any> = { offset, limit };

    if (deviceId) params.deviceId = deviceId;

    const response = await api.get<PaginatedResponse>('/api/sensors', { params });
    return response.data;
};

export const getLatestSensorData = async (): Promise<SensorData | null> => {
    const data = await getSensorData(0, 1);
    return data.readings.length > 0 ? data.readings[0] : null;
};

export default api;
