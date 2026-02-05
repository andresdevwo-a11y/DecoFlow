-- ============================================================
-- SISTEMA DE LICENCIAMIENTO - ESQUEMA CONSOLIDADO
-- ============================================================
-- Este archivo unifica la estructura, funciones y políticas
-- de la base de datos para el sistema de licencias.
-- ============================================================

-- ============================================================
-- 1. TABLAS E ÍNDICES
-- ============================================================

-- Tabla de licencias
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_code TEXT UNIQUE NOT NULL,
    license_type TEXT DEFAULT 'CUSTOM' CHECK (license_type IN ('TRIAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'LIFETIME', 'CUSTOM')),
    days_valid INTEGER,
    client_name TEXT,
    client_phone TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked', 'expired')),
    device_id TEXT,
    device_registered_at TIMESTAMP WITH TIME ZONE,
    last_validation TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_licenses_code ON licenses(license_code);
CREATE INDEX IF NOT EXISTS idx_licenses_device ON licenses(device_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_type ON licenses(license_type);

-- ============================================================
-- 2. TRIGGERS DE MANTENIMIENTO
-- ============================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger asociado
DROP TRIGGER IF EXISTS licenses_updated_at ON licenses;
CREATE TRIGGER licenses_updated_at
    BEFORE UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. FUNCIONES DEL SISTEMA (RPC)
-- ============================================================

-- 3.1 ACTIVAR LICENCIA
-- Lógica actualizada para incluir validación de dias, null end_date inicial, etc.
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

-- 3.2 VALIDAR LICENCIA (Revalidación periódica)
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
        'license_code', license_record.license_code,
        'license_type', license_record.license_type,
        'end_date', license_record.end_date,
        'days_remaining', CEIL(EXTRACT(EPOCH FROM license_record.end_date - NOW()) / 86400)
    );
END;
$$;

-- 3.3 GENERAR LICENCIA BASE
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

-- 3.4 WRAPPERS DE GENERACIÓN (Alias por conveniencia)

-- TRIAL: 7 días
CREATE OR REPLACE FUNCTION generate_trial_license(p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN generate_license_typed('TRIAL', p_client_name, p_client_phone, 7, p_notes); END; $$;

-- MENSUAL: 30 días
CREATE OR REPLACE FUNCTION generate_monthly_license(p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN generate_license_typed('MENSUAL', p_client_name, p_client_phone, 30, p_notes); END; $$;

-- TRIMESTRAL: 90 días
CREATE OR REPLACE FUNCTION generate_quarterly_license(p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN generate_license_typed('TRIMESTRAL', p_client_name, p_client_phone, 90, p_notes); END; $$;

-- SEMESTRAL: 180 días
CREATE OR REPLACE FUNCTION generate_semester_license(p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN generate_license_typed('SEMESTRAL', p_client_name, p_client_phone, 180, p_notes); END; $$;

-- ANUAL: 365 días
CREATE OR REPLACE FUNCTION generate_annual_license(p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN generate_license_typed('ANUAL', p_client_name, p_client_phone, 365, p_notes); END; $$;

-- LIFETIME: 36,500 días
CREATE OR REPLACE FUNCTION generate_lifetime_license(p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN generate_license_typed('LIFETIME', p_client_name, p_client_phone, 36500, p_notes); END; $$;

-- LEGADO: Custom
CREATE OR REPLACE FUNCTION generate_license(p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL, p_days_valid INTEGER DEFAULT 365, p_notes TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN generate_license_typed('CUSTOM', p_client_name, p_client_phone, p_days_valid, p_notes); END; $$;

-- ============================================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS) Y PERMISOS
-- ============================================================

-- Habilitar RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- 4.1 Permisos RPC (Funciones)
GRANT EXECUTE ON FUNCTION activate_license(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_license(TEXT, TEXT) TO anon;

-- Admin Panel necesita permisos para generar
GRANT EXECUTE ON FUNCTION generate_license_typed(TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_license_typed(TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_license_typed(TEXT, TEXT, TEXT, INTEGER, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION update_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION update_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at() TO service_role;

-- 4.2 Políticas de Tabla (CRUD para Admin Panel)

-- DROP de políticas previas para evitar errores al re-ejecutar
DROP POLICY IF EXISTS "Enable read access for all users" ON licenses;
DROP POLICY IF EXISTS "Enable update for all users" ON licenses;
DROP POLICY IF EXISTS "Enable delete for all users" ON licenses;
DROP POLICY IF EXISTS "Enable insert for all users" ON licenses;

-- Permitir SELECT (fixes "no se muestra nada")
CREATE POLICY "Enable read access for all users" ON "public"."licenses"
AS PERMISSIVE FOR SELECT TO public USING (true);

-- Permitir UPDATE (fixes "renovar/bloquear")
CREATE POLICY "Enable update for all users" ON "public"."licenses"
AS PERMISSIVE FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Permitir DELETE
CREATE POLICY "Enable delete for all users" ON "public"."licenses"
AS PERMISSIVE FOR DELETE TO public USING (true);

-- Permitir INSERT (si el panel insertara directo, aunque usa RPC)
CREATE POLICY "Enable insert for all users" ON "public"."licenses"
AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
