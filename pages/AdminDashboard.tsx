
import React, { useMemo, useState, useEffect } from 'react';
import { User, License, LicensePlan } from '../types';
import { 
  Users, Award, TrendingUp, DollarSign, 
  UserCheck, 
  Activity, Timer, Infinity as InfinityIcon,
  Globe, Smartphone, Monitor
} from 'lucide-react';

interface AdminDashboardProps {
  users: User[];
  licenses: License[];
  plans: LicensePlan[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, licenses, plans }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const activeLicenses = (licenses || []).filter(l => l.status === 'Ativa');
    const totalRevenue = activeLicenses.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const mrr = activeLicenses.reduce((acc, curr) => {
      const val = Number(curr.value) || 0;
      if (curr.type === 'Anual') return acc + (val / 12);
      if (curr.type === 'Mensal') return acc + val;
      return acc;
    }, 0);

    const licenseDistMap: Record<string, number> = {};
    (users || []).forEach(u => {
      const userLicenses = (licenses || []).filter(l => l.userId === u.id);
      const lic = userLicenses.find(l => l.status === 'Ativa') || userLicenses[0];
      const planName = lic?.name || (u.isAdmin ? 'Admin Vitalício' : (u.licenseType || 'Sem Plano'));
      licenseDistMap[planName] = (licenseDistMap[planName] || 0) + 1;
    });

    return {
      totalUsers: (users || []).length,
      activeSubscriptions: activeLicenses.length,
      totalProjected: totalRevenue,
      mrr,
      chartData: Object.entries(licenseDistMap).map(([name, value]) => ({ name, value }))
    };
  }, [users, licenses]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const calculateActivityTime = (seenTime?: string) => {
    if (!seenTime) return '—';
    const start = new Date(seenTime);
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    if (diff < 60) return 'Agora mesmo';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}h ${minutes}m atrás`;
  };

  const getUserStatus = (user: User) => {
    if (user.ativo === false) return { label: 'Bloqueado', color: 'bg-red-50 text-red-600 border-red-100', pulse: false };
    if (user.lastSeenAt) {
      const lastSeen = new Date(user.lastSeenAt);
      const diffSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);
      if (diffSeconds < 300) {
        return { label: 'On-line', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', pulse: true };
      }
    }
    return { label: 'Off-line', color: 'bg-slate-50 text-slate-400 border-slate-200', pulse: false };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic flex items-center gap-3">
             <Activity className="text-indigo-600" size={28} /> Painel de Telemetria
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Monitoramento de Fluxo e Presença Real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Base Total</p><p className="text-2xl font-black text-slate-800">{stats.totalUsers}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Award size={24} /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Licenças Ativas</p><p className="text-2xl font-black text-slate-800">{stats.activeSubscriptions}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><TrendingUp size={24} /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">MRR Recorrência</p><p className="text-2xl font-black text-slate-800">{formatCurrency(stats.mrr)}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><DollarSign size={24} /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase">Receita Total</p><p className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalProjected)}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-600" /> Presença de Usuários & Licenciamento
          </h3>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> <span className="text-[9px] font-black text-slate-400 uppercase">Tempo Real Ativo</span></div>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-5">Usuário</th>
                <th className="px-8 py-5">Plano / Valor</th>
                <th className="px-8 py-5">Expiração</th>
                <th className="px-8 py-5">IP / Dispositivo</th>
                <th className="px-8 py-5">Última Atividade</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(users || []).map(u => {
                const userLicenses = (licenses || []).filter(l => l.userId === u.id);
                const dbLicense = userLicenses.find(l => l.status === 'Ativa') || userLicenses[0];
                const isRealVitalicio = u.isAdmin || dbLicense?.type === 'Vitalícia';
                const displayPlan = dbLicense?.name || (u.isAdmin ? 'Admin Vitalício' : (u.licenseType || 'Sem Plano'));
                const displayValue = dbLicense ? dbLicense.value : (isRealVitalicio ? 299 : 0);
                const status = getUserStatus(u);
                
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} className="w-9 h-9 rounded-full border border-slate-200 object-cover" alt="" />
                        <div>
                          <p className="text-sm font-black text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-indigo-600">{displayPlan}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{displayValue > 0 ? formatCurrency(displayValue) : '—'}</p>
                    </td>
                    <td className="px-8 py-5 text-xs font-black text-slate-500">
                      {isRealVitalicio ? (
                        <span className="flex items-center gap-1 text-amber-500 uppercase text-[9px]">
                           <InfinityIcon size={12} /> Não Expira
                        </span>
                      ) : (
                        dbLicense?.expirationDate ? new Date(dbLicense.expirationDate).toLocaleDateString('pt-BR') : '—'
                      )}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                             {u.lastDevice === 'Mobile' ? <Smartphone size={12} className="text-blue-500"/> : <Monitor size={12} className="text-indigo-500"/>}
                             {u.lastDevice || 'Desktop'}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                             <Globe size={10} /> {u.lastIp || 'Indisponível'}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                          <Timer size={14} className="text-slate-300" />
                          {calculateActivityTime(u.lastSeenAt)}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm transition-all ${status.color} ${status.pulse ? 'animate-pulse' : ''}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
