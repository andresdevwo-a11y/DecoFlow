import React, { useState } from 'react';
import Modal from './Modal';
import { LicenseService } from '../../services/licenseService';

const CreateLicenseModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'TRIAL',
        clientName: '',
        clientPhone: '',
        notes: '',
        days: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await LicenseService.createLicense({
                type: formData.type,
                clientName: formData.clientName,
                clientPhone: formData.clientPhone,
                notes: formData.notes,
                days: formData.type === 'CUSTOM' ? parseInt(formData.days) : undefined
            });
            onSuccess();
            onClose();
            setFormData({ type: 'TRIAL', clientName: '', clientPhone: '', notes: '', days: '' });
        } catch (error) {
            console.error(error);
            alert('Error al crear la licencia: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Licencia">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tipo de Licencia</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                    >
                        <option value="TRIAL">Trial (7 días)</option>
                        <option value="MENSUAL">Mensual (30 días)</option>
                        <option value="TRIMESTRAL">Trimestral (90 días)</option>
                        <option value="SEMESTRAL">Semestral (180 días)</option>
                        <option value="ANUAL">Anual (365 días)</option>
                        <option value="LIFETIME">Lifetime (~100 años)</option>
                        <option value="CUSTOM">Personalizada</option>
                    </select>
                </div>

                {formData.type === 'CUSTOM' && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Días de Validez</label>
                        <input
                            type="number"
                            name="days"
                            required
                            value={formData.days}
                            onChange={handleChange}
                            placeholder="Ej. 15"
                            className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nombre del Cliente</label>
                    <input
                        type="text"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleChange}
                        placeholder="Ej. Juan Perez"
                        className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Teléfono</label>
                    <input
                        type="text"
                        name="clientPhone"
                        value={formData.clientPhone}
                        onChange={handleChange}
                        placeholder="+57 300..."
                        className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notas Opcionales</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="2"
                        className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                    ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-[var(--radius)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-[var(--radius)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
                    >
                        {loading ? 'Creando...' : 'Crear Licencia'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateLicenseModal;
