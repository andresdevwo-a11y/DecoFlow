import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import LicenseTable from '../components/Licenses/LicenseTable';
import CreateLicenseModal from '../components/Modals/CreateLicenseModal';
import ManageLicenseModal from '../components/Modals/ManageLicenseModal';
import { LicenseService } from '../services/licenseService';

const Licenses = () => {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // ALL, ACTIVE, TRIAL, etc.
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedLicense, setSelectedLicense] = useState(null);

    useEffect(() => {
        loadLicenses();
    }, []);

    const loadLicenses = async () => {
        setLoading(true);
        try {
            const data = await LicenseService.fetchLicenses();
            setLicenses(data || []);
        } catch (error) {
            console.error('Failed to load licenses', error);
            alert('Error cargando licencias');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (license) => {
        setSelectedLicense(license);
    };

    const filteredLicenses = licenses.filter(lic => {
        const matchesSearch =
            lic.license_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lic.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (filterType === 'ALL') return matchesSearch;
        return matchesSearch && lic.license_type === filterType;
    });

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Licencias</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Administra y monitorea todas las licencias.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-[var(--radius)] font-medium shadow-lg shadow-[var(--primary-glow)] transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nueva Licencia
                </button>
            </div>

            <div className="bg-[var(--bg-card)] p-4 rounded-[var(--radius)] border border-[var(--border)] mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Buscar por código o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-[var(--radius)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-[var(--text-muted)]" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-[var(--bg-app)] text-[var(--text-primary)] px-4 py-2.5 rounded-[var(--radius)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                    >
                        <option value="ALL">Todos los tipos</option>
                        <option value="TRIAL">Trial</option>
                        <option value="MENSUAL">Mensual</option>
                        <option value="ANUAL">Anual</option>
                        <option value="LIFETIME">Lifetime</option>
                    </select>
                </div>
                <button
                    onClick={loadLicenses}
                    className="p-2.5 bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-[var(--radius)] border border-[var(--border)]"
                    title="Recargar"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <LicenseTable licenses={filteredLicenses} onAction={handleAction} />

            <CreateLicenseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadLicenses}
            />

            <ManageLicenseModal
                isOpen={!!selectedLicense}
                license={selectedLicense}
                onClose={() => setSelectedLicense(null)}
                onSuccess={loadLicenses}
            />
        </div>
    );
};

export default Licenses;
