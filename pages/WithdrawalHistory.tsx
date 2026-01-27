
import React from 'react';
import { Withdrawal } from '../types';
import { History, ArrowUpRight, Monitor, Smartphone, Globe, Clock, Search, ShieldCheck, FileText } from 'lucide-react';

interface WithdrawalHistoryProps {
  withdrawals: Withdrawal[];
}

export const WithdrawalHistory: React.FC<WithdrawalHistoryProps> = ({ withdrawals }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filtered = withdrawals.filter(w => 
    w.investmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.observation.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Saques</h2>
          <p className="text-slate-500 text-sm">Rastreabilidade completa de movimentações de saída</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por ativo ou observação..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-full transition-all bg-slate-50"
          />
        </div>
      </div>

      {/* Modern Grid List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-[0.1em]">
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Ativo</th>
                <th className="px-6 py-4 text-center">Quantidade</th>
                <th className="px-6 py-4 text-right">Valor Retirado</th>
                <th className="px-6 py-4">Dispositivo / IP</th>
                <th className="px-6 py-4">Observação</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <History size={48} className="mb-4 opacity-10" />
                      <p className="text-sm font-medium">Nenhum registro de movimentação encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{formatDate(w.date)}</span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {formatTime(w.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <ArrowUpRight size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{w.investmentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {w.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-black text-red-500">
                        -{formatCurrency(w.value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          {w.deviceType === 'Mobile' ? (
                            <Smartphone size={14} className="text-blue-500" />
                          ) : (
                            <Monitor size={14} className="text-blue-500" />
                          )}
                          <span className="text-xs font-semibold">{w.deviceType}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Globe size={10} /> {w.deviceIp}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-2 group/obs">
                        <FileText size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-500 leading-relaxed truncate group-hover/obs:whitespace-normal transition-all" title={w.observation}>
                          {w.observation || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <ShieldCheck size={12} />
                        <span className="text-[10px] font-black uppercase tracking-tight">Efetivado</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info for mobile/tablet */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Total de registros: {filtered.length}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold uppercase">
              <ShieldCheck size={14} /> Sistema de Segurança Babylon Ativo
            </div>
          </div>
        )}
      </div>
    </div>
  );
};