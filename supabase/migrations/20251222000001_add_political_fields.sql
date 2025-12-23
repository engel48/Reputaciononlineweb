-- ================================================
-- MIGRACIÓN: Agregar campos para perfiles políticos
-- ================================================
-- Fecha: 2025-12-22
-- Descripción: Agrega campos faltantes para perfiles políticos y fuentes adicionales

-- Agregar columna additional_sources si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'additional_sources'
    ) THEN
        ALTER TABLE users ADD COLUMN additional_sources TEXT;
        RAISE NOTICE 'Columna additional_sources agregada';
    END IF;
END $$;

-- Agregar columna partido_politico si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'partido_politico'
    ) THEN
        ALTER TABLE users ADD COLUMN partido_politico TEXT;
        RAISE NOTICE 'Columna partido_politico agregada';
    END IF;
END $$;

-- Agregar columna cargo_actual si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'cargo_actual'
    ) THEN
        ALTER TABLE users ADD COLUMN cargo_actual TEXT;
        RAISE NOTICE 'Columna cargo_actual agregada';
    END IF;
END $$;

-- Agregar columna propuestas_principales si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'propuestas_principales'
    ) THEN
        ALTER TABLE users ADD COLUMN propuestas_principales TEXT;
        RAISE NOTICE 'Columna propuestas_principales agregada';
    END IF;
END $$;

-- Agregar columna is_active si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Columna is_active agregada';
    END IF;
END $$;

-- Comentarios para documentación
COMMENT ON COLUMN users.additional_sources IS 'JSON array de fuentes adicionales de monitoreo';
COMMENT ON COLUMN users.partido_politico IS 'Partido político del usuario (solo perfiles políticos)';
COMMENT ON COLUMN users.cargo_actual IS 'Cargo actual del político';
COMMENT ON COLUMN users.propuestas_principales IS 'Propuestas principales del político';
