
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

    const [isEnteringNewCode, setIsEnteringNewCode] = useState(false);
    // Nuevos estados para el sistema de expiración amigable
    const [warningLevel, setWarningLevel] = useState(null); // null, 'DAYS', 'HOURS', 'EXPIRED'
    const [gracePeriodEndsAt, setGracePeriodEndsAt] = useState(null);
    const [isInGracePeriod, setIsInGracePeriod] = useState(false);
    const [isWarningDismissed, setIsWarningDismissed] = useState(false);
    const [isGraceModalDismissed, setIsGraceModalDismissed] = useState(false);

    // Constantes de configuración
    const WARNING_DAYS_THRESHOLD = 3;
    const GRACE_PERIOD_MINUTES = 15;

    // Intervalos dinámicos según estado
    const INTERVALS = {
        NORMAL: 5 * 60 * 1000,      // 5 minutos
        URGENT: 60 * 1000,          // 1 minuto
        GRACE: 20 * 1000            // 20 segundos (un poco más rápido para asegurar precisión)
    };

    // Función para obtener intervalo actual
    const getCurrentInterval = useCallback(() => {
        if (isInGracePeriod) return INTERVALS.GRACE;
        if (warningLevel === 'HOURS') return INTERVALS.URGENT;
        return INTERVALS.NORMAL;
    }, [isInGracePeriod, warningLevel]);

    // Cargar licencia guardada y deviceId al iniciar
    useEffect(() => {
        console.log('[LicenseContext] Mounting Provider...');
        loadDeviceId();
        checkStoredLicense();
    }, []);

    // Verificación periódica local con intervalo dinámico
    useEffect(() => {
        let timeoutId = null;

        const scheduleNextCheck = () => {
            const interval = getCurrentInterval();
            console.log(`[LicenseContext] Next expiration check in ${interval / 1000}s`);

            timeoutId = setTimeout(() => {
                if (licenseInfo?.end_date) {
                    checkExpirationState();
                }
                scheduleNextCheck(); // Programar siguiente verificación
            }, interval);
        };

        // Verificación inicial inmediata si hay datos
        if (licenseInfo?.end_date) {
            checkExpirationState();
        }

        // Iniciar ciclo
        scheduleNextCheck();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [licenseInfo, isValid, isInGracePeriod, warningLevel, getCurrentInterval]);

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

        try {
            // PASO 1: Detectar si hay código (independiente de validación)
            console.log('[LicenseContext] Calling getStoredLicenseCode...');
            const storedCode = await getStoredLicenseCode();
            console.log('[LicenseContext] Stored code result:', storedCode);

            if (!storedCode) {
                console.log('[LicenseContext] No code found.');
                setIsActivated(false);
                setIsValid(false);
                setIsLoading(false);
                return;
            }

            // PASO 2: Hay código, SIEMPRE es activado (aunque no sepamos si es válido aún)
            console.log('[LicenseContext] Code found, marking as activated.');
            setIsActivated(true);

            // PASO 3: Intentar validar con servidor con timeout
            try {
                const validationPromise = new Promise(resolve => setTimeout(() => resolve(validateLicense(storedCode)), 0)); // Ensure it's async
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT')), 5000)
                );

                const result = await Promise.race([validationPromise, timeoutPromise]);
                console.log('[LicenseContext] Validation result:', result);
                handleValidationResult(result);
            } catch (validationError) {
                console.error('[LicenseContext] Validation error/timeout:', validationError);

                // Error de validación NO afecta isActivated (ya está en true)
                setIsValid(false);

                // Determinar razón del error para el UI
                const isTimeout = validationError.message === 'TIMEOUT' || validationError.message?.includes('Network');

                setLicenseInfo({
                    valid: false,
                    reason: isTimeout ? 'CACHE_EXPIRED' : 'VALIDATION_ERROR',
                    message: isTimeout
                        ? 'No se pudo verificar. Conecta a internet.'
                        : 'Error al verificar la licencia.'
                });
            }
        } catch (error) {
            console.error('[LicenseContext] Critical error reading storage:', error);
            // Solo si falla la lectura del storage (muy raro) desactivamos
            setIsActivated(false);
            setIsValid(false);
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

                // Salir del modo "ingresando código"
                setIsEnteringNewCode(false);

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

    const startNewLicenseEntry = () => {
        setIsEnteringNewCode(true);
    };

    const cancelNewLicenseEntry = () => {
        setIsEnteringNewCode(false);
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
        // Nuevos exports para el flujo de cambio
        isEnteringNewCode,
        startNewLicenseEntry,
        cancelNewLicenseEntry,
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
