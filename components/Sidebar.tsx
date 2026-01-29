
import React from 'react';
import { 
  LayoutDashboard, PlusCircle, Calendar as CalendarIcon, 
  TrendingUp, ChevronLeft, ChevronRight,
  History, ShieldCheck, Award, Target,
  GraduationCap, Library, BookCheck, 
  FileEdit, BarChart2, CreditCard,
  CalendarRange, Briefcase, Brain, Clock, 
  Trophy, BookMarked, Wallet, FileSearch, Scale
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  logoUrlSidebar?: string;
  user?: User;
  isAdmin?: boolean;
  onOpenProfile: () => void;
  activeModule: 'financial' | 'studies' | 'reconciliation';
  setActiveModule: (module: 'financial' | 'studies') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  isOpen, 
  setIsOpen,
  isCollapsed,
  toggleCollapse,
  logoUrlSidebar,
  isAdmin,
  activeModule
}) => {
  
  const financialItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Resumo financeiro' },
    { id: 'transactions', label: 'Lançamentos', icon: PlusCircle, description: 'Gestão de fluxo' },
    { id: 'agenda', label: 'Agenda', icon: CalendarIcon, description: 'Meus compromissos' },
    { id: 'metas', label: 'Metas', icon: Target, description: 'Objetivos financeiros' },
    { id: 'investments', label: 'Carteira', icon: TrendingUp, description: 'Gestão de ativos' },
    { id: 'withdrawal_history', label: 'Histórico de Saques', icon: History, description: 'Rastreabilidade' },
    { id: 'plans', label: 'Meu Plano', icon: CreditCard, description: 'Assinatura' },
  ];

  const adminItems = [
    { id: 'admin_panel', label: 'Usuários', icon: ShieldCheck, description: 'Gestão de acessos' },
    { id: 'licenses', label: 'Licenças', icon: Award, description: 'Planos e vendas' },
    { id: 'admin_dashboard', label: 'Monitoramento', icon: LayoutDashboard, description: 'Telemetria real' },
  ];

  const studyItems = [
    { 
      id: 'study_dashboard', 
      label: 'Dashboard', 
      icon: BarChart2,
      description: 'Visão geral de estudos'
    },
    { 
      id: 'study_analysis', 
      label: 'Análise de Edital', 
      icon: FileSearch,
      description: 'IA Mentor de Provas'
    },
    { 
      id: 'study_reconciliation', 
      label: 'Dá para conciliar?', 
      icon: Scale,
      description: 'Comparativo de editais'
    },
    { 
      id: 'study_courses', 
      label: 'Disciplinas', 
      icon: Library,
      description: 'Matérias do edital'
    },
    { 
      id: 'study_planning', 
      label: 'Planejamento', 
      icon: CalendarRange,
      description: 'Cronograma semanal'
    },
    { 
      id: 'study_mock_tests', 
      label: 'Simulados', 
      icon: FileEdit,
      description: 'Provas práticas'
    },
    { 
      id: 'study_exercises', 
      label: 'Exercícios', 
      icon: BookCheck,
      description: 'Prática por tópico'
    },
  ];

  const menuItems = isAdmin ? adminItems : (activeModule === 'studies' ? studyItems : financialItems);
  const themeColorClass = activeModule === 'studies' ? 'from-indigo-600 to-purple-600' : 'from-emerald-600 to-emerald-800';
  const accentColorClass = activeModule === 'studies' ? 'text-indigo-400' : 'text-emerald-400';
  const shadowClass = activeModule === 'studies' ? 'shadow-indigo-500/30' : 'shadow-emerald-500/30';

  const defaultSidebarLogo = 'https://assets.zyrosite.com/hm2grEdqKPVfr2SF/logo-meu-gestor-nQzVNZHWJRGH0cP7.png';

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen bg-slate-950 text-white transition-all duration-300 ease-in-out shadow-2xl flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}>
        
        {/* Toggle Button Desktop */}
        <button 
          onClick={toggleCollapse}
          className={`hidden md:flex absolute top-8 -right-4 w-8 h-8 rounded-full items-center justify-center text-white shadow-lg z-50 transition-all border-2 border-slate-950 ${activeModule === 'studies' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {isCollapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
        </button>

        {/* Header Logo Restored */}
        <div className={`transition-all duration-300 flex flex-col items-center ${isCollapsed ? 'px-4 py-6' : 'p-8'}`}>
           <img 
              src={logoUrlSidebar || defaultSidebarLogo} 
              alt="Logo" 
              className={`${isCollapsed ? 'w-10' : 'w-40'} object-contain transition-all`}
           />
           {!isCollapsed && (
             <div className="mt-4 text-center">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${accentColorClass}`}>
                  {activeModule === 'studies' ? 'Módulo Estudos' : 'Módulo Financeiro'}
                </p>
             </div>
           )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 mt-6 space-y-1.5 overflow-y-auto custom-sidebar-scroll">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${isCollapsed ? 'justify-center p-3.5' : 'space-x-3 px-4 py-3.5'}
                  ${isActive 
                    ? `bg-gradient-to-r ${themeColorClass} text-white shadow-lg ${shadowClass}` 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <Icon 
                  size={20} 
                  className={`flex-shrink-0 transition-all ${
                    isActive 
                      ? 'text-white' 
                      : `text-slate-500 group-hover:${accentColorClass}`
                  }`} 
                />
                
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <span className={`block text-[11px] font-black uppercase tracking-wider transition-colors ${
                      isActive 
                        ? 'text-white' 
                        : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {item.label}
                    </span>
                    {item.description && (
                      <span className={`block text-[9px] mt-0.5 font-bold transition-colors ${
                        isActive 
                          ? 'text-white/60' 
                          : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 flex items-center justify-center border-t border-slate-800/30 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {!isCollapsed ? (
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">© Copyright Meu Gestor</p>
            </div>
          ) : (
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <BookMarked className="text-slate-700" size={14} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
