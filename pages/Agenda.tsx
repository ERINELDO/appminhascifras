
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AgendaEvent } from '../types';
import { 
  ChevronLeft, ChevronRight, Plus, X, Clock, 
  Bell, Paperclip, Save, Trash2, Calendar as CalendarIcon,
  CheckCircle2, AlertCircle, Info, Filter, CalendarDays,
  CalendarCheck, ChevronDown, Pencil, Eye, Search, RotateCcw,
  List, Layers, Loader2, Trash, Check
} from 'lucide-react';

interface AgendaProps {
  events: AgendaEvent[];
  onAddEvent: (event: AgendaEvent) => void;
  onDeleteEvent: (id: string) => void;
  onToggleEvent: (id: string) => void;
}

const EVENT_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Lima', value: '#84cc16' },
  { name: 'Ardósia', value: '#475569' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Fúcsia', value: '#d946ef' },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const Agenda: React.FC<AgendaProps> = ({ events, onAddEvent, onDeleteEvent, onToggleEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewFilter, setViewFilter] = useState<'hoje' | '7dias' | 'mes' | 'periodo' | 'todos'>('mes');
  const [showForm, setShowForm] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<AgendaEvent | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Estado para confirmação de exclusão
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, event: AgendaEvent | null}>({
    isOpen: false,
    event: null
  });

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState(EVENT_COLORS[0].value);
  const [alert, setAlert] = useState(true);
  const [alertTime, setAlertTime] = useState('07_days_before');
  const [attachment, setAttachment] = useState<string | undefined>(undefined);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDayClick = (dayStr: string) => {
    setEventDate(dayStr);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: AgendaEvent) => {
    e.stopPropagation();
    setViewingEvent(event);
  };

  const handleEditFromView = () => {
    if (!viewingEvent) return;
    const ev = viewingEvent;
    setEditingId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description || '');
    setEventDate(ev.date);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setColor(ev.color);
    setAlert(ev.alert);
    setAlertTime(ev.alertTime || '07_days_before');
    setAttachment(ev.attachment);
    setViewingEvent(null);
    setShowForm(true);
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, event: AgendaEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, event });
    setViewingEvent(null);
  };

  const executeDelete = async () => {
    if (!deleteConfirm.event) return;
    setIsSubmitting(true);
    try {
      await onDeleteEvent(deleteConfirm.event.id);
      setNotification({ message: 'Compromisso removido com sucesso!', type: 'success' });
      setDeleteConfirm({ isOpen: false, event: null });
    } catch (error) {
      setNotification({ message: 'Erro ao excluir compromisso.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await onToggleEvent(id);
      const event = events.find(e => e.id === id);
      const newState = !event?.isCompleted;
      setNotification({ 
        message: newState ? 'Compromisso marcado como CONCLUÍDO!' : 'Compromisso reaberto.', 
        type: 'success' 
      });
    } catch (error) {
      setNotification({ message: 'Erro ao atualizar estado.', type: 'error' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('09:00');
    setEndTime('10:00');
    setColor(EVENT_COLORS[0].value);
    setAlert(true);
    setAlertTime('07_days_before');
    setAttachment(undefined);
    setEditingId(null);
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || isSubmitting) return;

    setIsSubmitting(true);
    const newEvent: AgendaEvent = {
      id: editingId || crypto.randomUUID(),
      title,
      description,
      date: eventDate,
      startTime,
      endTime,
      color,
      alert,
      alertTime: alert ? alertTime : undefined,
      isCompleted: editingId ? events.find(ev => ev.id === editingId)?.isCompleted || false : false
    };

    try {
      await onAddEvent(newEvent);
      setNotification({ message: editingId ? 'Compromisso atualizado!' : 'Agendamento realizado com sucesso!', type: 'success' });
      resetForm();
    } catch (error) {
      setNotification({ message: 'Erro ao salvar agendamento.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthYearDisplay = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  
  const days = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= days; i++) calendarDays.push(i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const filteredUpcomingEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (viewFilter === 'hoje') {
      return events.filter(e => e.date === todayStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
    } else if (viewFilter === '7dias') {
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      return events.filter(e => e.date >= todayStr && e.date <= nextWeekStr).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    } else if (viewFilter === 'mes') {
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      return events.filter(e => e.date.startsWith(monthPrefix)).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    } else if (viewFilter === 'todos') {
      return [...events].sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    } else {
      return events.filter(e => {
        if (!customStart || !customEnd) return true;
        return e.date >= customStart && e.date <= customEnd;
      }).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    }
  }, [events, viewFilter, customStart, customEnd, year, month]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
    };
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-bounce-in">
          <div className={`px-6 py-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex items-center gap-3 border-2 ${notification.type === 'success' ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 transition-all"><X size={16}/></button>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-white p-6 rounded-none border-2 border-slate-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 border-2 border-emerald-200 rounded-none">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight leading-none italic">{monthYearDisplay}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1">
              <CalendarCheck size={12} className="text-emerald-500" /> Cronograma de Compromissos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-50 p-1 rounded-none border-2 border-slate-200">
            <button onClick={prevMonth} className="p-2 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 hover:bg-emerald-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"><ChevronLeft size={18} strokeWidth={3} /></button>
            <span className="px-4 text-[10px] font-black uppercase text-slate-700 tracking-widest min-w-[120px] text-center">{MONTHS[month]}</span>
            <button onClick={nextMonth} className="p-2 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 hover:bg-emerald-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"><ChevronRight size={18} strokeWidth={3} /></button>
          </div>

          <div className="flex bg-slate-100 rounded-none p-1 border-2 border-slate-200 items-center overflow-x-auto max-w-full sm:max-w-none">
            {['hoje', '7dias', 'mes', 'periodo', 'todos'].map((f) => (
              <button 
                key={f}
                onClick={() => setViewFilter(f as any)} 
                className={`px-4 py-1.5 rounded-none text-[10px] font-black uppercase transition-all whitespace-nowrap ${viewFilter === f ? 'bg-white text-emerald-600 shadow-sm border-2 border-emerald-50' : 'text-slate-400'}`}
              >
                {f === '7dias' ? '7 Dias' : f}
              </button>
            ))}
          </div>

          <button onClick={() => handleDayClick(new Date().toISOString().split('T')[0])} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-none border-2 border-emerald-700 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] transition-all font-black text-xs uppercase active:translate-x-1 active:translate-y-1 active:shadow-none">
            <Plus size={18} /> Novo Agendamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] border-2 border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50 border-b-2 border-slate-200">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x-2 divide-y-2 divide-slate-100">
            {calendarDays.map((day, idx) => {
              const dStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day && new Date().toISOString().split('T')[0] === dStr;

              return (
                <div key={idx} onClick={() => dStr && handleDayClick(dStr)} className={`min-h-[140px] p-2 transition-all cursor-pointer group ${day ? 'hover:bg-slate-50/50' : 'bg-slate-50/30'}`}>
                  {day && (
                    <div className="h-full flex flex-col">
                      <span className={`text-xs font-black rounded-none border-2 w-8 h-8 flex items-center justify-center mb-2 transition-all ${isToday ? 'bg-emerald-600 text-white border-emerald-700 shadow-md' : 'text-slate-400 border-transparent group-hover:text-slate-800'}`}>
                        {day}
                      </span>
                      <div className="flex-1 space-y-1.5 overflow-hidden">
                        {dayEvents.map(ev => (
                          <div key={ev.id} onClick={(e) => handleEventClick(e, ev)} className="px-2 py-1.5 rounded-none text-[9px] font-black uppercase truncate border-2 shadow-sm transition-all hover:translate-x-1" style={{ backgroundColor: `${ev.color}15`, color: ev.color, borderColor: `${ev.color}30` }}>
                            {ev.startTime} {ev.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-none border-2 border-slate-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] min-h-[500px] flex flex-col">
              <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2 mb-8 italic"><List size={20} className="text-indigo-600" /> Listagem de Atividades</h3>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {filteredUpcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                    <CalendarDays size={48} className="opacity-10 mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest italic">Sem registros para este filtro</p>
                  </div>
                ) : (
                  filteredUpcomingEvents.map(event => {
                    const dateInfo = formatDateLabel(event.date);
                    return (
                      <div key={event.id} onClick={(e) => handleEventClick(e, event)} className="group flex items-center gap-5 p-5 rounded-none bg-slate-50 border-2 border-slate-200 hover:bg-white hover:shadow-xl hover:translate-x-1 transition-all cursor-pointer">
                         <div className="flex flex-col items-center justify-center min-w-[60px] py-1 border-r-2 border-slate-200">
                           <span className="text-[10px] font-black uppercase text-emerald-600 mb-0.5">{dateInfo.month}</span>
                           <span className="text-2xl font-black text-slate-800 leading-none italic">{dateInfo.day}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className={`text-sm font-black text-slate-800 truncate uppercase tracking-tight ${event.isCompleted ? 'line-through opacity-40' : ''}`}>{event.title}</h4>
                           <div className="flex items-center gap-3 mt-2">
                             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-indigo-700 rounded-none border-2 border-indigo-100 shadow-sm"><Clock size={12} /><span className="text-[11px] font-black tabular-nums">{event.startTime}</span></div>
                             <div className="w-3 h-3 rounded-full shadow-inner border border-white" style={{ backgroundColor: event.color }}></div>
                           </div>
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleToggle(event.id); }} 
                           className={`p-3 rounded-none border-2 transition-all shadow-sm ${event.isCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-slate-300 border-slate-100 hover:text-emerald-500 hover:border-emerald-200'}`}
                         >
                           <CheckCircle2 size={22} />
                         </button>
                      </div>
                    );
                  })
                )}
              </div>
           </div>
        </div>
      </div>

      {/* MODAL NOVO AGENDAMENTO */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-2 border-slate-300 w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-none border-2 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] ${editingId ? 'bg-blue-600 border-blue-700' : 'bg-emerald-600 border-emerald-700'}`}>{editingId ? <Pencil size={20} /> : <Plus size={20} />}</div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">{editingId ? 'Editar Registro' : 'Novo Agendamento'}</h3>
              </div>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 transition-all"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <form id="agenda-form" onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Título do Evento</label>
                  <input required autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião Financeira..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all shadow-inner" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Data</label>
                    <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none text-sm font-bold text-slate-600" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Início</label>
                    <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none text-sm font-bold text-slate-600" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Fim</label>
                    <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-none outline-none text-sm font-bold text-slate-600" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1">Notas / Detalhes</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes que podem ser importantes..." rows={3} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-none text-sm font-medium resize-none outline-none focus:border-indigo-500 transition-all shadow-inner" />
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest ml-1 block">Cor de Identificação</label>
                   <div className="flex flex-wrap gap-4 p-5 bg-slate-50 border-2 border-slate-200 rounded-none shadow-inner">
                      {EVENT_COLORS.map(c => (
                        <button 
                          key={c.value} 
                          type="button" 
                          onClick={() => setColor(c.value)} 
                          className={`w-10 h-10 rounded-full border-4 transition-all transform hover:scale-110 shadow-sm ${color === c.value ? 'border-slate-800 ring-2 ring-slate-200 scale-110 shadow-md' : 'border-white'}`} 
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                   </div>
                </div>

                <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-none space-y-5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-none border-2 transition-all ${alert ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
                         <Bell size={20} />
                      </div>
                      <span className="text-xs font-black uppercase text-amber-700 tracking-tight">Habilitar Lembrete Ativo</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={alert} onChange={() => setAlert(!alert)} />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {alert && (
                    <div className="animate-fade-in-down space-y-3">
                       <p className="text-[10px] text-amber-600 font-bold leading-relaxed flex items-center gap-2">
                          <Info size={14} /> Você receberá um e-mail automático baseado no tempo selecionado:
                       </p>
                       <select value={alertTime} onChange={e => setAlertTime(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-none text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-amber-500 shadow-sm">
                          <option value="at_time">No momento do evento</option>
                          <option value="07_days_before">07 dias antes</option>
                          <option value="15_days_before">15 dias antes</option>
                          <option value="30_days_before">30 dias antes</option>
                       </select>
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="px-8 py-6 border-t-2 border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" disabled={isSubmitting} onClick={resetForm} className="px-6 py-3 rounded-none text-slate-500 font-black text-[10px] uppercase hover:bg-slate-200 transition-all tracking-widest">Cancelar</button>
              <button type="submit" disabled={isSubmitting} form="agenda-form" className="px-10 py-3 bg-emerald-600 text-white rounded-none border-2 border-emerald-700 font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(5,150,105,1)] transition-all hover:bg-emerald-700 flex items-center gap-2 active:shadow-none active:translate-x-1 active:translate-y-1">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                {editingId ? 'Salvar Edição' : 'Agendar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO */}
      {viewingEvent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md overflow-hidden animate-slide-in-up">
              <div className="h-32 relative border-b-2 border-white/20" style={{ backgroundColor: viewingEvent.color }}>
                 <button onClick={() => setViewingEvent(null)} className="absolute right-4 top-4 p-2 bg-black/20 text-white rounded-none hover:bg-black/40 transition-all"><X size={20} /></button>
                 <div className="absolute -bottom-8 left-8 p-4 bg-white border-2 border-slate-200 rounded-none shadow-xl"><CalendarIcon className="w-8 h-8" style={{ color: viewingEvent.color }} /></div>
              </div>
              <div className="p-8 pt-12 space-y-6">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">{viewingEvent.title}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 border-l-4 pl-3" style={{ borderColor: viewingEvent.color }}>{new Date(viewingEvent.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-none border-2 border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Janela de Tempo</p><p className="text-xs font-black text-slate-700">{viewingEvent.startTime} às {viewingEvent.endTime}</p></div>
                    <div className="p-4 bg-slate-50 rounded-none border-2 border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Estado Atual</p><p className={`text-xs font-black uppercase ${viewingEvent.isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>{viewingEvent.isCompleted ? 'Concluído' : 'Em Aberto'}</p></div>
                 </div>
                 {viewingEvent.description && (<div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">Detalhamento</p><p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 border-2 border-slate-100 italic">"{viewingEvent.description}"</p></div>)}
                 <div className="flex gap-3 pt-4">
                    <button onClick={(e) => handleOpenDeleteConfirm(e, viewingEvent)} className="flex-1 py-4 bg-red-50 text-red-500 rounded-none border-2 border-red-200 font-black text-[10px] uppercase hover:bg-red-100 transition-all flex items-center justify-center gap-2"><Trash2 size={16} /> Excluir</button>
                    <button onClick={handleEditFromView} className="flex-[2] py-4 bg-indigo-600 text-white rounded-none border-2 border-indigo-700 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(67,56,202,1)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none"><Pencil size={16} /> Editar Registro</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO COMPROMISSO */}
      {deleteConfirm.isOpen && deleteConfirm.event && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 w-full max-w-md p-10 text-center animate-slide-in-up">
              <div className="w-20 h-20 bg-red-100 text-red-600 border-2 border-red-200 flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash size={40}/></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Excluir Compromisso?</h3>
              <p className="text-slate-500 mb-8 text-sm px-4">Você removerá <span className="font-black text-slate-800">"{deleteConfirm.event.title}"</span> da sua agenda permanentemente.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={executeDelete} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-none border-2 border-red-700 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Remover Agora'}
                 </button>
                 <button onClick={() => setDeleteConfirm({ isOpen: false, event: null })} disabled={isSubmitting} className="w-full py-4 text-slate-400 font-black text-xs uppercase hover:bg-slate-50 transition-all rounded-none border-2 border-transparent hover:border-slate-200">Não, Manter</button>
              </div>
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
