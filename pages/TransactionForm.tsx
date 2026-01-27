
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType, RecurrenceFrequency, Category, RecurrenceLimitType, TransactionStatus, TransactionConfirmation } from '../types';
import { 
  Save, Trash2, Calendar, Plus, X, Search, ArrowUpCircle, ArrowDownCircle, 
  Filter, Pencil, ListPlus, Eye, CheckCircle2, AlertCircle, 
  Info, RotateCcw, Repeat, ChevronLeft, ChevronRight, Share2, Paperclip, 
  Check, FileText, Smartphone, ChevronDown, CheckCircle, ChevronUp, Hash,
  LayoutGrid, Pause, Play, AlertTriangle, ListFilter, SlidersHorizontal, Trash, Tag, Activity, ShieldCheck, Lock, Loader2, Clock, MoreVertical,
  Scale, Calculator, Wallet, CalendarDays
} from 'lucide-react';
import { api } from '../services/api';

interface TransactionFormProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string, deleteAllRecurring?: boolean) => void;
  categories: Category[];
  onRefreshCategories: () => void;
  onRefreshData?: () => void;
  initialType?: TransactionType | null;
  onClearInitialType?: () => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const PREDEFINED_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#64748b', '#000000',
  '#fb923c', '#a3e635', '#2dd4bf', '#818cf8', '#fb7185'
];

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  transactions, 
  onAddTransaction, 
  onEditTransaction,
  onDeleteTransaction,
  categories,
  onRefreshCategories,
  onRefreshData,
  initialType,
  onClearInitialType
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCategoryEditOpen, setIsCategoryEditOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openCatMenuId, setOpenCatMenuId] = useState<string | null>(null);
  
  // Modal de Confirmação de Pagamento/Recebimento
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, transaction: Transaction | null, value: string}>({
    isOpen: false,
    transaction: null,
    value: ''
  });

  // Controle de busca de categoria
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, transaction: Transaction | null}>({
    isOpen: false,
    transaction: null
  });

  // Novo estado para confirmação de exclusão de categoria
  const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState<{isOpen: boolean, category: Category | null}>({
    isOpen: false,
    category: null
  });

  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 12;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'Todos'>('Todos');
  const [filterType, setFilterType] = useState<TransactionType | 'todos'>('todos');

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>('despesa');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TransactionStatus>('Pendente');
  const [description, setDescription] = useState('');
  const [observation, setObservation] = useState('');
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('mensal');
  const [limitType, setLimitType] = useState<RecurrenceLimitType>('forever');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState('12');

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PREDEFINED_COLORS[0]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) range.push(i);
    return range;
  }, []);

  useEffect(() => {
    const m = parseInt(selectedMonth);
    const y = parseInt(selectedYear);
    if (selectedMonth === 'all') {
      setFilterStartDate(`${y}-01-01`);
      setFilterEndDate(`${y}-12-31`);
    } else {
      const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
      setFilterStartDate(firstDay);
      setFilterEndDate(lastDay);
    }
    setCurrentPageNum(1); 
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (type === 'reserva') {
      setCategory('Reserva de Emergência');
      setCategorySearch('Reserva de Emergência');
    }
  }, [type]);

  useEffect(() => {
    if (initialType) {
      setFilterType(initialType);
      if (onClearInitialType) onClearInitialType();
    }
  }, [initialType]);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (catMenuRef.current && !catMenuRef.current.contains(event.target as Node)) {
        setOpenCatMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? t.category === filterCategory : true;
      const matchesStartDate = filterStartDate ? t.date >= filterStartDate : true;
      const matchesEndDate = filterEndDate ? t.date <= filterEndDate : true;
      const matchesStatus = filterStatus !== 'Todos' ? t.status === filterStatus : true;
      const matchesType = filterType !== 'todos' ? t.type === filterType : true;
      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate && matchesStatus && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterCategory, filterStartDate, filterEndDate, filterStatus, filterType]);

  const filteredStats = useMemo(() => {
    const receitas = filteredTransactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
    const despesas = filteredTransactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
    const reservas = filteredTransactions.filter(t => t.type === 'reserva').reduce((acc, t) => acc + t.amount, 0);
    return {
      receitas,
      despesas,
      reservas,
      saldo: receitas - despesas - reservas
    };
  }, [filteredTransactions]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterCategory) count++;
    if (selectedMonth !== 'all') count++;
    if (filterStatus !== 'Todos') count++;
    if (filterType !== 'todos') count++;
    return count;
  }, [filterCategory, selectedMonth, filterStatus, filterType]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPageNum - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPageNum]);

  const handleOpenNew = () => {
    setEditingId(null); setAmount(''); setDescription(''); setObservation(''); setCategory('');
    setCategorySearch('');
    setDate(new Date().toISOString().split('T')[0]); setIsRecurring(false);
    setFrequency('mensal'); setLimitType('forever'); setRecurrenceEndDate('');
    setRecurrenceCount('12'); setStatus('Pendente'); setType('despesa');
    setAttachment(undefined); setIsModalOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id); setType(t.type); setAmount(t.amount.toString());
    setCategory(t.category); setCategorySearch(t.category);
    setDate(t.date); setStatus(t.status);
    setDescription(t.description); setObservation(t.observation || '');
    setAttachment(t.attachment); setIsRecurring(t.isRecurring);
    if (t.frequency) setFrequency(t.frequency);
    if (t.recurrenceLimitType) setLimitType(t.recurrenceLimitType);
    if (t.recurrenceEndDate) setRecurrenceEndDate(t.recurrenceEndDate);
    if (t.recurrenceCount) setRecurrenceCount(t.recurrenceCount.toString());
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const filteredCategories = useMemo(() => {
    const list = [{ id: 'lazer', name: 'Lazer' }, ...categories.filter(c => c.name !== 'Lazer')];
    return list.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [categories, categorySearch]);

  const handleSelectCategory = (name: string) => {
    setCategory(name);
    setCategorySearch(name);
    setShowCategoryDropdown(false);
  };

  const handleQuickConfirm = (t: Transaction) => {
    const alreadyPaid = (t.confirmations || []).reduce((acc, c) => acc + c.amount, 0);
    const remaining = Math.max(0, t.amount - alreadyPaid);
    
    setConfirmModal({
      isOpen: true,
      transaction: t,
      value: remaining.toFixed(2)
    });
    setOpenMenuId(null);
  };

  const executeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = confirmModal.transaction;
    if (!t || !confirmModal.value || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payAmount = parseFloat(confirmModal.value);
      if (isNaN(payAmount)) throw new Error("Valor inválido");

      const previousPaid = (t.confirmations || []).reduce((acc, c) => acc + c.amount, 0);
      const totalPaid = previousPaid + payAmount;

      await api.addTransactionConfirmation({
        transactionId: t.id,
        amount: payAmount
      });

      if (totalPaid >= t.amount) {
        const { confirmations, transaction_confirmations, transactionConfirmations, ...cleanTransaction } = t as any;
        await api.addTransaction({
          ...cleanTransaction,
          status: 'Efetivado',
          paymentDate: new Date().toISOString()
        });
        setNotification({ message: 'Lançamento totalmente liquidado!', type: 'success' });
      } else {
        setNotification({ message: `Pagamento parcial de ${formatCurrency(payAmount)} registrado.`, type: 'success' });
      }

      setConfirmModal({ isOpen: false, transaction: null, value: '' });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setNotification({ message: 'Erro ao registrar confirmação: ' + (err.message || 'Erro técnico'), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (t: Transaction) => {
    setDeleteConfirmation({ isOpen: true, transaction: t });
    setOpenMenuId(null);
  };

  const executeDelete = async (deleteAll: boolean) => {
    const t = deleteConfirmation.transaction;
    if (!t) return;
    try {
      await api.deleteTransaction(t.id, deleteAll);
      setDeleteConfirmation({ isOpen: false, transaction: null });
      setNotification({ message: deleteAll ? 'Série removida.' : 'Removido com sucesso.', type: 'success' });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setNotification({ message: 'Erro ao excluir.', type: 'error' });
    }
  };

  // Funções para exclusão de categoria via modal
  const handleCategoryDeleteRequest = (cat: Category) => {
    setCategoryDeleteConfirm({ isOpen: true, category: cat });
    setOpenCatMenuId(null);
  };

  const executeDeleteCategory = async () => {
    const cat = categoryDeleteConfirm.category;
    if (!cat) return;
    setIsSubmitting(true);
    try {
      await api.deleteCategory(cat.id);
      setNotification({ message: `Categoria "${cat.name}" excluída com sucesso!`, type: 'success' });
      setCategoryDeleteConfirm({ isOpen: false, category: null });
      onRefreshCategories();
    } catch (err: any) {
      console.error(err);
      setNotification({ 
        message: 'Falha ao excluir categoria. Verifique se existem lançamentos usando esta categoria ou suas permissões.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const baseData: any = {
        type, 
        amount: parseFloat(amount), 
        category, 
        status, 
        description,
        observation, 
        date, 
        attachment, 
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        recurrenceLimitType: isRecurring ? limitType : undefined,
        recurrenceEndDate: isRecurring && limitType === 'until_date' ? recurrenceEndDate : undefined,
        recurrenceCount: isRecurring && limitType === 'count' ? parseInt(recurrenceCount) : undefined,
        paymentDate: status === 'Efetivado' ? new Date().toISOString() : undefined
      };

      if (editingId) {
        await api.addTransaction({ ...baseData, id: editingId });
      } else if (isRecurring) {
        const recurrenceGroupId = crypto.randomUUID();
        const batch: any[] = [];
        let currentDate = new Date(date + 'T12:00:00');
        let iterations = 0;
        if (limitType === 'count') iterations = parseInt(recurrenceCount) || 1;
        else if (limitType === 'forever') iterations = 12; 
        else if (limitType === 'until_date') iterations = 500; 

        for (let i = 0; i < iterations; i++) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (limitType === 'until_date' && recurrenceEndDate && dateStr > recurrenceEndDate) break;
          batch.push({
            ...baseData,
            date: dateStr,
            recurrenceGroupId,
            description: limitType === 'count' ? `${description} (${i+1}/${iterations})` : description,
            status: i === 0 ? status : 'Pendente'
          });
          if (frequency === 'mensal') currentDate.setMonth(currentDate.getMonth() + 1);
          else if (frequency === 'anual') currentDate.setFullYear(currentDate.getFullYear() + 1);
          else if (frequency === 'quinzenal') currentDate.setDate(currentDate.getDate() + 15);
        }
        await api.addTransactionsBatch(batch);
      } else {
        await api.addTransaction(baseData);
      }

      setNotification({ message: 'Lançamento salvo com sucesso!', type: 'success' });
      setIsModalOpen(false);
      onRefreshCategories();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setNotification({ message: 'Erro ao processar lançamento.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName === 'Lazer') {
       alert('Este nome é reservado pelo sistema.');
       return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingCategoryId) {
        await api.updateCategory(editingCategoryId, { name: newCategoryName, color: newCategoryColor });
        setNotification({ message: 'Categoria atualizada!', type: 'success' });
      } else {
        await api.addCategory({ name: newCategoryName, color: newCategoryColor });
        setNotification({ message: 'Nova categoria criada!', type: 'success' });
      }
      setIsCategoryEditOpen(false);
      onRefreshCategories();
    } catch (err) {
      setNotification({ message: 'Erro ao salvar categoria.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm(''); setFilterCategory(''); setFilterStatus('Todos'); setFilterType('todos');
    setSelectedMonth(new Date().getMonth().toString());
    setSelectedYear(new Date().getFullYear().toString());
    setShowFilters(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getCategoryColor = (catName: string) => {
    if (catName === 'Reserva de Emergência') return '#f59e0b';
    if (catName === 'Lazer') return '#6366f1';
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : '#94a3b8';
  };

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case 'Efetivado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pendente': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Vencido': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const currentEditingTransaction = useMemo(() => {
    if (!editingId) return null;
    return transactions.find(t => t.id === editingId);
  }, [editingId, transactions]);

  return (
    <div className="space-y-6 relative pb-24">
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-bounce-in">
          <div className={`px-6 py-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex items-center gap-3 border-2 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 transition-opacity"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic">Lançamentos</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setIsCategoryManagerOpen(true)} 
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 border-2 border-slate-300 rounded-none hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] font-black text-[10px] uppercase tracking-widest active:shadow-none active:translate-x-0 active:translate-y-0"
            >
              <LayoutGrid size={18} />
              Categorias
            </button>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all border-2 ${showFilters || activeFiltersCount > 0 ? 'bg-indigo-600 text-white border-indigo-700 shadow-[4px_4px_0px_0px_rgba(67,56,202,1)]' : 'bg-white text-slate-600 border-slate-300 shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] hover:bg-slate-50'}`}
            >
              <SlidersHorizontal size={18} />
              Filtros {activeFiltersCount > 0 && <span className="ml-1 bg-white/20 px-1.5 rounded-full">{activeFiltersCount}</span>}
            </button>

            <button onClick={handleOpenNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-none border-2 border-emerald-700 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] transition-all font-black text-[10px] uppercase tracking-widest active:shadow-none active:translate-x-1 active:translate-y-1">
              <Plus size={20} /> Novo Lançamento
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
           {/* CARD EXPOSTO DO MÊS FILTRADO */}
           <div className="bg-white border-2 border-indigo-600 p-4 md:p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(79,70,229,1)] flex items-center gap-5 min-w-[280px] animate-fade-in shrink-0">
              <div className="p-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 rounded-none">
                 <CalendarDays size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Período Selecionado</p>
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">
                   {selectedMonth === 'all' ? `Todo o Ano ${selectedYear}` : `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`}
                 </h3>
              </div>
           </div>

           {/* NOVO CARD: PERÍODO RÁPIDO (FORA DA EXPANSÃO) */}
           <div className="bg-white border-2 border-slate-300 p-4 md:p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(203,213,225,1)] flex flex-col sm:flex-row items-center gap-5 min-w-[320px] animate-fade-in shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-700 tracking-[0.1em]">
                <Calendar size={18} className="text-indigo-600" />
                <span>Período Rápido</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-40">
                  <select 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)} 
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none text-[11px] font-black uppercase text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all pr-8"
                  >
                    {MONTHS.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                    <option value="all">Todo o Ano</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative w-28">
                  <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(e.target.value)} 
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none text-[11px] font-black uppercase text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all pr-8"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
           </div>

           {/* BOTÕES DE ATALHO DE FILTRO EXPOSTOS */}
           <div className="flex flex-wrap gap-3 flex-1">
              <button 
                onClick={() => setFilterType(filterType === 'receita' ? 'todos' : 'receita')}
                className={`flex-1 min-w-[140px] md:flex-none md:w-44 py-3.5 px-6 border-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 rounded-none ${filterType === 'receita' ? 'bg-emerald-600 text-white border-emerald-700 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] translate-x-[1px] translate-y-[1px]' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.1)]'}`}
              >
                <ArrowUpCircle size={18} /> Receitas
              </button>
              <button 
                onClick={() => setFilterType(filterType === 'despesa' ? 'todos' : 'despesa')}
                className={`flex-1 min-w-[140px] md:flex-none md:w-44 py-3.5 px-6 border-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 rounded-none ${filterType === 'despesa' ? 'bg-red-600 text-white border-red-700 shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] translate-x-[1px] translate-y-[1px]' : 'bg-white text-red-600 border-red-200 hover:bg-red-50 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.1)]'}`}
              >
                <ArrowDownCircle size={18} /> Despesas
              </button>
              <button 
                onClick={() => setFilterType('todos')}
                className={`flex-1 min-w-[80px] md:flex-none md:w-32 py-3.5 px-6 border-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-none ${filterType === 'todos' ? 'bg-slate-800 text-white border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.02)]'}`}
              >
                Limpar
              </button>
           </div>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showFilters ? 'max-h-[600px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white p-6 md:p-8 rounded-none border-2 border-slate-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] space-y-6 md:space-y-8 relative">
           <button onClick={() => setShowFilters(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors"><X size={20}/></button>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-5">
              <div className="lg:col-span-4 space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-700 tracking-[0.1em] ml-1"><Search size={14} className="text-slate-500" /><span>Descrição</span></div>
                 <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm font-bold text-slate-700" />
              </div>

              <div className="lg:col-span-3 space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-700 tracking-[0.1em] ml-1"><ArrowUpCircle size={14} className="text-slate-500" /><span>Tipo</span></div>
                 <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm font-bold text-slate-600 appearance-none">
                    <option value="todos">Todos</option>
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                    <option value="reserva">Reserva</option>
                 </select>
              </div>

              <div className="lg:col-span-3 space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-700 tracking-[0.1em] ml-1"><Tag size={14} className="text-slate-500" /><span>Categoria</span></div>
                 <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none text-sm font-bold text-slate-600 bg-white">
                    <option value="">Todas</option>
                    <option value="Lazer">Lazer (Fixa)</option>
                    {categories.filter(c => c.name !== 'Lazer').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option value="Reserva de Emergência">Reserva de Emergência</option>
                 </select>
              </div>

              <div className="lg:col-span-2 space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-700 tracking-[0.1em] ml-1"><Activity size={14} className="text-slate-500" /><span>Situação</span></div>
                 <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-none outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm font-bold text-slate-600 appearance-none"><option value="Todos">Todos</option><option value="Pendente">Pendente</option><option value="Efetivado">Efetivado</option><option value="Vencido">Vencido</option></select>
              </div>
           </div>

           <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-50 gap-4">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Início</span>
                  <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-slate-50 border-2 border-slate-200 px-3 py-1.5 rounded-none text-[11px] font-black text-slate-500 outline-none focus:border-indigo-300" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Fim</span>
                  <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-slate-50 border-2 border-slate-200 px-3 py-1.5 rounded-none text-[11px] font-black text-slate-500 outline-none focus:border-indigo-300" />
                </div>
             </div>
             <button onClick={resetFilters} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-none border-2 border-red-200 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all shadow-[4px_4px_0px_0px_rgba(254,226,226,1)]"><RotateCcw size={14} /> Resetar Filtros</button>
           </div>
        </div>
      </div>

      {/* GRID DE CARDS PARA LANÇAMENTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedTransactions.map((t) => (
          <div key={t.id} className="bg-white rounded-none border-2 border-slate-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.08)] transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0">
               <span className={`px-4 py-1.5 text-[9px] font-black uppercase border-l-2 border-b-2 ${getStatusStyle(t.status)} shadow-sm`}>
                 {t.status}
               </span>
            </div>

            <div className="p-6 pt-10 space-y-5 flex-1">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-none border-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)] shrink-0 ${t.type === 'receita' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : t.type === 'reserva' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                   {t.type === 'receita' ? <ArrowUpCircle size={24} /> : t.type === 'reserva' ? <ShieldCheck size={24} /> : <ArrowDownCircle size={24} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {t.isRecurring && <Repeat size={12} className="text-indigo-500 shrink-0" />}
                    <h4 className="text-sm font-black text-slate-800 uppercase italic truncate leading-tight" title={t.description}>
                      {t.description}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-none text-[8px] font-black uppercase border-2" style={{ backgroundColor: `${getCategoryColor(t.category)}15`, color: getCategoryColor(t.category), borderColor: `${getCategoryColor(t.category)}40` }}>
                      {t.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar size={10} /> <b>Vencimento:</b> {t.date.split('-').reverse().join('/')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Valor do Item</span>
                   <span className={`text-xl font-black tracking-tighter ${t.type === 'receita' ? 'text-emerald-600' : t.type === 'reserva' ? 'text-amber-600' : 'text-red-600'}`}>
                     {formatCurrency(t.amount)}
                   </span>
                </div>

                <div className="relative" ref={openMenuId === t.id ? menuRef : null}>
                   <button 
                     onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                     className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-none border-2 border-transparent hover:border-indigo-700 transition-all"
                   >
                     <MoreVertical size={20} />
                   </button>

                   {openMenuId === t.id && (
                     <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border-2 border-slate-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] z-30 animate-fade-in-up">
                        {(t.status === 'Pendente' || t.status === 'Vencido') && (
                          <button onClick={() => handleQuickConfirm(t)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-black uppercase text-emerald-600 hover:bg-emerald-50 transition-colors border-b border-slate-100">
                             <CheckCircle2 size={16} /> Confirmar
                          </button>
                        )}
                        <button onClick={() => handleEdit(t)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-slate-100">
                           <Pencil size={16} /> Editar
                        </button>
                        <button onClick={() => handleDeleteRequest(t)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-black uppercase text-red-600 hover:bg-red-50 transition-colors">
                           <Trash2 size={16} /> Excluir
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {paginatedTransactions.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.02)]">
             <ListFilter size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
             <p className="text-xs font-black uppercase text-slate-300 tracking-widest italic">Nenhum lançamento no período filtrado.</p>
          </div>
        )}
      </div>

      {/* PAINEL DE RESUMO DE SALDO DO FILTRO */}
      {filteredTransactions.length > 0 && (
        <div className="mt-8 bg-slate-900 border-2 border-slate-800 p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden animate-fade-in">
           <div className="absolute right-0 top-0 opacity-5 -mr-8 -mt-8 pointer-events-none text-white"><Calculator size={160} /></div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full md:w-auto relative z-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ArrowUpCircle size={14} className="text-emerald-500" /> Total Receitas</p>
                 <p className="text-xl font-black text-emerald-400 tabular-nums">{formatCurrency(filteredStats.receitas)}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ArrowDownCircle size={14} className="text-red-500" /> Total Despesas</p>
                 <p className="text-xl font-black text-red-400 tabular-nums">{formatCurrency(filteredStats.despesas + filteredStats.reservas)}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Scale size={14} className="text-indigo-400" /> Saldo Líquido</p>
                 <p className={`text-xl font-black tabular-nums ${filteredStats.saldo >= 0 ? 'text-white' : 'text-red-500'}`}>{formatCurrency(filteredStats.saldo)}</p>
              </div>
           </div>
           <div className="w-full md:w-auto flex flex-col items-center md:items-end relative z-10">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Status do Período</p>
              <div className={`px-6 py-2 border-2 font-black text-xs uppercase italic ${filteredStats.saldo >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                 {filteredStats.saldo >= 0 ? 'Superavitário' : 'Déficit no Filtro'}
              </div>
           </div>
        </div>
      )}

      {/* PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-6">
          <button 
            disabled={currentPageNum === 1}
            onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
            className="p-3 bg-emerald-600 border-2 border-emerald-700 rounded-none text-white hover:bg-emerald-700 disabled:opacity-30 disabled:bg-slate-300 transition-all shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] bg-white px-6 py-3 border-2 border-slate-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            {currentPageNum} / {totalPages}
          </span>
          <button 
            disabled={currentPageNum === totalPages}
            onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
            className="p-3 bg-emerald-600 border-2 border-emerald-700 rounded-none text-white hover:bg-emerald-700 disabled:opacity-30 disabled:bg-slate-300 transition-all shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* MODAL LANÇAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 italic uppercase">{editingId ? 'Editar Registro' : 'Novo Lançamento'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <form id="transaction-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex p-1 bg-slate-100 rounded-none border-2 border-slate-200 shadow-inner">
                  <button type="button" onClick={() => setType('despesa')} className={`flex-1 py-2 rounded-none text-xs font-bold uppercase transition-all ${type === 'despesa' ? 'bg-white text-red-500 shadow-sm border-2 border-red-100' : 'text-slate-400'}`}>Despesa</button>
                  <button type="button" onClick={() => setType('receita')} className={`flex-1 py-2 rounded-none text-xs font-bold uppercase transition-all ${type === 'receita' ? 'bg-white text-emerald-600 shadow-sm border-2 border-emerald-100' : 'text-slate-400'}`}>Receita</button>
                  <button type="button" onClick={() => setType('reserva')} className={`flex-1 py-2 rounded-none text-xs font-bold uppercase transition-all ${type === 'reserva' ? 'bg-white text-amber-600 shadow-sm border-2 border-amber-100' : 'text-slate-400'}`}>Reserva</button>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Descrição</label>
                  <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Mercado, Salário, Aporte Reserva..." className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none font-bold text-slate-700 focus:border-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Valor Total (R$)</label>
                    <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none font-black text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Vencimento</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none text-sm font-bold text-slate-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative" ref={categoryRef}>
                    <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Categoria</label>
                    {type === 'reserva' ? (
                      <div className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-none text-sm font-black text-amber-600 uppercase italic">Reserva de Emergência</div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Search size={16} />
                        </div>
                        <input 
                          type="text" 
                          value={categorySearch}
                          onFocus={() => setShowCategoryDropdown(true)}
                          onChange={e => {
                            setCategorySearch(e.target.value);
                            setShowCategoryDropdown(true);
                          }}
                          placeholder="Pesquisa a categoria"
                          className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none text-sm font-bold text-slate-600 focus:border-indigo-500"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          <ChevronDown size={18} />
                        </button>

                        {showCategoryDropdown && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-slate-200 shadow-xl z-50 max-h-60 overflow-y-auto rounded-none">
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map(cat => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => handleSelectCategory(cat.name)}
                                  className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-between group"
                                >
                                  <span>{cat.name}</span>
                                  {category === cat.name && <Check size={16} className="text-emerald-500" />}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-400 italic">Nenhuma categoria encontrada.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as TransactionStatus)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none text-sm font-bold text-slate-600 bg-white outline-none">
                      <option value="Pendente">Pendente</option>
                      <option value="Efetivado">Efetivado</option>
                      <option value="Vencido">Vencido</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Observação</label>
                   <textarea value={observation} onChange={e => setObservation(e.target.value)} rows={2} placeholder="Notas adicionais sobre este lançamento..." className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none text-sm font-medium resize-none focus:border-indigo-500" />
                </div>

                {editingId && (
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
                      <Clock size={14} className="text-indigo-500" /> Histórico de Confirmações
                    </label>
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-none overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-500 font-black uppercase tracking-tight">
                            <th className="px-4 py-2">Data Confirmação</th>
                            <th className="px-4 py-2 text-right">Valor Efetivado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentEditingTransaction?.confirmations?.length ? (
                            currentEditingTransaction.confirmations.map((conf, idx) => (
                              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-4 py-2 font-bold text-slate-600">{new Date(conf.confirmedAt).toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-2 text-right font-black text-emerald-600">{formatCurrency(conf.amount)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={2} className="px-4 py-4 text-center text-slate-400 italic">Nenhuma confirmação registrada.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {type !== 'reserva' && !editingId && (
                  <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-none space-y-5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-none border-2 ${isRecurring ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-200 text-slate-400 border-slate-300'} transition-colors`}>
                           <Repeat size={18} />
                        </div>
                        <span className="text-xs font-black uppercase text-indigo-700 tracking-tight">Habilitar Recorrência</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {isRecurring && (
                      <div className="space-y-4 animate-fade-in-down">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-indigo-600 ml-1">Frequência</label>
                              <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full p-3 border-2 border-indigo-200 rounded-none bg-white text-xs font-bold text-slate-600 outline-none">
                                <option value="mensal">Mensal</option>
                                <option value="quinzenal">Quinzenal</option>
                                <option value="anual">Anual</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-indigo-600 ml-1">Limite</label>
                              <select value={limitType} onChange={e => setLimitType(e.target.value as any)} className="w-full p-3 border-2 border-indigo-200 rounded-none bg-white text-xs font-bold text-slate-600 outline-none">
                                <option value="forever">Para Sempre</option>
                                <option value="until_date">Até a Data</option>
                                <option value="count">Parcelas</option>
                              </select>
                           </div>
                        </div>
                        {limitType === 'until_date' && (
                          <div className="animate-fade-in-down">
                             <label className="text-[9px] font-bold uppercase text-indigo-600 ml-1">Último Lançamento</label>
                             <input type="date" required value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="w-full p-3 border-2 border-indigo-200 rounded-none bg-white text-xs font-bold text-slate-600 outline-none" />
                          </div>
                        )}
                        {limitType === 'count' && (
                          <div className="animate-fade-in-down">
                             <label className="text-[9px] font-bold uppercase text-indigo-600 ml-1">Quantidade de Parcelas</label>
                             <div className="relative">
                                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                                <input type="number" min="1" required value={recurrenceCount} onChange={(e) => setRecurrenceCount(e.target.value)} className="w-full pl-9 pr-4 py-3 border-2 border-indigo-200 rounded-none bg-white text-xs font-black text-slate-600 outline-none" />
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
            <div className="p-8 border-t-2 border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" disabled={isSubmitting} onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-none text-slate-500 font-black text-[10px] uppercase hover:bg-slate-200 transition-all tracking-widest uppercase">Cancelar</button>
              <button type="submit" disabled={isSubmitting} form="transaction-form" className="px-10 py-3 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] transition-all hover:bg-emerald-700 flex items-center gap-2 active:shadow-none active:translate-x-1 active:translate-y-1">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? 'Salvar Edição' : 'Gerar Lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO PAGAMENTO */}
      {confirmModal.isOpen && confirmModal.transaction && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">Confirmar Efetivação</h3>
              <button onClick={() => setConfirmModal({isOpen: false, transaction: null, value: ''})} className="text-slate-400 hover:text-slate-600 p-1"><X size={24} /></button>
            </div>
            <form onSubmit={executeConfirm} className="p-8 space-y-6">
              <div className="space-y-4">
                 <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Item em Aberto</p>
                    <p className="text-sm font-black text-slate-800 italic uppercase truncate">{confirmModal.transaction.description}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">Valor Original: {formatCurrency(confirmModal.transaction.amount)}</p>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-700 tracking-widest ml-1">VALOR A EFETIVAR (R$)</label>
                    <input type="number" step="0.01" required autoFocus value={confirmModal.value} onChange={e => setConfirmModal({...confirmModal, value: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none font-black text-2xl text-emerald-600 focus:border-emerald-500 shadow-inner" />
                 </div>
              </div>
              <button type="submit" disabled={isSubmitting || !confirmModal.value} className="w-full py-5 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 font-black text-xs uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Finalizar Confirmação
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO */}
      {deleteConfirmation.isOpen && deleteConfirmation.transaction && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md overflow-hidden p-10 space-y-8 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-none border-2 border-red-200 flex items-center justify-center mx-auto shadow-inner"><Trash size={40} /></div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-800 uppercase italic">Remover Item?</h3>
                 <p className="text-sm text-slate-500 font-medium px-4">"<span className="font-black text-slate-700 italic">{deleteConfirmation.transaction.description}</span>"</p>
              </div>
              <div className="space-y-3">
                 {deleteConfirmation.transaction.recurrenceGroupId ? (
                   <div className="flex flex-col gap-3">
                      <button onClick={() => executeDelete(true)} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] transition-all flex items-center justify-center gap-2"><Repeat size={16} /> Toda a Série</button>
                      <button onClick={() => executeDelete(false)} className="w-full py-4 bg-slate-100 text-slate-600 border-2 border-slate-200 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Apenas este</button>
                   </div>
                 ) : (
                   <button onClick={() => executeDelete(false)} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] transition-all">Confirmar Exclusão</button>
                 )}
                 <button onClick={() => setDeleteConfirmation({isOpen: false, transaction: null})} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Voltar</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL CATEGORIAS COM MENU RECOLHIDO (...) */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-10 py-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 shadow-[3px_3px_0px_0px_rgba(67,56,202,1)]"><LayoutGrid size={22} /></div>
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">Categorias</h3>
                 </div>
                 <button onClick={() => setIsCategoryManagerOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-4">
                 <button onClick={() => { setEditingCategoryId(null); setNewCategoryName(''); setNewCategoryColor(PREDEFINED_COLORS[0]); setIsCategoryEditOpen(true); }} className="w-full py-4 bg-emerald-600 border-2 border-emerald-700 text-white rounded-none font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]">
                    <Plus size={16} /> Criar Nova Categoria
                 </button>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between p-5 bg-indigo-50 border-2 border-indigo-200 rounded-none group transition-all opacity-80">
                      <div className="flex items-center gap-4">
                         <div className="w-11 h-11 rounded-none border-2 border-white shadow-sm bg-indigo-600 flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
                         <div className="flex flex-col"><span className="font-black text-indigo-700 uppercase italic text-sm">Lazer</span><span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><Lock size={10} /> Sistema Babylon</span></div>
                      </div>
                    </div>
                    {categories.filter(c => c.name !== 'Lazer').map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-5 bg-slate-50 border-2 border-slate-200 rounded-none group hover:bg-white hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-11 h-11 rounded-none border-2 border-white shadow-sm" style={{ backgroundColor: cat.color }}></div>
                           <span className="font-black text-slate-700 uppercase italic text-sm">{cat.name}</span>
                        </div>
                        
                        {/* MENU DE AÇÕES RETICÊNCIAS EM AZUL (IGUAL ÀS METAS) */}
                        <div className="relative" ref={openCatMenuId === cat.id ? catMenuRef : null}>
                           <button 
                             onClick={() => setOpenCatMenuId(openCatMenuId === cat.id ? null : cat.id)}
                             className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-none border-2 border-transparent hover:border-indigo-700 transition-all"
                           >
                             <MoreVertical size={20} />
                           </button>

                           {openCatMenuId === cat.id && (
                             <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border-2 border-slate-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] z-[350] animate-fade-in-up">
                                <button 
                                  onClick={() => { setEditingCategoryId(cat.id); setNewCategoryName(cat.name); setNewCategoryColor(cat.color); setIsCategoryEditOpen(true); setOpenCatMenuId(null); }} 
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-slate-100"
                                >
                                   <Pencil size={14} /> Editar
                                </button>
                                <button 
                                  onClick={() => handleCategoryDeleteRequest(cat)} 
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-colors"
                                >
                                   <Trash2 size={14} /> Excluir
                                </button>
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

      {/* MODAL CONFIGURAR CATEGORIA (CRIAR/EDITAR) */}
      {isCategoryEditOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-sm overflow-hidden p-10 space-y-8 animate-slide-in-up">
              <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 uppercase italic">Configurar Categoria</h3><button onClick={() => setIsCategoryEditOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={28} /></button></div>
              <form onSubmit={handleCategoryFormSubmit} className="space-y-8">
                 <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Nome</label><input required autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none font-bold text-slate-700 shadow-inner" /></div>
                 <div className="space-y-4"><label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Paleta Babylon</label><div className="grid grid-cols-5 gap-3">{PREDEFINED_COLORS.map(color => <button key={color} type="button" onClick={() => setNewCategoryColor(color)} className={`w-10 h-10 rounded-none border-4 transition-all shadow-sm ${newCategoryColor === color ? 'border-slate-800 shadow-md ring-2 ring-slate-200 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />)}</div></div>
                 <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 border-2 border-indigo-700 text-white rounded-none font-black text-[10px] uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO EXCLUSÃO CATEGORIA */}
      {categoryDeleteConfirm.isOpen && categoryDeleteConfirm.category && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md overflow-hidden p-10 space-y-8 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-none border-2 border-red-200 flex items-center justify-center mx-auto shadow-inner"><Trash2 size={40} /></div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-800 uppercase italic">Excluir Categoria?</h3>
                 <p className="text-sm text-slate-500 font-medium px-4">Remover a categoria "<span className="font-black text-slate-700 italic">{categoryDeleteConfirm.category.name}</span>"? Isso pode afetar lançamentos que a utilizam.</p>
              </div>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDeleteCategory} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Excluir'}
                 </button>
                 <button onClick={() => setCategoryDeleteConfirm({isOpen: false, category: null})} disabled={isSubmitting} className="w-full py-4 bg-slate-100 text-slate-600 border-2 border-slate-200 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Não, Manter</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
