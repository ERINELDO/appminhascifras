
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, MoreVertical, ArrowLeft, Loader2, X, Save, Pencil, Trash2, ListTree, User, Calendar, GraduationCap, ChevronRight } from 'lucide-react';
import { StudyCourse, StudyDiscipline } from '../types';
import { api } from '../services/api';

interface StudyDisciplinesProps {
  selectedCourse: StudyCourse | null;
  onBack: () => void;
  onSelectDiscipline: (discipline: StudyDiscipline) => void;
}

export const StudyDisciplines: React.FC<StudyDisciplinesProps> = ({ selectedCourse, onBack, onSelectDiscipline }) => {
  const [disciplines, setDisciplines] = useState<StudyDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({ id: '', name: '', professor: '' });

  useEffect(() => {
    if (selectedCourse) loadDisciplines();
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCourse]);

  const loadDisciplines = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const data = await api.getStudyDisciplines(selectedCourse.id);
      setDisciplines(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setFormData({ id: '', name: '', professor: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (disc: StudyDiscipline) => {
    setFormData({ id: disc.id, name: disc.name, professor: disc.professor || '' });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta disciplina apagará todos os seus tópicos. Continuar?")) return;
    try {
      await api.deleteStudyDiscipline(id);
      loadDisciplines();
    } catch (e) { alert("Erro ao excluir disciplina."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !selectedCourse || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (formData.id) await api.updateStudyDiscipline(formData.id, formData);
      else await api.addStudyDiscipline({ ...formData, courseId: selectedCourse.id });
      setIsModalOpen(false);
      loadDisciplines();
    } catch (e) { alert("Erro ao salvar disciplina."); }
    finally { setIsSubmitting(false); }
  };

  if (!selectedCourse) return null;

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-none border-2 border-slate-300 transition-all text-slate-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic flex items-center gap-3">
               <GraduationCap className="text-indigo-600" /> {selectedCourse.name}
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">Edital Verticalizado / Matérias</p>
          </div>
        </div>
        <button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-none border-2 border-indigo-700 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(67,56,202,1)] transition-all font-black text-[10px] uppercase active:translate-x-1 active:translate-y-1 active:shadow-none">
          <Plus size={18} /> Nova Disciplina
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disciplines.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200">
               <BookOpen size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Nenhuma disciplina cadastrada para este curso.</p>
            </div>
          ) : disciplines.map(disc => (
            <div key={disc.id} className="bg-white border-2 border-slate-300 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.08)] transition-all group overflow-hidden flex flex-col h-full">
               <div className="p-8 space-y-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 rounded-none group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <BookOpen size={24} />
                    </div>
                    
                    <div className="relative" ref={openMenuId === disc.id ? menuRef : null}>
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === disc.id ? null : disc.id)} 
                        className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                      >
                        <MoreVertical size={22} />
                      </button>
                      
                      {openMenuId === disc.id && (
                        <div className="absolute right-0 top-full mt-2 w-44 bg-white border-2 border-slate-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] z-50 animate-fade-in-down">
                          <button onClick={() => handleEdit(disc)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100">
                            <Pencil size={14}/> Editar
                          </button>
                          <button onClick={() => handleDelete(disc.id)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-red-600 hover:bg-slate-50 flex items-center gap-2">
                            <Trash2 size={14}/> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic leading-tight group-hover:text-indigo-600 transition-colors">
                      {disc.name}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <User size={12} className="text-indigo-400" /> Prof: {disc.professor || 'IA Babylon'}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} className="text-indigo-400" /> Criada em: {disc.createdAt ? new Date(disc.createdAt).toLocaleDateString('pt-BR') : '—'}
                       </span>
                    </div>
                  </div>
               </div>

               <div className="p-6 bg-slate-50 border-t-2 border-slate-100">
                  <button 
                    onClick={() => onSelectDiscipline(disc)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border-2 border-indigo-200 hover:border-indigo-700 font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(79,70,229,0.1)] hover:shadow-none active:translate-x-1 active:translate-y-1"
                  >
                    <ListTree size={18} /> Ver Tópicos <ChevronRight size={18} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVA/EDITAR DISCIPLINA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
               <h3 className="text-xl font-black italic uppercase">{formData.id ? 'Editar Disciplina' : 'Nova Disciplina'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome da Matéria</label>
                  <input required autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Direito Civil, Português..." className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-inner" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Professor Responsável</label>
                  <input value={formData.professor} onChange={e => setFormData({...formData, professor: e.target.value})} placeholder="Nome do professor..." className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-inner" />
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 font-black text-xs uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1">
                 {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={18}/>} Salvar Disciplina
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
