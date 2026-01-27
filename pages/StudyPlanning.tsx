
import React, { useState, useEffect } from 'react';
import { CalendarRange, Plus, X, Save, Loader2, Clock, BookOpen, Trash2, Pencil, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Library, GraduationCap, Calendar, ListTree, ChevronDown } from 'lucide-react';
import { StudyCourse, StudyDiscipline, StudyPlan } from '../types';
import { api } from '../services/api';

export const StudyPlanning: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const [courses, setCourses] = useState<StudyCourse[]>([]);
  const [disciplines, setDisciplines] = useState<StudyDiscipline[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');

  const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Paleta corrigida com hexadecimais para renderização correta
  const PALETTE = [
    { name: 'Índigo', value: 'border-indigo-200 bg-white text-indigo-700', marker: '#4f46e5' },
    { name: 'Esmeralda', value: 'border-emerald-200 bg-white text-emerald-700', marker: '#10b981' },
    { name: 'Âmbar', value: 'border-amber-200 bg-white text-amber-700', marker: '#f59e0b' },
    { name: 'Roxo', value: 'border-purple-200 bg-white text-purple-700', marker: '#8b5cf6' },
    { name: 'Rosa', value: 'border-pink-200 bg-white text-pink-700', marker: '#db2777' },
    { name: 'Azul', value: 'border-blue-200 bg-white text-blue-700', marker: '#2563eb' },
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    diasSelecionados: [] as string[],
    horaInicio: '08:00',
    horaFim: '10:00',
    cursoId: '',
    idDisciplina: '',
    tipoEstudo: 'Teoria',
    cor: PALETTE[0].value
  });

  useEffect(() => {
    loadInitialData();
  }, [selectedCourseFilter]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [coursesData, plansData] = await Promise.all([
        api.getStudyCourses(),
        api.getStudyPlans(selectedCourseFilter)
      ]);
      setCourses(coursesData);
      setPlans(plansData);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (courseId: string) => {
    setFormData(prev => ({ ...prev, cursoId: courseId, idDisciplina: '' }));
    setDisciplines([]);
    if (courseId) {
      try {
        const discs = await api.getStudyDisciplines(courseId);
        setDisciplines(discs);
      } catch (err) { console.error(err); }
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      diasSelecionados: prev.diasSelecionados.includes(day)
        ? prev.diasSelecionados.filter(d => d !== day)
        : [...prev.diasSelecionados, day]
    }));
  };

  const handleEdit = async (plan: StudyPlan) => {
    setEditingId(plan.id);
    setFormData({
      diasSelecionados: [plan.diaSemana],
      horaInicio: plan.horaInicio,
      horaFim: plan.horaFim,
      cursoId: plan.cursoId,
      idDisciplina: plan.idDisciplina,
      tipoEstudo: plan.tipoEstudo,
      cor: plan.color || PALETTE[0].value
    });
    
    try {
      const discs = await api.getStudyDisciplines(plan.cursoId);
      setDisciplines(discs);
    } catch (err) { console.error(err); }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idDisciplina || (formData.diasSelecionados.length === 0 && !editingId) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.addStudyPlan({
          id: editingId,
          cursoId: formData.cursoId,
          idDisciplina: formData.idDisciplina,
          tipoEstudo: formData.tipoEstudo as any,
          diaSemana: formData.diasSelecionados[0],
          horaInicio: formData.horaInicio,
          horaFim: formData.horaFim,
          color: formData.cor
        });
        setNotification({ message: 'Estudo atualizado!', type: 'success' });
      } else {
        await Promise.all(formData.diasSelecionados.map(dia => 
          api.addStudyPlan({
            cursoId: formData.cursoId,
            idDisciplina: formData.idDisciplina,
            tipoEstudo: formData.tipoEstudo as any,
            diaSemana: dia as any,
            horaInicio: formData.horaInicio,
            horaFim: formData.horaFim,
            color: formData.cor
          })
        ));
        setNotification({ message: 'Novo cronograma salvo!', type: 'success' });
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(prev => ({ ...prev, diasSelecionados: [] }));
      await loadInitialData();
    } catch (e: any) {
      setNotification({ message: 'Erro ao salvar planejamento.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirm = (plan: StudyPlan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!planToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteStudyPlan(planToDelete.id);
      await loadInitialData();
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
      setNotification({ message: 'Estudo removido!', type: 'success' });
    } catch (e) {
      setNotification({ message: 'Erro ao remover item.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlanByDay = (day: string) => {
    return plans.filter(p => p.diaSemana === day).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Header Estilo Disciplinas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <CalendarRange className="text-white" size={20} />
            </div>
            Planejamento Semanal
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-[52px]">Organize sua rotina de estudos por curso e disciplina</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full md:w-64">
            <Library size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-600 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todos os Cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => { 
              setEditingId(null);
              setFormData(prev => ({ ...prev, diasSelecionados: [], idDisciplina: '' })); 
              setIsModalOpen(true); 
            }} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Plus size={20} /> Novo Horário
          </button>
        </div>
      </div>

      {/* Calendário Desktop Grid */}
      <div className="hidden xl:grid xl:grid-cols-7 gap-4">
        {DAYS.map((day) => {
          const dayPlans = getPlanByDay(day);
          return (
            <div key={day} className="flex flex-col gap-4">
               <div className="bg-white p-3 text-center border-2 border-gray-200 rounded-xl">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{day}</span>
               </div>
               
               <div className="flex flex-col gap-3">
                  {dayPlans.length === 0 ? (
                    <div className="h-20 border-2 border-dashed border-gray-200 flex items-center justify-center rounded-2xl opacity-40">
                       <p className="text-[10px] font-bold uppercase text-gray-300">Livre</p>
                    </div>
                  ) : dayPlans.map(plan => {
                    const colorSet = PALETTE.find(p => p.value === plan.color) || PALETTE[0];
                    return (
                      <div key={plan.id} className="group bg-white border-2 border-gray-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all relative overflow-hidden">
                         <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: colorSet.marker }}></div>
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1 text-gray-400">
                               <Clock size={12} />
                               <span className="text-[10px] font-bold tabular-nums">{plan.horaInicio}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEdit(plan)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Pencil size={12}/></button>
                               <button onClick={() => openDeleteConfirm(plan)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={12}/></button>
                            </div>
                         </div>
                         <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-2 uppercase tracking-tighter">{plan.disciplinaNome}</h4>
                         <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md border border-gray-200">{plan.tipoEstudo}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          );
        })}
      </div>

      {/* Lista Mobile Style Cards */}
      <div className="xl:hidden space-y-8">
         {DAYS.map((day) => {
           const dayPlans = getPlanByDay(day);
           if (dayPlans.length === 0) return null;
           return (
             <div key={day} className="space-y-4">
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 px-2">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> {day}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dayPlans.map(plan => {
                    const colorSet = PALETTE.find(p => p.value === plan.color) || PALETTE[0];
                    return (
                      <div key={plan.id} className="bg-white rounded-2xl p-5 border-2 border-gray-200 flex items-center gap-5 relative overflow-hidden group">
                         <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: colorSet.marker }}></div>
                         <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-gray-100 pr-4">
                            <span className="text-xs font-bold text-indigo-600 tabular-nums">{plan.horaInicio}</span>
                            <span className="text-[10px] font-medium text-gray-400 tabular-nums">{plan.horaFim}</span>
                         </div>
                         <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-sm font-bold text-gray-900 truncate uppercase">{plan.disciplinaNome}</h4>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">{plan.tipoEstudo}</p>
                         </div>
                         <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleEdit(plan)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"><Pencil size={18} /></button>
                            <button onClick={() => openDeleteConfirm(plan)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                         </div>
                      </div>
                    );
                  })}
                </div>
             </div>
           );
         })}
         {plans.length === 0 && (
            <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
               <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
               <p className="text-sm font-medium text-gray-400">Nenhum estudo agendado para esta visão.</p>
            </div>
         )}
      </div>

      {/* Modal Redesenhado - Layout Paisagem Adaptativo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-gray-100 max-h-[90vh]">
              {/* Header Compacto */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-3">
                    <CalendarRange size={20} />
                    <h3 className="text-lg font-bold">{editingId ? 'Ajustar Planejamento' : 'Novo Estudo Semanal'}</h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform p-1"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {/* Lado Esquerdo: Identificação */}
                    <div className="space-y-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Curso Vinculado</label>
                          <div className="relative">
                             <Library className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <select 
                               required 
                               value={formData.cursoId} 
                               onChange={e => handleCourseChange(e.target.value)} 
                               className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none"
                             >
                                <option value="">Selecione o Curso...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Matéria/Disciplina</label>
                          <div className="relative">
                             <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <select 
                               required 
                               disabled={!formData.cursoId} 
                               value={formData.idDisciplina} 
                               onChange={e => setFormData({...formData, idDisciplina: e.target.value})} 
                               className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none disabled:opacity-50"
                             >
                                <option value="">{disciplines.length === 0 ? 'Aguardando curso...' : 'Selecione a Matéria...'}</option>
                                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                             </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Início</label>
                             <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="time" required value={formData.horaInicio} onChange={e => setFormData({...formData, horaInicio: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Término</label>
                             <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="time" required value={formData.horaFim} onChange={e => setFormData({...formData, horaFim: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Lado Direito: Dias e Estética */}
                    <div className="space-y-5">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dias da Semana</label>
                          <div className="flex flex-wrap gap-2">
                             {DAYS.map(dia => {
                               const isSelected = formData.diasSelecionados.includes(dia);
                               return (
                                 <button
                                   key={dia} type="button" 
                                   disabled={!!editingId}
                                   onClick={() => toggleDay(dia)}
                                   className={`flex-1 min-w-[45px] py-2 rounded-xl font-black text-[9px] uppercase transition-all border-2 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'} ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 >
                                   {dia.slice(0, 3)}
                                 </button>
                               );
                             })}
                          </div>
                          {editingId && <p className="text-[9px] text-amber-500 font-bold italic text-center">* Dias não editáveis em série</p>}
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Objetivo da Sessão</label>
                          <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
                             {['Teoria', 'Revisao', 'Exercicio'].map(tipo => (
                                <button 
                                   key={tipo} type="button" 
                                   onClick={() => setFormData({...formData, tipoEstudo: tipo as any})} 
                                   className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${formData.tipoEstudo === tipo ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                   {tipo === 'Exercicio' ? 'Questões' : tipo}
                                </button>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cor de Identificação</label>
                          <div className="flex gap-3 justify-between p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl">
                             {PALETTE.map(p => (
                                <button 
                                   key={p.name} type="button" 
                                   onClick={() => setFormData({...formData, cor: p.value})} 
                                   className={`w-9 h-9 rounded-full border-4 transition-all hover:scale-110 ${formData.cor === p.value ? 'ring-2 ring-indigo-500 border-white' : 'border-transparent shadow-sm'}`}
                                   style={{ backgroundColor: p.marker }}
                                   title={p.name}
                                />
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">Descartar</button>
                    <button 
                       type="submit" 
                       disabled={isSubmitting || !formData.idDisciplina || (formData.diasSelecionados.length === 0 && !editingId)} 
                       className="flex-1 md:flex-none md:min-w-[280px] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                       {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18} /> {editingId ? 'Salvar Alterações' : 'Confirmar Agenda'}</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal Deletar */}
      {isDeleteModalOpen && planToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center border border-gray-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
                <Trash2 size={36}/>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remover Horário?</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">
                Confirmar exclusão definitiva da aula de <span className="font-bold text-gray-900">"{planToDelete.disciplinaNome}"</span>?
              </p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDelete} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm uppercase transition-all hover:bg-red-700 shadow-lg shadow-red-100">Excluir Agora</button>
                 <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-3 text-gray-400 font-bold text-sm uppercase hover:bg-gray-50 rounded-2xl">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
