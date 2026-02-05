import React from 'react';

const LicenseStatusBadge = ({ status }) => {
    const styles = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        blocked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    const labels = {
        active: 'Activa',
        blocked: 'Bloqueada',
        expired: 'Expirada',
        pending: 'Pendiente',
    };

    const currentStyle = styles[status] || styles.pending;
    const label = labels[status] || status;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
            {label}
        </span>
    );
};

export default LicenseStatusBadge;
