
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, User, License, LicensePlan } from '../types';
import { 
  CreditCard, ExternalLink, Calendar, CheckCircle2, 
  Clock, AlertCircle, FileText, Loader2, Award, 
  Zap, Infinity as InfinityIcon, ShieldCheck, RefreshCw, Info, ShoppingBag, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

interface UserInvoicesProps {
  user: User;
}

export const UserInvoices: React.FC<UserInvoicesProps> = ({ user }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [licensesData, invoicesData] = await Promise.all([
        api.getMyLicenses(),
        api.getMyInvoices()
      ]);
      setLicenses(licensesData);
      setInvoices(invoicesData);
    } catch (e) {
      console.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAsaas = (url?: string) => {
    if (url) window.open(url, '_blank');
    else alert("Link de fatura não disponível.");
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const activeLicense = useMemo(() => {
    return licenses.find(l => l.status === 'Ativa');
  }, [licenses]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex flex-col xl:flex-row gap-5">
        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <CreditCard size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Assinaturas e Faturas</h2>
            <p className="text-sm text-slate-500 font-medium">Controle de pagamentos via Asaas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="px-6 py-4 bg-white rounded-3xl border border-slate-200 shadow-sm min-w-[240px]">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Plano Atual</p>
            <div className="flex items-center gap-3">
              <Award size={20} className="text-indigo-600" />
              <span className="text-lg font-black text-slate-800">{activeLicense?.name || 'Experimental'}</span>
            </div>
          </div>

          <div className={`px-6 py-4 rounded-3xl border shadow-xl min-w-[240px] flex flex-col justify-center ${activeLicense ? 'bg-slate-900 text-white border-slate-800' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <p className="text-[10px] font-black opacity-60 uppercase mb-2 tracking-widest">Vencimento</p>
            <div className="flex items-center gap-3">
              <Calendar size={20} className={activeLicense ? 'text-emerald-400' : 'text-red-400'} />
              {/* Fix: use camelCase expirationDate */}
              <span className="text-lg font-black">{activeLicense ? formatDate(activeLicense.expirationDate) : 'Sem Acesso'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <FileText size={16} /> Histórico de Pagamentos
          </h3>
          <button onClick={loadData} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCw size={16} /></button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-5">Identificador</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-center">Fatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">Nenhuma fatura encontrada.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="px-8 py-5 font-bold text-xs text-slate-400 uppercase tracking-tighter">#{inv.id.slice(0, 8)}</td>
                    {/* Fix: changed created_at to createdAt to match interface and API output */}
                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{new Date(inv.createdAt || '').toLocaleDateString('pt-BR')}</td>
                    <td className="px-8 py-5 text-base font-black text-slate-800">{formatCurrency(inv.amount)}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${inv.status === 'Pago' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {/* Fix: removed cast and used camelCase invoiceUrl */}
                      {inv.invoiceUrl && (
                        <button onClick={() => handleOpenAsaas(inv.invoiceUrl)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Ver no Asaas">
                          <ExternalLink size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
