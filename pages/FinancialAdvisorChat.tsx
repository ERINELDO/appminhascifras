
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Sparkles, Loader2, Info, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Transaction, Investment, AgendaEvent } from '../types';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

interface FinancialAdvisorChatProps {
  transactions: Transaction[];
  investments: Investment[];
  agendaEvents: AgendaEvent[];
}

export const FinancialAdvisorChat: React.FC<FinancialAdvisorChatProps> = ({ transactions, investments, agendaEvents }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<Chat | null>(null);

  // Formata um resumo dos dados financeiros e de agenda para a IA
  const getExtendedContext = () => {
    const totalIncome = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
    const totalInvested = investments.reduce((acc, inv) => acc + inv.value, 0);
    
    const investmentList = investments
      .filter(inv => inv.value > 0)
      .map(inv => `${inv.name} (${inv.type}): R$ ${inv.value.toFixed(2)}`)
      .join(', ');

    const upcomingEvents = agendaEvents
      .filter(e => !e.isCompleted)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10)
      .map(e => `- ${e.date} às ${e.startTime}: ${e.title} (${e.description || 'Sem descrição'})`)
      .join('\n');
    
    return `
      SNAPSHOT FINANCEIRO E DE AGENDA:
      
      FINANCEIRO:
      - Receitas: R$ ${totalIncome.toFixed(2)}
      - Despesas: R$ ${totalExpenses.toFixed(2)}
      - Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}
      - Patrimônio Investido: R$ ${totalInvested.toFixed(2)}
      - Ativos: ${investmentList || 'Nenhum ativo cadastrado.'}
      
      AGENDA E COMPROMISSOS:
      ${upcomingEvents || 'Nenhum compromisso pendente na agenda.'}
      
      INSTRUÇÃO ADICIONAL: Se o usuário perguntar sobre sua agenda ou compromissos, consulte a lista acima. Tente relacionar compromissos com a saúde financeira (ex: lembrar de pagamentos ou sugerir tempos de estudo de mercado em janelas livres).
    `;
  };

  const SYSTEM_INSTRUCTION = `Atue como meu assessor financeiro pessoal ultra atualizado. Analise o cenário global e local (Brasil e mercados internacionais), identificando as melhores tendências de investimentos atuais com base em dados e fundamentos econômicos. Forneça insights claros e práticos sobre:
• Ações com potencial de crescimento no médio/longo prazo
• Setores em alta (ex: tecnologia, energia limpa, IA, biotech, semântica ambiental)
• Renda fixa com retorno competitivo frente à inflação
• Criptoativos com fundamentos sólidos e risco calculado
• Fundos imobiliários e tendências de real estate pós-pandemia
• Estratégias de diversificação e gestão de risco

Responda de forma didática, com análises baseadas em dados, expectativas de retorno, riscos associados e ações recomendadas passo a passo. Use uma linguagem clara, com um toque de visão estratégica e sugestões práticas para um investidor consciente do seu patrimônio e objetivos financeiros.

${getExtendedContext()}`;

  useEffect(() => {
    const initChat = async () => {
      // Fix: initialization uses process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatInstance.current = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      setMessages([
        { 
          role: 'model', 
          parts: 'Olá! Sou seu Assessor Financeiro IA. Já analisei seus lançamentos, sua carteira e sua agenda de compromissos. Como posso otimizar seu tempo e seu dinheiro hoje?' 
        }
      ]);
    };

    initChat();
  }, [transactions, investments, agendaEvents]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
      const responseStream = await chatInstance.current.sendMessageStream({ message: userMessage });
      
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', parts: '' }]);

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].parts = fullResponse;
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', parts: "Desculpe, tive um problema ao processar sua análise. Por favor, tente novamente em instantes." }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('•') || line.startsWith('-')) {
        return <li key={i} className="ml-4 list-disc mb-1">{line.substring(1).trim()}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="ml-4 list-decimal mb-1">{line.substring(line.indexOf('.') + 1).trim()}</li>;
      }
      if (line.startsWith('###') || line.startsWith('**')) {
        const clean = line.replace(/[#*]/g, '');
        return <p key={i} className="font-bold text-slate-800 mt-3 mb-1">{clean}</p>;
      }
      return <p key={i} className="mb-2 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] max-w-5xl mx-auto animate-fade-in">
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Assessor IA Babylon</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <CalendarIcon size={10} /> Agenda & Finanças Sincronizadas
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 border-x border-slate-200 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
            <div className={`max-w-[85%] md:max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-600 text-white'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}`}>
                {renderText(msg.parts)}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-xs text-slate-400 font-medium italic">Consultando sua agenda e mercado...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-b-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Como está minha agenda para os dias de vencimento das contas?"
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-3 font-medium uppercase flex items-center justify-center gap-2">
          <Info size={12} /> Assessor IA com acesso total ao seu fluxo e cronograma Babylon.
        </p>
      </div>
    </div>
  );
};