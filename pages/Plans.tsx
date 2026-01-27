
import React, { useState, useEffect, useRef } from 'react';
import { LicensePlan, User } from '../types';
import { api } from '../services/api';
import { 
  Check, Crown, Zap, Loader2, Star, 
  ArrowRight, Shield, CheckCircle, AlertTriangle, X,
  CreditCard, FileText, Smartphone, Copy, ShieldCheck,
  QrCode, CreditCard as CardIcon, PartyPopper, RefreshCw
} from 'lucide-react';

interface PlansProps {
  user: User;
  onPlanSelected?: () => void;
}

type BillingMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';

export const Plans: React.FC<PlansProps> = ({ user, onPlanSelected }) => {
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<BillingMethod>('PIX');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadPlans();
    return () => {
      if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPlans();
      if (!data || data.length === 0) {
        throw new Error("Nenhum plano disponível no catálogo no momento.");
      }
      setPlans(data.filter(p => p.type !== 'Trial')); 
    } catch (e: any) {
      console.error("Erro ao carregar catálogo de planos:", e);
      setError(e.message || "Erro inesperado ao buscar planos.");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (paymentId: string) => {
    if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const result = await api.verifyAsaasPayment(paymentId);
        if (result.success) {
          if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
          setIsPaid(true);
          
          setTimeout(() => {
            if (onPlanSelected) onPlanSelected();
            else window.location.reload();
          }, 3500);
        }
      } catch (e) {
        console.warn("Aguardando confirmação de pagamento...");
      }
    }, 5000); 
  };

  const handleSubscribe = async (plan: LicensePlan) => {
    if (user.isAdmin) {
      alert("Administradores possuem acesso total liberado.");
      return;
    }
    
    // Verificação baseada no ID do plano associado à licença ativa
    if (user.active_license_id === plan.id) {
       alert("Você já possui este plano ativo em sua conta.");
       return;
    }

    setProcessingId(plan.id);
    setError(null);
    setIsPaid(false);
    
    try {
      const result = await api.createAsaasSubscription(plan.id, user.id, selectedMethod);
      if (!result.success) throw new Error("Erro ao processar assinatura no gateway.");

      setPaymentData(result);

      if (selectedMethod === 'PIX' && result.pixData) {
        setShowPaymentModal(true);
        startPolling(result.paymentId);
      } else if (selectedMethod === 'BOLETO' && result.invoiceUrl) {
        setShowPaymentModal(true);
      } else {
        const redirectUrl = result.invoiceUrl;
        if (redirectUrl) {
          window.open(redirectUrl, '_blank');
          setShowPaymentModal(true); 
          startPolling(result.paymentId);
        } else {
          throw new Error("Não foi possível gerar o link de pagamento.");
        }
      }
      
    } catch (e: any) {
      console.error("Subscription error:", e);
      setError(e.message || "Erro inesperado ao conectar com o serviço de pagamentos.");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preparando Catálogo de Planos...</p>
      </div>
    );
  }

  if (error && plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border-2 border-red-100">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-800 uppercase italic">Catálogo Temporariamente Indisponível</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{error}</p>
        </div>
        <button onClick={loadPlans} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
          <RefreshCw size={14} /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
           <Crown size={12} /> Academia de Prosperidade Babylon
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Escolha sua Jornada Financeira</h2>
        
        <div className="max-w-md mx-auto mt-8 p-1.5 bg-slate-100 rounded-2xl flex gap-1 border border-slate-200">
           <button onClick={() => setSelectedMethod('PIX')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedMethod === 'PIX' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><QrCode size={14} /> PIX</button>
           <button onClick={() => setSelectedMethod('CREDIT_CARD')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedMethod === 'CREDIT_CARD' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><CardIcon size={14} /> Cartão</button>
           <button onClick={() => setSelectedMethod('BOLETO')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedMethod === 'BOLETO' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><FileText size={14} /> Boleto</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isRecommended = plan.type === 'Anual';
          const isPremium = plan.price > 200;
          // Identifica se este plano é o atual do usuário
          const isActive = user.active_license_id === plan.id;
          
          return (
            <div key={plan.id} className={`relative bg-white rounded-[3rem] p-10 border transition-all duration-500 flex flex-col group hover:shadow-2xl ${isRecommended ? 'border-indigo-600 shadow-xl shadow-indigo-900/10 scale-105 z-10' : 'border-slate-200 shadow-sm'} ${isActive ? 'ring-4 ring-emerald-500/20 bg-emerald-50/10' : ''}`}>
              {isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Melhor Custo Benefício</div>
              )}

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${isPremium ? 'bg-amber-100 text-amber-600' : isRecommended ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                   {isPremium ? <Crown size={28} /> : isRecommended ? <Star size={28} /> : <Zap size={28} />}
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase italic leading-none">{plan.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Ciclo {plan.type}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-400">R$</span>
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{Math.floor(plan.price)}</span>
                  <span className="text-xl font-black text-slate-400">,{(plan.price % 1).toFixed(2).split('.')[1]}</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.description?.split('\n').map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} strokeWidth={4} /></div>
                    <span className="text-sm text-slate-600 font-medium leading-tight">{feat || 'Acesso completo às ferramentas.'}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleSubscribe(plan)}
                disabled={!!processingId || isActive}
                className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl ${isActive ? 'bg-emerald-600 text-white cursor-default' : isRecommended ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                {processingId === plan.id ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : isActive ? (
                  <><CheckCircle size={18} /> Plano Atual</>
                ) : (
                  <>Pagar com {selectedMethod === 'PIX' ? 'PIX' : selectedMethod === 'BOLETO' ? 'Boleto' : 'Cartão'} <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {showPaymentModal && paymentData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden relative">
            {isPaid && (
              <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce"><PartyPopper size={48} /></div>
                <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Pagamento Confirmado!</h3>
                <p className="text-slate-500 font-bold leading-relaxed mb-6">Seu acesso está sendo liberado.</p>
                <Loader2 className="animate-spin text-emerald-600" size={24} />
              </div>
            )}
            <div className="px-8 py-6 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic">Pagamento Seguro</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/70 hover:text-white transition"><X size={28} /></button>
            </div>
            <div className="p-8 space-y-6">
              {paymentData.pixData ? (
                <>
                  <div className="text-center space-y-4">
                    <QrCode className="mx-auto text-emerald-600" size={48} />
                    <h4 className="text-lg font-black">Aguardando PIX</h4>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <img src={`data:image/png;base64,${paymentData.pixData.qrCode}`} alt="QR Code" className="w-full max-w-[200px] mx-auto rounded-xl" />
                  </div>
                  <button onClick={() => copyToClipboard(paymentData.pixData.copyPaste)} className="w-full py-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 font-bold"><Copy size={18} /> Copiar Código</button>
                </>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-4">
                  <Loader2 size={40} className="animate-spin text-indigo-600" />
                  <p className="text-sm text-slate-500">Aguardando confirmação do Asaas...</p>
                  <a href={paymentData.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-black uppercase underline text-xs">Abrir fatura em nova aba</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
