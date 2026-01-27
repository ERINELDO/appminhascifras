import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Clock, Trophy, BookOpen, Target, CheckCircle, TrendingUp, FileText, Calendar, BrainCircuit, Check, X as CloseIcon, Plus, Save, Loader2, ChevronDown, BookMarked, ListChecks } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { api } from '../services/api';
import { StudyCourse, StudyPlan, StudyDiscipline, StudyTopic, StudySession } from '../types';

interface StudyDashboardProps {
  onOpenTimer: () => void;
  isSidebarCollapsed: boolean;
}

type Period = 'HOJE' | 'SEMANA' | 'MES' | 'TOTAL';

export const StudyDashboard: React.FC<StudyDashboardProps> = ({ onOpenTimer, isSidebarCollapsed }) => {
  const [courses, setCourses] = useState<StudyCourse[]>([]);
  const [disciplines, setDisciplines] = useState<StudyDiscipline[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [todayPlans, setTodayPlans] = useState<StudyPlan[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [activePeriod, setActivePeriod] = useState<Period>('SEMANA');
  const [loading, setLoading] = useState(true);
  
  // Modal de Lançamento Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualData, setManualData] = useState({
    courseId: '',
    disciplineId: '',
    topicId: '',
    type: 'Teoria',
    startTime: '08:00',
    endTime: '09:00',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cData, eData, dData, sData] = await Promise.all([
        api.getStudyCourses(),
        api.getStudyExercises(),
        api.getStudyDisciplines(),
        api.getStudySessions()
      ]);
      setCourses(cData || []);
      setExercises(eData || []);
      setDisciplines(dData || []);
      setSessions(sData || []);
      loadTodayActivities();
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChangeManual = async (id: string) => {
    setManualData(prev => ({ ...prev, courseId: id, disciplineId: '', topicId: '' }));
    setDisciplines([]); setTopics([]);
    if (id) {
       const discs = await api.getStudyDisciplines(id);
       setDisciplines(discs);
    }
  };

  const handleDisciplineChangeManual = async (id: string) => {
    setManualData(prev => ({ ...prev, disciplineId: id, topicId: '' }));
    if (id) {
      try {
        const tops = await api.getStudyTopics(id);
        setTopics(tops);
      } catch (e) { console.error(e); }
    } else {
      setTopics([]);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.disciplineId || !manualData.topicId || manualLoading) return;
    
    setManualLoading(true);
    try {
      const start = new Date(`${manualData.date}T${manualData.startTime}:00`);
      const end = new Date(`${manualData.date}T${manualData.endTime}:00`);
      
      let totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
      
      // Se o estudo passou da meia-noite
      if (totalSeconds < 0) {
        totalSeconds += 86400; 
      }

      if (totalSeconds <= 0) {
        alert("O horário de término deve ser maior que o de início.");
        setManualLoading(false);
        return;
      }

      await api.addManualStudySession({
        idDisciplina: manualData.disciplineId,
        idTopico: manualData.topicId,
        tipoEstudo: manualData.type,
        durationSeconds: totalSeconds,
        startTime: start.toISOString()
      });

      setIsManualModalOpen(false);
      await loadInitialData();
      alert("Estudo registrado com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar estudo manual.");
    } finally {
      setManualLoading(false);
    }
  };

  const loadTodayActivities = async () => {
    try {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayName = days[new Date().getDay()];
      const data = await api.getStudyPlans(selectedCourseId === 'all' ? undefined : selectedCourseId);
      const today = data.filter(p => p.diaSemana === dayName).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      setTodayPlans(today);
    } catch (e) { console.error(e); }
  };

  const formatSeconds = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h${m.toString().padStart(2, '0')}m`;
    return `${m}m`;
  };

  const weeklyChartData = useMemo(() => {
    const now = new Date();
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let filteredSessions = sessions.filter(s => s.startTime && s.durationSeconds);
    
    if (activePeriod === 'HOJE') {
      const todayStr = now.toISOString().split('T')[0];
      filteredSessions = filteredSessions.filter(s => new Date(s.startTime).toISOString().split('T')[0] === todayStr);
    } else if (activePeriod === 'SEMANA') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      filteredSessions = filteredSessions.filter(s => new Date(s.startTime) >= weekAgo);
    }
    
    return days.map((day, index) => {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - (now.getDay() - index));
      const dayStr = targetDate.toISOString().split('T')[0];
      const daySessions = filteredSessions.filter(s => new Date(s.startTime).toISOString().split('T')[0] === dayStr);
      const minutes = daySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60;
      return { name: day, minutos: Math.round(minutes) };
    });
  }, [sessions, activePeriod]);

  const performanceData = useMemo(() => {
    const filteredDisciplines = disciplines.filter(d => selectedCourseId === 'all' || d.courseId === selectedCourseId);
    return filteredDisciplines.map(disc => {
      const discExercises = exercises.filter(ex => ex.disciplinaNome === disc.name);
      const certas = discExercises.reduce((acc, curr) => acc + (curr.nAcertos || 0), 0);
      const erradas = discExercises.reduce((acc, curr) => acc + (curr.nErros || 0), 0);
      const totalQuestoes = discExercises.reduce((acc, curr) => acc + (curr.nQuestoes || 0), 0);
      const perc = totalQuestoes > 0 ? Math.round((certas / totalQuestoes) * 100) : 0;
      const discSeconds = sessions.filter(s => s.idDisciplina === disc.id).reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
      return { id: disc.id, nome: disc.name, tempo: formatSeconds(discSeconds), certas, erradas, total: totalQuestoes, perc };
    }).sort((a, b) => b.perc - a.perc);
  }, [disciplines, exercises, sessions, selectedCourseId]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Banner de Boas-vindas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                 <Trophy className="text-white" size={22} />
               </div>
               Minha Performance
             </h2>
             <p className="text-gray-500 text-sm mt-1 ml-[52px]">Central de monitoramento de aprendizagem</p>
           </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Clock size={28} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Total</p>
                <p className="text-2xl font-black text-slate-800 tracking-tighter">{formatSeconds(sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0))}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><ListChecks size={28} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questões Feitas</p>
                <p className="text-2xl font-black text-slate-800 tracking-tighter">{exercises.reduce((acc, ex) => acc + ex.nQuestoes, 0)}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Target size={28} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Acerto</p>
                <p className="text-2xl font-black text-slate-800 tracking-tighter">
                   {exercises.reduce((acc, ex) => acc + ex.nQuestoes, 0) > 0 ? 
                    Math.round((exercises.reduce((acc, ex) => acc + ex.nAcertos, 0) / exercises.reduce((acc, ex) => acc + ex.nQuestoes, 0)) * 100) : 0}%
                </p>
              </div>
           </div>
        </div>

        {/* Gráfico Semanal */}
        <div className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-2">
                 <BarChart2 size={18} className="text-indigo-600" /> Distribuição de Carga Horária
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 {['HOJE', 'SEMANA'].map(p => (
                   <button key={p} onClick={() => setActivePeriod(p as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activePeriod === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{p}</button>
                 ))}
              </div>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyChartData}>
                  <defs>
                    <linearGradient id="barStudy" x1="0" y1="0" x2="0" y2="1">
                      {/* Fix: removed duplicated attribute and corrected mapping (x1, y1, x2, y2). */}
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                  <YAxis hide />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px'}} />
                  <Bar dataKey="minutos" fill="url(#barStudy)" radius={[10, 10, 0, 0]} barSize={35} />
                  <Line type="monotone" dataKey="minutos" stroke="#ec4899" strokeWidth={3} dot={{fill: '#ec4899', r: 4}} />
                </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Lista de Performance */}
        <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase italic">Ranking de Aproveitamento</h3>
              <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="bg-white border-2 border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-500">
                 <option value="all">Filtrar por Curso...</option>
                 {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-gray-100 bg-slate-50/30">
                       <th className="px-8 py-5">Disciplina</th>
                       <th className="px-8 py-5 text-center">Tempo Estudo</th>
                       <th className="px-8 py-5 text-center">Questões</th>
                       <th className="px-8 py-5 text-center">% Acerto</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {performanceData.map(d => (
                      <tr key={d.id} className="hover:bg-indigo-50/30 transition-colors">
                         <td className="px-8 py-5 font-black text-slate-700 text-xs uppercase italic">{d.nome}</td>
                         <td className="px-8 py-5 text-center font-bold text-slate-500 text-xs">{d.tempo}</td>
                         <td className="px-8 py-5 text-center font-bold text-slate-500 text-xs">{d.total}</td>
                         <td className="px-8 py-5 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${d.perc >= 70 ? 'bg-emerald-50 text-emerald-600' : d.perc >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                               {d.perc}%
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* RODAPÉ DE AÇÃO - LARGURA DINÂMICA */}
      <div className={`fixed bottom-0 left-0 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-72'} right-0 z-[100] transition-all`}>
         <div className="bg-white border-t-2 border-gray-200 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] px-4 py-4 md:py-6">
            <div className="max-w-4xl mx-auto flex items-center justify-around gap-2">
               <button onClick={() => setIsManualModalOpen(true)} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-indigo-50 transition-all flex-1">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200"><BookMarked size={22} /></div>
                  <span className="text-[10px] font-black uppercase text-slate-600">Lançar Estudo Manual</span>
               </button>
               <button onClick={onOpenTimer} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-purple-50 transition-all flex-1">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200"><Clock size={22} /></div>
                  <span className="text-[10px] font-black uppercase text-slate-600">Iniciar Estudo</span>
               </button>
               <button className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-emerald-50 transition-all flex-1">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200"><Target size={22} /></div>
                  <span className="text-[10px] font-black uppercase text-slate-600">Meta Diária</span>
               </button>
            </div>
         </div>
      </div>

      {/* MODAL LANÇAMENTO MANUAL COMPLETO */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100 max-h-[90vh]">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm"><Clock size={24} /></div>
                    <h3 className="text-xl font-bold uppercase italic tracking-tight">Registro Manual de Estudo</h3>
                 </div>
                 <button onClick={() => setIsManualModalOpen(false)} className="hover:rotate-90 transition-transform p-1"><CloseIcon size={28} /></button>
              </div>

              <form onSubmit={handleManualSubmit} className="p-8 overflow-y-auto space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Curso Alvo</label>
                       <select required value={manualData.courseId} onChange={e => handleCourseChangeManual(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-gray-200 rounded-2xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500">
                          <option value="">Selecione o Curso...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Disciplina</label>
                       <select required value={manualData.disciplineId} onChange={e => handleDisciplineChangeManual(e.target.value)} disabled={!manualData.courseId} className="w-full px-5 py-4 bg-slate-50 border-2 border-gray-200 rounded-2xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 disabled:opacity-50">
                          <option value="">{disciplines.length > 0 ? 'Selecione a Matéria...' : 'Aguardando curso...'}</option>
                          {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tópico / Assunto</label>
                    <select required value={manualData.topicId} onChange={e => setManualData({...manualData, topicId: e.target.value})} disabled={!manualData.disciplineId} className="w-full px-5 py-4 bg-slate-50 border-2 border-gray-200 rounded-2xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 disabled:opacity-50">
                       <option value="">{topics.length > 0 ? 'Selecione o Tópico...' : 'Aguardando matéria...'}</option>
                       {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Data do Estudo</label>
                       <input type="date" required value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-gray-200 rounded-2xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Modalidade</label>
                       <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                          {['Teoria', 'Revisao', 'Exercicio'].map(t => (
                             <button key={t} type="button" onClick={() => setManualData({...manualData, type: t})} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${manualData.type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                                {t}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Início</label>
                       <input type="time" required value={manualData.startTime} onChange={e => setManualData({...manualData, startTime: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-gray-200 rounded-2xl font-black text-lg text-slate-800" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Término</label>
                       <input type="time" required value={manualData.endTime} onChange={e => setManualData({...manualData, endTime: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-gray-200 rounded-2xl font-black text-lg text-slate-800" />
                    </div>
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all">Descartar</button>
                    <button type="submit" disabled={manualLoading} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                       {manualLoading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Confirmar Estudo</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};