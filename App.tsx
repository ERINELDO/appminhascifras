import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login'; 
import { ProfileModal } from './components/ProfileModal';
import { StudyTimer } from './components/StudyTimer';

// Dynamic imports para divisão de código
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TransactionForm = lazy(() => import('./pages/TransactionForm').then(m => ({ default: m.TransactionForm })));
const Agenda = lazy(() => import('./pages/Agenda').then(m => ({ default: m.Agenda })));
const Metas = lazy(() => import('./pages/Metas').then(m => ({ default: m.Metas })));
const Investments = lazy(() => import('./pages/Investments').then(m => ({ default: m.Investments })));
const WithdrawalHistory = lazy(() => import('./pages/WithdrawalHistory').then(m => ({ default: m.WithdrawalHistory })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const Licenses = lazy(() => import('./pages/Licenses').then(m => ({ default: m.Licenses })));
const UserInvoices = lazy(() => import('./pages/UserInvoices').then(m => ({ default: m.UserInvoices })));
const Plans = lazy(() => import('./pages/Plans').then(m => ({ default: m.Plans })));

const StudyCourses = lazy(() => import('./pages/StudyCourses').then(m => ({ default: m.StudyCourses })));
const StudyDashboard = lazy(() => import('./pages/StudyDashboard').then(m => ({ default: m.StudyDashboard })));
const StudyDisciplines = lazy(() => import('./pages/StudyDisciplines').then(m => ({ default: m.StudyDisciplines })));
const StudyLessons = lazy(() => import('./pages/StudyLessons').then(m => ({ default: m.StudyLessons })));
const StudyMockTests = lazy(() => import('./pages/StudyMockTests').then(m => ({ default: m.StudyMockTests })));
const StudyExercises = lazy(() => import('./pages/StudyExercises').then(m => ({ default: m.StudyExercises })));
const StudyPlanning = lazy(() => import('./pages/StudyPlanning').then(m => ({ default: m.StudyPlanning })));
const EditalAnalysis = lazy(() => import('./pages/EditalAnalysis').then(m => ({ default: m.EditalAnalysis })));

import { Transaction, AgendaEvent, Investment, Category, User, InvestmentType, Withdrawal, Goal, AppSettings, License, LicensePlan, TransactionType, StudyCourse, StudyDiscipline } from './types';
import { Menu, Loader2, ShieldAlert, LogOut, CreditCard, User as UserIcon, ShoppingBag, ChevronDown, Sun, Moon, Briefcase, GraduationCap, ArrowLeft } from 'lucide-react';
import { api } from './services/api';
import { supabase } from './lib/supabase';

const PageLoading = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-indigo-600">
    <Loader2 className="animate-spin" size={40} />
    <p className="text-[10px] font-black uppercase tracking-widest">Carregando Módulo...</p>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<string>('');
  const [activeModule, setActiveModule] = useState<'financial' | 'studies'>(() => (localStorage.getItem('babylon_active_module') as any) || 'financial');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');

  // Estudo - Timer Control Global
  const [isStudyTimerOpen, setIsStudyTimerOpen] = useState(false);
  const [timerIsRunning, setTimerIsRunning] = useState(() => localStorage.getItem('babylon_study_session') !== null);

  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investmentTypes, setInvestmentTypes] = useState<InvestmentType[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [globalSettings, setGlobalSettings] = useState<AppSettings>({ stripe_public_key: '', stripe_secret_key: '', logoUrl: '', logoUrlSidebar: '' });
  
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [allPlans, setAllPlans] = useState<LicensePlan[]>([]);
  const [transactionTypeTrigger, setTransactionTypeTrigger] = useState<TransactionType | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<StudyCourse | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<StudyDiscipline | null>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('babylon_active_module', activeModule);
  }, [activeModule]);

  const loadData = useCallback(async (forcedTarget?: string) => {
    try {
      setLoading(true);
      setErrorState(null);
      const { data: { session } } = await supabase.auth.getSession();
      
      const settings = await api.getSettings().catch(() => null);
      if (settings) setGlobalSettings(settings);

      if (!session) {
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      const profile = await api.getProfile();
      if (!profile) throw new Error("Erro de perfil");

      if (profile.isBlocked === true || profile.ativo === false) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUser(null);
        setErrorState("Usuário está bloqueado, favor entre em contato com o Suporte");
        setLoading(false);
        return;
      }
      
      setIsAdmin(!!profile.isAdmin);
      
      const myLicenses = await api.getMyLicenses();
      const activeLic = myLicenses.find(l => l.status === 'Ativa');
      const licenseName = activeLic?.name || (profile.isAdmin ? 'Administrador' : 'Sem Licença Ativa');
      setUser({ ...profile, licenseType: licenseName });

      let expired = false;
      if (!profile.isAdmin) {
        if (!activeLic) expired = true;
        else if (activeLic.type !== 'Vitalícia' && activeLic.expirationDate) {
          if (new Date() > new Date(activeLic.expirationDate + 'T23:59:59')) expired = true;
        }
      }
      setIsExpired(expired);

      if (!currentPage || forcedTarget) {
        const defaultPage = profile.isAdmin ? 'admin_panel' : (activeModule === 'studies' ? 'study_dashboard' : 'dashboard');
        setCurrentPage(forcedTarget || defaultPage);
      }

      if (profile.isAdmin || !expired) {
        const [txs, invs, events, cats, invTypes, withs, goalsData] = await Promise.all([
          api.getTransactions().catch(() => []),
          api.getInvestments().catch(() => []),
          api.getAgendaEvents().catch(() => []),
          api.getCategories().catch(() => []),
          api.getInvestmentTypes().catch(() => []),
          api.getWithdrawals().catch(() => []),
          api.getGoals().catch(() => [])
        ]);
        setTransactions(txs);
        setInvestments(invs);
        setAgendaEvents(events);
        setCategories(cats);
        setInvestmentTypes(invTypes);
        setWithdrawals(withs);
        setGoals(goalsData);
      }

      if (profile.isAdmin) {
        api.getAllUsers().then(setUsers);
        api.getAllUsersLicenses().then(setAllLicenses);
        api.getPlans().then(setAllPlans);
      }
      setInitialDataLoaded(true);
    } catch (e: any) { 
      setErrorState(e.message || "Erro de sincronização."); 
    } finally { 
      setLoading(false); 
    }
  }, [currentPage, activeModule]);

  useEffect(() => {
    loadData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) loadData();
      else if (event === 'SIGNED_OUT') setIsAuthenticated(false);
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  const pageToRender = useMemo(() => {
    if (errorState) return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 animate-fade-in text-center p-8">
        <ShieldAlert size={64} className="text-red-500 mb-2" />
        <h3 className="text-xl font-black text-slate-800 uppercase italic">Acesso Restrito</h3>
        <p className="max-w-md font-medium">{errorState}</p>
        <button 
          onClick={async () => { 
            await supabase.auth.signOut();
            setErrorState(null);
            setIsAuthenticated(false);
          }} 
          className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>
    );
    
    if (!user) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>;

    let activePage = currentPage || (isAdmin ? 'admin_panel' : (activeModule === 'studies' ? 'study_dashboard' : 'dashboard'));
    if (isExpired && !isAdmin && activePage !== 'plans' && activePage !== 'user_invoices') activePage = 'plans';

    return (
      <Suspense fallback={<PageLoading />}>
        {(() => {
          switch (activePage) {
            case 'admin_panel': return <AdminPanel users={users} onUpdateUsers={setUsers} />;
            case 'licenses': return <Licenses />;
            case 'dashboard': 
              return isAdmin ? (
                <AdminDashboard users={users} licenses={allLicenses} plans={allPlans} />
              ) : (
                <Dashboard 
                  transactions={transactions} 
                  investments={investments} 
                  withdrawals={withdrawals} 
                  user={user} 
                  isAdmin={isAdmin} 
                  goals={goals} 
                  onNavigate={setCurrentPage}
                  onOpenTransaction={(type) => { setTransactionTypeTrigger(type); setCurrentPage('transactions'); }}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              );
            case 'transactions': return <TransactionForm transactions={transactions} onAddTransaction={(t) => api.addTransaction(t).then(() => loadData())} onEditTransaction={(t) => api.addTransaction(t).then(() => loadData())} onDeleteTransaction={(id, all) => api.deleteTransaction(id, all).then(() => loadData())} categories={categories} onRefreshCategories={() => api.getCategories().then(setCategories)} onRefreshData={() => loadData()} initialType={transactionTypeTrigger} onClearInitialType={() => setTransactionTypeTrigger(null)} />;
            case 'investments': return <Investments investments={investments} investmentTypes={investmentTypes} onAddInvestment={(inv) => api.addInvestment(inv).then(() => loadData())} onEditInvestment={(inv) => api.addInvestment(inv).then(() => loadData())} onDeleteInvestment={(id) => api.deleteInvestment(id).then(() => loadData())} onRefreshInvestmentTypes={() => api.getInvestmentTypes().then(setInvestmentTypes)} onWithdraw={(w) => api.addWithdrawal(w).then(() => loadData())} />;
            case 'agenda': return <Agenda events={agendaEvents} onAddEvent={(e) => api.addAgendaEvent(e).then(() => loadData())} onDeleteEvent={(id) => api.deleteAgendaEvent(id).then(() => loadData())} onToggleEvent={(id) => { const ev = agendaEvents.find(e => e.id === id); if(ev) api.toggleAgendaEvent(id, !ev.isCompleted).then(() => loadData()); }} />;
            case 'metas': return <Metas />;
            case 'withdrawal_history': return <WithdrawalHistory withdrawals={withdrawals} />;
            case 'user_invoices': return <UserInvoices user={user} />;
            case 'plans': return <Plans user={user} onPlanSelected={() => loadData('dashboard')} />;
            case 'study_dashboard': return <StudyDashboard onOpenTimer={() => setIsStudyTimerOpen(true)} isSidebarCollapsed={isSidebarCollapsed} />;
            case 'study_analysis': return <EditalAnalysis />;
            case 'study_courses': return <StudyCourses onSelectCourse={(c) => { setSelectedCourse(c); setCurrentPage('study_disciplines'); }} />;
            case 'study_disciplines': return <StudyDisciplines selectedCourse={selectedCourse} onBack={() => setCurrentPage('study_courses')} onSelectDiscipline={(d) => { setSelectedDiscipline(d); setCurrentPage('study_lessons'); }} />;
            case 'study_lessons': return <StudyLessons selectedDiscipline={selectedDiscipline} onBack={() => setCurrentPage('study_disciplines')} />;
            case 'study_mock_tests': return <StudyMockTests onStartMock={() => {}} />;
            case 'study_exercises': return <StudyExercises />;
            case 'study_planning': return <StudyPlanning />;
            default: 
              return isAdmin ? (
                <AdminDashboard users={users} licenses={allLicenses} plans={allPlans} />
              ) : (
                <Dashboard 
                  transactions={transactions} 
                  investments={investments} 
                  withdrawals={withdrawals} 
                  user={user} 
                  isAdmin={isAdmin} 
                  goals={goals} 
                  onNavigate={setCurrentPage}
                  onOpenTransaction={(type) => { setTransactionTypeTrigger(type); setCurrentPage('transactions'); }}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              );
          }
        })()}
      </Suspense>
    );
  }, [currentPage, user, isAdmin, isExpired, errorState, users, transactions, investments, withdrawals, goals, categories, agendaEvents, allLicenses, allPlans, loadData, transactionTypeTrigger, selectedCourse, selectedDiscipline, activeModule, isSidebarCollapsed]);

  if (loading && !initialDataLoaded) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
  if (!isAuthenticated && !errorState) return <Login onLogin={() => { loadData(); }} logoUrl={globalSettings.logoUrl} />;

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {!errorState && (
        <Sidebar 
          currentPage={currentPage} setCurrentPage={setCurrentPage} 
          onLogout={() => supabase.auth.signOut()} 
          isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} 
          isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          user={user!} isAdmin={isAdmin} onOpenProfile={() => setIsProfileModalOpen(true)}
          activeModule={activeModule} setActiveModule={setActiveModule}
          logoUrlSidebar={globalSettings.logoUrlSidebar}
        />
      )}
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {!errorState && (
          <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 transition-colors">
            <div className="flex items-center gap-2 sm:gap-4">
               <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 dark:text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><Menu size={24} /></button>
               
               {!isAdmin && !isExpired && activeModule === 'financial' && (
                 <div className="hidden sm:flex items-center gap-2">
                    <button onClick={() => { setTransactionTypeTrigger('receita'); setCurrentPage('transactions'); }} className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">RECEITA</button>
                    <button onClick={() => { setTransactionTypeTrigger('despesa'); setCurrentPage('transactions'); }} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">DESPESA</button>
                 </div>
               )}
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
              
              {user && (
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right hidden xs:block">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white">{user.name?.split(' ')[0]}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{user.licenseType}</p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-1 group">
                      <img src={user.avatar} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-emerald-500 cursor-pointer object-cover shadow-sm" alt="" />
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>
                    
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-3 z-50 animate-fade-in-down">
                         <p className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Conta</p>
                         <button onClick={() => { setIsProfileModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm flex items-center gap-3"><UserIcon size={18}/> Meu Perfil</button>
                         
                         {!isAdmin && (
                           <>
                             <button onClick={() => { setActiveModule('financial'); setCurrentPage('dashboard'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-bold text-sm flex items-center gap-3"><Briefcase size={18} className="text-emerald-500" /> Meu Financeiro</button>
                             <button onClick={() => { setActiveModule('studies'); setCurrentPage('study_dashboard'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold text-sm flex items-center gap-3"><GraduationCap size={18} className="text-indigo-500" /> Meus Estudos</button>
                             
                             <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                             <button onClick={() => { setCurrentPage('plans'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm flex items-center gap-3"><ShoppingBag size={18}/> Assinar Plano</button>
                             <button onClick={() => { setCurrentPage('user_invoices'); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm flex items-center gap-3"><CreditCard size={18}/> Minhas Faturas</button>
                           </>
                         )}
                         
                         <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                         <button onClick={() => supabase.auth.signOut()} className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-black text-sm flex items-center gap-3"><LogOut size={18}/> Sair</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">{pageToRender}</div>
      </main>

      {isAuthenticated && !isAdmin && (isStudyTimerOpen || timerIsRunning) && (
        <StudyTimer 
          isOpen={isStudyTimerOpen} 
          onClose={() => setIsStudyTimerOpen(false)} 
          onOpen={() => setIsStudyTimerOpen(true)}
          onTimerStatusChange={setTimerIsRunning}
        />
      )}

      {isProfileModalOpen && user && <ProfileModal user={user} onClose={() => setIsProfileModalOpen(false)} onSave={async (u) => { await api.updateProfile(u); loadData(); }} />}
    </div>
  );
};

export default App;
