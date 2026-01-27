import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Timer, X, Loader2, Clock, BrainCircuit, Monitor, ShieldCheck, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { StudyDiscipline, StudyTopic, StudySession } from '../types';
import { api } from '../services/api';

interface StudyTimerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onTimerStatusChange?: (isRunning: boolean) => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ isOpen, onClose, onOpen, onTimerStatusChange }) => {
  const [disciplines, setDisciplines] = useState<StudyDiscipline[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [selectedDiscId, setSelectedDiscId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [studyType, setStudyType] = useState<'Teoria' | 'Revisao' | 'Exercicio'>('Teoria');
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // ✅ Notificação com duração maior (8s) e auto-dismiss
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ✅ Restaurar estado do localStorage ao montar
  useEffect(() => {
    loadDisciplines();
    
    const savedSessionStr = localStorage.getItem('babylon_study_session');
    const savedSessionId = localStorage.getItem('babylon_study_session_id');
    const savedStartTimeStr = localStorage.getItem('babylon_study_start_time');
    const savedIsPaused = localStorage.getItem('babylon_study_paused') === 'true';
    const savedSeconds = parseInt(localStorage.getItem('babylon_study_seconds') || '0');

    if ((savedSessionStr || savedSessionId) && savedStartTimeStr) {
      try {
        let session = savedSessionStr ? JSON.parse(savedSessionStr) : null;
        
        const sessionId = savedSessionId || session?.id;
        
        if (sessionId) {
          if (!session) session = {};
          session.id = sessionId;
          
          setCurrentSession(session);
          setSelectedDiscId(session.idDisciplina || '');
          setSelectedTopicId(session.idTopico || '');
          setStudyType(session.tipoEstudo || 'Teoria');
          setIsActive(true);
          setIsPaused(savedIsPaused);
          
          const startTime = parseInt(savedStartTimeStr);
          startTimeRef.current = startTime;
          
          if (!savedIsPaused) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setSeconds(elapsed);
          } else {
            setSeconds(savedSeconds);
          }

          console.log("✅ Sessão restaurada com ID:", sessionId);
        }
      } catch (e) {
        console.error("❌ Erro ao recuperar sessão do localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDiscId) loadTopics(selectedDiscId);
  }, [selectedDiscId]);

  useEffect(() => {
    if (onTimerStatusChange) onTimerStatusChange(isActive);
  }, [isActive, onTimerStatusChange]);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setSeconds(elapsed);
          localStorage.setItem('babylon_study_seconds', elapsed.toString());
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  const loadDisciplines = async () => {
    try {
      const data = await api.getStudyDisciplines();
      setDisciplines(data);
    } catch (e) { 
      console.error("❌ Erro ao carregar disciplinas:", e); 
    }
  };

  const loadTopics = async (id: string) => {
    try {
      const data = await api.getStudyTopics(id);
      setTopics(data);
    } catch (e) { 
      console.error("❌ Erro ao carregar tópicos:", e); 
    }
  };

  const handleStart = async () => {
    if (!selectedDiscId || !selectedTopicId || loading) return;
    
    setLoading(true);
    setNotification({ type: 'info', message: '🚀 Iniciando cronômetro...' });
    
    try {
      const session = await api.startStudySession({
        idDisciplina: selectedDiscId,
        idTopico: selectedTopicId,
        tipoEstudo: studyType as any
      });
      
      if (!session || !session.id) {
        throw new Error("❌ Sessão criada mas ID não foi retornado");
      }

      const now = Date.now();
      startTimeRef.current = now;
      setCurrentSession(session);
      setIsActive(true);
      setIsPaused(false);
      setSeconds(0);

      localStorage.setItem('babylon_study_session', JSON.stringify(session));
      localStorage.setItem('babylon_study_session_id', session.id);
      localStorage.setItem('babylon_study_start_time', now.toString());
      localStorage.setItem('babylon_study_paused', 'false');
      localStorage.setItem('babylon_study_seconds', '0');
      
      setNotification({ type: 'success', message: '✅ Foco iniciado com sucesso!' });
      
      console.log("✅ Sessão iniciada. ID salvo:", session.id);
      
    } catch (e: any) {
      console.error("❌ Erro ao iniciar sessão:", e);
      setNotification({ 
        type: 'error', 
        message: `❌ Falha ao iniciar: ${e.message || 'Erro desconhecido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    localStorage.setItem('babylon_study_paused', newPausedState.toString());
    
    if (!newPausedState) {
      const newStart = Date.now() - (seconds * 1000);
      startTimeRef.current = newStart;
      localStorage.setItem('babylon_study_start_time', newStart.toString());
    }
  };

  // ✅ FUNÇÃO DE FINALIZAÇÃO COMPLETAMENTE REESCRITA (SEM CONFIRMAÇÃO)
  const handleFinalize = async () => {
    // 🔒 Prevenir cliques duplos
    if (isFinalizing) {
      console.warn("⚠️ Operação de finalização já em andamento");
      return;
    }

    // 1️⃣ Recuperação agressiva do sessionId
    let sessionId = currentSession?.id || localStorage.getItem('babylon_study_session_id');
    
    if (!sessionId) {
      const storageSession = localStorage.getItem('babylon_study_session');
      if (storageSession) {
        try {
          const parsed = JSON.parse(storageSession);
          sessionId = parsed.id;
        } catch (e) { 
          console.error("❌ Erro ao fazer parse do localStorage:", e); 
        }
      }
    }

    // 2️⃣ Validação crítica
    if (!sessionId || sessionId.trim() === '') {
       console.error("❌ ID da sessão ausente. Estado atual:", { 
         currentSession, 
         localStorage: localStorage.getItem('babylon_study_session'),
         sessionId: localStorage.getItem('babylon_study_session_id')
       });
       
       setNotification({ 
         type: 'error', 
         message: '❌ Erro crítico: ID da sessão não encontrado. Por favor, recarregue a página.' 
       });
       
       return;
    }

    // 3️⃣ Início da operação (SEM CONFIRMAÇÃO - salvamento direto)
    setIsFinalizing(true);
    setLoading(true);
    setNotification({ type: 'info', message: '💾 Salvando sessão no banco de dados...' });

    console.log("🔄 Iniciando finalização da sessão:", { sessionId, durationSeconds: seconds });

    try {
      const durationSeconds = seconds;
      
      // 4️⃣ Chamada à API
      await api.finishStudySession(sessionId, durationSeconds);
      
      console.log("✅ Sessão finalizada com sucesso no banco");
      
      // 5️⃣ Limpeza de estado e storage
      if (timerRef.current) clearInterval(timerRef.current);
      
      localStorage.removeItem('babylon_study_session');
      localStorage.removeItem('babylon_study_session_id');
      localStorage.removeItem('babylon_study_start_time');
      localStorage.removeItem('babylon_study_paused');
      localStorage.removeItem('babylon_study_seconds');
      
      setIsActive(false);
      setIsPaused(false);
      setSeconds(0);
      setCurrentSession(null);
      startTimeRef.current = null;
      
      // 6️⃣ Feedback de sucesso (MODAL VISUAL - 5 segundos na tela)
      setNotification({ 
        type: 'success', 
        message: `✅ Estudo salvo com sucesso! Tempo total: ${formatTime(durationSeconds)}` 
      });
      
      // 7️⃣ Fechamento suave do modal (após 3s para usuário ver mensagem)
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (e: any) {
      console.error("❌ Erro fatal ao salvar sessão:", e);
      
      // 8️⃣ Feedback de erro CLARO
      setNotification({ 
        type: 'error', 
        message: `❌ Erro ao gravar no banco: ${e.message || 'Erro desconhecido'}. Seus dados NÃO foram perdidos. Tente novamente.` 
      });
      
      // 9️⃣ NÃO limpar o estado em caso de erro (permitir retry)
      console.warn("⚠️ Sessão mantida em memória para nova tentativa");
      
    } finally {
      setLoading(false);
      setIsFinalizing(false);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const currentDisc = disciplines.find(d => d.id === selectedDiscId);
  const currentTopic = topics.find(t => t.id === selectedTopicId);

  return (
    <>
      {/* ✅ TOAST DE NOTIFICAÇÃO GRANDE E VISÍVEL */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-4 px-8 py-6 border-3 shadow-2xl rounded-3xl backdrop-blur-lg animate-bounce-in min-w-[380px] max-w-[500px] ${
          notification.type === 'success' 
            ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-900/50' 
            : notification.type === 'error' 
            ? 'bg-red-600 border-red-300 text-white shadow-red-900/50' 
            : 'bg-indigo-600 border-indigo-300 text-white shadow-indigo-900/50'
        }`}>
           <div className="flex-shrink-0">
             {notification.type === 'success' && <CheckCircle size={36} strokeWidth={2.5} />}
             {notification.type === 'error' && <XCircle size={36} strokeWidth={2.5} />}
             {notification.type === 'info' && <Loader2 size={36} strokeWidth={2.5} className="animate-spin" />}
           </div>
           <div className="flex-1">
             <p className="text-base font-black uppercase leading-snug">{notification.message}</p>
           </div>
        </div>
      )}

      {/* Floating Indicator */}
      {isActive && !isOpen && (
        <div 
          onClick={onOpen} 
          className="fixed bottom-6 right-6 z-[300] bg-slate-950 border-2 border-indigo-500 p-4 shadow-2xl animate-bounce-in cursor-pointer flex items-center gap-4 rounded-2xl group hover:scale-105 transition-all"
        >
          <div className={`p-2.5 rounded-xl text-white ${isPaused ? 'bg-amber-600' : 'bg-indigo-600 animate-pulse'}`}>
             <Clock size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[9px] font-black uppercase text-indigo-400 leading-none mb-1">Tempo de Foco</p>
            <p className="text-xl font-black text-white italic tabular-nums leading-none">{formatTime(seconds)}</p>
          </div>
        </div>
      )}

      {/* Main Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100 max-h-[90vh]">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                       <Timer size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight uppercase italic">Estação de Foco</h3>
                      <p className="text-xs opacity-80 font-medium">Controle seu tempo e desempenho</p>
                    </div>
                 </div>
                 <button 
                   onClick={onClose} 
                   disabled={isFinalizing}
                   className="hover:rotate-90 transition-transform p-1 disabled:opacity-50"
                 >
                   <X size={28} />
                 </button>
              </div>

              <div className="p-8 overflow-y-auto">
                 {!isActive ? (
                   <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 gap-5">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Disciplina</label>
                            <select 
                              value={selectedDiscId} 
                              onChange={e => setSelectedDiscId(e.target.value)}
                              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none"
                            >
                              <option value="">Selecione a Matéria...</option>
                              {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tópico / Assunto</label>
                            <select 
                              disabled={!selectedDiscId}
                              value={selectedTopicId} 
                              onChange={e => setSelectedTopicId(e.target.value)}
                              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none disabled:opacity-50"
                            >
                              <option value="">Selecione o Tópico...</option>
                              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Modalidade</label>
                         <div className="grid grid-cols-3 gap-3">
                            {['Teoria', 'Revisao', 'Exercicio'].map((type) => (
                               <button 
                                 key={type}
                                 type="button"
                                 onClick={() => setStudyType(type as any)} 
                                 className={`py-3.5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${studyType === type ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}
                               >
                                  {type}
                               </button>
                            ))}
                         </div>
                      </div>

                      <button 
                        onClick={handleStart}
                        disabled={!selectedTopicId || loading}
                        className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {loading ? (
                            <>
                              <Loader2 size={24} className="animate-spin" />
                              <span>Iniciando...</span>
                            </>
                          ) : (
                            <>
                              <Play size={24} fill="currentColor" />
                              <span>Iniciar Estudo</span>
                            </>
                          )}
                      </button>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-4 space-y-10 animate-fade-in">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                           <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                           <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">{isPaused ? 'Sessão Pausada' : 'Foco em Andamento'}</span>
                        </div>
                        <h2 className={`text-8xl md:text-9xl font-black italic tracking-tighter tabular-nums leading-none transition-colors duration-500 ${isPaused ? 'text-amber-500' : 'text-slate-900'}`}>{formatTime(seconds)}</h2>
                      </div>
                      
                      <div className="w-full p-6 bg-slate-950 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 opacity-5 pointer-events-none -mt-4 -mr-4"><BrainCircuit size={160}/></div>
                         <div className="relative z-10 grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                               <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">Matéria</span>
                               <p className="text-sm font-bold uppercase truncate">{currentDisc?.name || 'Disciplina Ativa'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">Modalidade</span>
                               <p className="text-sm font-bold uppercase">{studyType}</p>
                            </div>
                            <div className="col-span-2 pt-4 border-t border-white/10">
                               <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Tópico Atual</span>
                               <p className="text-xs font-medium text-gray-400 uppercase leading-relaxed line-clamp-2">{currentTopic?.name || 'Carregando tópico...'}</p>
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                         <button 
                           type="button"
                           onClick={handlePauseResume}
                           disabled={isFinalizing}
                           className={`flex-1 w-full py-5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed ${isPaused ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'}`}
                         >
                            {isPaused ? <><Play size={20} fill="currentColor" /> Retomar</> : <><Pause size={20} fill="currentColor" /> Pausar</>}
                         </button>
                         
                         {/* ✅ BOTÃO DE ENCERRAR - SALVA IMEDIATAMENTE SEM PERGUNTAR */}
                         <button 
                           type="button"
                           onClick={handleFinalize}
                           disabled={loading || isFinalizing}
                           className="flex-1 w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                         >
                            {isFinalizing ? (
                              <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Salvando...</span>
                              </>
                            ) : (
                              <>
                                <Square size={18} fill="currentColor" />
                                <span>Encerrar e Salvar</span>
                              </>
                            )}
                         </button>
                      </div>

                      <button 
                        onClick={onClose} 
                        disabled={isFinalizing}
                        className="text-gray-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        <Monitor size={14} /> Manter em Segundo Plano
                      </button>
                   </div>
                 )}
              </div>
              
              <div className="px-8 py-5 bg-slate-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-2 text-emerald-600">
                    <ShieldCheck size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Sincronização Cloud Ativa</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Babylon.Edu v3.0</span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};