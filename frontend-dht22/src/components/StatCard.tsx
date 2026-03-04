import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    unit: string;
    icon: LucideIcon;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon: Icon, colorClass }) => {
    return (
        <div className="bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-800 flex items-center justify-between transition-transform hover:-translate-y-1 duration-300">
            <div>
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
                <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold text-white">{value}</span>
                    <span className="ml-1 text-xl font-medium text-gray-400">{unit}</span>
                </div>
            </div>
            <div className={`p-4 rounded-full bg-opacity-20 ${colorClass} bg-current`}>
                <Icon size={32} className={colorClass} />
            </div>
        </div>
    );
};

export default StatCard;
