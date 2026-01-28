
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Timer, Save, X, Loader2, FileEdit, CheckCircle2 } from 'lucide-react';
import { StudyMockTest } from '../types';
import { api } from '../services/api';

interface MockTestTimerProps {
  activeMock: StudyMockTest;
  onFinished: () => void;
}

export const MockTestTimer: React.FC<MockTestTimerProps> = ({ activeMock, onFinished }) => {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acertos, setAcertos] = useState('');
  const [erros, setErros] = useState('');
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = activeMock.horaInicio ? new Date(activeMock.horaInicio).getTime() : Date.now();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    setSeconds(elapsed > 0 ? elapsed : 0);

    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (isPaused) return s;
        return s + 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeMock.id, isPaused]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleFinishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseInt(acertos) || 0;
    const err = parseInt(erros) || 0;
    
    setIsSubmitting(true);
    try {
      const endTime = new Date().toISOString();
      await api.updateStudyMockTest(activeMock.id, {
        disciplinaNome: activeMock.disciplinaNome,
        horaFim: endTime,
        tempoTotal: seconds,
        nAcertos: a,
        nErros: err,
        saldoSimulado: a - err
      });
      onFinished();
    } catch (e) {
      alert("Erro ao salvar resultados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-4 bg-slate-900 border-2 border-indigo-500 p-4 shadow-[12px_12px_0px_0px_rgba(79,70,229,0.2)] animate-slide-in-up md:min-w-[450px] rounded-none">
         <div className={`p-3 rounded-none border-2 border-white/10 text-white ${isPaused ? 'bg-amber-600' : 'bg-indigo-600 animate-pulse'}`}>
            <FileEdit size={20} />
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em] leading-none mb-1">Simulado Ativo</p>
            <h4 className="text-sm font-black text-white italic truncate uppercase">{activeMock.disciplinaNome}</h4>
         </div>
         <div className="text-right px-4 border-l border-white/10">
            <p className="text-2xl font-black text-white tabular-nums leading-none italic">{formatTime(seconds)}</p>
         </div>
         <div className="flex gap-2 border-l border-white/10 pl-4">
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className={`p-2 rounded-none border-2 transition-all ${isPaused ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-amber-600 text-white border-amber-700'}`}
              title={isPaused ? "Retomar" : "Pausar Tempo"}
            >
               {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
            <button 
              onClick={() => { setIsPaused(true); setIsFinishing(true); }}
              className="p-2 bg-red-600 text-white border-2 border-red-700 rounded-none shadow-[3px_3px_0px_0px_rgba(185,28,28,0.2)] hover:bg-red-700 transition-all"
              title="Finalizar e lançar questões"
            >
               <Square size={18} fill="currentColor" />
            </button>
         </div>
      </div>

      {isFinishing && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-sm flex flex-col">
              <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                 <h3 className="text-xl font-black italic uppercase tracking-tight">Desempenho Final</h3>
                 <button onClick={() => setIsFinishing(false)} className="text-white/60 hover:text-white transition-all"><X size={28} /></button>
              </div>
              <form onSubmit={handleFinishSubmit} className="p-8 space-y-6">
                 <div className="text-center p-4 bg-indigo-50 border-2 border-indigo-100 mb-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tempo de Prova</p>
                    <p className="text-3xl font-black text-indigo-700 italic tabular-nums">{formatTime(seconds)}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-1">Certas</label>
                       <input type="number" required autoFocus value={acertos} onChange={e => setAcertos(e.target.value)} className="w-full px-5 py-4 bg-emerald-50 border-2 border-emerald-200 font-black text-2xl text-emerald-700 outline-none text-center rounded-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-red-600 tracking-widest ml-1">Erradas</label>
                       <input type="number" required value={erros} onChange={e => setErros(e.target.value)} className="w-full px-5 py-4 bg-red-50 border-2 border-red-200 font-black text-2xl text-red-700 outline-none text-center rounded-none" />
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 border-2 border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Saldo de Pontos:</span>
                    <span className="text-xl font-black text-slate-800 italic">{(parseInt(acertos) || 0) - (parseInt(erros) || 0)}</span>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 font-black text-xs uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] transition-all flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={18}/>} Gravar Desempenho
                 </button>
              </form>
           </div>
        </div>
      )}
    </>
  );
};
