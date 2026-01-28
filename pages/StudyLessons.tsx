
import React, { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft, Loader2, X, Save, Target, CheckCircle2, FileText, MoreVertical, Pencil, Trash2, Zap, History, Clock } from 'lucide-react';
import { StudyDiscipline, StudyTopic, StudySession } from '../types';
import { api } from '../services/api';

interface StudyTopicsProps {
  selectedDiscipline: StudyDiscipline | null;
  onBack: () => void;
}

export const StudyLessons: React.FC<StudyTopicsProps> = ({ selectedDiscipline, onBack }) => {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({ id: '', name: '', prioridade: 'Média' as any });

  useEffect(() => {
    if (selectedDiscipline) loadData();
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedDiscipline]);

  const loadData = async () => {
    if (!selectedDiscipline) return;
    setLoading(true);
    try {
      const [topicsData, sessionsData] = await Promise.all([
        api.getStudyTopics(selectedDiscipline.id),
        api.getStudySessions()
      ]);
      setTopics(topicsData);
      setSessions(sessionsData.filter(s => s.idDisciplina === selectedDiscipline.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setFormData({ id: '', name: '', prioridade: 'Média' });
    setIsModalOpen(true);
  };

  const handleEdit = (topic: StudyTopic) => {
    setFormData({ id: topic.id, name: topic.name, prioridade: topic.prioridade || 'Média' });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este tópico do seu edital?")) return;
    try {
      await api.deleteStudyTopic(id);
      loadData();
    } catch (e) { alert("Erro ao excluir tópico."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !selectedDiscipline || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (formData.id) await api.updateStudyTopic(formData.id, formData);
      else await api.addStudyTopic({ ...formData, disciplineId: selectedDiscipline.id });
      setIsModalOpen(false);
      loadData();
    } catch (e) { alert("Erro ao salvar tópico."); }
    finally { setIsSubmitting(false); }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    return `${h}h${m % 60}m`;
  };

  if (!selectedDiscipline) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-none border-2 border-slate-300 transition-all text-slate-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic flex items-center gap-3">
               <Zap className="text-amber-500" /> {selectedDiscipline.name}
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">Edital Verticalizado / Tópicos Detalhados</p>
          </div>
        </div>
        <button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-none border-2 border-emerald-700 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] transition-all font-black text-[10px] uppercase active:translate-x-1 active:translate-y-1 active:shadow-none">
          <Plus size={18} /> Novo Tópico
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {topics.length === 0 ? (
            <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.02)]">
               <FileText size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Nenhum tópico identificado ainda.</p>
            </div>
          ) : topics.map(topic => {
            const topicSessions = sessions.filter(s => s.idTopico === topic.id).sort((a,b) => b.startTime.localeCompare(a.startTime));
            
            return (
              <div key={topic.id} className="bg-white border-2 border-slate-300 p-8 rounded-none flex flex-col hover:border-indigo-500 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.04)] group relative">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                       <div className={`p-5 rounded-none border-2 bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-amber-50 group-hover:border-amber-200 group-hover:text-amber-600 transition-all shrink-0 shadow-sm`}>
                          <Target size={32} />
                       </div>
                       <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                             <span className={`text-[9px] font-black uppercase px-3 py-1 border shadow-sm ${topic.prioridade === 'Alta' ? 'bg-red-50 text-red-500 border-red-200' : topic.prioridade === 'Baixa' ? 'bg-emerald-50 text-emerald-500 border-emerald-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                               Prioridade {topic.prioridade}
                             </span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                               <CheckCircle2 size={12} className="text-emerald-500" /> Cadastrado em {new Date(topic.createdAt!).toLocaleDateString('pt-BR')}
                             </span>
                          </div>
                          <h4 className="font-black text-slate-800 uppercase italic text-lg leading-tight">
                            {topic.name}
                          </h4>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                       <div className="relative" ref={openMenuId === topic.id ? menuRef : null}>
                         <button 
                           onClick={() => setOpenMenuId(openMenuId === topic.id ? null : topic.id)} 
                           className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 border-2 border-transparent hover:border-indigo-200 rounded-none transition-all shadow-sm"
                         >
                           <MoreVertical size={24} />
                         </button>
                         
                         {openMenuId === topic.id && (
                           <div className="absolute right-0 top-full mt-2 w-44 bg-white border-2 border-slate-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] z-50 animate-fade-in-down">
                             <button onClick={() => handleEdit(topic)} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase text-indigo-600 hover:bg-slate-50 flex items-center gap-3 border-b-2 border-slate-100">
                               <Pencil size={16}/> Editar
                             </button>
                             <button onClick={() => handleDelete(topic.id)} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase text-red-600 hover:bg-slate-50 flex items-center gap-3">
                               <Trash2 size={16}/> Remover
                             </button>
                           </div>
                         )}
                       </div>
                    </div>
                 </div>

                 {/* HISTÓRICO DE ESTUDO DO TÓPICO */}
                 <div className="mt-6 pt-6 border-t-2 border-slate-50 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                       <History size={16} className="text-indigo-500" />
                       <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Histórico de Estudo e Registros</h5>
                    </div>
                    
                    {topicSessions.length === 0 ? (
                       <p className="text-[9px] font-bold text-slate-300 uppercase italic">Nenhum registro de estudo para este tópico.</p>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {topicSessions.map(session => (
                             <div key={session.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group/sess transition-all hover:bg-white hover:border-indigo-200">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${session.tipoEstudo === 'Teoria' ? 'bg-indigo-600' : session.tipoEstudo === 'Revisao' ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                                   <Clock size={14} />
                                </div>
                                <div className="min-w-0">
                                   <p className="text-[9px] font-black text-slate-800 uppercase italic truncate">{session.tipoEstudo}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                      {new Date(session.startTime).toLocaleDateString('pt-BR')} • {formatDuration(session.durationSeconds)}
                                   </p>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NOVO/EDITAR TÓPICO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
               <h3 className="text-xl font-black italic uppercase">{formData.id ? 'Editar Tópico' : 'Novo Tópico'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assunto / Tema</label>
                  <textarea required autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} rows={3} placeholder="Ex: Artigo 5º da CF..." className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-inner resize-none" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nível de Prioridade</label>
                  <select value={formData.prioridade} onChange={e => setFormData({...formData, prioridade: e.target.value as any})} className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-indigo-500">
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 font-black text-xs uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                 {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={18}/>} Confirmar
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
