-- ============================================================
-- FIX: PERMISOS PARA ADMIN PANEL
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Permitir que la API lea las licencias (SELECT)
-- Esto soluciona que "no se muestre nada"
CREATE POLICY "Enable read access for all users" ON "public"."licenses"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- 2. Permitir que la API actualice las licencias (UPDATE)
-- Necesario para: Renovar, Reset Hardware, Bloquear
CREATE POLICY "Enable update for all users" ON "public"."licenses"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 3. Permitir borrar (DELETE)
CREATE POLICY "Enable delete for all users" ON "public"."licenses"
AS PERMISSIVE FOR DELETE
TO public
USING (true);

-- 4. Permitir ejecutar la función de creación (RPC)
-- Esto soluciona el error "Could not find function..." (por permisos)
GRANT EXECUTE ON FUNCTION generate_license_typed(TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_license_typed(TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_license_typed(TEXT, TEXT, TEXT, INTEGER, TEXT) TO service_role;

-- Dar permisos a la funcion Update Updated At
GRANT EXECUTE ON FUNCTION update_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION update_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at() TO service_role;
