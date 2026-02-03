
import { supabase } from './supabaseClient';
import { getDeviceId } from './DeviceService';
import * as SecureStore from 'expo-secure-store';

const LICENSE_CACHE_KEY = 'woodland_license_cache';
const OFFLINE_GRACE_DAYS = 7;

/**
 * Activa una nueva licencia
 * @param {string} licenseCode - El código de licencia (formato XXXX-XXXX-XXXX)
 */
export const activateLicense = async (licenseCode) => {
    try {
        const deviceId = await getDeviceId();

        const { data, error } = await supabase.rpc('activate_license', {
            p_license_code: licenseCode,
            p_device_id: deviceId
        });

        if (error) throw error;

        if (data.valid) {
            await cacheLicenseResult({
                ...data,
                license_code: licenseCode
            });
        }

        return data;
    } catch (error) {
        console.error('Error activating license - Full Object:', JSON.stringify(error, null, 2));
        console.error('Error activating license - Message:', error.message);
        console.error('Error activating license - Details:', error.details);
        console.error('Error activating license - Hint:', error.hint);
        throw error;
    }
};

/**
 * Valida la licencia actual (con soporte offline)
 * @param {string} licenseCode - El código de licencia guardado
 */
export const validateLicense = async (licenseCode) => {
    if (!licenseCode) return { valid: false, reason: 'NO_CODE' };

    try {
        const deviceId = await getDeviceId();

        // Intentar validación online
        const { data, error } = await supabase.rpc('validate_license', {
            p_license_code: licenseCode,
            p_device_id: deviceId
        });

        if (error) throw error;

        if (data.valid) {
            await cacheLicenseResult({
                ...data,
                license_code: licenseCode // Asegurar que guardamos el código
            });
            return data;
        } else {
            // Actulizamos el cache con la info de invalidez para recordarlo
            // pero mantenemos el código guardado
            await cacheLicenseResult({
                ...data,
                license_code: licenseCode
            });
            return data;
        }

    } catch (error) {
        // Error de red u otro, intentar offline
        console.log('Online validation failed, trying offline:', error.message);
        return await validateOffline(licenseCode);
    }
};

/**
 * Valida usando datos cacheados
 */
export const validateOffline = async (expectedCode) => {
    try {
        const cachedString = await SecureStore.getItemAsync(LICENSE_CACHE_KEY);
        if (!cachedString) {
            return {
                valid: false,
                reason: 'NO_CACHE',
                message: 'Se requiere conexión a internet para validar la licencia.'
            };
        }

        const data = JSON.parse(cachedString);

        // Verificar que coincida el código (por si acaso)
        if (expectedCode && data.license_code && data.license_code !== expectedCode) {
            return {
                valid: false,
                reason: 'CODE_MISMATCH',
                message: 'Los datos guardados no coinciden con la licencia.'
            };
        }

        const cachedDate = new Date(data.cached_at);
        const daysSinceCache = (Date.now() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);

        // Verificar período de gracia
        if (daysSinceCache > OFFLINE_GRACE_DAYS) {
            return {
                valid: false,
                reason: 'CACHE_EXPIRED',
                message: `Han pasado más de ${OFFLINE_GRACE_DAYS} días sin conexión. Conéctate a internet para verificar tu licencia.`
            };
        }

        // Verificar fecha de expiración de la licencia
        if (data.end_date && new Date(data.end_date) < new Date()) {
            return {
                valid: false,
                reason: 'LICENSE_EXPIRED',
                message: 'Tu licencia ha expirado.'
            };
        }

        return {
            ...data,
            valid: true, // Si pasó las comprobaciones, es válida offline
            offline_mode: true,
            offline_days_remaining: Math.max(0, Math.floor(OFFLINE_GRACE_DAYS - daysSinceCache))
        };

    } catch (error) {
        console.error('Offline validation error:', error);
        return {
            valid: false,
            reason: 'CACHE_ERROR',
            message: 'Error al verificar licencia offline.'
        };
    }
};

/**
 * Guarda el resultado exitoso en cache seguro
 */
const cacheLicenseResult = async (result) => {
    const cacheData = {
        ...result,
        cached_at: new Date().toISOString(),
    };
    await SecureStore.setItemAsync(LICENSE_CACHE_KEY, JSON.stringify(cacheData));
};

/**
 * Borra el cache de licencia
 */
export const clearLicenseCache = async () => {
    await SecureStore.deleteItemAsync(LICENSE_CACHE_KEY);
};

/**
 * Obtiene el código de licencia guardado localmente (si existe)
 */
export const getStoredLicenseCode = async () => {
    try {
        const cachedString = await SecureStore.getItemAsync(LICENSE_CACHE_KEY);
        if (cachedString) {
            const data = JSON.parse(cachedString);
            return data.license_code;
        }
    } catch (e) {
        console.error('Error reading stored license:', e);
    }
    return null;
};
