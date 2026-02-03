
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { validateLicense, activateLicense, getStoredLicenseCode, clearLicenseCache } from '../services/LicenseService';
import { getDeviceId } from '../services/DeviceService';

const LicenseContext = createContext();

export const LicenseProvider = ({ children }) => {
    const [licenseInfo, setLicenseInfo] = useState(null);
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isActivated, setIsActivated] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [deviceId, setDeviceId] = useState(null);

    // Nuevos estados para el sistema de expiración amigable
    const [warningLevel, setWarningLevel] = useState(null); // null, 'DAYS', 'HOURS', 'EXPIRED'
    const [gracePeriodEndsAt, setGracePeriodEndsAt] = useState(null);
    const [isInGracePeriod, setIsInGracePeriod] = useState(false);
    const [isWarningDismissed, setIsWarningDismissed] = useState(false);
    const [isGraceModalDismissed, setIsGraceModalDismissed] = useState(false);

    // Constantes de configuración
    const WARNING_DAYS_THRESHOLD = 3;
    const GRACE_PERIOD_MINUTES = 15;
    const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

    // Cargar licencia guardada y deviceId al iniciar
    useEffect(() => {
        console.log('[LicenseContext] Mounting Provider...');
        loadDeviceId();
        checkStoredLicense();
    }, []);

    // Verificación periódica local
    useEffect(() => {
        // Ejecutar inmediatamente si tenemos datos
        if (licenseInfo?.end_date && isValid) {
            checkExpirationState();
        }

        const interval = setInterval(() => {
            if (licenseInfo?.end_date && isValid) {
                checkExpirationState();
            }
        }, CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [licenseInfo, isValid, isInGracePeriod]);

    const loadDeviceId = async () => {
        try {
            const id = await getDeviceId();
            setDeviceId(id);
        } catch (error) {
            console.error('[LicenseContext] Error loading deviceId:', error);
        }
    };

    // Lógica principal de verificación de estado
    const checkExpirationState = () => {
        if (!licenseInfo?.end_date) return;

        const now = Date.now();
        const endDate = new Date(licenseInfo.end_date).getTime();
        const diff = endDate - now;

        console.log('[LicenseContext] Checking expiration. Time left (ms):', diff);

        // Si ya estamos en período de gracia, verificar si se acabó
        if (isInGracePeriod) {
            if (gracePeriodEndsAt && now >= gracePeriodEndsAt) {
                console.log('[LicenseContext] Grace period ended. Blocking app.');
                endGracePeriod();
            }
            return;
        }

        // Si la licencia expiró y NO estamos en gracia
        if (diff <= 0) {
            console.log('[LicenseContext] License expired globally. Starting grace period.');
            startGracePeriod();
            return;
        }

        // Niveles de advertencia
        const daysLeft = diff / (1000 * 60 * 60 * 24);
        const hoursLeft = diff / (1000 * 60 * 60);

        if (hoursLeft <= 24) {
            setWarningLevel('HOURS');
        } else if (daysLeft <= WARNING_DAYS_THRESHOLD) {
            setWarningLevel('DAYS');
        } else {
            setWarningLevel(null);
        }
    };

    const startGracePeriod = () => {
        // Solo iniciar si no estamos ya en ello
        if (isInGracePeriod) return;

        console.log('[LicenseContext] Starting grace period check...');
        const endsAt = Date.now() + (GRACE_PERIOD_MINUTES * 60 * 1000);
        setGracePeriodEndsAt(endsAt);
        setIsInGracePeriod(true);
        setWarningLevel('EXPIRED');
        setIsGraceModalDismissed(false); // Forzar que se muestre el modal

        // NO ponemos isValid a false todavía, eso pasa cuando acaba el tiempo
    };

    const endGracePeriod = () => {
        setIsInGracePeriod(false);
        setIsValid(false);
        setLicenseInfo(prev => ({
            ...prev,
            valid: false,
            reason: 'LICENSE_EXPIRED',
            message: 'El período de gracia ha finalizado.'
        }));
    };

    const dismissWarning = () => {
        setIsWarningDismissed(true);
    };

    const dismissGraceModal = () => {
        setIsGraceModalDismissed(true);
    };

    const showGraceModal = () => {
        setIsGraceModalDismissed(false);
    };

    // Revalidar cuando la app vuelve primer plano
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active' && isActivated) {
                // Verificar estado local inmediatamente
                checkExpirationState();

                // Solo revalidar con servidor si ha pasado tiempo
                const now = Date.now();
                if (!lastCheck || (now - lastCheck > 60 * 60 * 1000)) {
                    refreshLicense();
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, [isActivated, lastCheck, licenseInfo]);

    const checkStoredLicense = async () => {
        console.log('[LicenseContext] Checking stored license...');
        setIsLoading(true);

        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve('TIMEOUT');
            }, 5000);
        });

        const checkPromise = async () => {
            try {
                console.log('[LicenseContext] Calling getStoredLicenseCode...');
                const storedCode = await getStoredLicenseCode();
                console.log('[LicenseContext] Stored code result:', storedCode);

                if (storedCode) {
                    console.log('[LicenseContext] Code found, validating...');
                    setIsActivated(true);
                    // Validar la licencia guardada
                    const result = await validateLicense(storedCode);
                    console.log('[LicenseContext] Validation result:', result);
                    handleValidationResult(result);
                } else {
                    console.log('[LicenseContext] No code found.');
                    setIsActivated(false);
                    setIsValid(false);
                }
            } catch (error) {
                console.error('[LicenseContext] Initial license check failed:', error);
                setIsValid(false);
            }
            return 'DONE';
        };

        try {
            const result = await Promise.race([checkPromise(), timeoutPromise]);

            if (result === 'TIMEOUT') {
                console.warn('[LicenseContext] Initialization timed out! Force stopping loading.');
                setIsActivated(false);
                setIsValid(false);
            }
        } catch (e) {
            console.error('[LicenseContext] Race error:', e);
        } finally {
            console.log('[LicenseContext] Finished check, loading false.');
            setIsLoading(false);
        }
    };

    const handleValidationResult = (result) => {
        setLicenseInfo(result);
        setIsValid(result.valid);
        setLastCheck(Date.now());

        // Resetear advertencias si es válido
        if (result.valid) {
            // Forzar check inmediato para setear warnings correctos
            checkExpirationState();
        }

        if (!result.valid && result.reason !== 'NO_CODE') {
            // Si no es válida pero teníamos código, sigue activada (pero bloqueada)
            setIsActivated(true);
        }
    };

    const activate = async (code) => {
        try {
            const result = await activateLicense(code);

            if (result.valid) {
                // Pre-set license info but verify entry manually with confirmActivation
                setLicenseInfo(result);
                setIsValid(true);

                // Reiniciar estados de advertencia
                setWarningLevel(null);
                setIsInGracePeriod(false);
                setGracePeriodEndsAt(null);
                setIsWarningDismissed(false);

                return { success: true };
            } else {
                return { success: false, message: result.message || 'Error al activar.' };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error de conexión.'
            };
        }
    };

    const confirmActivation = () => {
        setIsActivated(true);
    };

    const refreshLicense = async () => {
        const storedCode = await getStoredLicenseCode();
        if (storedCode) {
            const result = await validateLicense(storedCode);
            handleValidationResult(result);
            return result;
        }
    };

    const removeLicense = async () => {
        await clearLicenseCache();
        setLicenseInfo(null);
        setIsValid(false);
        setIsActivated(false);
        // Reset full state
        setWarningLevel(null);
        setIsInGracePeriod(false);
        setGracePeriodEndsAt(null);
    };

    const value = {
        licenseInfo,
        isValid,
        isLoading,
        isActivated,
        deviceId,
        activate,
        confirmActivation,
        refreshLicense,
        removeLicense,
        // Nuevos exports
        warningLevel,
        isInGracePeriod,
        gracePeriodEndsAt,
        isWarningDismissed,
        dismissWarning,
        isGraceModalDismissed,
        dismissGraceModal,
        showGraceModal
    };

    return (
        <LicenseContext.Provider value={value}>
            {children}
        </LicenseContext.Provider>
    );
};

export const useLicense = () => {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
};
