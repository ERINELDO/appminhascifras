
import React, { useState, useEffect, useMemo } from 'react';
import { BookCheck, Plus, Search, Trash2, Pencil, X, Loader2, Save, History, Library, ChevronDown, AlertTriangle, CheckCircle2, AlertCircle, GraduationCap, Calendar, Target, Award, ListTree } from 'lucide-react';
import { StudyExercise, StudyCourse, StudyDiscipline, StudyTopic } from '../types';
import { api } from '../services/api';

export const StudyExercises: React.FC = () => {
  const [exercises, setExercises] = useState<StudyExercise[]>([]);
  const [courses, setCourses] = useState<StudyCourse[]>([]);
  const [disciplines, setDisciplines] = useState<StudyDiscipline[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [exToDelete, setExToDelete] = useState<StudyExercise | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilterId, setCourseFilterId] = useState<string>('all');
  const [hasError, setHasError] = useState(false);

  const [formData, setFormData] = useState({
    id: '', 
    dataPratica: new Date().toISOString().split('T')[0],
    idCurso: '', 
    idDisciplina: '', 
    disciplinaNome: '',
    idTopico: '', 
    nQuestoes: '20', 
    nAcertos: '0', 
    nErros: '0', 
    observacao: ''
  });

  useEffect(() => {
    loadInitialData();
  }, [courseFilterId]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadInitialData = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const [exData, cData] = await Promise.all([
        api.getStudyExercises(courseFilterId),
        api.getStudyCourses()
      ]);
      setExercises(exData || []);
      setCourses(cData || []);
    } catch (e) {
      console.error(e);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = async (ex: StudyExercise) => {
    setLoading(true);
    try {
      setFormData({
        id: ex.id,
        dataPratica: ex.dataPratica,
        idCurso: ex.idCurso || '',
        idDisciplina: '', 
        disciplinaNome: ex.disciplinaNome,
        idTopico: ex.idTopico || '',
        nQuestoes: ex.nQuestoes.toString(),
        nAcertos: ex.nAcertos.toString(),
        nErros: ex.nErros.toString(),
        observacao: ex.observacao || ''
      });

      if (ex.idCurso) {
        const discs = await api.getStudyDisciplines(ex.idCurso);
        setDisciplines(discs);
        const discMatch = discs.find(d => d.name === ex.disciplinaNome);
        if (discMatch) {
          setFormData(prev => ({ ...prev, idDisciplina: discMatch.id }));
          const tops = await api.getStudyTopics(discMatch.id);
          setTopics(tops);
        }
      }
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (cid: string) => {
    setFormData(prev => ({ ...prev, idCurso: cid, idDisciplina: '', idTopico: '', disciplinaNome: '' }));
    setDisciplines([]); setTopics([]);
    if (cid) {
      try {
        const discs = await api.getStudyDisciplines(cid);
        setDisciplines(discs);
      } catch (e) { console.error(e); }
    }
  };

  const handleDisciplineChange = async (did: string) => {
    const disc = disciplines.find(d => d.id === did);
    setFormData(prev => ({ ...prev, idDisciplina: did, disciplinaNome: disc?.name || '', idTopico: '' }));
    setTopics([]);
    if (did) {
      try {
        const tops = await api.getStudyTopics(did);
        setTopics(tops);
      } catch (e) { console.error(e); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.disciplinaNome || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        dataPratica: formData.dataPratica,
        idCurso: formData.idCurso || undefined,
        idTopico: formData.idTopico || undefined,
        disciplinaNome: formData.disciplinaNome,
        nQuestoes: parseInt(formData.nQuestoes) || 0,
        nAcertos: parseInt(formData.nAcertos) || 0,
        nErros: parseInt(formData.nErros) || 0,
        observacao: formData.observacao
      };

      if (formData.id) {
        await api.updateStudyExercise(formData.id, payload);
        setNotification({ message: 'Performance atualizada!', type: 'success' });
      } else {
        await api.addStudyExercise(payload);
        setNotification({ message: 'Exercício registrado!', type: 'success' });
      }
      
      setIsModalOpen(false);
      loadInitialData();
    } catch (e) { 
      setNotification({ message: 'Erro ao processar exercício.', type: 'error' }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const executeDelete = async () => {
    if (!exToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteStudyExercise(exToDelete.id);
      setNotification({ message: 'Registro removido!', type: 'success' });
      setExercises(prev => prev.filter(e => e.id !== exToDelete.id));
      setIsDeleteModalOpen(false);
      setExToDelete(null);
    } catch (e) {
      setNotification({ message: 'Erro ao excluir.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => 
      ex.disciplinaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.observacao || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.dataPratica.localeCompare(a.dataPratica));
  }, [exercises, searchTerm]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Header Padronizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <BookCheck className="text-white" size={20} />
            </div>
            Meus Exercícios
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-[52px]">Acompanhe seu desempenho por disciplina e tópico</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full md:w-64 group">
            <Library size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={courseFilterId} 
              onChange={(e) => setCourseFilterId(e.target.value)} 
              className="w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-600 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todos os Cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              placeholder="Pesquisar histórico..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-600 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <button 
            onClick={() => { 
                setFormData({ id: '', dataPratica: new Date().toISOString().split('T')[0], idCurso: '', idDisciplina: '', disciplinaNome: '', idTopico: '', nQuestoes: '20', nAcertos: '0', nErros: '0', observacao: '' }); 
                setIsModalOpen(true); 
            }} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Plus size={20} /> Registrar Prática
          </button>
        </div>
      </div>

      {/* Grid de Performance / Exercícios */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 px-2">
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Histórico de Exercícios
        </h3>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : hasError ? (
          <div className="p-10 text-center bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem]">
            <AlertTriangle className="mx-auto text-red-500 mb-4" />
            <p className="font-black uppercase text-red-600 text-xs">Erro ao conectar com a base de dados.</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
             <History size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Nenhuma prática registrada no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExercises.map(ex => {
              const perc = ex.nQuestoes > 0 ? Math.round((ex.nAcertos / ex.nQuestoes) * 100) : 0;
              return (
                <div key={ex.id} className="group bg-white rounded-[2.5rem] p-7 border-2 border-gray-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                  
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(ex.dataPratica + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      <h4 className="text-md font-bold text-gray-800 uppercase italic leading-tight mt-1">{ex.disciplinaNome}</h4>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleOpenEdit(ex)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Pencil size={16}/></button>
                      <button onClick={() => { setExToDelete(ex); setIsDeleteModalOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Questões</p>
                         <p className="text-xs font-bold text-gray-700">{ex.nQuestoes}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Taxa Acerto</p>
                         <p className={`text-xs font-bold ${perc >= 70 ? 'text-emerald-600' : perc >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{perc}%</p>
                      </div>
                   </div>

                   <div className="space-y-2 flex-1">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full transition-all duration-700 ${perc >= 70 ? 'bg-emerald-500' : perc >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${perc}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-gray-400">
                         <span>Acertos: <b className="text-emerald-600">{ex.nAcertos}</b></span>
                         <span>Erros: <b className="text-red-500">{ex.nErros}</b></span>
                      </div>
                   </div>

                   {ex.observacao && (
                     <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="text-[10px] text-gray-400 italic line-clamp-2">"{ex.observacao}"</p>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Registrar Prática - Layout Paisagem Adaptativo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-gray-100 max-h-[90vh]">
              {/* Header Compacto */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-3">
                    <BookCheck size={20} />
                    <h3 className="text-lg font-bold">{formData.id ? 'Ajustar Performance' : 'Lançar Nova Prática'}</h3>
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
                               value={formData.idCurso} 
                               onChange={e => handleCourseChange(e.target.value)} 
                               className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none"
                             >
                                <option value="">Selecione o Curso...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Disciplina</label>
                          <div className="relative">
                             <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <select 
                               required 
                               disabled={!formData.idCurso} 
                               value={formData.idDisciplina} 
                               onChange={e => handleDisciplineChange(e.target.value)} 
                               className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none disabled:opacity-50"
                             >
                                <option value="">{disciplines.length === 0 ? 'Aguardando curso...' : 'Selecione a Matéria...'}</option>
                                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                             </select>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tópico / Assunto</label>
                          <div className="relative">
                             <ListTree className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <select 
                               value={formData.idTopico} 
                               onChange={e => setFormData({...formData, idTopico: e.target.value})} 
                               disabled={!formData.idDisciplina}
                               className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none disabled:opacity-50"
                             >
                                <option value="">{topics.length === 0 ? 'Aguardando disciplina...' : 'Todos os tópicos'}</option>
                                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                             </select>
                          </div>
                       </div>
                    </div>

                    {/* Lado Direito: Métricas e Data */}
                    <div className="space-y-5">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Data da Prática</label>
                             <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="date" required value={formData.dataPratica} onChange={e => setFormData({...formData, dataPratica: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nº Respondidas</label>
                             <div className="relative">
                                <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="number" required value={formData.nQuestoes} onChange={e => setFormData({...formData, nQuestoes: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-1">Acertos (Certas)</label>
                             <div className="relative">
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                                <input type="number" required value={formData.nAcertos} onChange={e => setFormData({...formData, nAcertos: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl font-black text-emerald-700 outline-none focus:border-emerald-500" />
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-red-600 tracking-widest ml-1">Erros (Erradas)</label>
                             <div className="relative">
                                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={14} />
                                <input type="number" required value={formData.nErros} onChange={e => setFormData({...formData, nErros: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-red-50/30 border-2 border-red-100 rounded-xl font-black text-red-700 outline-none focus:border-red-500" />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Observações da Prática</label>
                          <textarea 
                            value={formData.observacao} 
                            onChange={e => setFormData({...formData, observacao: e.target.value})} 
                            rows={2} 
                            placeholder="Anote suas dificuldades ou lembretes..."
                            className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-sm text-gray-700 outline-none focus:border-indigo-500 resize-none"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">Descartar</button>
                    <button 
                       type="submit" 
                       disabled={isSubmitting || !formData.disciplinaNome} 
                       className="flex-1 md:flex-none md:min-w-[280px] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                       {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18} /> {formData.id ? 'Salvar Alterações' : 'Confirmar Performance'}</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal Deletar */}
      {isDeleteModalOpen && exToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center border border-gray-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
                <Trash2 size={36}/>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remover Registro?</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">
                Confirmar exclusão definitiva do histórico de <span className="font-bold text-gray-900">"{exToDelete.disciplinaNome}"</span>?
              </p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDelete} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm uppercase transition-all hover:bg-red-700 shadow-lg shadow-red-100">Excluir Agora</button>
                 <button onClick={() => { setIsDeleteModalOpen(false); setExToDelete(null); }} className="w-full py-3 text-gray-400 font-bold text-sm uppercase hover:bg-gray-50 rounded-2xl">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
