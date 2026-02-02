
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// ⚠️ REEMPLAZA ESTAS VARIABLES CON LAS DE TU PROYECTO SUPABASE
const SUPABASE_URL = 'https://vsxmovszgymmzdnpqskt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeG1vdnN6Z3ltbXpkbnBxc2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTkyNDcsImV4cCI6MjA4NTYzNTI0N30.Qh1G9vZzsRsslB2SI9FuHY709RCwi8eiSwm7idF9QKk';

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
