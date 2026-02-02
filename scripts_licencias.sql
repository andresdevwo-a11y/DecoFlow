-- ============================================================
-- SISTEMA DE LICENCIAMIENTO POR NIVELES: SCRIPTS SQL PARA SUPABASE
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================
-- TIPOS DE LICENCIA:
--   TRIAL      = 7 días (prueba gratuita)
--   MENSUAL    = 30 días
--   TRIMESTRAL = 90 días
--   SEMESTRAL  = 180 días
--   ANUAL      = 365 días
--   LIFETIME   = 36,500 días (~100 años)
-- ============================================================

-- ============================================================
-- 1. ESQUEMA DE BASE DE DATOS
-- ============================================================

-- Tabla de licencias con soporte para tipos
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_code TEXT UNIQUE NOT NULL,
    license_type TEXT DEFAULT 'CUSTOM' CHECK (license_type IN ('TRIAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'LIFETIME', 'CUSTOM')),
    client_name TEXT,
    client_phone TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
    device_id TEXT,
    device_registered_at TIMESTAMP WITH TIME ZONE,
    last_validation TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_licenses_code ON licenses(license_code);
CREATE INDEX IF NOT EXISTS idx_licenses_device ON licenses(device_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_type ON licenses(license_type);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS licenses_updated_at ON licenses;
CREATE TRIGGER licenses_updated_at
    BEFORE UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 2. FUNCIÓN: ACTIVAR LICENCIA
-- ============================================================
-- Uso: SELECT activate_license('XXXX-XXXX-XXXX', 'device_id_aqui');

CREATE OR REPLACE FUNCTION activate_license(p_license_code TEXT, p_device_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    license_record RECORD;
BEGIN
    -- Buscar licencia por código
    SELECT * INTO license_record
    FROM licenses
    WHERE license_code = UPPER(TRIM(p_license_code));
    
    -- Si no existe la licencia
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'INVALID_CODE',
            'message', 'El código de licencia ingresado no es válido.'
        );
    END IF;
    
    -- Verificar si la licencia está bloqueada
    IF license_record.status = 'blocked' THEN
        RETURN json_build_object(
            'valid', false,
            'reason', 'LICENSE_BLOCKED',
            'message', 'Esta licencia ha sido bloqueada. Contacte al administrador.'
        );
    END IF;
    
    -- Verificar si la licencia expiró
    IF license_record.end_date < NOW() THEN
        UPDATE licenses SET status = 'expired' WHERE id = license_record.id;
        RETURN json_build_object(
            'valid', false,
            'reason', 'LICENSE_EXPIRED',
            'message', 'Esta licencia ha expirado. Contacte al administrador para renovar.',
            'expired_at', license_record.end_date
        );
    END IF;
    
    -- Si la licencia ya tiene un dispositivo asociado
    IF license_record.device_id IS NOT NULL THEN
        -- Verificar si es el mismo dispositivo
        IF license_record.device_id = p_device_id THEN
            -- Actualizar última validación
            UPDATE licenses 
            SET last_validation = NOW()
            WHERE id = license_record.id;
            
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
            -- Dispositivo diferente
            RETURN json_build_object(
                'valid', false,
                'reason', 'DEVICE_MISMATCH',
                'message', 'Esta licencia ya está activada en otro dispositivo. Solo se permite un dispositivo por licencia.'
            );
        END IF;
    END IF;
    
    -- Registrar dispositivo por primera vez
    UPDATE licenses 
    SET 
        device_id = p_device_id,
        device_registered_at = NOW(),
        last_validation = NOW()
    WHERE id = license_record.id;
    
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
-- 3. FUNCIÓN: VALIDAR LICENCIA (Revalidación periódica)
-- ============================================================
-- Uso: SELECT validate_license('XXXX-XXXX-XXXX', 'device_id_aqui');

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
    
    IF license_record.end_date < NOW() THEN
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
-- 4. FUNCIÓN BASE: GENERAR LICENCIA CON TIPO
-- ============================================================
-- Uso interno por las funciones wrapper

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
    -- Generar código único en formato XXXX-XXXX-XXXX
    new_code := UPPER(
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
        SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
    
    -- Asegurar que no exista
    WHILE EXISTS (SELECT 1 FROM licenses WHERE license_code = new_code) LOOP
        new_code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
        );
    END LOOP;
    
    -- Construir notas con prefijo de tipo
    final_notes := 'TIPO: ' || p_license_type;
    IF p_extra_notes IS NOT NULL AND p_extra_notes != '' THEN
        final_notes := final_notes || ' | ' || p_extra_notes;
    END IF;
    
    INSERT INTO licenses (license_code, license_type, client_name, client_phone, end_date, notes)
    VALUES (
        new_code, 
        p_license_type, 
        p_client_name, 
        p_client_phone, 
        NOW() + (p_days_valid || ' days')::INTERVAL, 
        final_notes
    )
    RETURNING * INTO new_license;
    
    RETURN json_build_object(
        'success', true,
        'license_code', new_license.license_code,
        'license_type', new_license.license_type,
        'client_name', new_license.client_name,
        'client_phone', new_license.client_phone,
        'start_date', new_license.start_date,
        'end_date', new_license.end_date,
        'days_valid', p_days_valid
    );
END;
$$;


-- ============================================================
-- 5. FUNCIÓN LEGADO: GENERAR LICENCIA (compatibilidad)
-- ============================================================
-- Uso: SELECT generate_license('Nombre Cliente', '3001234567', 365);

CREATE OR REPLACE FUNCTION generate_license(
    p_client_name TEXT DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_days_valid INTEGER DEFAULT 365,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN generate_license_typed('CUSTOM', p_client_name, p_client_phone, p_days_valid, p_notes);
END;
$$;


-- ============================================================
-- 6. FUNCIONES WRAPPER POR TIPO DE LICENCIA
-- ============================================================

-- TRIAL: 7 días de prueba gratuita
CREATE OR REPLACE FUNCTION generate_trial_license(
    p_client_name TEXT DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN generate_license_typed('TRIAL', p_client_name, p_client_phone, 7, p_notes);
END;
$$;

-- MENSUAL: 30 días
CREATE OR REPLACE FUNCTION generate_monthly_license(
    p_client_name TEXT DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN generate_license_typed('MENSUAL', p_client_name, p_client_phone, 30, p_notes);
END;
$$;

-- TRIMESTRAL: 90 días
CREATE OR REPLACE FUNCTION generate_quarterly_license(
    p_client_name TEXT DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN generate_license_typed('TRIMESTRAL', p_client_name, p_client_phone, 90, p_notes);
END;
$$;

-- SEMESTRAL: 180 días
CREATE OR REPLACE FUNCTION generate_semester_license(
    p_client_name TEXT DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN generate_license_typed('SEMESTRAL', p_client_name, p_client_phone, 180, p_notes);
END;
$$;

-- ANUAL: 365 días
CREATE OR REPLACE FUNCTION generate_annual_license(
    p_client_name TEXT DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN generate_license_typed('ANUAL', p_client_name, p_client_phone, 365, p_notes);
END;
$$;

-- LIFETIME: 36,500 días (~100 años)
CREATE OR REPLACE FUNCTION generate_lifetime_license(
    p_client_name TEXT DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN generate_license_typed('LIFETIME', p_client_name, p_client_phone, 36500, p_notes);
END;
$$;


-- ============================================================
-- 7. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================================

-- Habilitar RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Las funciones son SECURITY DEFINER, así que ejecutan con permisos del owner
-- No se necesitan políticas SELECT para el usuario anon si solo usamos RPC


-- ============================================================
-- 8. PERMISOS PARA FUNCIONES RPC
-- ============================================================

-- Permitir que usuarios anónimos llamen las funciones de validación
GRANT EXECUTE ON FUNCTION activate_license(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_license(TEXT, TEXT) TO anon;

-- Las funciones de generación NO tienen acceso anon (solo service_role/dashboard)
-- Esto es intencional por seguridad


-- ============================================================
-- 9. COMANDOS DE ADMINISTRACIÓN - GENERACIÓN DE LICENCIAS
-- ============================================================

-- ┌─────────────────────────────────────────────────────────────┐
-- │ GENERAR LICENCIAS POR TIPO                                  │
-- └─────────────────────────────────────────────────────────────┘

-- Trial (7 días gratis):
-- SELECT generate_trial_license('Cliente Demo', '3001234567');

-- Mensual (30 días):
-- SELECT generate_monthly_license('Juan Pérez', '3009876543');

-- Trimestral (90 días):
-- SELECT generate_quarterly_license('Empresa XYZ', '3005551234');

-- Semestral (180 días):
-- SELECT generate_semester_license('María García', '3007778899');

-- Anual (365 días):
-- SELECT generate_annual_license('Pedro López', '3001112233');

-- Lifetime (~100 años):
-- SELECT generate_lifetime_license('VIP Cliente', '3004445566');

-- Personalizada (días específicos):
-- SELECT generate_license('Cliente Custom', '3001234567', 45, 'Promoción especial');


-- ============================================================
-- 10. COMANDOS DE ADMINISTRACIÓN - CONSULTAS
-- ============================================================

-- ┌─────────────────────────────────────────────────────────────┐
-- │ CONSULTAS ÚTILES                                            │
-- └─────────────────────────────────────────────────────────────┘

-- Ver todas las licencias:
-- SELECT id, license_code, license_type, client_name, status, end_date, device_id FROM licenses;

-- Ver licencias por tipo:
-- SELECT * FROM licenses WHERE license_type = 'TRIAL';
-- SELECT * FROM licenses WHERE license_type = 'MENSUAL';
-- SELECT * FROM licenses WHERE license_type = 'ANUAL';
-- SELECT * FROM licenses WHERE license_type = 'LIFETIME';

-- Contar licencias activas por tipo:
-- SELECT license_type, COUNT(*) as total FROM licenses WHERE status = 'active' GROUP BY license_type ORDER BY total DESC;

-- Licencias próximas a expirar (7 días):
-- SELECT license_code, license_type, client_name, end_date, 
--        EXTRACT(DAY FROM end_date - NOW()) as dias_restantes
-- FROM licenses 
-- WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status = 'active'
-- ORDER BY end_date;

-- Licencias expiradas:
-- SELECT * FROM licenses WHERE status = 'expired' OR end_date < NOW();

-- Buscar licencia por código:
-- SELECT * FROM licenses WHERE license_code = 'XXXX-XXXX-XXXX';

-- Buscar licencia por cliente:
-- SELECT * FROM licenses WHERE client_name ILIKE '%nombre%';


-- ============================================================
-- 11. COMANDOS DE ADMINISTRACIÓN - MANTENIMIENTO
-- ============================================================

-- ┌─────────────────────────────────────────────────────────────┐
-- │ RENOVACIÓN DE LICENCIAS                                     │
-- └─────────────────────────────────────────────────────────────┘

-- Renovar licencia agregando 30 días:
-- UPDATE licenses 
-- SET end_date = end_date + INTERVAL '30 days', status = 'active' 
-- WHERE license_code = 'XXXX-XXXX-XXXX';

-- Renovar licencia agregando 1 año:
-- UPDATE licenses 
-- SET end_date = end_date + INTERVAL '1 year', status = 'active' 
-- WHERE license_code = 'XXXX-XXXX-XXXX';

-- Extender licencia desde HOY (si ya expiró):
-- UPDATE licenses 
-- SET end_date = NOW() + INTERVAL '30 days', status = 'active' 
-- WHERE license_code = 'XXXX-XXXX-XXXX';


-- ┌─────────────────────────────────────────────────────────────┐
-- │ RESET DE HARDWARE (Cambio de dispositivo)                   │
-- └─────────────────────────────────────────────────────────────┘

-- Desasociar dispositivo (permite activar en otro equipo):
-- UPDATE licenses 
-- SET device_id = NULL, device_registered_at = NULL 
-- WHERE license_code = 'XXXX-XXXX-XXXX';


-- ┌─────────────────────────────────────────────────────────────┐
-- │ BLOQUEO Y DESBLOQUEO                                        │
-- └─────────────────────────────────────────────────────────────┘

-- Bloquear licencia (uso indebido):
-- UPDATE licenses SET status = 'blocked' WHERE license_code = 'XXXX-XXXX-XXXX';

-- Desbloquear licencia:
-- UPDATE licenses SET status = 'active' WHERE license_code = 'XXXX-XXXX-XXXX';


-- ┌─────────────────────────────────────────────────────────────┐
-- │ ELIMINAR LICENCIA (Usar con precaución)                     │
-- └─────────────────────────────────────────────────────────────┘

-- DELETE FROM licenses WHERE license_code = 'XXXX-XXXX-XXXX';
