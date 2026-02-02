
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export const getDeviceId = async () => {
    let deviceId = 'unknown-device';

    try {
        if (Platform.OS === 'android') {
            deviceId = Application.getAndroidId();
        } else if (Platform.OS === 'ios') {
            deviceId = await Application.getIosIdForVendorAsync();
        }
    } catch (error) {
        console.error('Error getting device ID:', error);
    }

    // Fallback simple si falla (aunque expo-application es muy confiable)
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substring(2, 15);
    }

    return deviceId;
};

export const getDeviceInfo = () => {
    return {
        appVersion: Application.nativeApplicationVersion,
        buildVersion: Application.nativeBuildVersion,
        model: Application.modelName,
        osVersion: Platform.Version,
    };
};
