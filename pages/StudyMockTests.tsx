
import React, { useState, useEffect } from 'react';
import { FileEdit, Plus, Search, CheckCircle2, Play, Trash2, Pencil, X, Loader2, TrendingUp, Clock, Save, History, BarChart2, AlertTriangle, Calendar, Award, CheckCircle, AlertCircle, RefreshCw, Trophy, ChevronRight, GraduationCap, Library } from 'lucide-react';
import { StudyMockTest } from '../types';
import { api } from '../services/api';

interface StudyMockTestsProps {
  activeMockId?: string;
  onStartMock: (mock: StudyMockTest) => void;
}

export const StudyMockTests: React.FC<StudyMockTestsProps> = ({ activeMockId, onStartMock }) => {
  const [mockTests, setMockTests] = useState<StudyMockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasError, setHasError] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mockToDelete, setMockToDelete] = useState<StudyMockTest | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    dataSimulado: new Date().toISOString().split('T')[0],
    disciplinaNome: '',
    organizacaoSimulado: '',
    nQuestoes: '50'
  });

  useEffect(() => {
    loadMockTests();
  }, [activeMockId]);

  const loadMockTests = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const data = await api.getStudyMockTests();
      setMockTests(data || []);
    } catch (e: any) {
      console.error("Erro ao carregar simulados:", e);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (mock: StudyMockTest) => {
    setFormData({
      id: mock.id,
      dataSimulado: mock.dataSimulado,
      disciplinaNome: mock.disciplinaNome,
      organizacaoSimulado: mock.organizacaoSimulado || '',
      nQuestoes: mock.nQuestoes.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.disciplinaNome.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const payload: Partial<StudyMockTest> = {
        dataSimulado: formData.dataSimulado,
        disciplinaNome: formData.disciplinaNome.trim(),
        organizacaoSimulado: formData.organizacaoSimulado.trim(),
        nQuestoes: parseInt(formData.nQuestoes) || 0
      };

      if (formData.id) {
        await api.updateStudyMockTest(formData.id, payload);
        setNotification({ message: 'Simulado atualizado!', type: 'success' });
      } else {
        await api.addStudyMockTest({
            ...payload,
            nAcertos: 0,
            nErros: 0,
            saldoSimulado: 0
        });
        setNotification({ message: 'Simulado agendado!', type: 'success' });
      }
      
      setIsModalOpen(false);
      await loadMockTests();
      setFormData({ id: '', dataSimulado: new Date().toISOString().split('T')[0], disciplinaNome: '', organizacaoSimulado: '', nQuestoes: '50' });
    } catch (e: any) {
      setNotification({ message: 'Erro ao salvar simulado.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!mockToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteStudyMockTest(mockToDelete.id);
      setMockTests(prev => prev.filter(m => m.id !== mockToDelete.id));
      setIsDeleteModalOpen(false);
      setMockToDelete(null);
      setNotification({ message: 'Simulado removido!', type: 'success' });
    } catch (e) {
      setNotification({ message: 'Erro ao excluir.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return '—';
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.floor((e.getTime() - s.getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const filteredMocks = mockTests.filter(m => 
    m.disciplinaNome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.organizacaoSimulado || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingMocks = filteredMocks.filter(m => !m.horaFim);
  const completedMocks = filteredMocks.filter(m => !!m.horaFim);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Header Padronizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <FileEdit className="text-white" size={20} />
            </div>
            Meus Simulados
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-[52px]">Gerencie suas provas e monitore sua performance</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              placeholder="Buscar histórico..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-600 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button 
            onClick={() => { 
              setFormData({ id: '', dataSimulado: new Date().toISOString().split('T')[0], disciplinaNome: '', organizacaoSimulado: '', nQuestoes: '50' }); 
              setIsModalOpen(true); 
            }} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Plus size={20} /> Agendar Simulado
          </button>
        </div>
      </div>

      {/* Grid de Simulados Agendados */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 px-2">
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Simulados Pendentes
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : pendingMocks.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
             <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Nenhuma prova agendada no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingMocks.map(mock => (
              <div key={mock.id} className="group bg-white rounded-[2rem] p-6 border-2 border-gray-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {new Date(mock.dataSimulado + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex gap-1 transition-opacity">
                    <button onClick={() => handleOpenEdit(mock)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Pencil size={16}/></button>
                    <button onClick={() => { setMockToDelete(mock); setIsDeleteModalOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="flex-1 min-w-0 mb-6">
                  <h4 className="text-lg font-bold text-gray-900 truncate uppercase tracking-tight">{mock.disciplinaNome}</h4>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">{mock.organizacaoSimulado || 'Geral'}</p>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total de Questões</span>
                      <span className="text-xl font-bold text-gray-900">{mock.nQuestoes}</span>
                   </div>
                   <button 
                    onClick={() => onStartMock(mock)}
                    className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase"
                   >
                     <Play size={16} fill="currentColor" /> Iniciar
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Performance */}
      {completedMocks.length > 0 && (
        <div className="space-y-6 pt-10">
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Histórico de Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {completedMocks.map(mock => {
              const perc = Math.round((mock.nAcertos / mock.nQuestoes) * 100);
              return (
                <div key={mock.id} className="bg-white rounded-[2rem] p-7 border-2 border-gray-200 flex flex-col hover:border-emerald-300 transition-all group">
                   <div className="flex justify-between items-start mb-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(mock.dataSimulado + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <h4 className="text-md font-bold text-gray-800 uppercase italic truncate max-w-[150px]">{mock.disciplinaNome}</h4>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-black text-emerald-600 italic leading-none">{perc}%</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Duração</p>
                         <p className="text-xs font-bold text-gray-700">{calculateDuration(mock.horaInicio, mock.horaFim)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Saldo Líquido</p>
                         <p className="text-xs font-bold text-indigo-600">{(mock.nAcertos || 0) - (mock.nErros || 0)} pts</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${perc}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-gray-400">
                         <span>Acertos: <b className="text-emerald-600">{mock.nAcertos}</b></span>
                         <span>Erros: <b className="text-red-500">{mock.nErros}</b></span>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Agendar Simulado - Layout Paisagem Adaptativo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-gray-100 max-h-[90vh]">
              {/* Header Compacto */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-3">
                    <FileEdit size={20} />
                    <h3 className="text-lg font-bold">{formData.id ? 'Ajustar Simulado' : 'Estruturar Novo Simulado'}</h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform p-1"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    {/* Lado Esquerdo: Identificação */}
                    <div className="space-y-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Disciplina ou Matéria Alvo</label>
                          <div className="relative">
                             <Library className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <input 
                               required 
                               autoFocus
                               value={formData.disciplinaNome} 
                               onChange={e => setFormData({...formData, disciplinaNome: e.target.value})} 
                               placeholder="Ex: Português FGV, Simulado PM-CE..."
                               className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all"
                             />
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Instituição / Organizadora</label>
                          <div className="relative">
                             <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <input 
                               value={formData.organizacaoSimulado} 
                               onChange={e => setFormData({...formData, organizacaoSimulado: e.target.value})} 
                               placeholder="Ex: Cebraspe, Vunesp, Estratégia..."
                               className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all"
                             />
                          </div>
                       </div>
                    </div>

                    {/* Lado Direito: Métricas e Data */}
                    <div className="space-y-5">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Data Prevista</label>
                             <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="date" required value={formData.dataSimulado} onChange={e => setFormData({...formData, dataSimulado: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nº de Questões</label>
                             <div className="relative">
                                <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="number" required value={formData.nQuestoes} onChange={e => setFormData({...formData, nQuestoes: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                             </div>
                          </div>
                       </div>

                       <div className="p-5 bg-indigo-50 rounded-[1.5rem] border-2 border-indigo-100">
                          <div className="flex gap-3 text-indigo-700">
                             <AlertCircle size={20} className="shrink-0" />
                             <p className="text-[10px] font-black uppercase leading-relaxed tracking-tighter">
                               Os resultados de acertos e erros devem ser lançados ao concluir a execução do simulado para gerar suas métricas de desempenho.
                             </p>
                          </div>
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
                       {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18} /> {formData.id ? 'Salvar Alterações' : 'Confirmar Simulado'}</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal Deletar */}
      {isDeleteModalOpen && mockToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center border border-gray-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
                <Trash2 size={36}/>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remover Simulado?</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">
                Apagar permanentemente o registro de <span className="font-bold text-gray-900">"{mockToDelete.disciplinaNome}"</span>?
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
