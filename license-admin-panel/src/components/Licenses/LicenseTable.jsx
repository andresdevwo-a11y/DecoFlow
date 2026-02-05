import React from 'react';
import { MoreHorizontal, Monitor, Calendar } from 'lucide-react';
import LicenseStatusBadge from './LicenseStatusBadge';

const LicenseTable = ({ licenses, onAction }) => {
    return (
        <div className="w-full overflow-x-auto bg-[var(--bg-card)] rounded-[var(--radius)] border border-[var(--border)] shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-[var(--border)]">
                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Código</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Dispositivo</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Vencimiento</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {licenses.map((license) => (
                        <tr key={license.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="px-6 py-4 font-mono text-sm text-[var(--text-primary)]">
                                {license.license_code}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-[var(--text-primary)]">{license.client_name || 'Sin nombre'}</div>
                                <div className="text-xs text-[var(--text-muted)]">{license.client_phone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                                {license.license_type}
                            </td>
                            <td className="px-6 py-4">
                                <LicenseStatusBadge status={license.status} />
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                                {license.device_id ? (
                                    <div className="flex items-center text-emerald-400" title={license.device_id}>
                                        <Monitor className="w-4 h-4 mr-1.5" />
                                        <span className="truncate max-w-[100px]">Registrado</span>
                                    </div>
                                ) : (
                                    <span className="text-[var(--text-muted)]">--</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                                {license.end_date ? (
                                    <div className="flex flex-col">
                                        <span>{new Date(license.end_date).toLocaleDateString()}</span>
                                        {license.status === 'active' && (
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {Math.ceil((new Date(license.end_date) - new Date()) / (1000 * 60 * 60 * 24))} días
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[var(--text-muted)]">--</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => onAction(license)}
                                    className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {licenses.length === 0 && (
                        <tr>
                            <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                                No se encontraron licencias.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LicenseTable;
