
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Sparkles, Loader2, Info, RefreshCw, FileText, Upload, Calendar, Target, ShieldCheck, Cpu } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  parts: string;
  isAnalysis?: boolean;
}

export const EditalAnalysis: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<Chat | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MENTOR_PROMPT = `Você é um Professor Mentor e Coordenador Pedagógico especialista em Concursos Públicos de alto nível. 
Sua missão é realizar uma análise estratégica de editais para orientar o aluno rumo à aprovação.

Ao receber um edital (PDF), você deve estruturar sua resposta com os seguintes pilares:
1. BANCA EXAMINADORA: Perfil da banca e "armadilhas" comuns.
2. CRONOGRAMA CRÍTICO: Data da prova, inscrições e prazos vitais.
3. ESTATÍSTICA PREDITIVA: Quais tópicos a banca X costuma cobrar mais para esse cargo/área.
4. REQUISITOS E VAGAS: Resumo direto.
5. PLANO DE ATAQUE: Sugestão de foco baseado no peso das matérias.

Sempre use Markdown para formatar (negrito, listas, títulos). Seja encorajador, mas extremamente técnico e direto.`;

  useEffect(() => {
    initChat();
  }, []);

  const initChat = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatInstance.current = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction: MENTOR_PROMPT },
    });

    setMessages([
      { 
        role: 'model', 
        parts: 'Olá! Sou seu Mentor IA de Concursos. Carregue o PDF do seu edital aqui e eu farei uma análise estratégica completa: datas, banca, tópicos mais quentes e plano de ataque. Vamos começar?' 
      }
    ]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert("Por favor, selecione um arquivo PDF.");
        return;
      }
      setPdfFile(file);
      analyzeEdital(file);
    }
  };

  const analyzeEdital = async (file: File) => {
    setIsLoading(true);
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'user', parts: `Analisando arquivo: ${file.name}` }]);

    try {
      const base64Data = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64Data } },
            { text: "Realize a análise completa deste edital seguindo suas diretrizes de Mentor de Concursos. Foque em datas, banca e tópicos mais cobrados." }
          ]
        }
      });

      const text = response.text;
      setMessages(prev => [...prev, { role: 'model', parts: text || "Não foi possível processar o edital.", isAnalysis: true }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', parts: "Erro ao analisar o PDF. Verifique se o arquivo não está protegido ou corrompido." }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setPdfFile(null);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: userMessage }]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (!chatInstance.current) throw new Error("Chat not initialized");
      const response = await chatInstance.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', parts: response.text || "" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', parts: "Tive um problema na conexão. Pode repetir?" }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) return <h3 key={i} className="text-lg font-black text-indigo-700 mt-4 mb-2 uppercase italic">{line.replace(/###/g, '')}</h3>;
      if (line.startsWith('**')) return <p key={i} className="font-bold text-slate-800 mt-2">{line.replace(/\*\*/g, '')}</p>;
      if (line.startsWith('-') || line.startsWith('•')) return <li key={i} className="ml-4 list-disc mb-1 text-slate-600 font-medium">{line.substring(1).trim()}</li>;
      return <p key={i} className="mb-2 leading-relaxed text-slate-600 font-medium">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto animate-fade-in space-y-4">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Mentor de Edital IA</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Professor Online</span>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
            <div className={`max-w-[90%] md:max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Cpu size={16} />}
              </div>
              <div className={`p-5 rounded-2xl shadow-sm border ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none' 
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700 rounded-tl-none'
              }`}>
                {renderText(msg.parts)}
                {msg.isAnalysis && (
                  <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-4">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-600">Verificação de Edital</p>
                      <p className="text-xs font-bold text-slate-500 italic">Análise baseada em parâmetros oficiais da banca examinadora.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center animate-pulse">
                <Sparkles size={16} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-xs font-black text-slate-400 uppercase italic tracking-widest">Processando Edital...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            <Upload size={18} /> Carregar Edital PDF
          </button>
          <form onSubmit={handleSend} className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo sobre o edital analisado..."
              className="w-full pl-5 pr-14 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold text-slate-700 dark:text-white"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="application/pdf" 
          className="hidden" 
        />
        <p className="text-[9px] text-slate-400 text-center mt-3 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Info size={12} className="text-indigo-500" /> IA Mentor pedagógica com visão estratégica de bancas examinadoras.
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}</style>
    </div>
  );
};
