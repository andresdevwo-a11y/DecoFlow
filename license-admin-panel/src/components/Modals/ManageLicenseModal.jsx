import React, { useState } from 'react';
import Modal from './Modal';
import { LicenseService } from '../../services/licenseService';
import { RefreshCw, MonitorX, Lock, Unlock, Trash2, CalendarPlus } from 'lucide-react';

const ManageLicenseModal = ({ isOpen, onClose, license, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [extendDays, setExtendDays] = useState(30);

    if (!license) return null;

    const handleAction = async (actionFn, successMessage) => {
        if (!window.confirm('¿Estás seguro de realizar esta acción?')) return;

        setLoading(true);
        try {
            await actionFn();
            alert(successMessage);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar Licencia: ${license.license_code}`}>
            <div className="space-y-6">
                {/* Info Preview */}
                <div className="bg-[var(--bg-app)] p-3 rounded-[var(--radius)] text-sm">
                    <p><span className="text-[var(--text-secondary)]">Cliente:</span> {license.client_name || 'N/A'}</p>
                    <p><span className="text-[var(--text-secondary)]">Tipo:</span> {license.license_type}</p>
                    <p><span className="text-[var(--text-secondary)]">Estado:</span> {license.status}</p>
                </div>

                {/* Action: Extend */}
                <div className="border-t border-[var(--border)] pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center">
                        <CalendarPlus className="w-4 h-4 mr-2" /> Renovación / Extensión
                    </h4>
                    <div className="flex gap-2">
                        <select
                            value={extendDays}
                            onChange={(e) => setExtendDays(e.target.value)}
                            className="bg-[var(--bg-app)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                        >
                            <option value="30">30 Días</option>
                            <option value="90">90 Días</option>
                            <option value="180">6 Meses</option>
                            <option value="365">1 Año</option>
                        </select>
                        <button
                            disabled={loading}
                            onClick={() => handleAction(
                                () => LicenseService.extendLicense(license.id, extendDays),
                                'Licencia extendida correctamente.'
                            )}
                            className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium py-2 rounded-[var(--radius)]"
                        >
                            Extender Vencimiento
                        </button>
                    </div>
                </div>

                {/* Action: Reset Hardware */}
                <div className="border-t border-[var(--border)] pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center">
                        <MonitorX className="w-4 h-4 mr-2" /> Reset de Hardware
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mb-3">
                        Permite activar la licencia en un nuevo dispositivo.
                    </p>
                    <button
                        disabled={loading || !license.device_id}
                        onClick={() => handleAction(
                            () => LicenseService.resetHardware(license.id),
                            'Hardware reseteado. El cliente puede activar en otro equipo.'
                        )}
                        className="w-full border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-medium py-2 rounded-[var(--radius)] disabled:opacity-50"
                    >
                        {license.device_id ? 'Desvincular Dispositivo Actual' : 'No hay dispositivo vinculado'}
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-[var(--border)] pt-4">
                    <h4 className="text-sm font-semibold mb-3 text-[var(--accent-danger)]">Zona de Peligro</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            disabled={loading}
                            onClick={() => handleAction(
                                () => LicenseService.toggleBlock(license.id, license.status !== 'blocked'),
                                license.status === 'blocked' ? 'Licencia desbloqueada.' : 'Licencia bloqueada.'
                            )}
                            className={`flex items-center justify-center py-2 rounded-[var(--radius)] text-sm font-medium border ${license.status === 'blocked'
                                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                    : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                }`}
                        >
                            {license.status === 'blocked' ? (
                                <><Unlock className="w-4 h-4 mr-2" /> Desbloquear</>
                            ) : (
                                <><Lock className="w-4 h-4 mr-2" /> Bloquear</>
                            )}
                        </button>

                        <button
                            disabled={loading}
                            onClick={() => handleAction(
                                () => LicenseService.deleteLicense(license.id),
                                'Licencia eliminada permanentemente.'
                            )}
                            className="flex items-center justify-center py-2 rounded-[var(--radius)] text-sm font-medium border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </button>
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default ManageLicenseModal;
