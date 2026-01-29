import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Scale, Upload, X, Loader2, CheckCircle2, AlertTriangle, 
  BarChart, List, ChevronRight, FileText, Sparkles, Zap, 
  Target, Info, ArrowRight, ShieldCheck, History, Trash2, Search, RefreshCw, Calendar,
  Plus, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

interface ReconciliationDetail {
  discipline: string;
  similarity: number;
  commonTopics: string[];
  uniqueA: string[];
  uniqueB: string[];
}

interface ReconciliationResult {
  editalAName: string;
  editalBName: string;
  overallPercentage: number;
  details: ReconciliationDetail[];
}

export const StudyReconciliation: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<ReconciliationResult | null>(null);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [view, setView] = useState<'form' | 'result' | 'history'>('form');

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getStudyReconciliations();
      setReconciliations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleReconcile = async () => {
    if (!fileA || !fileB) return;

    setIsLoading(true);
    try {
      const [base64A, base64B] = await Promise.all([
        fileToBase64(fileA),
        fileToBase64(fileB)
      ]);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Ação: Cruzamento Analítico de Conteúdo Programático.
        Objetivo: Identificar a similaridade real entre o Edital A e o Edital B.

        INSTRUÇÕES CRÍTICAS:
        1. Localize apenas as seções de conteúdo programático.
        2. Mapeie as disciplinas mais relevantes.
        3. Identifique tópicos comuns e exclusivos.
        4. O retorno DEVE ser EXCLUSIVAMENTE um objeto JSON válido. 
        5. NÃO inclua explicações, avisos, markdown ou blocos de pensamento (thoughts).

        FORMATO DO JSON:
        {
          "editalAName": "Nome do Concurso A",
          "editalBName": "Nome do Concurso B",
          "overallPercentage": 0-100,
          "details": [
            {
              "discipline": "Nome da Matéria",
              "similarity": 0-100,
              "commonTopics": ["Tópico 1", "Tópico 2"],
              "uniqueA": ["Item Exclusivo A"],
              "uniqueB": ["Item Exclusivo B"]
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64A } },
            { inlineData: { mimeType: "application/pdf", data: base64B } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          // Desabilitar o orçamento de pensamento para evitar o aviso de thoughtSignature
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              editalAName: { type: Type.STRING },
              editalBName: { type: Type.STRING },
              overallPercentage: { type: Type.NUMBER },
              details: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    discipline: { type: Type.STRING },
                    similarity: { type: Type.NUMBER },
                    commonTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    uniqueA: { type: Type.ARRAY, items: { type: Type.STRING } },
                    uniqueB: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["discipline", "similarity"]
                }
              }
            },
            required: ["editalAName", "editalBName", "overallPercentage", "details"]
          }
        }
      });

      // Tratamento robusto para extrair apenas o JSON, removendo qualquer sufixo de pensamento ou markdown
      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      
      let result: ReconciliationResult;
      try {
        result = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Erro ao parsear JSON da IA:", cleanJson);
        throw new Error("A resposta da IA não é um JSON válido. Tente novamente.");
      }

      // Validação defensiva dos campos obrigatórios para evitar erro de .length
      if (!result || typeof result !== 'object') throw new Error("Estrutura de dados inválida.");
      if (!result.details) result.details = [];
      
      setAnalysisResult(result);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mainRec } = await supabase.from('study_reconciliations').insert({
            user_id: user.id,
            edital_a_nome: result.editalAName || "Edital A",
            edital_b_nome: result.editalBName || "Edital B",
            porcentagem_geral: result.overallPercentage || 0
        }).select().single();

        if (mainRec && result.details && result.details.length > 0) {
            const detailsPayload = result.details.map((d: any) => ({
                reconciliation_id: mainRec.id,
                disciplina_nome: d.discipline || "Disciplina",
                similaridade: d.similarity || 0,
                topicos_comuns: d.commonTopics || [],
                topicos_exclusivos_a: d.uniqueA || [],
                topicos_exclusivos_b: d.uniqueB || []
            }));
            await supabase.from('study_reconciliation_details').insert(detailsPayload);
        }
        loadHistory();
      }

      setView('result');
    } catch (error: any) {
      console.error("Erro na análise estratégica:", error);
      alert(`Erro no processamento: ${error.message || "A IA demorou muito para responder ou enviou dados incorretos."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowHistoryDetail = async (rec: any) => {
    setIsLoading(true);
    try {
      const details = await api.getStudyReconciliationDetails(rec.id);
      const mappedResult: ReconciliationResult = {
        editalAName: rec.edital_a_nome,
        editalBName: rec.edital_b_nome,
        overallPercentage: rec.porcentagem_geral,
        details: (details || []).map(d => ({
          discipline: d.disciplina_nome,
          similarity: d.similaridade,
          commonTopics: d.topicos_comuns || [],
          uniqueA: d.topicos_exclusivos_a || [],
          uniqueB: d.topicos_exclusivos_b || []
        }))
      };
      setAnalysisResult(mappedResult);
      setView('result');
    } catch (e) {
      alert("Erro ao carregar detalhes do histórico.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm("Remover este cruzamento do seu histórico?")) return;
    try {
      await api.deleteStudyReconciliation(id);
      loadHistory();
    } catch (e) {
      alert("Erro ao excluir.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="text-white" size={24} />
            </div>
            Dá para conciliar?
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-[52px]">Comparativo estratégico de conteúdos programáticos</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setView('form')}
             className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${view === 'form' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50'}`}
           >
             <Plus size={16} className="inline mr-2" /> Nova Análise
           </button>
           <button 
             onClick={() => setView('history')}
             className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50'}`}
           >
             <History size={16} className="inline mr-2" /> Histórico
           </button>
        </div>
      </div>

      {view === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
           {/* Upload Edital A */}
           <div className={`p-10 bg-white border-2 border-dashed rounded-[2.5rem] transition-all flex flex-col items-center justify-center text-center space-y-6 ${fileA ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-300 hover:border-indigo-400'}`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-transform hover:scale-110 ${fileA ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                 <FileText size={40} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">Edital Referência (A)</h3>
                 <p className="text-sm text-slate-400 font-medium">Concurso que você já estuda ou pretende estudar</p>
              </div>
              <input type="file" ref={fileInputARef} onChange={(e) => setFileA(e.target.files?.[0] || null)} accept="application/pdf" className="hidden" />
              <button 
                onClick={() => fileInputARef.current?.click()}
                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 ${fileA ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'}`}
              >
                {fileA ? fileA.name : 'Selecionar Edital A'}
              </button>
           </div>

           {/* Upload Edital B */}
           <div className={`p-10 bg-white border-2 border-dashed rounded-[2.5rem] transition-all flex flex-col items-center justify-center text-center space-y-6 ${fileB ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-300 hover:border-indigo-400'}`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-transform hover:scale-110 ${fileB ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                 <FileText size={40} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">Edital Comparativo (B)</h3>
                 <p className="text-sm text-slate-400 font-medium">O novo concurso que você quer conciliar</p>
              </div>
              <input type="file" ref={fileInputBRef} onChange={(e) => setFileB(e.target.files?.[0] || null)} accept="application/pdf" className="hidden" />
              <button 
                onClick={() => fileInputBRef.current?.click()}
                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 ${fileB ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'}`}
              >
                {fileB ? fileB.name : 'Selecionar Edital B'}
              </button>
           </div>

           <div className="lg:col-span-2 pt-6">
              <button 
                onClick={handleReconcile}
                disabled={!fileA || !fileB || isLoading}
                className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-base uppercase tracking-widest shadow-2xl hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 border-b-4 border-indigo-900"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={28} />
                    <span>Realizando Cruzamento...</span>
                  </>
                ) : (
                  <>
                    <Zap size={28} fill="currentColor" />
                    <span>Iniciar Análise IA</span>
                  </>
                )}
              </button>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 opacity-60">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" /> Alta Performance Flash
                 </p>
                 <div className="w-1 h-1 bg-slate-300 rounded-full hidden md:block"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Info size={14} className="text-indigo-500" /> Comparação baseada em Conteúdo Programático
                 </p>
              </div>
           </div>
        </div>
      )}

      {view === 'result' && analysisResult && (
        <div className="space-y-8 animate-fade-in">
           {/* Resumo Geral */}
           <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl border-2 border-slate-800 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 -mr-10 -mt-10 pointer-events-none"><Scale size={240} /></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                 <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase border border-indigo-500/20 tracking-widest">Diagnóstico de Similitude</div>
                    <h3 className="text-3xl font-black italic uppercase leading-tight tracking-tight">
                       {analysisResult.editalAName} <br/> <span className="text-indigo-500 mx-1">x</span> <br/> {analysisResult.editalBName}
                    </h3>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                       <CheckCircle2 size={16} className="text-emerald-500" />
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sincronização de Editais Concluída</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-center bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl min-w-[280px]">
                    <span className="text-[9px] font-black uppercase text-indigo-400 mb-3 tracking-[0.3em]">Match de Conteúdo</span>
                    <div className="text-7xl font-black text-emerald-400 italic tracking-tighter tabular-nums leading-none mb-4">{analysisResult.overallPercentage}%</div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
                       <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all duration-1000 ease-out" style={{ width: `${analysisResult.overallPercentage}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Grid de Disciplinas */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Comparativo por Disciplina
                 </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {(analysisResult.details || []).map((detail, idx) => (
                   <div key={idx} className="bg-white border-2 border-slate-200 p-8 rounded-[3rem] shadow-sm hover:border-indigo-500 hover:shadow-xl transition-all group animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className="flex justify-between items-start mb-8">
                         <div className="space-y-1">
                            <h5 className="text-xl font-black text-slate-800 uppercase italic truncate max-w-[220px]">{detail.discipline}</h5>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nível de Coincidência</span>
                         </div>
                         <div className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 group-hover:bg-indigo-600 transition-colors">
                            <span className="text-base font-black italic">{detail.similarity}%</span>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="space-y-4">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-200"><Check size={14} strokeWidth={3} /></div>
                               <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Tópicos em Comum</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {(detail.commonTopics || []).length > 0 ? (detail.commonTopics || []).map((t, i) => (
                                 <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-[10px] font-bold group-hover:bg-emerald-100 transition-colors">{t}</span>
                               )) : <span className="text-[10px] text-slate-300 italic font-medium">Nenhum tópico idêntico identificado.</span>}
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-slate-50">
                            <div className="space-y-3">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Exclusivo A</span>
                               <div className="flex flex-col gap-2">
                                  {(detail.uniqueA || []).slice(0, 3).map((t, i) => (
                                    <span key={i} className="text-[10px] text-slate-600 font-bold leading-tight line-clamp-2">• {t}</span>
                                  ))}
                                  {(detail.uniqueA || []).length === 0 && <span className="text-[9px] text-slate-300 italic">Sem diferenças</span>}
                               </div>
                            </div>
                            <div className="space-y-3">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div> Exclusivo B</span>
                               <div className="flex flex-col gap-2">
                                  {(detail.uniqueB || []).slice(0, 3).map((t, i) => (
                                    <span key={i} className="text-[10px] text-slate-600 font-bold leading-tight line-clamp-2">• {t}</span>
                                  ))}
                                  {(detail.uniqueB || []).length === 0 && <span className="text-[9px] text-slate-300 italic">Sem diferenças</span>}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex justify-center pt-10">
              <button onClick={() => setView('form')} className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl shadow-slate-300 border-b-4 border-slate-700">
                 <ArrowRight size={20} /> Nova Comparação
              </button>
           </div>
        </div>
      )}

      {view === 'history' && (
        <div className="bg-white rounded-[3rem] border-2 border-slate-200 overflow-hidden shadow-sm animate-fade-in">
           <div className="p-8 border-b-2 border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><History size={20} /></div>
                 <h3 className="text-sm font-black text-slate-800 uppercase italic">Registro de Análises</h3>
              </div>
              <button onClick={loadHistory} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCw size={20} className={historyLoading ? 'animate-spin' : ''}/></button>
           </div>
           
           {historyLoading ? (
             <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Acessando Banco de Memória...</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                   <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b-2 border-slate-100 bg-white">
                         <th className="px-10 py-6 text-center">Data</th>
                         <th className="px-10 py-6">Editais Comparados</th>
                         <th className="px-10 py-6 text-center">Similitude</th>
                         <th className="px-10 py-6 text-center">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {reconciliations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                             <Target size={48} className="mx-auto text-slate-100 mb-4" />
                             <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Nenhuma análise salva.</p>
                          </td>
                        </tr>
                      ) : reconciliations.map((rec) => (
                        <tr key={rec.id} className="hover:bg-indigo-50/40 transition-all group">
                           <td className="px-10 py-6 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="text-xs font-black text-slate-700 italic">{new Date(rec.created_at).toLocaleDateString('pt-BR')}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(rec.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm"><FileText size={18} /></div>
                                 <p className="text-sm font-black text-slate-700 uppercase italic">
                                    {rec.edital_a_nome} <span className="text-indigo-400 mx-2">vs</span> {rec.edital_b_nome}
                                 </p>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-center">
                              <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 rounded-2xl font-black text-xs italic">
                                 {rec.porcentagem_geral}%
                                 <div className="w-8 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-600" style={{ width: `${rec.porcentagem_geral}%` }}></div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                 <button onClick={() => handleShowHistoryDetail(rec)} className="p-3 bg-white border-2 border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded-2xl shadow-sm transition-all active:scale-95" title="Ver Detalhes"><ChevronRight size={20}/></button>
                                 <button onClick={() => handleDeleteHistory(rec.id)} className="p-3 bg-white border-2 border-slate-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-2xl shadow-sm transition-all active:scale-95" title="Excluir"><Trash2 size={20}/></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
           
           <div className="px-10 py-6 bg-slate-50 border-t-2 border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Armazenamento Criptografado</p>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                 <ShieldCheck size={16} /> Babylon Cloud Sync
              </div>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};