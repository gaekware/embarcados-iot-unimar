import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import type { SensorData } from '../types';

interface SensorChartProps {
    data: SensorData[];
    dataKey: 'soilMoistureRaw' | 'soilMoisturePercent';
    color: string;
    title: string;
}

const SensorChart: React.FC<SensorChartProps> = ({ data, dataKey, color, title }) => {
    const formatTime = (isoString: any) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString as string);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const gradientId = `color${dataKey}`;

    return (
        <div className="bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-800 flex flex-col h-96">
            <h3 className="text-xl font-semibold text-gray-200 mb-6">{title}</h3>
            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatTime}
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF' }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            minTickGap={20}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF' }}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#F3F4F6' }}
                            itemStyle={{ color: '#F3F4F6' }}
                            labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem' }}
                            labelFormatter={formatTime}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                            name={dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SensorChart;
