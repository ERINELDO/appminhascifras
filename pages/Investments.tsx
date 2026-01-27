
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Investment, Withdrawal, InvestmentType } from '../types';
import { 
  Wallet, Plus, TrendingUp, Building, Trash2, ListPlus, X, Save, Pencil, 
  ArrowDownRight, Info, Monitor, Smartphone, Globe, Loader2, LayoutGrid, 
  CheckCircle2, AlertCircle, Calendar, MoreVertical, ShieldCheck, 
  ArrowUpRight, Landmark, Activity, Hash, ChevronDown, RotateCcw, CalendarDays, Trash
} from 'lucide-react';
import { api } from '../services/api';

interface InvestmentsProps {
  investments: Investment[];
  investmentTypes: InvestmentType[];
  onAddInvestment: (inv: Omit<Investment, 'id'>) => void;
  onEditInvestment: (inv: Investment) => void;
  onDeleteInvestment: (id: string) => void;
  onRefreshInvestmentTypes: () => void;
  onWithdraw: (withdrawal: Withdrawal) => void;
}

const PREDEFINED_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#64748b', '#000000',
  '#fb923c', '#a3e635', '#2dd4bf', '#818cf8', '#fb7185'
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const Investments: React.FC<InvestmentsProps> = ({ 
  investments, 
  investmentTypes, 
  onAddInvestment, 
  onEditInvestment,
  onDeleteInvestment,
  onRefreshInvestmentTypes,
  onWithdraw
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const [isTypeEditOpen, setIsTypeEditOpen] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Modais de Confirmação
  const [typeDeleteConfirm, setTypeDeleteConfirm] = useState<{isOpen: boolean, id: string, name: string} | null>(null);
  const [assetDeleteConfirm, setAssetDeleteConfirm] = useState<{isOpen: boolean, id: string, name: string} | null>(null);

  // Filtros de Busca e Período
  const [filterMonth, setFilterMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) range.push(i);
    return range;
  }, []);

  // Filtro de Ativos
  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => {
      const invDate = new Date(inv.date + 'T12:00:00');
      const matchesMonth = filterMonth === 'all' ? true : (invDate.getMonth() + 1).toString() === filterMonth;
      const matchesYear = filterYear === 'all' ? true : invDate.getFullYear().toString() === filterYear;
      const matchesCategory = filterCategory === 'all' ? true : inv.type === filterCategory;
      const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesMonth && matchesYear && matchesCategory && matchesSearch;
    });
  }, [investments, filterMonth, filterYear, filterCategory, searchTerm]);

  // Type Editor States
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(PREDEFINED_COLORS[0]);
  
  // Investment Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Withdrawal Form State
  const [wInvestmentId, setWInvestmentId] = useState('');
  const [wQuantity, setWQuantity] = useState('');
  const [wValue, setWValue] = useState('');
  const [wObservation, setWObservation] = useState('');

  useEffect(() => {
    if (investmentTypes.length > 0 && !type) {
      setType(investmentTypes[0].name);
    }
  }, [investmentTypes]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (wInvestmentId) {
      const selected = investments.find(inv => inv.id === wInvestmentId);
      if (selected) {
        setWQuantity(selected.quantity);
        setWValue(selected.value.toString());
      }
    } else {
      setWQuantity('');
      setWValue('');
    }
  }, [wInvestmentId, investments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWValueChange = (newVal: string) => {
    setWValue(newVal);
    const selected = investments.find(inv => inv.id === wInvestmentId);
    if (selected && selected.value > 0) {
      const v = parseFloat(newVal);
      if (!isNaN(v)) {
        const currentQtyStr = selected.quantity.replace(',', '.');
        const totalQty = parseFloat(currentQtyStr);
        const proportionalQty = (v / selected.value) * totalQty;
        if (v >= selected.value) {
          setWQuantity(selected.quantity);
        } else {
          setWQuantity(proportionalQty.toLocaleString('pt-BR', { maximumFractionDigits: 6 }));
        }
      }
    }
  };

  useEffect(() => {
    const q = parseFloat(quantity.replace(',', '.'));
    const uv = parseFloat(unitValue.replace(',', '.'));
    if (!isNaN(q) && !isNaN(uv)) {
      setValue((q * uv).toFixed(2));
    }
  }, [quantity, unitValue]);

  const resetForm = () => {
    setName('');
    setType(investmentTypes[0]?.name || '');
    setLocation('');
    setQuantity('');
    setUnitValue('');
    setValue('');
    setDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
    setShowForm(false);
    setIsSubmitting(false);
  };

  const resetFilters = () => {
    setFilterMonth('all');
    setFilterYear('all');
    setFilterCategory('all');
    setSearchTerm('');
  };

  const resetWithdrawForm = () => {
    setWInvestmentId('');
    setWQuantity('');
    setWValue('');
    setWObservation('');
    setShowWithdrawModal(false);
    setIsSubmitting(false);
  };

  const handleEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setName(inv.name);
    setType(inv.type);
    setLocation(inv.location);
    setQuantity(inv.quantity);
    setValue(inv.value.toString());
    setDate(inv.date.split('T')[0]);
    const q = parseFloat(inv.quantity.replace(',', '.'));
    if (!isNaN(q) && q !== 0) {
      setUnitValue((inv.value / q).toFixed(2));
    } else {
      setUnitValue('');
    }
    setOpenMenuId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const investmentData: any = {
      name,
      type,
      location,
      quantity,
      value: parseFloat(value),
      date: date
    };
    try {
      if (editingId) onEditInvestment({ ...investmentData, id: editingId });
      else onAddInvestment(investmentData);
      setNotification({ message: 'Ativo alocado na carteira com sucesso!', type: 'success' });
      resetForm();
    } catch (err) {
      setNotification({ message: 'Erro técnico ao registrar ativo.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  const handleWithdrawRequest = (inv: Investment) => {
    setWInvestmentId(inv.id);
    setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wInvestmentId || !wValue || isSubmitting) return;
    
    setIsSubmitting(true);
    const selectedInv = investments.find(inv => inv.id === wInvestmentId);
    if (!selectedInv) return;

    const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
    const simulatedIp = `177.200.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    const withdrawalData: Withdrawal = {
      id: `temp-${Date.now()}`,
      investmentId: wInvestmentId,
      investmentName: selectedInv.name,
      quantity: wQuantity,
      value: parseFloat(wValue),
      date: new Date().toISOString(),
      observation: wObservation,
      deviceIp: simulatedIp,
      deviceType: deviceType
    };

    try {
      await onWithdraw(withdrawalData);
      setNotification({ message: 'Saque processado e saldo atualizado!', type: 'success' });
      resetWithdrawForm();
    } catch (err) {
      setNotification({ message: 'Erro ao processar saque.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingTypeId) {
        await api.updateInvestmentType(editingTypeId, { name: newTypeName, color: newTypeColor });
        setNotification({ message: 'Categoria atualizada!', type: 'success' });
      } else {
        await api.addInvestmentType({ name: newTypeName, color: newTypeColor });
        setNotification({ message: 'Identidade visual e categoria registradas!', type: 'success' });
      }
      setIsTypeEditOpen(false);
      onRefreshInvestmentTypes();
    } catch (err) {
      setNotification({ message: 'Falha ao salvar categoria.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteType = async () => {
    if (!typeDeleteConfirm || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteInvestmentType(typeDeleteConfirm.id);
      setNotification({ message: `Categoria "${typeDeleteConfirm.name}" removida com sucesso!`, type: 'success' });
      setTypeDeleteConfirm(null);
      onRefreshInvestmentTypes();
    } catch (err: any) {
      setNotification({ 
        message: 'Não é possível excluir categorias com ativos vinculados.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteAsset = async () => {
    if (!assetDeleteConfirm || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDeleteInvestment(assetDeleteConfirm.id);
      setNotification({ message: `Ativo "${assetDeleteConfirm.name}" removido da carteira!`, type: 'success' });
      setAssetDeleteConfirm(null);
    } catch (err: any) {
      setNotification({ message: 'Erro ao excluir ativo do banco de dados.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if(!dateStr) return '—';
    const parts = dateStr.split('-');
    if(parts.length < 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const getAssetTypeColor = (typeName: string) => {
    const t = investmentTypes.find(it => it.name === typeName);
    return t ? t.color : '#94a3b8';
  };

  const totalInvested = investments.reduce((acc, inv) => acc + inv.value, 0);
  const filteredTotal = filteredInvestments.reduce((acc, inv) => acc + inv.value, 0);

  return (
    <div className="space-y-6 relative pb-24">
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-bounce-in">
          <div className={`px-6 py-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex items-center gap-3 border-2 ${notification.type === 'success' ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 transition-opacity"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* HEADER E AÇÕES */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic uppercase">Minha Carteira</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsTypeManagerOpen(true)} className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 px-6 py-3 rounded-none flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] active:shadow-none active:translate-x-0 active:translate-y-0">
            <LayoutGrid size={18} /> Categorias
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-none border-2 border-emerald-700 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] transition-all font-black text-[10px] uppercase tracking-widest active:shadow-none active:translate-x-1 active:translate-y-1">
            <Plus size={20} /> Novo Ativo
          </button>
        </div>
      </div>

      {/* PATRIMÔNIO TOTAL */}
      <div className="bg-slate-900 rounded-none p-8 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] relative overflow-hidden border-2 border-slate-800">
        <div className="absolute right-0 top-0 opacity-5 -mr-10 -mt-10 pointer-events-none text-white"><Wallet size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-slate-500 font-black mb-1.5 uppercase text-[10px] tracking-[0.3em]">Patrimônio Total Estruturado</p>
            <h3 className="text-4xl font-black italic tracking-tighter text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvested)}
            </h3>
            <div className="mt-4 flex items-center gap-3">
               <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-none text-[9px] font-black uppercase border-2 border-emerald-500/20 flex items-center gap-2 tracking-widest">
                 <ShieldCheck size={14} /> Carteira Verificada
               </div>
               <div className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-none text-[9px] font-black uppercase border-2 border-indigo-500/20 flex items-center gap-2 tracking-widest">
                 <Activity size={14} /> Ativos em Fluxo
               </div>
            </div>
          </div>
          {filteredTotal !== totalInvested && (
             <div className="bg-white/5 backdrop-blur-sm border-2 border-white/10 p-5 rounded-none text-right">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Total no Filtro</p>
                <p className="text-2xl font-black text-indigo-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filteredTotal)}</p>
             </div>
          )}
        </div>
      </div>

      {/* NOVO PAINEL DE FILTROS DESTACADOS */}
      <div className="flex flex-col xl:flex-row gap-6 animate-fade-in">
          {/* INDICADOR DE VISÃO */}
          <div className="bg-white border-2 border-indigo-600 p-4 md:p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(79,70,229,1)] flex items-center gap-5 min-w-[280px] shrink-0">
              <div className="p-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 rounded-none">
                 {filterMonth === 'all' && filterYear === 'all' && filterCategory === 'all' ? <Globe size={24} /> : <CalendarDays size={24} />}
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Visão da Carteira</p>
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">
                   {filterMonth === 'all' && filterYear === 'all' 
                     ? 'Portfólio Global' 
                     : filterMonth === 'all' 
                        ? `Aportes de ${filterYear}` 
                        : `Aportes: ${MONTHS[parseInt(filterMonth)-1]} ${filterYear === 'all' ? '' : filterYear}`}
                 </h3>
              </div>
          </div>

          {/* CARD DE SELEÇÃO RÁPIDA DE PERÍODO */}
          <div className="bg-white border-2 border-slate-300 p-4 md:p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(203,213,225,1)] flex flex-col sm:flex-row items-center gap-5 min-w-[320px] shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-700 tracking-[0.1em]">
                <Calendar size={18} className="text-indigo-600" />
                <span>Mês de Aporte</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-40">
                  <select 
                    value={filterMonth} 
                    onChange={e => setFilterMonth(e.target.value)} 
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
                    onChange={e => setFilterYear(e.target.value)} 
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none text-[11px] font-black uppercase text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all pr-8"
                  >
                    <option value="all">Todos</option>
                    {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
          </div>

          {/* CARD DE CATEGORIAS */}
          <div className="bg-white border-2 border-slate-300 p-4 md:p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(203,213,225,1)] flex flex-col sm:flex-row items-center gap-5 min-w-[280px] shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-700 tracking-[0.1em]">
                <LayoutGrid size={18} className="text-indigo-600" />
                <span>Segmento</span>
              </div>
              <div className="relative w-full sm:w-48">
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)} 
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none text-[11px] font-black uppercase text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all pr-8"
                >
                  <option value="all">Todas as Categorias</option>
                  {investmentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
          </div>
          
          <div className="flex-1 flex items-center">
             <button onClick={resetFilters} className="text-slate-400 hover:text-red-500 font-black text-[10px] uppercase flex items-center gap-2 px-4 py-2 hover:bg-red-50 transition-all rounded-none"><RotateCcw size={14}/> Limpar Atalhos</button>
          </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO (EXPANSÍVEL) */}
      {showForm && (
        <div className="bg-white p-8 rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] border-2 border-slate-300 animate-fade-in-down mb-6">
          <div className="flex justify-between items-center mb-8 border-b-2 border-slate-50 pb-4">
             <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">{editingId ? 'Editar Investimento' : 'Aporte de Ativo'}</h3>
             <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ativo (Ticker/Nome)</label>
                <input required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex: PETR4, Bitcoin..." className="w-full border-2 border-slate-200 bg-slate-50 rounded-none p-4 focus:border-indigo-500 outline-none font-bold text-slate-700 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corretora de Custódia</label>
                <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Binance, XP..." className="w-full border-2 border-slate-200 bg-slate-50 rounded-none p-4 focus:border-indigo-500 outline-none font-bold text-slate-700 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Segmento do Ativo</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full border-2 border-slate-200 bg-slate-50 rounded-none p-4 outline-none font-bold text-slate-700 shadow-inner">
                  <option value="">Selecione...</option>
                  {investmentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data da Operação</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border-2 border-slate-200 bg-slate-50 rounded-none p-4 outline-none font-bold text-slate-600 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd Adquirida</label>
                <input type="text" required value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Ex: 10,5" className="w-full border-2 border-slate-200 bg-slate-50 rounded-none p-4 outline-none font-bold text-slate-700 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Pago Unitário (R$)</label>
                <input type="number" step="0.01" value={unitValue} onChange={e => setUnitValue(e.target.value)} placeholder="0.00" className="w-full border-2 border-slate-200 bg-slate-50 rounded-none p-4 outline-none font-black text-slate-800 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Investimento Total (R$)</label>
                <input type="number" step="0.01" required value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="w-full border-2 border-slate-200 bg-slate-50 rounded-none p-4 outline-none font-black text-emerald-600 shadow-inner" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={resetForm} className="px-8 py-3 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-100 rounded-none transition-all">Descartar</button>
              <button type="submit" disabled={isSubmitting} className="px-12 py-4 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 hover:bg-indigo-700 flex items-center justify-center gap-3 font-black text-[10px] uppercase shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Finalizar Registro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GRID DE CARDS DE INVESTIMENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInvestments.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.02)]">
             <ListPlus size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
             <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] italic">Nenhum ativo encontrado para este filtro.</p>
             <button onClick={resetFilters} className="mt-4 text-indigo-600 font-black text-[10px] uppercase underline">Ver Tudo</button>
          </div>
        ) : (
          filteredInvestments.map((inv) => (
            <div key={inv.id} className="bg-white rounded-none border-2 border-slate-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.08)] transition-all group relative overflow-hidden flex flex-col h-full animate-fade-in">
              
              <div className="absolute top-0 right-0">
                 <span className="px-4 py-2 text-[11px] font-black uppercase border-l-2 border-b-2 bg-slate-50 text-slate-500 border-slate-300 shadow-sm">
                   Aporte: <span className="text-slate-800 ml-1 font-mono">{formatDate(inv.date)}</span>
                 </span>
              </div>

              <div className="p-6 pt-12 space-y-5 flex-1">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)] shrink-0">
                    <Building size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase italic truncate leading-tight mb-1.5" title={inv.name}>
                      {inv.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-none text-[8px] font-black uppercase border-2" style={{ backgroundColor: `${getAssetTypeColor(inv.type)}15`, color: getAssetTypeColor(inv.type), borderColor: `${getAssetTypeColor(inv.type)}40` }}>
                        {inv.type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Landmark size={10} className="text-slate-300" /> {inv.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-4">
                   <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Patrimônio Alocado</span>
                         <span className="text-xl font-black tracking-tighter text-emerald-600">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value)}
                         </span>
                      </div>
                      <div className="flex flex-col text-right">
                         <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Qtd</span>
                         <span className="text-xs font-black text-slate-600 font-mono italic">{inv.quantity}</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => handleWithdrawRequest(inv)}
                        className="flex-1 py-2.5 bg-amber-100 text-amber-700 border-2 border-amber-200 rounded-none font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 hover:text-white hover:border-amber-700 transition-all shadow-[3px_3px_0px_0px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2"
                      >
                         <ArrowDownRight size={14} /> Efetuar Saque
                      </button>

                      <div className="relative" ref={openMenuId === inv.id ? menuRef : null}>
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                          className="p-2.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-none border-2 border-transparent hover:border-indigo-700 transition-all"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenuId === inv.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border-2 border-slate-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] z-30 animate-fade-in-up">
                             <button onClick={() => handleEdit(inv)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-slate-100">
                                <Pencil size={14} /> Editar
                             </button>
                             <button onClick={() => setAssetDeleteConfirm({ isOpen: true, id: inv.id, name: inv.name })} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 size={14} /> Excluir
                             </button>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL SAQUE */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-lg overflow-hidden">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-amber-50/50">
              <div className="flex items-center gap-3 text-amber-800 font-black italic">
                <ArrowDownRight size={24} />
                <h3 className="text-xl uppercase italic tracking-tight">Solicitar Retirada</h3>
              </div>
              <button onClick={resetWithdrawForm} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-none transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleWithdrawSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ativo sob Custódia</label>
                <select required value={wInvestmentId} onChange={e => setWInvestmentId(e.target.value)} className="w-full p-4 rounded-none border-2 border-slate-200 focus:border-amber-500 outline-none bg-slate-50 font-black text-slate-800 shadow-inner">
                  <option value="">Selecione um ativo...</option>
                  {investments.filter(inv => inv.value > 0).map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.quantity}) - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd Retirada</label>
                  <input required value={wQuantity} onChange={e => setWQuantity(e.target.value)} className="w-full p-4 rounded-none border-2 border-slate-200 outline-none bg-slate-50 font-bold text-slate-600 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Bruto (R$)</label>
                  <input required type="number" step="0.01" value={wValue} onChange={e => handleWValueChange(e.target.value)} className="w-full p-4 rounded-none border-2 border-slate-200 outline-none font-black text-2xl text-red-600 shadow-inner" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Justificativa da Saída</label>
                <textarea value={wObservation} onChange={e => setWObservation(e.target.value)} rows={2} placeholder="Ex: Rebalanceamento, Emergência..." className="w-full p-4 rounded-none border-2 border-slate-200 outline-none resize-none font-medium shadow-inner" />
              </div>
              <div className="p-5 bg-blue-50 rounded-none flex gap-4 border-2 border-blue-100 text-blue-800">
                <ShieldCheck size={24} className="shrink-0 text-blue-600" />
                <p className="text-[10px] font-black uppercase leading-relaxed tracking-tighter">
                  Esta operação será registrada permanentemente no seu histórico de saques com rastro de IP e dispositivo.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-50">
                <button type="button" onClick={resetWithdrawForm} className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-12 py-4 bg-amber-600 text-white rounded-none border-2 border-amber-700 font-black text-[10px] uppercase hover:bg-amber-700 shadow-[6px_6px_0px_0px_rgba(217,119,6,1)] transition-all flex items-center justify-center gap-3 active:shadow-none active:translate-x-1 active:translate-y-1">
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <ArrowDownRight size={20} />} Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GERENCIADOR DE CATEGORIAS */}
      {isTypeManagerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 shadow-sm"><LayoutGrid size={20} /></div>
                    <h3 className="text-lg font-black text-slate-800 uppercase italic">Categorias de Ativos</h3>
                 </div>
                 <button onClick={() => setIsTypeManagerOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                 <button onClick={() => { setEditingTypeId(null); setNewTypeName(''); setNewTypeColor(PREDEFINED_COLORS[0]); setIsTypeEditOpen(true); }} className="w-full py-4 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-none font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                    <Plus size={16} /> Nova Categoria
                 </button>
                 <div className="space-y-2">
                    {investmentTypes.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50 border-2 border-slate-100 rounded-none group hover:bg-white hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-none border-2 border-white shadow-sm" style={{ backgroundColor: t.color }}></div>
                           <span className="font-black text-slate-700 uppercase italic text-sm">{t.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => { setEditingTypeId(t.id); setNewTypeName(t.name); setNewTypeColor(t.color); setIsTypeEditOpen(true); }} className="p-2 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 rounded-none transition-all hover:bg-indigo-600 hover:text-white"><Pencil size={18} /></button>
                           <button onClick={() => setTypeDeleteConfirm({ isOpen: true, id: t.id, name: t.name })} className="p-2 bg-red-50 text-red-600 border-2 border-red-100 rounded-none transition-all hover:bg-red-600 hover:text-white"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO ATIVO (SIM/NÃO) */}
      {assetDeleteConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md p-10 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 border-2 border-red-200 flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash size={40}/></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Excluir Ativo?</h3>
              <p className="text-slate-500 mb-8 text-sm px-4">Esta ação apagará o ativo <span className="font-black text-slate-800">"{assetDeleteConfirm.name}"</span> permanentemente da sua base de dados.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDeleteAsset} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Excluir do Banco'}
                 </button>
                 <button onClick={() => setAssetDeleteConfirm(null)} disabled={isSubmitting} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50 transition-all border-2 border-transparent hover:border-slate-200">Não, Manter</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO CATEGORIA (SIM/NÃO) */}
      {typeDeleteConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md p-10 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 border-2 border-red-200 flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash size={40}/></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Remover Categoria?</h3>
              <p className="text-slate-500 mb-8 text-sm px-4">Esta ação apagará a categoria <span className="font-black text-slate-800">"{typeDeleteConfirm.name}"</span>. Ela não poderá ser removida se houver ativos vinculados.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDeleteType} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Remover Categoria'}
                 </button>
                 <button onClick={() => setTypeDeleteConfirm(null)} disabled={isSubmitting} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50 transition-all border-2 border-transparent hover:border-slate-200">Não, Manter</button>
              </div>
           </div>
        </div>
      )}

      {/* EDIÇÃO DE CATEGORIA */}
      {isTypeEditOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-sm overflow-hidden p-10 space-y-8 animate-slide-in-up">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">{editingTypeId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                 <button onClick={() => setIsTypeEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={28} /></button>
              </div>
              <form onSubmit={handleSaveType} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome da Categoria</label>
                    <input required autoFocus value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Ex: Renda Fixa..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none font-bold text-slate-700 focus:border-indigo-500 shadow-inner" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Identidade Visual</label>
                    <div className="grid grid-cols-5 gap-3">
                       {PREDEFINED_COLORS.map(color => (
                         <button key={color} type="button" onClick={() => setNewTypeColor(color)} className={`w-10 h-10 rounded-none border-4 transition-all shadow-sm ${newTypeColor === color ? 'border-slate-800 ring-2 ring-slate-200 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                       ))}
                    </div>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 border-2 border-indigo-700 text-white rounded-none font-black text-[10px] uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all active:translate-x-1 active:translate-y-1">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Definição'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
