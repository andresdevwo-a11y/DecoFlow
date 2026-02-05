import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
    return (
        <div className="bg-[var(--bg-card)] p-6 rounded-[var(--radius)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wider">
                    {title}
                </h3>
                <div style={{ color: color }} className="p-2 rounded-full bg-[var(--bg-app)]">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <span className="text-3xl font-bold text-[var(--text-primary)]">{value}</span>
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
                        }`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
