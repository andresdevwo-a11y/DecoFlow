-- ============================================================
-- MIGRACIÓN: Contador desde Activación
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columna days_valid
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS days_valid INTEGER;

-- 2. Actualizar constraint de status para incluir 'pending'
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_status_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_status_check 
    CHECK (status IN ('pending', 'active', 'blocked', 'expired'));

-- 3. Hacer end_date nullable
ALTER TABLE licenses ALTER COLUMN end_date DROP NOT NULL;

-- 4. Migrar licencias existentes: calcular days_valid desde end_date
UPDATE licenses 
SET days_valid = CEIL(EXTRACT(EPOCH FROM end_date - start_date) / 86400)
WHERE days_valid IS NULL AND end_date IS NOT NULL;


-- ============================================================
-- ACTUALIZAR FUNCIÓN: activate_license
-- ============================================================

CREATE OR REPLACE FUNCTION activate_license(p_license_code TEXT, p_device_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    license_record RECORD;
BEGIN
    SELECT * INTO license_record
    FROM licenses
    WHERE license_code = UPPER(TRIM(p_license_code));
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'INVALID_CODE',
            'message', 'El código de licencia ingresado no es válido.'
        );
    END IF;
    
    IF license_record.status = 'blocked' THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'LICENSE_BLOCKED',
            'message', 'Esta licencia ha sido bloqueada. Contacte al administrador.'
        );
    END IF;
    
    -- Solo verificar expiración si end_date está definido
    IF license_record.end_date IS NOT NULL AND license_record.end_date < NOW() THEN
        UPDATE licenses SET status = 'expired' WHERE id = license_record.id;
        RETURN json_build_object(
            'valid', false,
            'reason', 'LICENSE_EXPIRED',
            'message', 'Esta licencia ha expirado. Contacte al administrador para renovar.',
            'expired_at', license_record.end_date
        );
    END IF;
    
    IF license_record.device_id IS NOT NULL THEN
        IF license_record.device_id = p_device_id THEN
            UPDATE licenses SET last_validation = NOW() WHERE id = license_record.id;
            
            RETURN json_build_object(
                'valid', true,
                'reason', 'LICENSE_VALID',
                'license_id', license_record.id,
                'license_code', license_record.license_code,
                'license_type', license_record.license_type,
                'client_name', license_record.client_name,
                'end_date', license_record.end_date,
                'days_remaining', CEIL(EXTRACT(EPOCH FROM license_record.end_date - NOW()) / 86400)
            );
        ELSE
            RETURN json_build_object(
                'valid', false,
                'reason', 'DEVICE_MISMATCH',
                'message', 'Esta licencia ya está activada en otro dispositivo.'
            );
        END IF;
    END IF;
    
    -- PRIMERA ACTIVACIÓN: Calcular end_date ahora
    UPDATE licenses 
    SET 
        device_id = p_device_id,
        device_registered_at = NOW(),
        last_validation = NOW(),
        start_date = NOW(),
        end_date = NOW() + (license_record.days_valid || ' days')::INTERVAL,
        status = 'active'
    WHERE id = license_record.id;
    
    -- Recargar con los nuevos valores
    SELECT * INTO license_record FROM licenses WHERE id = license_record.id;
    
    RETURN json_build_object(
        'valid', true,
        'reason', 'DEVICE_REGISTERED',
        'message', 'Licencia activada exitosamente.',
        'license_id', license_record.id,
        'license_code', license_record.license_code,
        'license_type', license_record.license_type,
        'client_name', license_record.client_name,
        'end_date', license_record.end_date,
        'days_remaining', CEIL(EXTRACT(EPOCH FROM license_record.end_date - NOW()) / 86400)
    );
END;
$$;


-- ============================================================
-- ACTUALIZAR FUNCIÓN: validate_license
-- ============================================================

CREATE OR REPLACE FUNCTION validate_license(p_license_code TEXT, p_device_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    license_record RECORD;
BEGIN
    SELECT * INTO license_record
    FROM licenses
    WHERE license_code = UPPER(TRIM(p_license_code))
      AND device_id = p_device_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'LICENSE_NOT_FOUND',
            'message', 'Licencia no encontrada para este dispositivo.'
        );
    END IF;
    
    IF license_record.status = 'blocked' THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'LICENSE_BLOCKED',
            'message', 'Esta licencia ha sido bloqueada.'
        );
    END IF;
    
    IF license_record.end_date IS NOT NULL AND license_record.end_date < NOW() THEN
        UPDATE licenses SET status = 'expired' WHERE id = license_record.id;
        RETURN json_build_object(
            'valid', false,
            'reason', 'LICENSE_EXPIRED',
            'message', 'Su licencia ha expirado.',
            'expired_at', license_record.end_date
        );
    END IF;
    
    UPDATE licenses SET last_validation = NOW() WHERE id = license_record.id;
    
    RETURN json_build_object(
        'valid', true,
        'reason', 'LICENSE_VALID',
        'license_type', license_record.license_type,
        'end_date', license_record.end_date,
        'days_remaining', CEIL(EXTRACT(EPOCH FROM license_record.end_date - NOW()) / 86400)
    );
END;
$$;


-- ============================================================
-- ACTUALIZAR FUNCIÓN: generate_license_typed
-- ============================================================

CREATE OR REPLACE FUNCTION generate_license_typed(
    p_license_type TEXT,
    p_client_name TEXT,
    p_client_phone TEXT,
    p_days_valid INTEGER,
    p_extra_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_code TEXT;
    new_license RECORD;
    final_notes TEXT;
BEGIN
    new_code := UPPER(
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
    
    WHILE EXISTS (SELECT 1 FROM licenses WHERE license_code = new_code) LOOP
        new_code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
        );
    END LOOP;
    
    final_notes := 'TIPO: ' || p_license_type;
    IF p_extra_notes IS NOT NULL AND p_extra_notes != '' THEN
        final_notes := final_notes || ' | ' || p_extra_notes;
    END IF;
    
    -- SIN end_date, se calcula al activar
    INSERT INTO licenses (license_code, license_type, days_valid, client_name, client_phone, notes, status)
    VALUES (new_code, p_license_type, p_days_valid, p_client_name, p_client_phone, final_notes, 'pending')
    RETURNING * INTO new_license;
    
    RETURN json_build_object(
        'success', true,
        'license_code', new_license.license_code,
        'license_type', new_license.license_type,
        'days_valid', new_license.days_valid,
        'client_name', new_license.client_name,
        'status', new_license.status,
        'message', 'Licencia creada. Se activará cuando el usuario ingrese el código.'
    );
END;
$$;
