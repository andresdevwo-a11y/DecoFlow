
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// ⚠️ REEMPLAZA ESTAS VARIABLES CON LAS DE TU PROYECTO SUPABASE
const SUPABASE_URL = 'https://hmaubqenaantwvyswirw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtYXVicWVuYWFudHd2eXN3aXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODU0NzEsImV4cCI6MjA4NTU2MTQ3MX0.OsA69mXJRV7KSsacNcpVFXaNZZ-_8zwMZySPBgC2vi4';

const ExpoSecureStoreAdapter = {
    getItem: (key) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key, value) => {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key) => {
        SecureStore.deleteItemAsync(key);
    },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
