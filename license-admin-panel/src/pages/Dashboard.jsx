import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import StatsCard from '../components/Dashboard/StatsCard';
import { LicenseService } from '../services/licenseService';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expiring: 0,
        expired: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const licenses = await LicenseService.fetchLicenses();

            const now = new Date();
            const in7Days = new Date();
            in7Days.setDate(now.getDate() + 7);

            const computed = licenses.reduce((acc, lic) => {
                acc.total++;
                if (lic.status === 'active') acc.active++;
                if (lic.status === 'expired') acc.expired++;

                // Expiring Soon Logic (Active AND End date within 7 days)
                if (lic.status === 'active' && lic.end_date) {
                    const endDate = new Date(lic.end_date);
                    if (endDate > now && endDate <= in7Days) {
                        acc.expiring++;
                    }
                }
                return acc;
            }, { total: 0, active: 0, expired: 0, expiring: 0 });

            setStats(computed);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">Dashboard Overview</h2>
                <p className="text-[var(--text-secondary)] mt-1">Welcome back, here is what's happening today.</p>
            </div>

            {loading ? (
                <div className="text-[var(--text-secondary)]">Loading metrics...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Licenses"
                        value={stats.total}
                        icon={Users}
                        color="#6366f1"
                    />
                    <StatsCard
                        title="Active Licenses"
                        value={stats.active}
                        icon={CheckCircle}
                        color="#10b981"
                    />
                    <StatsCard
                        title="Expiring Soon"
                        value={stats.expiring}
                        icon={Clock}
                        color="#f59e0b"
                    />
                    <StatsCard
                        title="Expired/Blocked"
                        value={stats.expired}
                        icon={AlertTriangle}
                        color="#ef4444"
                    />
                </div>
            )}

            {/* Recent Activity Table Placeholder */}
            <div className="mt-10">
                <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                <div className="p-6 bg-[var(--bg-card)] rounded-[var(--radius)] border border-[var(--border)] text-center text-[var(--text-muted)]">
                    Detailed activity log coming soon.
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
