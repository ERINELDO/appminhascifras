
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction, Investment, User, Withdrawal, Goal, TransactionType } from '../types';
import { 
  TrendingUp, ArrowUpCircle, ArrowDownCircle, 
  Wallet, Loader2, Activity, PieChart as PieIcon,
  Crown, ShieldCheck, Target, Heart, Scale,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Filter, RotateCcw, ListOrdered, BarChart3, ShieldAlert,
  Palmtree, ChevronDown, CheckCircle, Clock, History, Trophy, ArrowRight, Building, ArrowRightCircle,
  CheckCircle2, AlertCircle, AlertTriangle, ListPlus
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', 
  '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#475569',
  '#fb923c', '#a3e635', '#2dd4bf', '#818cf8', '#fb7185',
  '#64748b', '#0ea5e9', '#f43f5e', '#84cc16', '#a855f7'
];

const formatCurrencyGlobal = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

// COMPONENTE PieCard
const PieCard = ({ title, data, icon: Icon }: { title: string, data: any[], icon: any }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[450px] group transition-all">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors"><Icon size={18} /></div>
          <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{title}</h3>
        </div>
        {total > 0 && (
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
            {data.length} {data.length === 1 ? 'Categoria' : 'Categorias'}
          </span>
        )}
      </div>

      <div className="flex-1 relative min-h-0">
        {data.length > 0 ? (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Geral</p>
               <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{formatCurrencyGlobal(total)}</p>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={3} 
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      className="hover:opacity-80 transition-opacity outline-none cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    fontSize: '10px', 
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => [formatCurrencyGlobal(value), `${name}`]} 
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
            <PieIcon size={40} className="opacity-10 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Sem dados no período</p>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
             {data.map((item, idx) => (
               <div key={idx} className="flex items-center gap-2 group/item">
                 <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 truncate uppercase tracking-tighter group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400">
                      {((item.value / total) * 100).toFixed(1)}%
                    </span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

interface DashboardProps {
  transactions: Transaction[];
  investments: Investment[];
  withdrawals: Withdrawal[];
  goals: Goal[];
  user: User | null;
  isAdmin?: boolean;
  onNavigate: (page: string) => void;
  onOpenTransaction: (type: TransactionType) => void;
  isSidebarCollapsed: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions = [], 
  investments = [], 
  withdrawals = [],
  goals = [],
  user,
  isAdmin = false,
  onNavigate,
  onOpenTransaction,
  isSidebarCollapsed
}) => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const carouselRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) range.push(i);
    return range;
  }, []);

  const updateDates = (month: number, year: number, mode: 'monthly' | 'yearly') => {
    if (mode === 'monthly') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else {
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      setViewMode('yearly');
      updateDates(0, currentViewDate.getFullYear(), 'yearly');
    } else {
      const m = parseInt(val);
      setViewMode('monthly');
      const newDate = new Date(currentViewDate.getFullYear(), m, 1);
      setCurrentViewDate(newDate);
      updateDates(m, currentViewDate.getFullYear(), 'monthly');
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value);
    const newDate = new Date(y, currentViewDate.getMonth(), 1);
    setCurrentViewDate(newDate);
    updateDates(currentViewDate.getMonth(), y, viewMode);
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
    setCurrentViewDate(prev);
    updateDates(prev.getMonth(), prev.getFullYear(), 'monthly');
    setViewMode('monthly');
  };

  const handleNextMonth = () => {
    const next = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
    setCurrentViewDate(next);
    updateDates(next.getMonth(), next.getFullYear(), 'monthly');
    setViewMode('monthly');
  };

  const handleResetFilter = () => {
    const now = new Date();
    setCurrentViewDate(now);
    setViewMode('monthly');
    updateDates(now.getMonth(), now.getFullYear(), 'monthly');
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatCurrency = (val: number) => formatCurrencyGlobal(val);

  const getMonthlyAverage = (goal: Goal) => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate + 'T12:00:00');
    let diffMonths = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    if (diffMonths <= 0) diffMonths = 1;
    const remainingValue = Math.max(0, goal.targetValue - (goal.currentValue || 0));
    return remainingValue / diffMonths;
  };

  const stats = useMemo(() => {
    const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    const filteredInvestments = investments.filter(inv => inv.date >= startDate && inv.date <= endDate);
    
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const income = filteredTransactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.amount || 0), 0);
    const receivedIncome = filteredTransactions.filter(t => t.type === 'receita' && t.status === 'Efetivado').reduce((acc, t) => acc + (t.amount || 0), 0);
    const expenses = filteredTransactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalPaid = filteredTransactions.filter(t => t.type === 'despesa' && t.status === 'Efetivado').reduce((acc, t) => acc + (t.amount || 0), 0);
    const pendingExpenses = filteredTransactions.filter(t => t.type === 'despesa' && (t.status === 'Pendente' || t.status === 'Vencido')).reduce((acc, t) => acc + (t.amount || 0), 0);
    const dueSoonExpenses = filteredTransactions.filter(t => t.type === 'despesa' && t.status === 'Pendente' && t.date >= today && t.date <= sevenDaysStr).reduce((acc, t) => acc + (t.amount || 0), 0);
    const emergencySaved = filteredTransactions.filter(t => t.type === 'reserva').reduce((acc, t) => acc + (t.amount || 0), 0);
    const lazerSpent = filteredTransactions.filter(t => t.type === 'despesa' && t.category === 'Lazer').reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const currentPeriodInvested = filteredInvestments.reduce((acc, inv) => acc + (inv.value || 0), 0);

    const expByCatMap: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'despesa').forEach(t => { expByCatMap[t.category] = (expByCatMap[t.category] || 0) + t.amount; });
    const expensesByCategory = Object.entries(expByCatMap).map(([name, value]) => ({ name, value })).filter(i => i.value > 0).sort((a, b) => b.value - a.value);

    const incByCatMap: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'receita').forEach(t => { incByCatMap[t.category] = (incByCatMap[t.category] || 0) + t.amount; });
    const incomeByCategory = Object.entries(incByCatMap).map(([name, value]) => ({ name, value })).filter(i => i.value > 0).sort((a, b) => b.value - a.value);

    const invByTypeMap: Record<string, number> = {};
    filteredInvestments.forEach(inv => { invByTypeMap[inv.type] = (invByTypeMap[inv.type] || 0) + inv.value; });
    const investmentsByType = Object.entries(invByTypeMap).map(([name, value]) => ({ name, value })).filter(i => i.value > 0).sort((a, b) => b.value - a.value);

    let expensesTarget = income * 0.7;
    let investmentTarget = income * 0.1;
    let reserveTarget = income * 0.1;
    let leisureTarget = income * 0.1;

    if (expenses > expensesTarget) {
      const remainingForOthers = Math.max(0, income - expenses);
      investmentTarget = remainingForOthers / 3;
      reserveTarget = remainingForOthers / 3;
      leisureTarget = remainingForOthers / 3;
    }

    let totalTargetValue = 0;
    let totalCurrentValue = 0;
    let totalMonthlyAverage = 0;
    goals.forEach(g => {
      totalTargetValue += (g.targetValue || 0);
      totalCurrentValue += (g.currentValue || 0);
      totalMonthlyAverage += getMonthlyAverage(g);
    });

    const overallAportadoPercent = totalTargetValue > 0 ? Math.round((totalCurrentValue / totalTargetValue) * 100) : 0;

    return { 
      income, receivedIncome, expenses, totalPaid, pendingExpenses, dueSoonExpenses, emergencySaved, lazerSpent,
      invested: currentPeriodInvested,
      babylonRule: { expensesTarget, investmentTarget, reserveTarget, leisureTarget },
      expensesByCategory, incomeByCategory, investmentsByType, totalAportadoMetas: totalCurrentValue,
      totalMonthlyAverage, overallAportadoPercent
    };
  }, [transactions, investments, goals, startDate, endDate]);

  const displayName = useMemo(() => {
    if (!user || !user.name) return 'Sincronizando...';
    const firstName = user.name.split(' ')[0].split('@')[0];
    return firstName || 'Membro Babylon';
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-32 transition-all">
      
      {/* Banner Principal */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 -mr-10 -mt-10 pointer-events-none text-blue-400"><Crown size={200} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <img src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-20 h-20 rounded-2xl border-2 border-emerald-500 object-cover shadow-lg" alt="" />
          <div>
            <h2 className="text-2xl font-black text-white italic">Olá, {displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase rounded">{user?.licenseType || 'Processando...'}</span>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle Inteligente Ativo</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end relative z-10">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resultado Líquido do Período</p>
           <h3 className="text-4xl font-black text-emerald-400 tracking-tighter">{formatCurrency(stats.income - stats.expenses + stats.invested)}</h3>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Filter size={20} /></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400">Filtrar por Período</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{viewMode === 'monthly' ? `${MONTHS[currentViewDate.getMonth()]} / ${currentViewDate.getFullYear()}` : `Todo o Ano de ${currentViewDate.getFullYear()}`}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
           <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <button onClick={handlePrevMonth} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm"><ChevronLeft size={18} strokeWidth={3} /></button>
              <div className="relative group mx-1">
                <select value={viewMode === 'monthly' ? currentViewDate.getMonth() : 'all'} onChange={handleMonthChange} className="appearance-none bg-transparent pl-4 pr-8 py-1.5 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-widest cursor-pointer outline-none focus:text-emerald-600 min-w-[140px] text-center">
                  {MONTHS.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                  <option value="all">Todo o Ano</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
              <div className="relative group mx-1">
                <select value={currentViewDate.getFullYear()} onChange={handleYearChange} className="appearance-none bg-transparent pl-4 pr-8 py-1.5 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-widest cursor-pointer outline-none focus:text-emerald-600 min-w-[80px] text-center">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <button onClick={handleNextMonth} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm"><ChevronRight size={18} strokeWidth={3} /></button>
           </div>
           <button onClick={handleResetFilter} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Resetar Filtros"><RotateCcw size={18} /></button>
        </div>
      </div>

      {/* Grid de Principais Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <div className="bg-blue-600 p-6 rounded-3xl border border-blue-500 shadow-xl shadow-blue-600/20 flex items-center gap-4 group transition-transform hover:scale-[1.02] text-white">
            <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:scale-110 transition-transform"><ArrowUpCircle size={28} /></div>
            <div><p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Entradas</p><p className="text-xl font-black">{formatCurrency(stats.income)}</p></div>
          </div>
          <div className="bg-blue-100 p-6 rounded-3xl border border-blue-200 shadow-sm flex items-center gap-4 group animate-fade-in transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-white text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm"><CheckCircle2 size={28} /></div>
            <div><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Recebidos</p><p className="text-xl font-black text-blue-800">{formatCurrency(stats.receivedIncome)}</p></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-red-600 p-6 rounded-3xl border border-red-500 shadow-xl shadow-red-600/20 flex items-center gap-4 group transition-transform hover:scale-[1.02] text-white">
            <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:scale-110 transition-transform"><ArrowDownCircle size={28} /></div>
            <div><p className="text-[10px] font-black text-red-100 uppercase tracking-widest">Saídas</p><p className="text-xl font-black">{formatCurrency(stats.expenses)}</p></div>
          </div>
          <div className="bg-red-100 p-6 rounded-3xl border border-red-200 shadow-sm flex items-center gap-4 group animate-fade-in transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-white text-red-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm"><CheckCircle size={28} /></div>
            <div><p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Total Pago</p><p className="text-xl font-black text-red-800">{formatCurrency(stats.totalPaid)}</p></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-purple-700 p-6 rounded-3xl border border-purple-600 shadow-xl shadow-purple-700/20 flex items-center gap-4 group transition-transform hover:scale-[1.02] text-white">
            <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
            <div><p className="text-[10px] font-black text-purple-100 uppercase tracking-widest">Ativos (Mês Atual)</p><p className="text-xl font-black">{formatCurrency(stats.invested)}</p></div>
          </div>
          <div className="bg-purple-100 p-6 rounded-3xl border border-purple-200 shadow-sm flex items-center gap-4 group animate-fade-in transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-white text-purple-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm"><Clock size={28} /></div>
            <div><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Pagamento Pendente</p><p className="text-xl font-black text-purple-800">{formatCurrency(stats.pendingExpenses)}</p></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-500 p-6 rounded-3xl border border-amber-400 shadow-xl shadow-amber-500/20 flex items-center gap-4 group transition-transform hover:scale-[1.02] text-white">
            <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:scale-110 transition-transform"><Target size={28} /></div>
            <div><p className="text-[10px] font-black text-amber-50 uppercase tracking-widest">Metas (Aportado)</p><p className="text-xl font-black">{formatCurrency(stats.totalAportadoMetas)}</p></div>
          </div>
          <div className="bg-amber-100 p-6 rounded-3xl border border-amber-200 shadow-sm flex items-center gap-4 group animate-fade-in transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-white text-amber-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm"><AlertTriangle size={28} /></div>
            <div><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">A Vencer em 07 dias</p><p className="text-xl font-black text-amber-800">{formatCurrency(stats.dueSoonExpenses)}</p></div>
          </div>
        </div>
      </div>

      {/* METAS DE GESTÃO DINÂMICAS */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
            <Scale size={18} className="text-indigo-600" /> Metas de Gestão Dinâmicas ({viewMode === 'monthly' ? 'Mensal' : 'Anual'})
          </h3>
          <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Padrão de Saúde Financeira</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Custos de Vida (70%)', current: stats.expenses, target: stats.babylonRule.expensesTarget, color: 'bg-red-500', icon: <Heart size={16} className="text-red-500" />, warning: 'Cuidado! Seu custo está alto.' },
            { label: 'Investimentos (10%)', current: stats.invested, target: stats.babylonRule.investmentTarget, color: 'bg-emerald-500', icon: <TrendingUp size={16} className="text-emerald-500" />, warning: 'Cuidado! Seus investimentos estão altos.' },
            { label: 'Reserva de Valor (10%)', current: stats.emergencySaved, target: stats.babylonRule.reserveTarget, color: 'bg-amber-500', icon: <ShieldCheck size={16} className="text-amber-500" />, warning: 'Cuidado! Sua reserva ultrapassou o limite.' },
            { label: 'Lazer (10%)', current: stats.lazerSpent, target: stats.babylonRule.leisureTarget, color: 'bg-indigo-500', icon: <Palmtree size={16} className="text-indigo-500" />, warning: 'Cuidado! Seu gasto com lazer está alto.' }
          ].map((item, idx) => {
            const perc = stats.income > 0 ? Math.min((item.current / (item.target || 1)) * 100, 200) : 0;
            const isOver = item.current > item.target && stats.income > 0;
            
            return (
              <div key={idx} className={`p-5 rounded-[2rem] border flex flex-col gap-4 transition-all hover:scale-[1.03] group ${isOver ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex flex-col gap-1.5">
                   <div className="flex items-center justify-between">
                     <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase truncate">
                       {item.icon} {item.label.split(' ')[0]}
                     </span>
                     <span className={`text-[10px] font-black ${isOver ? 'text-red-600 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                       {Math.round(perc)}%
                     </span>
                   </div>

                   {isOver && (
                     <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-red-600 uppercase animate-fade-in">
                       <ShieldAlert size={12} />
                       {item.warning}
                     </div>
                   )}

                   <div className="mt-2 space-y-1">
                     <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight flex justify-between">
                       <span>Total Usado:</span> <span className="text-slate-900 dark:text-white">{formatCurrency(item.current)}</span>
                     </p>
                     <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-1">
                       <span>Limite:</span> <span className={`${isOver ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'} text-sm font-black`}>{formatCurrency(item.target)}</span>
                     </p>
                   </div>
                </div>
                <div className="h-2.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner relative">
                   <div 
                     className={`h-full ${isOver ? 'bg-red-600' : item.color} transition-all duration-1000 ease-out`} 
                     style={{ width: `${Math.min(perc, 100)}%` }}
                   ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Progresso das Metas */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase italic flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" /> Progresso das Metas (Deslize para ver)
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-600" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Total Médio Mensal:</span>
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(stats.totalMonthlyAverage)}</span>
             </div>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">% Aportado:</span>
                <span className="text-xs font-black text-emerald-600">{stats.overallAportadoPercent}%</span>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={() => scrollCarousel('left')} className="p-2 bg-emerald-600 border border-emerald-500 rounded-xl text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-90"><ChevronLeft size={20} strokeWidth={3} /></button>
             <button onClick={() => scrollCarousel('right')} className="p-2 bg-emerald-600 border border-emerald-500 rounded-xl text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-90"><ChevronRight size={20} strokeWidth={3} /></button>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center gap-3">
             <Target size={40} className="text-slate-200 dark:text-slate-700" />
             <p className="text-xs font-black text-slate-400 uppercase italic">Nenhuma meta ativa para monitoramento.</p>
          </div>
        ) : (
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto pb-6 px-2 snap-x snap-mandatory scrollbar-hide scroll-smooth"
          >
            {goals.map(goal => {
              const perc = Math.min(Math.round(((goal.currentValue || 0) / (goal.targetValue || 1)) * 100), 100);
              const monthlyAvg = getMonthlyAverage(goal);
              
              return (
                <div key={goal.id} className="min-w-[calc(100%-32px)] md:min-w-[calc(50%-12px)] snap-start bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center shadow-inner shrink-0" style={{ backgroundColor: `${goal.typeColor}15`, color: goal.typeColor }}>
                            <Target size={24} className="md:w-[30px] md:h-[30px]" />
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-sm md:text-lg font-black text-slate-800 dark:text-white truncate uppercase tracking-tighter italic leading-tight">{goal.name}</h4>
                            <div className="flex flex-col gap-1 mt-1">
                               <span className="text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border w-fit" style={{ color: goal.typeColor, borderColor: `${goal.typeColor}40` }}>{goal.typeName}</span>
                               <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Building size={10} className="text-indigo-400" /> {goal.accountName}
                               </span>
                            </div>
                         </div>
                      </div>
                      <span className="text-sm md:text-lg font-black text-slate-900 dark:text-white">{perc}%</span>
                   </div>

                   <div className="space-y-6">
                      <div className="h-3 md:h-4 bg-slate-100 dark:bg-slate-950 rounded-full border border-slate-50 dark:border-slate-800 overflow-hidden relative shadow-inner">
                         <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${perc}%`, backgroundColor: goal.typeColor }}></div>
                      </div>

                      <div className="flex justify-between items-end">
                         <div className="space-y-0.5">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Aportado</p>
                            <p className="text-base md:text-xl font-black text-slate-900 dark:text-white leading-none">{formatCurrency(goal.currentValue || 0)}</p>
                         </div>
                         <div className="text-right space-y-0.5">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Meta Final</p>
                            <p className="text-sm md:text-lg font-black text-indigo-700 dark:text-indigo-400 leading-none">{formatCurrency(goal.targetValue)}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                         <div className="p-3 md:p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[1.5rem] md:rounded-3xl border border-emerald-100/50 dark:border-emerald-800/30">
                            <p className="text-[8px] md:text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1.5">
                               <TrendingUp size={12} /> Média Mensal
                            </p>
                            <p className="text-sm md:text-lg font-black text-emerald-700 dark:text-emerald-300 leading-none">
                              {formatCurrency(monthlyAvg)}
                            </p>
                         </div>
                         <div className="p-3 md:p-4 bg-emerald-600 rounded-[1.5rem] md:rounded-3xl border border-emerald-500 shadow-lg shadow-emerald-500/20">
                            <p className="text-[8px] md:text-[9px] font-black text-emerald-100 uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1.5">
                               <History size={12} /> Último Depósito
                            </p>
                            <p className="text-sm md:text-lg font-black text-white leading-none">
                              {formatCurrency(goal.lastEntryValue || 0)}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <PieCard title="Despesas por Categoria" data={stats.expensesByCategory} icon={ArrowDownCircle} />
         <PieCard title="Receitas por Categoria" data={stats.incomeByCategory} icon={ArrowUpCircle} />
         <PieCard title="Alocação por Tipo de Ativo" data={stats.investmentsByType} icon={TrendingUp} />
      </div>

      {/* RODAPÉ DE AÇÃO RÁPIDA - MEU FINANCEIRO */}
      <div className={`fixed bottom-0 left-0 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-72'} right-0 z-[100] transition-all`}>
         <div className="bg-white border-t-2 border-gray-200 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] px-4 py-4 md:py-6">
            <div className="max-w-4xl mx-auto flex items-center justify-around gap-2">
               <button 
                  onClick={() => onOpenTransaction('receita')} 
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-emerald-50 transition-all flex-1 group"
               >
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                     <ArrowUpCircle size={22} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-600">Receitas</span>
               </button>

               <button 
                  onClick={() => onOpenTransaction('despesa')} 
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-red-50 transition-all flex-1 group"
               >
                  <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-110 transition-transform">
                     <ArrowDownCircle size={22} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-600">Despesas</span>
               </button>

               <button 
                  onClick={() => onNavigate('investments')} 
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-indigo-50 transition-all flex-1 group"
               >
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                     <TrendingUp size={22} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-600">Investimentos</span>
               </button>
            </div>
         </div>
      </div>

    </div>
  );
};
