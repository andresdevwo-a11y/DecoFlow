import { supabase } from '../supabaseClient';

export const LicenseService = {
    /**
     * Fetch all licenses from the database.
     * Supports optional filtering.
     */
    async fetchLicenses() {
        // Select all columns and order by created_at desc
        const { data, error } = await supabase
            .from('licenses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Create a new license using the secure RPC function.
     * @param {Object} params 
     * @param {string} params.type - TRIAL, MENSUAL, etc.
     * @param {string} params.clientName
     * @param {string} params.clientPhone
     * @param {number} params.days - Optional custom days
     * @param {string} params.notes
     */
    async createLicense({ type, clientName, clientPhone, days, notes }) {
        // Prepare parameters ensuring they match SQL signature EXACTLY and handle defaults

        let daysToSend = days ? parseInt(days) : null;
        if (!daysToSend) {
            switch (type) {
                case 'TRIAL': daysToSend = 7; break;
                case 'MENSUAL': daysToSend = 30; break;
                case 'TRIMESTRAL': daysToSend = 90; break;
                case 'SEMESTRAL': daysToSend = 180; break;
                case 'ANUAL': daysToSend = 365; break;
                case 'LIFETIME': daysToSend = 36500; break;
                default: daysToSend = 30;
            }
        }

        const params = {
            p_license_type: type,
            p_client_name: clientName || '',
            p_client_phone: clientPhone || '',
            p_days_valid: daysToSend,
            p_extra_notes: notes || ''
        };

        const { data, error } = await supabase.rpc('generate_license_typed', params);

        if (error) throw error;
        return data;
    },

    /**
     * Update an existing license.
     * @param {string} id 
     * @param {Object} updates 
     */
    async updateLicense(id, updates) {
        const { data, error } = await supabase
            .from('licenses')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Renew/Extend a license.
     * Direct SQL update for end_date.
     */
    async extendLicense(id, days) {
        // We need to fetch current Date to be safe, or use SQL calculation.
        // Let's use an RPC or raw SQL? Supabase doesn't support 'end_date = end_date + interval' easily via JS SDK .update()
        // unless we read first. 
        // Optimization: Read first, then update.

        // 1. Get current license
        const { data: license, error: fetchError } = await supabase
            .from('licenses')
            .select('end_date, status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Calculate new date
        const currentEnd = new Date(license.end_date || new Date());
        const now = new Date();
        // If expired, start from NOW. If active, valid from currentEnd
        const baseDate = (currentEnd < now) ? now : currentEnd;
        baseDate.setDate(baseDate.getDate() + parseInt(days));

        // 3. Update
        const { data, error } = await supabase
            .from('licenses')
            .update({
                end_date: baseDate.toISOString(),
                status: 'active' // Auto-activate if it was expired
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Reset hardware binding (Device ID).
     */
    async resetHardware(id) {
        const { data, error } = await supabase
            .from('licenses')
            .update({
                device_id: null,
                device_registered_at: null
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Block or Unblock a license.
     */
    async toggleBlock(id, isBlocked) {
        const status = isBlocked ? 'blocked' : 'active';
        // Note: if unblocking, we might want to check if it's expired, but 'active' implies valid legally.
        // The cron/validation logic handles expiration.

        const { data, error } = await supabase
            .from('licenses')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a license permanently.
     */
    async deleteLicense(id) {
        const { error } = await supabase
            .from('licenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
