import React, { useEffect, useState, useCallback } from 'react';
import { Leaf, Droplets, RefreshCcw, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';
import SensorChart from './SensorChart';
import type { SensorData } from '../types';
import { getSensorData } from '../services/api';

const Dashboard: React.FC = () => {
    const [data, setData] = useState<SensorData[]>([]);
    const [latestData, setLatestData] = useState<SensorData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const fetchData = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setIsRefreshing(true);
        try {
            // Fetch the last 50 readings
            const response = await getSensorData(0, 50);

            // The API might return data sorted by latest first or oldest first.
            // Assuming it's latest first, we reverse it for the chart to show progression Left -> Right.
            const chartData = [...response.readings].reverse();

            setData(chartData);
            setLatestData(response.readings.length > 0 ? response.readings[0] : null);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch sensor data:', err);
            setError('Failed to connect to the sensor API. Please check if the server is running.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Auto refresh every 10 seconds
        const interval = setInterval(() => {
            fetchData();
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading && data.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-dark-bg">
                <div className="flex flex-col items-center">
                    <RefreshCcw className="animate-spin text-primary-500 mb-4" size={48} />
                    <h2 className="text-xl font-semibold text-gray-300">Loading Sensor Data...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg text-gray-100 p-6 md:p-10 font-sans selection:bg-primary-500 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-800">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Sensor Monitor</h1>
                        <p className="text-gray-400">Real-time soil moisture analytics</p>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                        {latestData && (
                            <span className="text-sm text-gray-500">
                                Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={() => fetchData(true)}
                            disabled={isRefreshing}
                            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium shadow-lg shadow-primary-500/20"
                        >
                            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </header>

                {/* Error State */}
                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3">
                        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="text-red-400 font-medium">Connection Error</h3>
                            <p className="text-red-200/70 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard
                        title="Soil Moisture (Percent)"
                        value={latestData ? Number(latestData.soilMoisturePercent).toFixed(1) : '--'}
                        unit="%"
                        icon={Droplets}
                        colorClass="text-blue-400"
                    />
                    <StatCard
                        title="Soil Moisture (Raw)"
                        value={latestData ? Number(latestData.soilMoistureRaw) : '--'}
                        unit=""
                        icon={Leaf}
                        colorClass="text-emerald-500"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {data.length > 0 ? (
                        <>
                            <SensorChart
                                data={data}
                                dataKey="soilMoisturePercent"
                                color="#60a5fa" // Tailwind blue-400
                                title="Moisture History (%)"
                            />
                            <SensorChart
                                data={data}
                                dataKey="soilMoistureRaw"
                                color="#10b981" // Tailwind emerald-500
                                title="Moisture History (Raw)"
                            />
                        </>
                    ) : (
                        <div className="col-span-1 lg:col-span-2 bg-dark-surface p-12 rounded-2xl border border-gray-800 flex items-center justify-center">
                            <p className="text-gray-500 text-lg">No historical data available yet. Waiting for sensor readings...</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
