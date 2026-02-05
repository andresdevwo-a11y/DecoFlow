import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans antialiased overflow-hidden">
            <Sidebar />
            <main className="flex-1 ml-[var(--sidebar-width)] h-full overflow-y-auto relative">
                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
