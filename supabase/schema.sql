
-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS MÓDULO FINANCEIRO (METAS)
CREATE TABLE IF NOT EXISTS public.tipo_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meta_locais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type_id UUID REFERENCES public.tipo_meta(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.meta_locais(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    target_value NUMERIC NOT NULL DEFAULT 0,
    current_value NUMERIC DEFAULT 0,
    target_date DATE NOT NULL,
    data_inicio DATE DEFAULT CURRENT_DATE,
    meses_previsao INTEGER DEFAULT 12,
    observation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meta_aportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELAS MÓDULO DE ESTUDOS
CREATE TABLE IF NOT EXISTS public.study_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    local_estudo TEXT,
    status TEXT DEFAULT 'Em andamento',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.study_courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    professor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discipline_id UUID NOT NULL REFERENCES public.study_disciplines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prioridade TEXT DEFAULT 'Média',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.study_courses(id) ON DELETE CASCADE,
    id_disciplina UUID REFERENCES public.study_disciplines(id) ON DELETE CASCADE,
    id_topico UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
    dia_semana TEXT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    tipo_estudo TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.study_courses(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
    data_pratica DATE NOT NULL DEFAULT CURRENT_DATE,
    disciplina_nome TEXT NOT NULL,
    n_questoes INTEGER NOT NULL DEFAULT 0,
    n_acertos INTEGER NOT NULL DEFAULT 0,
    n_erros INTEGER NOT NULL DEFAULT 0,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_simulado DATE NOT NULL DEFAULT CURRENT_DATE,
    disciplina_nome TEXT NOT NULL,
    organizacao_simulado TEXT,
    n_questoes INTEGER NOT NULL DEFAULT 0,
    n_acertos INTEGER DEFAULT 0,
    n_erros INTEGER DEFAULT 0,
    saldo_simulado INTEGER DEFAULT 0,
    hora_inicio TIMESTAMPTZ,
    hora_fim TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discipline_id UUID REFERENCES public.study_disciplines(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.study_topics(id) ON DELETE CASCADE,
    tipo_estudo TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_aportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Exemplo de política para METAS (Repetir padrão para as outras)
DROP POLICY IF EXISTS "Users can manage their own metas" ON public.metas;
CREATE POLICY "Users can manage their own metas" ON public.metas FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own study_courses" ON public.study_courses;
CREATE POLICY "Users can manage their own study_courses" ON public.study_courses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own disciplines" ON public.study_disciplines;
CREATE POLICY "Users can manage their own disciplines" ON public.study_disciplines FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own plans" ON public.study_plans;
CREATE POLICY "Users can manage their own plans" ON public.study_plans FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own exercises" ON public.study_exercises;
CREATE POLICY "Users can manage their own exercises" ON public.study_exercises FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own mock_tests" ON public.study_mock_tests;
CREATE POLICY "Users can manage their own mock_tests" ON public.study_mock_tests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.study_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);

-- 5. TRIGGER DE ATUALIZAÇÃO DE SALDO DE METAS
CREATE OR REPLACE FUNCTION update_meta_current_value()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.metas
    SET current_value = (SELECT COALESCE(SUM(amount), 0) FROM public.meta_aportes WHERE meta_id = NEW.meta_id)
    WHERE id = NEW.meta_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_meta_current_value ON public.meta_aportes;
CREATE TRIGGER tr_update_meta_current_value AFTER INSERT OR UPDATE OR DELETE ON public.meta_aportes FOR EACH ROW EXECUTE FUNCTION update_meta_current_value();

NOTIFY pgrst, 'reload schema';
