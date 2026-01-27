
import { supabase } from '../lib/supabase';
import { 
  StudyPlan, StudyCourse, StudyDiscipline, StudyTopic, 
  StudyMockTest, StudyExercise, StudySession, User, Transaction, 
  Investment, InvestmentType, Withdrawal, Goal, 
  GoalType, GoalAccount, Category, AgendaEvent, 
  AppSettings, License, LicensePlan, Invoice 
} from '../types';

export const api = {
  // CONFIGURAÇÕES E PERFIL
  async getSettings(): Promise<AppSettings | null> {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error) return null;
    return data;
  },

  async getProfile(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (error) return null;
    return {
      ...data,
      isAdmin: data.is_admin,
      isBlocked: data.is_blocked, 
      ativo: data.ativo,
      active_license_id: data.active_license_id,
      lastSeenAt: data.last_seen_at,
      lastIp: data.last_ip,
      lastDevice: data.last_device,
      cpfCnpj: data.cpf_cnpj
    };
  },

  async updateProfile(user: Partial<User>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const payload: any = { ...user };
    delete payload.id;
    if (payload.isAdmin !== undefined) { payload.is_admin = payload.isAdmin; delete payload.isAdmin; }
    if (payload.cpfCnpj !== undefined) { payload.cpf_cnpj = payload.cpfCnpj; delete payload.cpfCnpj; }
    const { error } = await supabase.from('profiles').update(payload).eq('id', session.user.id);
    if (error) throw error;
  },

  // --- MÓDULO FINANCEIRO (TRANSAÇÕES) ---
  async getTransactions(): Promise<Transaction[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.from('transactions').select('*, confirmations:transaction_confirmations(*)').eq('user_id', session?.user?.id);
    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      userId: t.user_id,
      isRecurring: t.is_recurring,
      recurrenceLimitType: t.recurrence_limit_type,
      recurrenceEndDate: t.recurrence_end_date,
      recurrenceCount: t.recurrence_count,
      recurrenceGroupId: t.recurrence_group_id,
      paymentDate: t.payment_date,
      confirmations: (t.confirmations || []).map((c: any) => ({
        ...c,
        transactionId: c.transaction_id,
        confirmedAt: c.confirmed_at
      }))
    }));
  },

  async addTransaction(t: Partial<Transaction>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload: any = { 
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      status: t.status,
      description: t.description,
      observation: t.observation,
      user_id: session?.user?.id,
      is_recurring: t.isRecurring,
      recurrence_limit_type: t.recurrenceLimitType,
      recurrence_end_date: t.recurrenceEndDate,
      recurrence_count: t.recurrenceCount,
      recurrence_group_id: t.recurrenceGroupId,
      payment_date: t.paymentDate
    };

    if (t.id) await supabase.from('transactions').update(payload).eq('id', t.id);
    else await supabase.from('transactions').insert([payload]);
  },

  async deleteTransaction(id: string, deleteAllRecurring?: boolean) {
    if (deleteAllRecurring) {
      const { data: t } = await supabase.from('transactions').select('recurrence_group_id').eq('id', id).single();
      if (t?.recurrence_group_id) {
        await supabase.from('transactions').delete().eq('recurrence_group_id', t.recurrence_group_id);
        return;
      }
    }
    await supabase.from('transactions').delete().eq('id', id);
  },

  async addTransactionsBatch(batch: any[]) {
    const { data: { session } } = await supabase.auth.getSession();
    const payloads = batch.map(t => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      status: t.status,
      description: t.description,
      observation: t.observation,
      user_id: session?.user?.id,
      is_recurring: t.is_recurring,
      recurrence_limit_type: t.recurrence_limit_type,
      recurrence_end_date: t.recurrence_end_date,
      recurrence_count: t.recurrence_count,
      recurrence_group_id: t.recurrence_group_id,
      payment_date: t.payment_date
    }));
    const { error } = await supabase.from('transactions').insert(payloads);
    if (error) throw error;
  },

  async addTransactionConfirmation(conf: { transactionId: string, amount: number }) {
    const { error } = await supabase.from('transaction_confirmations').insert([{
      transaction_id: conf.transactionId,
      amount: conf.amount,
      confirmed_at: new Date().toISOString()
    }]);
    if (error) throw error;
  },

  // --- CATEGORIAS (TRANSAÇÕES) ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async addCategory(cat: Partial<Category>) {
    const { error } = await supabase.from('categories').insert([cat]);
    if (error) throw error;
  },

  async updateCategory(id: string, cat: Partial<Category>) {
    const { error } = await supabase.from('categories').update(cat).eq('id', id);
    if (error) throw error;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MÓDULO FINANCEIRO (INVESTIMENTOS) ---
  async getInvestments(): Promise<Investment[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.from('investments').select('*').eq('user_id', session?.user?.id);
    if (error) throw error;
    return (data || []).map(inv => ({ ...inv, userId: inv.user_id }));
  },

  async addInvestment(inv: Partial<Investment>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { 
      name: inv.name,
      type: inv.type,
      location: inv.location,
      quantity: inv.quantity,
      value: inv.value,
      date: inv.date,
      user_id: session?.user?.id 
    };
    if (inv.id) await supabase.from('investments').update(payload).eq('id', inv.id);
    else await supabase.from('investments').insert([payload]);
  },

  async deleteInvestment(id: string) {
    await supabase.from('investments').delete().eq('id', id);
  },

  async getWithdrawals(): Promise<Withdrawal[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.from('withdrawals').select('*').eq('user_id', session?.user?.id);
    if (error) throw error;
    return (data || []).map(w => ({ 
      ...w, 
      userId: w.user_id, 
      investmentId: w.investment_id, 
      investmentName: w.investment_name, 
      deviceIp: w.device_ip, 
      deviceType: w.device_type 
    }));
  },

  async addWithdrawal(w: Withdrawal) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      investment_id: w.investmentId, investment_name: w.investmentName,
      quantity: w.quantity, value: w.value, date: w.date,
      observation: w.observation, device_ip: w.deviceIp, device_type: w.deviceType,
      user_id: session?.user?.id
    };
    await supabase.from('withdrawals').insert([payload]);
  },

  // --- TIPOS DE INVESTIMENTO ---
  async getInvestmentTypes(): Promise<InvestmentType[]> {
    const { data, error } = await supabase.from('investment_types').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async addInvestmentType(it: Partial<InvestmentType>) {
    const { error } = await supabase.from('investment_types').insert([it]);
    if (error) throw error;
  },

  async updateInvestmentType(id: string, it: Partial<InvestmentType>) {
    const { error } = await supabase.from('investment_types').update(it).eq('id', id);
    if (error) throw error;
  },

  async deleteInvestmentType(id: string) {
    const { error } = await supabase.from('investment_types').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MÓDULO DE ESTUDOS ---
  async getStudyCourses(): Promise<StudyCourse[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.from('study_courses').select('*').eq('user_id', session?.user?.id).order('name');
    if (error) throw error;
    return (data || []).map(c => ({ ...c, localEstudo: c.local_estudo }));
  },

  async addStudyCourse(c: Partial<StudyCourse>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { 
      name: c.name,
      category: c.category,
      local_estudo: c.localEstudo,
      status: c.status,
      user_id: session?.user?.id 
    };
    const { data, error } = await supabase.from('study_courses').insert([payload]).select().single();
    if (error) throw error;
    return { ...data, id_curso: data.id };
  },

  async updateStudyCourse(id: string, c: Partial<StudyCourse>) {
    const payload = { 
      name: c.name,
      category: c.category,
      local_estudo: c.localEstudo,
      status: c.status
    };
    const { data, error } = await supabase.from('study_courses').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, id_curso: data.id };
  },

  async deleteStudyCourse(id: string) {
    await supabase.from('study_courses').delete().eq('id', id);
  },

  async getStudyDisciplines(courseId?: string): Promise<StudyDiscipline[]> {
    const { data: { session } } = await supabase.auth.getSession();
    let query = supabase.from('study_disciplines').select('*').eq('user_id', session?.user?.id);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, courseId: d.course_id, createdAt: d.created_at }));
  },

  async addStudyDiscipline(d: Partial<StudyDiscipline>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { 
      name: d.name,
      professor: d.professor,
      course_id: d.courseId,
      user_id: session?.user?.id
    };
    const { data, error } = await supabase.from('study_disciplines').insert([payload]).select().single();
    if (error) throw error;
    return { ...data, id_disciplina: data.id };
  },

  async updateStudyDiscipline(id: string, d: Partial<StudyDiscipline>) {
    const payload = { 
      name: d.name,
      professor: d.professor,
      course_id: d.courseId
    };
    const { error } = await supabase.from('study_disciplines').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteStudyDiscipline(id: string) {
    await supabase.from('study_disciplines').delete().eq('id', id);
  },

  async getStudyTopics(disciplineId: string): Promise<StudyTopic[]> {
    const { data, error } = await supabase.from('study_topics').select('*').eq('discipline_id', disciplineId);
    if (error) throw error;
    return (data || []).map(t => ({ ...t, disciplineId: t.discipline_id, createdAt: t.created_at }));
  },

  async addStudyTopic(t: Partial<StudyTopic>) {
    const payload = { 
      name: t.name,
      prioridade: t.prioridade,
      discipline_id: t.disciplineId 
    };
    const { error } = await supabase.from('study_topics').insert([payload]);
    if (error) throw error;
  },

  async updateStudyTopic(id: string, t: Partial<StudyTopic>) {
    const payload = { 
      name: t.name,
      prioridade: t.prioridade
    };
    const { error } = await supabase.from('study_topics').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteStudyTopic(id: string) {
    await supabase.from('study_topics').delete().eq('id', id);
  },

  async getStudyMockTests(): Promise<StudyMockTest[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.from('study_mock_tests').select('*').eq('user_id', session?.user?.id).order('data_simulado', { ascending: false });
    if (error) throw error;
    return (data || []).map(m => ({
      ...m,
      dataSimulado: m.data_simulado,
      disciplinaNome: m.disciplina_nome,
      organizacaoSimulado: m.organizacao_simulado,
      nQuestoes: m.n_questoes,
      horaInicio: m.hora_inicio,
      horaFim: m.hora_fim,
      nAcertos: m.n_acertos,
      nErros: m.n_erros,
      saldoSimulado: m.saldo_simulado
    }));
  },

  async addStudyMockTest(m: Partial<StudyMockTest>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      user_id: session?.user?.id,
      data_simulado: m.dataSimulado, 
      disciplina_nome: m.disciplinaNome, 
      organizacao_simulado: m.organizacaoSimulado, 
      n_questoes: m.nQuestoes,
      n_acertos: m.nAcertos || 0, 
      n_erros: m.nErros || 0, 
      saldo_simulado: m.saldoSimulado || 0
    };
    const { data, error } = await supabase.from('study_mock_tests').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async updateStudyMockTest(id: string, m: Partial<StudyMockTest>) {
    const payload: any = {};
    if (m.dataSimulado) payload.data_simulado = m.dataSimulado;
    if (m.disciplinaNome) payload.disciplina_nome = m.disciplinaNome;
    if (m.organizacaoSimulado) payload.organizacao_simulado = m.organizacaoSimulado;
    if (m.nQuestoes) payload.n_questoes = m.nQuestoes;
    if (m.nAcertos !== undefined) payload.n_acertos = m.nAcertos;
    if (m.nErros !== undefined) payload.n_erros = m.nErros;
    if (m.saldoSimulado !== undefined) payload.saldo_simulado = m.saldoSimulado;
    if (m.horaInicio) payload.hora_inicio = m.horaInicio;
    if (m.horaFim) payload.hora_fim = m.horaFim;

    const { data, error } = await supabase.from('study_mock_tests').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteStudyMockTest(id: string) {
    await supabase.from('study_mock_tests').delete().eq('id', id);
  },

  async getStudyExercises(courseId?: string): Promise<StudyExercise[]> {
    const { data: { session } } = await supabase.auth.getSession();
    let query = supabase.from('study_exercises').select('*').eq('user_id', session?.user?.id);
    if (courseId && courseId !== 'all') query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(ex => ({
      ...ex, 
      idUsuario: ex.user_id, 
      idCurso: ex.course_id, 
      idTopico: ex.topic_id,
      dataPratica: ex.data_pratica, 
      disciplinaNome: ex.disciplina_nome, 
      nQuestoes: ex.n_questoes, 
      nAcertos: ex.n_acertos, 
      nErros: ex.n_erros
    }));
  },

  async addStudyExercise(ex: Partial<StudyExercise>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      user_id: session?.user?.id, 
      course_id: ex.idCurso, 
      topic_id: ex.idTopico, 
      data_pratica: ex.dataPratica, 
      disciplina_nome: ex.disciplinaNome, 
      n_questoes: ex.nQuestoes, 
      n_acertos: ex.nAcertos, 
      n_erros: ex.nErros,
      observacao: ex.observacao
    };
    const { error } = await supabase.from('study_exercises').insert([payload]);
    if (error) throw error;
  },

  async updateStudyExercise(id: string, ex: Partial<StudyExercise>) {
    const payload = {
      course_id: ex.idCurso, 
      topic_id: ex.idTopico, 
      data_pratica: ex.dataPratica, 
      disciplina_nome: ex.disciplinaNome, 
      n_questoes: ex.nQuestoes, 
      n_acertos: ex.nAcertos, 
      n_erros: ex.nErros,
      observacao: ex.observacao
    };
    const { error } = await supabase.from('study_exercises').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteStudyExercise(id: string) {
    const { error } = await supabase.from('study_exercises').delete().eq('id', id);
    if (error) throw error;
  },

  async startStudySession(sess: Partial<StudySession>): Promise<StudySession> {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    
    const payload = {
      user_id: authSession?.user?.id, 
      discipline_id: sess.idDisciplina,
      topic_id: sess.idTopico, 
      tipo_estudo: sess.tipoEstudo,
      start_time: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([payload])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Falha ao iniciar sessão: ${error.message}`);
    }

    const session: StudySession = { 
      id: data.id,
      idUsuario: data.user_id, 
      idDisciplina: data.discipline_id, 
      idTopico: data.topic_id, 
      tipoEstudo: data.tipo_estudo, 
      startTime: data.start_time 
    };

    localStorage.setItem('babylon_study_session_id', data.id);
    return session;
  },

  async finishStudySession(sessionId: string, durationSeconds: number) {
    if (!sessionId || sessionId.trim() === '') {
      throw new Error("ID da sessão inválido ou ausente");
    }

    const endTime = new Date().toISOString();
    const { data, error } = await supabase
      .from('study_sessions')
      .update({ 
        end_time: endTime, 
        duration_seconds: durationSeconds 
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Falha ao salvar: ${error.message}`);
    }

    localStorage.removeItem('babylon_study_session_id');
    return data;
  },

  async getStudySessions(): Promise<StudySession[]> {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const { data, error } = await supabase.from('study_sessions').select('*').eq('user_id', authSession?.user?.id);
    if (error) throw error;
    return (data || []).map(s => ({
      id: s.id,
      idUsuario: s.user_id,
      idDisciplina: s.discipline_id,
      idTopico: s.topic_id,
      tipoEstudo: s.tipo_estudo,
      startTime: s.start_time,
      endTime: s.end_time,
      durationSeconds: s.duration_seconds
    }));
  },

  async addManualStudySession(sess: { idDisciplina: string, idTopico: string, tipoEstudo: string, durationSeconds: number, startTime: string }) {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const payload = {
      user_id: authSession?.user?.id,
      discipline_id: sess.idDisciplina,
      topic_id: sess.idTopico,
      tipo_estudo: sess.tipoEstudo,
      start_time: sess.startTime,
      end_time: new Date(new Date(sess.startTime).getTime() + (sess.durationSeconds * 1000)).toISOString(),
      duration_seconds: sess.durationSeconds
    };
    const { error } = await supabase.from('study_sessions').insert(payload);
    if (error) throw error;
  },

  async getStudyPlans(courseId?: string): Promise<StudyPlan[]> {
    const { data: { session } } = await supabase.auth.getSession();
    let query = supabase.from('study_plans').select('*, study_courses(name), study_disciplines(name), study_topics(name)').eq('user_id', session?.user?.id);
    if (courseId && courseId !== 'all') query = query.eq('course_id', courseId);
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(p => ({
      ...p, 
      idUsuario: p.user_id, 
      cursoId: p.course_id, 
      cursoNome: (p as any).study_courses?.name,
      idDisciplina: p.discipline_id, 
      disciplinaNome: (p as any).study_disciplines?.name,
      idTopico: p.topic_id, 
      topicoNome: (p as any).study_topics?.name,
      diaSemana: p.dia_semana, 
      horaInicio: p.hora_inicio, 
      horaFim: p.hora_fim,
      tipoEstudo: p.tipo_estudo, 
      createdAt: p.created_at
    }));
  },

  async addStudyPlan(p: Partial<StudyPlan>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      user_id: session?.user?.id, 
      course_id: p.cursoId,
      discipline_id: p.idDisciplina, 
      topic_id: p.idTopico || null,
      dia_semana: p.diaSemana, 
      hora_inicio: p.horaInicio,
      hora_fim: p.horaFim, 
      tipo_estudo: p.tipoEstudo,
      color: p.color
    };
    const { error } = await supabase.from('study_plans').insert([payload]);
    if (error) throw error;
  },

  async deleteStudyPlan(id: string) {
    await supabase.from('study_plans').delete().eq('id', id);
  },

  // --- MÓDULO FINANCEIRO (METAS) ---
  async getGoals(): Promise<Goal[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from('metas')
      .select('*, tipo_meta(name, color), meta_locais(name)')
      .eq('user_id', session?.user?.id);
    
    if (error) throw error;
    
    return (data || []).map(g => ({
      ...g, 
      targetValue: g.target_value, 
      startDate: g.data_inicio,
      monthsForecast: g.meses_previsao, 
      targetDate: g.target_date, 
      typeId: g.type_id, 
      accountId: g.account_id,
      typeName: (g as any).tipo_meta?.name, 
      typeColor: (g as any).tipo_meta?.color, 
      accountName: (g as any).meta_locais?.name
    }));
  },

  async addGoal(g: Partial<Goal>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { 
      name: g.name,
      user_id: session?.user?.id, 
      target_value: g.targetValue, 
      data_inicio: g.startDate, 
      meses_previsao: g.monthsForecast, 
      target_date: g.targetDate, 
      type_id: g.typeId, 
      account_id: g.accountId,
      observation: g.observation
    };
    const { error } = await supabase.from('metas').insert([payload]);
    if (error) throw error;
  },

  async updateGoal(id: string, g: Partial<Goal>) {
    const payload = { 
      name: g.name,
      target_value: g.targetValue, 
      data_inicio: g.startDate, 
      meses_previsao: g.monthsForecast, 
      target_date: g.targetDate, 
      type_id: g.typeId, 
      account_id: g.accountId,
      observation: g.observation
    };
    const { error } = await supabase.from('metas').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteGoal(id: string) {
    const { error } = await supabase.from('metas').delete().eq('id', id);
    if (error) throw error;
  },

  async getGoalTypes(): Promise<GoalType[]> { 
    const { data, error = null } = await supabase.from('tipo_meta').select('*').order('name'); 
    if (error) throw error;
    return data || []; 
  },
  async addGoalType(gt: Partial<GoalType>) { await supabase.from('tipo_meta').insert([gt]); },
  async updateGoalType(id: string, gt: Partial<GoalType>) { await supabase.from('tipo_meta').update(gt).eq('id', id); },
  async deleteGoalType(id: string) { await supabase.from('tipo_meta').delete().eq('id', id); },

  async getGoalAccounts(): Promise<GoalAccount[]> { 
    const { data, error = null } = await supabase.from('meta_locais').select('*').order('name'); 
    if (error) throw error;
    return data || []; 
  },
  async addGoalAccount(ga: Partial<GoalAccount>) { await supabase.from('meta_locais').insert([ga]); },
  async updateGoalAccount(id: string, ga: Partial<GoalAccount>) { await supabase.from('meta_locais').update(ga).eq('id', id); },
  async deleteGoalAccount(id: string) { await supabase.from('meta_locais').delete().eq('id', id); },
  
  async addGoalEntry(entry: { meta_id: string, amount: number, date: string, description: string }) {
    const { error } = await supabase.from('meta_aportes').insert([entry]);
    if (error) throw error;
  },

  // --- LICENCIAMENTO ---
  async getMyLicenses(): Promise<License[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('licenses').select('*').eq('user_id', session?.user?.id);
    return (data || []).map(l => ({ ...l, userId: l.user_id, planId: l.plan_id, expirationDate: l.expiration_date }));
  },
  
  async getMyInvoices(): Promise<Invoice[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('invoices').select('*').eq('user_id', session?.user?.id).order('created_at', { ascending: false });
    return (data || []).map(i => ({ ...i, userId: i.user_id, licenseId: i.license_id, createdAt: i.created_at, confirmedAt: i.confirmed_at, invoiceUrl: i.invoice_url }));
  },

  async getPlans(): Promise<LicensePlan[]> {
    const { data } = await supabase.from('license_plans').select('*');
    return (data || []).map(p => ({ ...p, stripePriceId: p.stripe_price_id }));
  },

  async createPlan(p: Partial<LicensePlan>) {
    const payload = { ...p, stripe_price_id: p.stripePriceId };
    await supabase.from('license_plans').insert([payload]);
  },

  async updatePlan(id: string, p: Partial<LicensePlan>) {
    const payload = { ...p, stripe_price_id: p.stripePriceId };
    await supabase.from('license_plans').update(payload).eq('id', id);
  },

  async deletePlan(id: string) { await supabase.from('license_plans').delete().eq('id', id); },

  async getAllUsers(): Promise<User[]> { 
    const { data } = await supabase.from('profiles').select('*'); 
    return (data || []).map(d => ({ ...d, isAdmin: d.is_admin, cpfCnpj: d.cpf_cnpj })); 
  },

  async getAllUsersLicenses(): Promise<License[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, profiles!user_id(name, email)') 
      .order('created_at', { ascending: false });
    
    if (error) {
       return [];
    }

    return (data || []).map(l => ({ 
      ...l, 
      userId: l.user_id, 
      planId: l.plan_id, 
      expirationDate: l.expiration_date, 
      userName: (l as any).profiles?.name || 'Usuário Desconhecido', 
      userEmail: (l as any).profiles?.email || '—' 
    }));
  },

  // --- ASAAS PAYMENTS ---
  async createAsaasSubscription(planId: string, userId: string, billingType: string) {
    const resp = await fetch('/api/asaas/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, userId, billingType })
    });
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao processar assinatura');
    }
    return await resp.json();
  },

  async verifyAsaasPayment(paymentId: string) {
    const resp = await fetch('/api/asaas/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId })
    });
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao verificar pagamento');
    }
    return await resp.json();
  },

  async getAgendaEvents(): Promise<AgendaEvent[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('agenda_events').select('*').eq('user_id', session?.user?.id);
    return (data || []).map(e => ({ ...e, isCompleted: e.is_completed }));
  },
  
  async addAgendaEvent(e: Partial<AgendaEvent>) {
    const { data: { session } } = await supabase.auth.getSession();
    const payload = { ...e, user_id: session?.user?.id, is_completed: e.isCompleted };
    if (e.id && !e.id.includes('-')) await supabase.from('agenda_events').update(payload).eq('id', e.id);
    else await supabase.from('agenda_events').insert([payload]);
  },
  
  async deleteAgendaEvent(id: string) { await supabase.from('agenda_events').delete().eq('id', id); },
  
  async toggleAgendaEvent(id: string, isCompleted: boolean) { await supabase.from('agenda_events').update({ is_completed: isCompleted }).eq('id', id); }
};
