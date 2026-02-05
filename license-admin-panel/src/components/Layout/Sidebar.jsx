import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Key, Settings, Shield } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Key, label: 'Licencias', path: '/licenses' },
        // { icon: Shield, label: 'Auditoría', path: '/audit' }, // Future
        // { icon: Settings, label: 'Configuración', path: '/settings' }, // Future
    ];

    return (
        <aside className="w-[var(--sidebar-width)] h-screen bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col fixed left-0 top-0 z-20 transition-all duration-300">
            {/* Brand */}
            <div className="h-[var(--header-height)] flex items-center px-6 border-b border-[var(--border)]">
                <Shield className="w-8 h-8 text-[var(--primary)] mr-3" />
                <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">
                    AdminPanel
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 rounded-[var(--radius)] transition-all duration-200 group ${isActive
                                ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer / User Info */}
            <div className="p-4 border-t border-[var(--border)]">
                <div className="flex items-center p-3 rounded-[var(--radius)] bg-[var(--bg-app)]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--accent-warning)] flex items-center justify-center text-xs font-bold text-white">
                        AD
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-[var(--text-primary)]">Admin User</p>
                        <p className="text-xs text-[var(--text-muted)]">Super Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
