-- ================================================
-- HABILITAR PGVECTOR PARA BÚSQUEDA SEMÁNTICA
-- ================================================
-- Fecha: 2025-01-01
-- Descripción: Habilita la extensión pgvector para búsqueda semántica
-- Uso: Búsqueda inteligente de menciones, noticias y contenido similar

-- ================================================
-- HABILITAR EXTENSIÓN PGVECTOR
-- ================================================

-- Crear extensión pgvector (requiere permisos de superuser)
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================
-- TABLA DE MENCIONES CON VECTORES
-- ================================================

-- Tabla para almacenar menciones con embeddings
CREATE TABLE IF NOT EXISTS mentions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    source TEXT NOT NULL, -- 'facebook', 'x', 'linkedin', etc.
    source_url TEXT,
    author TEXT,
    author_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    sentiment TEXT, -- 'positive', 'negative', 'neutral'
    sentiment_score DOUBLE PRECISION,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    -- Vector embedding (1536 dimensiones para OpenAI text-embedding-3-small)
    embedding vector(1536),
    -- Metadata adicional en JSON
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para menciones
CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_source ON mentions(source);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment ON mentions(sentiment);
CREATE INDEX IF NOT EXISTS idx_mentions_published_at ON mentions(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON mentions(created_at DESC);

-- Índice vectorial para búsqueda semántica
-- Usando ivfflat con 100 listas (ajustar según tamaño de datos)
CREATE INDEX IF NOT EXISTS idx_mentions_embedding ON mentions
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ================================================
-- TABLA DE NOTICIAS CON VECTORES
-- ================================================

-- Tabla para almacenar noticias con embeddings
CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    category TEXT,
    tags TEXT[], -- Array de tags
    -- Vector embedding
    embedding vector(1536),
    -- Metadata adicional
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para noticias
CREATE INDEX IF NOT EXISTS idx_news_source ON news(source);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_tags ON news USING GIN(tags);

-- Índice vectorial para búsqueda semántica
CREATE INDEX IF NOT EXISTS idx_news_embedding ON news
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ================================================
-- FUNCIONES DE BÚSQUEDA SEMÁNTICA
-- ================================================

-- Función para buscar menciones similares
CREATE OR REPLACE FUNCTION search_similar_mentions(
    query_embedding vector(1536),
    user_id_filter TEXT DEFAULT NULL,
    match_threshold DOUBLE PRECISION DEFAULT 0.78,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    content TEXT,
    source TEXT,
    author TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    sentiment TEXT,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.source,
        m.author,
        m.published_at,
        m.sentiment,
        1 - (m.embedding <=> query_embedding) as similarity
    FROM mentions m
    WHERE
        (user_id_filter IS NULL OR m.user_id = user_id_filter)
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Función para buscar noticias similares
CREATE OR REPLACE FUNCTION search_similar_news(
    query_embedding vector(1536),
    match_threshold DOUBLE PRECISION DEFAULT 0.78,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    content TEXT,
    source TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.title,
        n.content,
        n.source,
        n.published_at,
        1 - (n.embedding <=> query_embedding) as similarity
    FROM news n
    WHERE 1 - (n.embedding <=> query_embedding) > match_threshold
    ORDER BY n.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Función para agrupar menciones similares (clustering)
CREATE OR REPLACE FUNCTION cluster_mentions_by_similarity(
    user_id_filter TEXT,
    similarity_threshold DOUBLE PRECISION DEFAULT 0.85,
    max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    mention_id TEXT,
    similar_mention_ids TEXT[],
    cluster_size INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH mention_pairs AS (
        SELECT
            m1.id as id1,
            m2.id as id2,
            1 - (m1.embedding <=> m2.embedding) as similarity
        FROM mentions m1
        CROSS JOIN mentions m2
        WHERE
            m1.user_id = user_id_filter
            AND m2.user_id = user_id_filter
            AND m1.id < m2.id
            AND 1 - (m1.embedding <=> m2.embedding) > similarity_threshold
    )
    SELECT
        mp.id1 as mention_id,
        array_agg(mp.id2) as similar_mention_ids,
        count(*)::INTEGER as cluster_size
    FROM mention_pairs mp
    GROUP BY mp.id1
    ORDER BY cluster_size DESC
    LIMIT max_results;
END;
$$;

-- ================================================
-- TRIGGERS PARA AUTO-UPDATE
-- ================================================

CREATE TRIGGER update_mentions_updated_at BEFORE UPDATE ON mentions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- COMENTARIOS
-- ================================================

COMMENT ON TABLE mentions IS 'Menciones con embeddings para búsqueda semántica';
COMMENT ON TABLE news IS 'Noticias con embeddings para búsqueda semántica';
COMMENT ON FUNCTION search_similar_mentions IS 'Busca menciones similares usando embeddings vectoriales';
COMMENT ON FUNCTION search_similar_news IS 'Busca noticias similares usando embeddings vectoriales';
COMMENT ON FUNCTION cluster_mentions_by_similarity IS 'Agrupa menciones similares para detección de tendencias';

-- ================================================
-- EJEMPLO DE USO
-- ================================================

-- Para buscar menciones similares:
-- SELECT * FROM search_similar_mentions(
--     '[0.1, 0.2, ...]'::vector(1536),  -- embedding del query
--     'user-id',                         -- filtro de usuario (opcional)
--     0.78,                              -- umbral de similaridad
--     10                                 -- número de resultados
-- );

-- ================================================
-- FIN DE MIGRACIÓN PGVECTOR
-- ================================================
