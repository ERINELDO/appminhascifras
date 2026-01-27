
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Goal, GoalType, GoalEntry, GoalAccount } from '../types';
import { 
  Target, Plus, Calendar, DollarSign, Trash2, Pencil, X, Save, 
  LayoutGrid, Info, CheckCircle2, AlertCircle, Loader2, Flag, 
  Trophy, TrendingUp, ArrowUpCircle,
  Building, Landmark, Clock, Trash, AlertTriangle,
  ChevronLeft, ChevronRight, Filter, RotateCcw, SlidersHorizontal,
  Wallet, History, ChevronDown, RefreshCw, BarChart3, MoreVertical,
  CalendarDays, Globe
} from 'lucide-react';
import { api } from '../services/api';

const PREDEFINED_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#64748b', '#000000',
  '#fb923c', '#a3e635', '#2dd4bf', '#818cf8', '#fb7185'
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const Metas: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTypes, setGoalTypes] = useState<GoalType[]>([]);
  const [goalAccounts, setGoalAccounts] = useState<GoalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncError, setSyncError] = useState(false);
  
  // Modais
  const [showForm, setShowForm] = useState(false);
  const [showAporteForm, setShowAporteForm] = useState(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const [isTypeEditOpen, setIsTypeEditOpen] = useState(false);
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [isAccountEditOpen, setIsAccountEditOpen] = useState(false);
  const [openTypeMenuId, setOpenTypeMenuId] = useState<string | null>(null);
  const [openAccountMenuId, setOpenAccountMenuId] = useState<string | null>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  // Estados de Confirmação de Exclusão
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, goalId: string, goalName: string} | null>(null);
  const [typeDeleteConfirm, setTypeDeleteConfirm] = useState<{isOpen: boolean, id: string, name: string} | null>(null);
  const [accountDeleteConfirm, setAccountDeleteConfirm] = useState<{isOpen: boolean, id: string, name: string} | null>(null);

  // Filtros e Notificações
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  
  // Período Rápido
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Estados dos formulários
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthsForecast, setMonthsForecast] = useState('12');
  const [targetDate, setTargetDate] = useState('');
  const [typeId, setTypeId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [observation, setObservation] = useState('');

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [aporteAmount, setAporteAmount] = useState('');
  const [aporteDate, setAporteDate] = useState(new Date().toISOString().split('T')[0]);
  const [aporteDesc, setAporteDesc] = useState('');

  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(PREDEFINED_COLORS[0]);
  
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 2; i <= currentYear + 10; i++) range.push(i);
    return range;
  }, []);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (startDate && monthsForecast) {
      const start = new Date(startDate + 'T12:00:00');
      const months = parseInt(monthsForecast) || 0;
      start.setMonth(start.getMonth() + months);
      setTargetDate(start.toISOString().split('T')[0]);
    }
  }, [startDate, monthsForecast]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setOpenTypeMenuId(null);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setOpenAccountMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setSyncError(false);
    try {
      const [goalsData, typesData, accountsData] = await Promise.all([
        api.getGoals(),
        api.getGoalTypes(),
        api.getGoalAccounts()
      ]);
      setGoals(goalsData || []);
      setGoalTypes(typesData || []);
      setGoalAccounts(accountsData || []);
    } catch (e: any) {
      console.error("Erro ao carregar metas:", e);
      setSyncError(true);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyAverage = (goal: Goal) => {
    const today = new Date();
    const tDate = new Date(goal.targetDate + 'T12:00:00');
    let diffMonths = (tDate.getFullYear() - today.getFullYear()) * 12 + (tDate.getMonth() - today.getMonth());
    if (diffMonths <= 0) diffMonths = 1;
    const remainingValue = Math.max(0, goal.targetValue - (goal.currentValue || 0));
    return remainingValue / diffMonths;
  };

  const globalStats = useMemo(() => {
    let totalMonthly = 0;
    let totalTarget = 0;
    let totalCurrent = 0;

    goals.forEach(g => {
      totalMonthly += getMonthlyAverage(g);
      totalTarget += (g.targetValue || 0);
      totalCurrent += (g.currentValue || 0);
    });

    const totalPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

    return { totalMonthly, totalPercent };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const matchesType = filterType ? goal.typeId === filterType : true;
      const goalDate = new Date(goal.targetDate + 'T12:00:00');
      
      const matchesMonth = filterMonth === 'all' ? true : (goalDate.getMonth() + 1).toString() === filterMonth;
      const matchesYear = filterYear === 'all' ? true : goalDate.getFullYear().toString() === filterYear;
      
      return matchesType && matchesMonth && matchesYear;
    }).sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [goals, filterType, filterMonth, filterYear]);

  const paginatedGoals = filteredGoals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredGoals.length / itemsPerPage);

  const resetGoalForm = () => {
    setEditingId(null); setName(''); setTargetValue('');
    setStartDate(new Date().toISOString().split('T')[0]); setMonthsForecast('12');
    setTypeId(''); setAccountId(''); setObservation('');
  };

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id); setName(goal.name || '');
    setTargetValue((goal.targetValue ?? 0).toString());
    setStartDate(goal.startDate || new Date().toISOString().split('T')[0]);
    setMonthsForecast((goal.monthsForecast ?? 12).toString());
    setTargetDate(goal.targetDate || '');
    setTypeId(goal.typeId || ''); setAccountId(goal.accountId || '');
    setObservation(goal.observation || '');
    setShowForm(true);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetValue);
    if (!name || isNaN(val) || val <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    // TypeScript correction: use || undefined instead of null to match interface Goal
    const data = { 
      name, 
      targetValue: val, 
      startDate, 
      monthsForecast: parseInt(monthsForecast), 
      targetDate, 
      typeId: typeId || undefined, 
      accountId: accountId || undefined, 
      observation 
    };

    try {
      if (editingId) {
        await api.updateGoal(editingId, data);
        setNotification({ message: 'Meta atualizada com sucesso!', type: 'success' });
      } else {
        await api.addGoal(data);
        setNotification({ message: 'Nova meta cadastrada com sucesso!', type: 'success' });
      }
      setShowForm(false); resetGoalForm(); loadData();
    } catch (err: any) { 
      console.error("Erro Supabase:", err);
      setNotification({ message: `Erro ao salvar meta: ${err.message || 'Verifique os dados.'}`, type: 'error' }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const executeDeleteGoal = async () => {
    if (!deleteConfirm || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteGoal(deleteConfirm.goalId);
      setNotification({ message: `Meta "${deleteConfirm.goalName}" removida com sucesso.`, type: 'success' });
      setDeleteConfirm(null); loadData();
    } catch (err: any) { 
      console.error(err);
      setNotification({ message: `Falha ao excluir meta: ${err.message}`, type: 'error' }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const executeDeleteType = async () => {
    if (!typeDeleteConfirm || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteGoalType(typeDeleteConfirm.id);
      setNotification({ message: 'Categoria removida!', type: 'success' });
      setTypeDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      setNotification({ message: 'Não é possível excluir categorias em uso por metas ativas.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteAccount = async () => {
    if (!accountDeleteConfirm || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteGoalAccount(accountDeleteConfirm.id);
      setNotification({ message: 'Local de custódia removido!', type: 'success' });
      setAccountDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      setNotification({ message: 'Este local está vinculado a metas e não pode ser removido.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAporte = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(aporteAmount);
    if (!selectedGoal || isNaN(val) || val <= 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await api.addGoalEntry({ meta_id: selectedGoal.id, amount: val, date: aporteDate, description: aporteDesc });
      setNotification({ message: `Aporte de ${formatCurrency(val)} registrado em "${selectedGoal.name}"!`, type: 'success' });
      setShowAporteForm(false); setAporteAmount(''); loadData();
    } catch (err: any) { 
      setNotification({ message: `Erro ao processar aporte: ${err.message}`, type: 'error' }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingTypeId) {
        await api.updateGoalType(editingTypeId, { name: newTypeName, color: newTypeColor });
        setNotification({ message: 'Categoria atualizada!', type: 'success' });
      } else {
        await api.addGoalType({ name: newTypeName, color: newTypeColor });
        setNotification({ message: 'Nova categoria criada!', type: 'success' });
      }
      setIsTypeEditOpen(false);
      loadData();
    } catch (err: any) {
      setNotification({ message: `Erro na categoria: ${err.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingAccountId) {
        await api.updateGoalAccount(editingAccountId, { name: newAccountName });
        setNotification({ message: 'Local de custódia atualizado!', type: 'success' });
      } else {
        await api.addGoalAccount({ name: newAccountName });
        setNotification({ message: 'Local registrado no sistema!', type: 'success' });
      }
      setIsAccountEditOpen(false);
      loadData();
    } catch (err: any) {
      setNotification({ message: `Erro no local: ${err.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setFilterType('');
    setFilterMonth('all'); 
    setFilterYear('all'); 
    setShowFilters(false);
    setCurrentPage(1);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-8">
      
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-bounce-in">
          <div className={`px-6 py-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex items-center gap-3 border-2 ${notification.type === 'success' ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 transition-all"><X size={16}/></button>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div className="space-y-2">
           <h2 className="text-2xl font-black text-slate-800 italic flex items-center gap-3 uppercase tracking-tight">
              <Target className="text-indigo-600" size={32} /> Minhas Metas
           </h2>
           {!loading && goals.length > 0 && (
             <div className="flex flex-wrap items-center gap-4 bg-white border-2 border-slate-300 px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2">
                   <TrendingUp size={16} className="text-indigo-500" />
                   <span className="text-[10px] font-black uppercase text-slate-400">Valor Total Médio Mensal:</span>
                   <span className="text-sm font-black text-indigo-600">{formatCurrency(globalStats.totalMonthly)}</span>
                </div>
                <div className="w-px h-4 bg-slate-300 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                   <BarChart3 size={16} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase text-slate-400">% Aportado:</span>
                   <span className="text-sm font-black text-emerald-600">{globalStats.totalPercent}%</span>
                </div>
             </div>
           )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsAccountManagerOpen(true)} className="bg-white border-2 border-slate-300 px-4 py-2.5 rounded-none flex items-center gap-2 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:shadow-none"><Landmark size={18} className="text-indigo-500" /> Locais</button>
          <button onClick={() => setIsTypeManagerOpen(true)} className="bg-white border-2 border-slate-300 px-4 py-2.5 rounded-none flex items-center gap-2 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:shadow-none"><LayoutGrid size={18} /> Categorias</button>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2.5 rounded-none font-black text-[10px] uppercase border-2 flex items-center gap-2 transition-all ${showFilters || filterType ? 'bg-indigo-600 text-white shadow-[4px_4px_0px_0px_rgba(67,56,202,1)] border-indigo-700' : 'bg-white text-slate-600 border-slate-300 shadow-[4px_4px_0px_0px_rgba(203,213,225,1)]'}`}><SlidersHorizontal size={18} /> Filtros {filterType && <span className="ml-1 bg-white/20 px-1 rounded-full text-[8px]">1</span>}</button>
          <button onClick={() => { resetGoalForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-none border-2 border-emerald-700 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] transition-all font-black text-[10px] uppercase hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none"><Plus size={20} /> Nova Meta</button>
        </div>
      </div>

      {/* FILTRO RÁPIDO */}
      <div className="flex flex-col xl:flex-row gap-6">
          <div className="bg-white border-2 border-indigo-600 p-4 md:p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(79,70,229,1)] flex items-center gap-5 min-w-[280px] animate-fade-in shrink-0">
              <div className="p-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 rounded-none">
                 {filterMonth === 'all' && filterYear === 'all' ? <Globe size={24} /> : <CalendarDays size={24} />}
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Alvo de Visão</p>
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">
                   {filterMonth === 'all' && filterYear === 'all' 
                     ? 'Portfólio Estratégico' 
                     : filterMonth === 'all' 
                        ? `Todo o Ano ${filterYear}` 
                        : `${MONTHS[parseInt(filterMonth)-1]} ${filterYear === 'all' ? '' : filterYear}`}
                 </h3>
              </div>
          </div>

          <div className="bg-white border-2 border-slate-300 p-4 md:p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(203,213,225,1)] flex flex-col sm:flex-row items-center gap-5 min-w-[320px] animate-fade-in shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-700 tracking-[0.1em]">
                <Calendar size={18} className="text-indigo-600" />
                <span>Mês do Objetivo</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-40">
                  <select 
                    value={filterMonth} 
                    onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1); }} 
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none text-[11px] font-black uppercase text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all pr-8"
                  >
                    <option value="all">Todos os Meses</option>
                    {MONTHS.map((m, idx) => <option key={idx} value={(idx+1).toString()}>{m}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative w-28">
                  <select 
                    value={filterYear} 
                    onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }} 
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none text-[11px] font-black uppercase text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all pr-8"
                  >
                    <option value="all">Anos</option>
                    {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
          </div>
          
          <div className="flex-1 flex items-center">
             <button onClick={resetFilters} className="text-slate-400 hover:text-red-500 font-black text-[10px] uppercase flex items-center gap-2 px-4 py-2 hover:bg-red-50 transition-all rounded-none"><RotateCcw size={14}/> Limpar Atalho</button>
          </div>
      </div>

      {/* GRID DE CARDS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border-2 border-dashed border-slate-200">
           <Loader2 className="animate-spin text-indigo-600" size={48} />
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Sincronizando Estratégias...</p>
        </div>
      ) : syncError ? (
        <div className="col-span-full py-24 text-center bg-red-50 rounded-none border-2 border-dashed border-red-200">
           <AlertTriangle size={48} className="mx-auto text-red-300 mb-4" />
           <h3 className="text-red-600 font-black uppercase text-sm italic">Falha na Matriz de Dados</h3>
           <button onClick={loadData} className="mt-6 px-8 py-3 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase flex items-center gap-2 mx-auto hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all active:shadow-none"><RefreshCw size={16}/> Tentar Reconectar</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.02)]">
               <Target size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Sem metas registradas no período.</p>
            </div>
          ) : (
            paginatedGoals.map(goal => {
              const progress = Math.min(Math.round(((goal.currentValue || 0) / (goal.targetValue || 1)) * 100), 100);
              const monthlyAvg = getMonthlyAverage(goal);
              return (
                <div key={goal.id} className="bg-white rounded-none border-2 border-slate-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.08)] transition-all group overflow-hidden flex flex-col">
                  <div className="p-8 space-y-6 flex-1">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 rounded-none text-[9px] font-black uppercase border-2" style={{ backgroundColor: `${goal.typeColor}15`, color: goal.typeColor, borderColor: `${goal.typeColor}30` }}>{goal.typeName}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(goal)} className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-none border-2 border-transparent hover:border-indigo-700 transition-all"><Pencil size={18}/></button>
                        <button onClick={() => setDeleteConfirm({ isOpen: true, goalId: goal.id, goalName: goal.name || '' })} className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-none border-2 border-transparent hover:border-red-700 transition-all"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 truncate italic tracking-tight uppercase leading-none">{goal.name}</h3>
                    <div className="space-y-2">
                       <div className="h-4 bg-slate-100 rounded-none overflow-hidden border-2 border-slate-200 shadow-inner"><div className="h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, backgroundColor: goal.typeColor }}></div></div>
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">{progress}% concluído</span><span className="text-[10px] font-black text-slate-800 uppercase">{formatCurrency(Math.max(0, goal.targetValue - (goal.currentValue || 0)))} faltam</span></div>
                    </div>
                    <div className="flex justify-between items-end pt-2 gap-2">
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">Média Mensal</span>
                         <p className="text-sm font-black text-indigo-600 leading-tight">{formatCurrency(monthlyAvg)}</p>
                       </div>
                       <div className="flex flex-col text-center">
                         <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total Aportado</span>
                         <p className="text-xl font-black text-slate-900 leading-tight">{formatCurrency(goal.currentValue || 0)}</p>
                       </div>
                       <div className="flex flex-col text-right">
                         <span className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">Vencimento</span>
                         <p className="text-xs font-black text-indigo-600">{new Date(goal.targetDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                       </div>
                    </div>
                  </div>
                  <div className="px-8 py-5 bg-slate-50 border-t-2 border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2"><Landmark size={14} className="text-slate-300" /><span className="text-[9px] font-black uppercase text-slate-500 truncate max-w-[120px]">{goal.accountName}</span></div>
                     <button onClick={() => { setSelectedGoal(goal); setShowAporteForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 font-black text-[9px] uppercase hover:bg-emerald-700 shadow-[3px_3px_0px_0px_rgba(5,150,105,1)] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"><ArrowUpCircle size={14} /> Novo Aporte</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PAGINAÇÃO */}
      {!syncError && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
           <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 disabled:opacity-30 disabled:bg-slate-300 hover:bg-emerald-700 transition-all shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]"><ChevronLeft size={20} strokeWidth={3} /></button>
           <span className="font-black text-xs text-slate-500 uppercase tracking-widest bg-white border-2 border-slate-300 px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">Página {currentPage} de {totalPages}</span>
           <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 disabled:opacity-30 disabled:bg-slate-300 hover:bg-emerald-700 transition-all shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]"><ChevronRight size={20} strokeWidth={3} /></button>
        </div>
      )}

      {/* MODAL META (ADD/EDIT) */}
      {showForm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">
                {editingId ? 'Editar Objetivo' : 'Estruturar Nova Meta'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 p-2 hover:bg-slate-200 rounded-none transition-all"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
               <form id="goal-form" onSubmit={handleSubmitGoal} className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descrição do Objetivo</label><input required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem para Europa..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-inner" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor Final Alvo (R$)</label><input type="number" step="0.01" required value={targetValue} onChange={e => setTargetValue(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none font-black text-slate-800 outline-none focus:border-indigo-500 shadow-inner" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Previsão em Meses</label><input type="number" required value={monthsForecast} onChange={e => setMonthsForecast(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none font-black text-slate-800 outline-none focus:border-indigo-500 shadow-inner" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoria</label><select value={typeId} onChange={e => setTypeId(e.target.value)} className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-none text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-inner"><option value="">Selecione...</option>{goalTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Local da Reserva</label><select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-none text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-inner"><option value="">Selecione o Local...</option>{goalAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Anotações Estratégicas</label><textarea value={observation} onChange={e => setObservation(e.target.value)} rows={2} placeholder="Notas complementares..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none text-sm font-medium resize-none outline-none focus:border-indigo-500 shadow-inner" /></div>
               </form>
            </div>
            <div className="p-8 border-t-2 border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button disabled={isSubmitting} onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase hover:bg-slate-200 rounded-none transition-all">Cancelar</button>
              <button type="submit" disabled={isSubmitting} form="goal-form" className="px-10 py-3 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none">
                {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {editingId ? 'Salvar Alteração' : 'Criar Meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÕES DE EXCLUSÃO (METAS / TIPOS / LOCAIS) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md p-10 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 border-2 border-red-200 flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash size={40}/></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Remover Meta?</h3>
              <p className="text-slate-500 mb-8 text-sm px-4">Esta ação apagará permanentemente a meta <span className="font-black text-slate-800">"{deleteConfirm.goalName}"</span> e todos os seus aportes históricos.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDeleteGoal} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Remover Meta'}
                 </button>
                 <button onClick={() => setDeleteConfirm(null)} disabled={isSubmitting} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50 transition-all border-2 border-transparent hover:border-slate-200">Não, Manter</button>
              </div>
           </div>
        </div>
      )}

      {/* GERENCIADORES (TIPOS E LOCAIS) */}
      {isTypeManagerOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-lg flex flex-col max-h-[85vh]">
              <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 shadow-[3px_3px_0px_0px_rgba(67,56,202,1)]"><LayoutGrid size={20}/></div>
                  <h3 className="text-lg font-black uppercase italic text-slate-800">Categorias de Metas</h3>
                </div>
                <button onClick={() => setIsTypeManagerOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-none transition-all"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-5">
                 <button onClick={() => { setEditingTypeId(null); setNewTypeName(''); setNewTypeColor(PREDEFINED_COLORS[0]); setIsTypeEditOpen(true); }} className="w-full py-4 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-none font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all shadow-[3px_3px_0px_0px_rgba(16,185,129,0.05)]"><Plus size={16}/> Nova Categoria</button>
                 <div className="space-y-2">
                    {goalTypes.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-none border-2 border-slate-200 group hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-none border-2 border-white shadow-sm" style={{ backgroundColor: t.color }}></div>
                          <span className="font-black uppercase text-sm italic text-slate-700">{t.name}</span>
                        </div>
                        <div className="relative" ref={openTypeMenuId === t.id ? typeMenuRef : null}>
                           <button onClick={() => setOpenTypeMenuId(openTypeMenuId === t.id ? null : t.id)} className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-none border-2 border-transparent hover:border-indigo-700 transition-all"><MoreVertical size={20} /></button>
                           {openTypeMenuId === t.id && (
                             <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border-2 border-slate-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] z-30 animate-fade-in-up">
                                <button onClick={() => { setEditingTypeId(t.id); setNewTypeName(t.name); setNewTypeColor(t.color); setIsTypeEditOpen(true); setOpenTypeMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-slate-100"><Pencil size={14} /> Editar</button>
                                <button onClick={() => { setTypeDeleteConfirm({ isOpen: true, id: t.id, name: t.name }); setOpenTypeMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /> Excluir</button>
                             </div>
                           )}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {isAccountManagerOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-lg flex flex-col max-h-[85vh]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 shadow-[3px_3px_0px_0px_rgba(67,56,202,1)]"><Landmark size={20}/></div><h3 className="text-lg font-black uppercase italic text-slate-800">Locais de Reserva</h3></div><button onClick={() => setIsAccountManagerOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-none transition-all"><X size={24}/></button></div>
              <div className="flex-1 overflow-y-auto p-8 space-y-5">
                 <button onClick={() => { setEditingAccountId(null); setNewAccountName(''); setIsAccountEditOpen(true); }} className="w-full py-4 bg-indigo-50 text-indigo-600 border-2 border-indigo-200 rounded-none font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all shadow-[3px_3px_0px_0px_rgba(79,70,229,0.05)]"><Plus size={16}/> Novo Local de Custódia</button>
                 <div className="space-y-2">
                    {goalAccounts.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-none border-2 border-slate-200 group hover:bg-white transition-all">
                         <div className="flex items-center gap-4"><div className="p-2.5 bg-white border-2 border-slate-100 rounded-none shadow-sm text-indigo-500"><Landmark size={20}/></div><span className="font-black uppercase text-sm italic text-slate-700">{a.name}</span></div>
                         <div className="relative" ref={openAccountMenuId === a.id ? accountMenuRef : null}>
                            <button onClick={() => setOpenAccountMenuId(openAccountMenuId === a.id ? null : a.id)} className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-none border-2 border-transparent hover:border-indigo-700 transition-all"><MoreVertical size={20} /></button>
                            {openAccountMenuId === a.id && (
                              <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border-2 border-slate-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] z-30 animate-fade-in-up">
                                 <button onClick={() => { setEditingAccountId(a.id); setNewAccountName(a.name); setIsAccountEditOpen(true); setOpenAccountMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-slate-100"><Pencil size={14} /> Editar</button>
                                 <button onClick={() => { setAccountDeleteConfirm({ isOpen: true, id: a.id, name: a.name }); setOpenAccountMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /> Excluir</button>
                              </div>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FORMULÁRIOS DE CRIAÇÃO/EDIÇÃO (NESTED) */}
      {isTypeEditOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 animate-fade-in backdrop-blur-md">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 p-8 w-full max-w-sm space-y-6 animate-slide-in-up">
              <div className="flex justify-between items-center"><h3 className="font-black uppercase italic text-slate-800">{editingTypeId ? 'Editar Categoria' : 'Nova Categoria'}</h3><button onClick={() => setIsTypeEditOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button></div>
              <form onSubmit={handleSaveType} className="space-y-8">
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome</label><input required autoFocus value={newTypeName} onChange={e => setNewTypeName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-none border-2 border-slate-200 font-bold outline-none focus:border-indigo-500 shadow-inner" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Paleta Babylon</label><div className="grid grid-cols-5 gap-3">{PREDEFINED_COLORS.map(c => <button key={c} type="button" onClick={() => setNewTypeColor(c)} className={`w-9 h-9 rounded-none border-4 transition-all hover:scale-110 shadow-sm ${newTypeColor === c ? 'border-slate-800 shadow-md ring-2 ring-slate-200' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div></div>
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                   {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} Confirmar Definição
                </button>
              </form>
           </div>
        </div>
      )}

      {isAccountEditOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 animate-fade-in backdrop-blur-md">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 p-8 w-full max-w-sm space-y-6 animate-slide-in-up">
              <div className="flex justify-between items-center"><h3 className="font-black uppercase italic text-slate-800">{editingAccountId ? 'Editar Local' : 'Novo Local'}</h3><button onClick={() => setIsAccountEditOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button></div>
              <form onSubmit={handleSaveAccount} className="space-y-8">
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Instituição / Local</label><input required autoFocus value={newAccountName} onChange={e => setNewAccountName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-none border-2 border-slate-200 font-bold outline-none focus:border-indigo-500 shadow-inner" /></div>
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                   {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} Registrar Local
                </button>
              </form>
           </div>
        </div>
      )}

      {/* CONFIRMAÇÕES DE EXCLUSÃO (NESTED) */}
      {typeDeleteConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md p-10 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-none border-2 border-red-200 flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={40}/></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Excluir Categoria?</h3>
              <p className="text-slate-500 mb-8 text-sm px-4">Remover a categoria <span className="font-black text-slate-700 italic">"{typeDeleteConfirm.name}"</span>? Isso não apagará suas metas, mas elas ficarão sem categoria definida.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDeleteType} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Excluir Categoria'}
                 </button>
                 <button onClick={() => setTypeDeleteConfirm(null)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50 transition-all border-2 border-transparent">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      {accountDeleteConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md p-10 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-none border-2 border-red-200 flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash size={40}/></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Excluir Local?</h3>
              <p className="text-slate-500 mb-8 text-sm px-4">Remover o local <span className="font-black text-slate-800">"{accountDeleteConfirm.name}"</span> da sua base?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDeleteAccount} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Excluir Local'}
                 </button>
                 <button onClick={() => setAccountDeleteConfirm(null)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50 transition-all border-2 border-transparent">Não, Manter</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL APORTE */}
      {showAporteForm && selectedGoal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-md overflow-hidden animate-slide-in-up">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-emerald-50/50"><h3 className="text-xl font-black text-emerald-800 uppercase italic">Lançar Depósito</h3><button onClick={() => setShowAporteForm(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-none transition-all"><X size={24}/></button></div>
            <form onSubmit={handleSubmitAporte} className="p-8 space-y-6">
               <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Meta: <span className="text-slate-800">{selectedGoal.name}</span></label><input type="number" step="0.01" autoFocus required value={aporteAmount} onChange={e => setAporteAmount(e.target.value)} placeholder="0,00" className="w-full px-5 py-6 bg-slate-50 border-2 border-emerald-100 rounded-none text-3xl font-black text-emerald-600 outline-none text-center focus:border-emerald-500 transition-all shadow-inner" /></div>
               <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data</label><input type="date" required value={aporteDate} onChange={e => setAporteDate(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-inner" /></div>
               <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none">
                 {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20}/>} Confirmar Depósito
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
