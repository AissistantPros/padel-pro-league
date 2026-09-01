-- ==========================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS SUPABASE (PÁDEL PRO LEAGUE)
-- Copia y pega este script en el "SQL Editor" de tu proyecto Supabase
-- ==========================================================

-- 1. Tabla de Configuración y Ajustes del Torneo
CREATE TABLE IF NOT EXISTS public.tournament_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_config',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Jugadores
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Jornadas y Fechas del Torneo
CREATE TABLE IF NOT EXISTS public.tournament_days (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla del Bracket de la Gran Final
CREATE TABLE IF NOT EXISTS public.grand_finale (
  id TEXT PRIMARY KEY DEFAULT 'main_bracket',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- HABILITAR SEGURIDAD A NIVEL DE FILA (RLS) CON ACCESO PÚBLICO
-- ==========================================================

ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grand_finale ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (cualquier jugador puede consultar en vivo)
CREATE POLICY "Permitir lectura publica de settings" ON public.tournament_settings FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de tournament_days" ON public.tournament_days FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de grand_finale" ON public.grand_finale FOR SELECT USING (true);

-- Políticas de escritura pública (inserción y actualización desde la app)
CREATE POLICY "Permitir escritura publica de settings" ON public.tournament_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escritura publica de players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escritura publica de tournament_days" ON public.tournament_days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escritura publica de grand_finale" ON public.grand_finale FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================
-- ACTIVAR PUBLICACIONES EN TIEMPO REAL (REALTIME CHANNELS)
-- Para que los marcadores en cancha se actualicen en vivo en los celulares
-- ==========================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_days;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grand_finale;
