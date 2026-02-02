
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

    // Cargar licencia guardada y deviceId al iniciar
    useEffect(() => {
        console.log('[LicenseContext] Mounting Provider...');
        loadDeviceId();
        checkStoredLicense();
    }, []);

    const loadDeviceId = async () => {
        try {
            const id = await getDeviceId();
            setDeviceId(id);
        } catch (error) {
            console.error('[LicenseContext] Error loading deviceId:', error);
        }
    };

    // Revalidar cuando la app vuelve primer plano
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active' && isActivated) {
                // Solo revalidar si ha pasado > 1 hora o si hubo error previo
                const now = Date.now();
                if (!lastCheck || (now - lastCheck > 60 * 60 * 1000)) {
                    refreshLicense();
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, [isActivated, lastCheck]);

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
        removeLicense
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
