
import React, { useState, useEffect } from 'react';
import { License, User, LicenseStatus, LicensePeriodType, LicensePlan } from '../types';
import { 
  Award, Plus, Search, Trash2, Pencil, X, Save, 
  User as UserIcon, CheckCircle2, Loader2, Calendar,
  Infinity as InfinityIcon, Clock, DollarSign, Tag, List, CreditCard, AlertCircle, Database, RefreshCw, Info, ShieldCheck, ShieldAlert, AlertTriangle, Zap,
  Timer
} from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

export const Licenses: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('subscriptions');
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [planData, setPlanData] = useState<Omit<LicensePlan, 'id'>>({ 
    name: '', 
    type: 'Mensal', 
    price: 0, 
    description: '',
    stripePriceId: ''
  });

  const [subData, setSubData] = useState({ 
    userId: '', 
    planId: '', 
    status: 'Ativa' as LicenseStatus 
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [plansData, licensesData, usersData] = await Promise.all([
        api.getPlans(),
        api.getAllUsersLicenses(),
        api.getAllUsers()
      ]);
      
      setPlans(plansData || []);
      setLicenses(licensesData || []);
      setAllUsers(usersData || []);
    } catch (e: any) { 
      console.error(e);
      setErrorMessage(e.message || "Erro ao carregar dados do servidor.");
    } finally { 
      setLoading(false); 
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, planData);
      } else {
        await api.createPlan(planData);
      }
      setShowPlanForm(false);
      setEditingPlan(null);
      setPlanData({ name: '', type: 'Mensal', price: 0, description: '', stripePriceId: '' });
      await loadData();
    } catch (e: any) {
      alert("Erro ao salvar plano: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Excluir este plano? Isso não afetará licenças já emitidas, mas impedirá novas assinaturas.")) return;
    try {
      await api.deletePlan(id);
      await loadData();
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subData.userId || !subData.planId) return;
    setSubmitting(true);
    try {
      const selectedPlan = plans.find(p => p.id === subData.planId);
      const selectedUser = allUsers.find(u => u.id === subData.userId);
      
      if (!selectedPlan || !selectedUser) throw new Error("Dados inválidos");

      const expDate = new Date();
      if (selectedPlan.type === 'Mensal') expDate.setMonth(expDate.getMonth() + 1);
      else if (selectedPlan.type === 'Anual') expDate.setFullYear(expDate.getFullYear() + 1);
      else if (selectedPlan.type === 'Trial') expDate.setDate(expDate.getDate() + 15);

      // Inativar anteriores
      await supabase.from('licenses')
        .update({ status: 'Expirada' })
        .eq('user_id', subData.userId)
        .eq('status', 'Ativa');

      const { data: newLicResult, error: licError } = await supabase.from('licenses').insert([{
        user_id: subData.userId,
        plan_id: subData.planId,
        name: selectedPlan.name,
        type: selectedPlan.type,
        value: selectedPlan.price,
        status: subData.status,
        expiration_date: selectedPlan.type === 'Vitalícia' ? null : expDate.toISOString().split('T')[0],
        frequency: `Atribuição Manual - ${selectedPlan.type}`
      }]).select().single();

      if (licError || !newLicResult) throw new Error("Erro ao registrar licença: " + licError?.message);

      await supabase.from('profiles').update({ 
        active_license_id: newLicResult.id 
      }).eq('id', subData.userId);

      await supabase.from('invoices').insert([{
        user_id: subData.userId,
        license_id: newLicResult.id,
        amount: selectedPlan.price,
        status: 'Pago',
        description: `Liberação Manual: ${selectedPlan.name}`,
        confirmed_at: new Date().toISOString()
      }]);

      setShowSubForm(false);
      setSubData({ userId: '', planId: '', status: 'Ativa' });
      alert(`Licença ${selectedPlan.name} emitida com sucesso!`);
      await loadData(); // Recarrega a tabela imediatamente
    } catch (e: any) {
      console.error(e);
      alert("Erro ao emitir licença: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredLicenses = licenses.filter(l => {
    const search = searchTerm.toLowerCase();
    return (l.userName || '').toLowerCase().includes(search) || 
           (l.userEmail || '').toLowerCase().includes(search) || 
           (l.name || '').toLowerCase().includes(search);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-[10px] font-black uppercase text-slate-400">Sincronizando Base de Dados...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <Award size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight italic">Licenciamento & Planos</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle Administrativo de Atribuição</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab('plans')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'plans' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Gestão de Preços</button>
          <button onClick={() => setActiveTab('subscriptions')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'subscriptions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Assinantes Ativos</button>
        </div>
      </div>

      {activeTab === 'plans' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase italic">Catálogo de Planos Babylon</h3>
            <button onClick={() => { setEditingPlan(null); setPlanData({ name: '', type: 'Mensal', price: 0, description: '', stripePriceId: '' }); setShowPlanForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase shadow-lg shadow-indigo-200 transition-all">
              <Plus size={18} /> Criar Novo Plano
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${plan.type === 'Vitalícia' ? 'bg-amber-100 text-amber-600' : plan.type === 'Trial' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {plan.type === 'Vitalícia' ? <InfinityIcon size={24} /> : plan.type === 'Trial' ? <Timer size={24} /> : <Zap size={24} />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingPlan(plan); setPlanData({ ...plan }); setShowPlanForm(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Pencil size={18}/></button>
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                  </div>
                </div>
                <h4 className="text-xl font-black text-slate-800 uppercase italic">{plan.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Modalidade: {plan.type}</p>
                <div className="mt-6">
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{plan.price === 0 ? 'GRATUITO' : formatCurrency(plan.price)}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-line">{plan.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
           <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
                <input placeholder="Filtrar por nome ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner font-medium" />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                 <button onClick={loadData} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Recarregar Lista">
                   <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                 </button>
                 <button onClick={() => setShowSubForm(true)} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95">
                   <CheckCircle2 size={18} /> Emitir Licença Direta
                 </button>
              </div>
           </div>
           
           <div className="overflow-x-auto flex-1">
             <table className="w-full text-left whitespace-nowrap">
               <thead>
                 <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                   <th className="px-8 py-5">Assinante</th>
                   <th className="px-8 py-5">Plano Vigente</th>
                   <th className="px-8 py-5">Data de Expiração</th>
                   <th className="px-8 py-5 text-center">Situação do Acesso</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredLicenses.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="p-20 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                          <Award size={48} className="text-slate-100" />
                          <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Nenhuma licença ativa encontrada no sistema.</p>
                       </div>
                     </td>
                   </tr>
                 ) : (
                   filteredLicenses.map(l => {
                     const isVitalicio = l.type === 'Vitalícia' || !l.expirationDate;
                     const isTrial = l.type === 'Trial';
                     return (
                       <tr key={l.id} className="hover:bg-slate-50/50 group transition-colors animate-fade-in">
                         <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                             <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black uppercase shadow-lg shadow-indigo-100 border-2 border-white">
                               {(l.userName || '?').charAt(0)}
                             </div>
                             <div>
                               <p className="text-sm font-black text-slate-800 uppercase italic">{l.userName}</p>
                               <p className="text-[10px] text-slate-400 font-bold">{l.userEmail}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-5">
                           <div className="flex flex-col">
                             <span className="text-sm font-black text-indigo-600 uppercase italic">{l.name}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{l.frequency}</span>
                           </div>
                         </td>
                         <td className="px-8 py-5 text-sm font-black text-slate-500 tabular-nums">
                            {!isVitalicio && l.expirationDate ? (
                               <div className="flex items-center gap-2">
                                 {isTrial && <Timer size={14} className="text-emerald-500" />}
                                 {new Date(l.expirationDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                               </div>
                            ) : (
                               <span className="inline-flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                 <InfinityIcon size={14} /> Vitalício
                               </span>
                            )}
                         </td>
                         <td className="px-8 py-5 text-center">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 shadow-sm transition-all ${l.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                             {l.status === 'Ativa' ? '• Acesso Liberado' : 'Acesso Bloqueado'}
                           </span>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
           
           <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total: {filteredLicenses.length} Assinantes encontrados</p>
             <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
               <ShieldCheck size={14} /> Monitoramento Babylon Ativo
             </div>
           </div>
        </div>
      )}

      {/* MODAL PLANO */}
      {showPlanForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-800 uppercase italic">{editingPlan ? 'Ajustar Plano' : 'Novo Plano Babylon'}</h3>
                <button onClick={() => setShowPlanForm(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all"><X size={24} /></button>
             </div>
             <form onSubmit={handleSavePlan} className="p-8 space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome Comercial do Plano</label>
                   <input required value={planData.name} onChange={e => setPlanData({...planData, name: e.target.value})} placeholder="Ex: Assinatura Premium..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Valor Unitário (R$)</label>
                      <input type="number" step="0.01" required value={planData.price} onChange={e => setPlanData({...planData, price: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-indigo-600 outline-none shadow-inner" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Frequência de Ciclo</label>
                      <select value={planData.type} onChange={e => setPlanData({...planData, type: e.target.value as LicensePeriodType})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 outline-none shadow-inner">
                         <option value="Mensal">Mensal</option>
                         <option value="Anual">Anual</option>
                         <option value="Vitalícia">Vitalícia</option>
                         <option value="Trial">Trial (15 dias de teste)</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ID do Preço (Stripe/Asaas)</label>
                   <input value={planData.stripePriceId} onChange={e => setPlanData({...planData, stripePriceId: e.target.value})} placeholder="prod_... ou price_..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-xs text-slate-600 outline-none shadow-inner" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vantagens Inclusas</label>
                   <textarea rows={4} value={planData.description} onChange={e => setPlanData({...planData, description: e.target.value})} placeholder="Liste as vantagens separadas por quebra de linha..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium resize-none outline-none focus:border-indigo-500 shadow-inner" />
                </div>
                <button type="submit" disabled={submitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none">
                   {submitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Confirmar Cadastro do Plano
                </button>
             </form>
          </div>
        </div>
      )}

      {/* MODAL EMISSÃO DIRETA */}
      {showSubForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Emitir Licença Manual</h3>
                <button onClick={() => setShowSubForm(false)} className="text-white/60 hover:text-white transition-all"><X size={28} /></button>
             </div>
             <form onSubmit={handleSaveSub} className="p-8 space-y-7">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Selecionar Usuário</label>
                   <select required value={subData.userId} onChange={e => setSubData({...subData, userId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-inner">
                      <option value="">Selecione o assinante...</option>
                      {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Plano Destino</label>
                   <select required value={subData.planId} onChange={e => setSubData({...subData, planId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-inner">
                      <option value="">Selecione um plano do catálogo...</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Situação do Acesso</label>
                   <select value={subData.status} onChange={e => setSubData({...subData, status: e.target.value as LicenseStatus})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-inner">
                      <option value="Ativa">Liberar Imediatamente (Ativa)</option>
                      <option value="Pendente">Aguardar Confirmação (Pendente)</option>
                   </select>
                </div>
                <div className="p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl flex gap-4 text-indigo-700 shadow-sm">
                   <Info size={24} className="shrink-0 mt-0.5" />
                   <p className="text-[10px] font-black leading-relaxed uppercase italic">Atenção: A liberação manual anula cobranças automáticas do gateway para este período e ativa o rastro de auditoria.</p>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none">
                   {submitting ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>} Liberar Acesso Agora
                </button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};
