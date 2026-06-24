import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Layers,
  Activity,
  Calendar,
  DollarSign,
  Users,
  ShieldAlert,
  ChevronDown,
  Settings,
  Sun,
  Moon,
  Palette,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
  Database,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  User,
  Organization,
  Project,
  ProjectMember,
  OrgConfig,
  MemberProjectVisibility,
  ProjectRole,
  UserTabPermissions,
} from '../types';

import Dashboard from './Dashboard';
import CronogramaDashboard from './CronogramaDashboard';
import Finance from './Finance';
import Stakeholders from './Stakeholders';
import RiskManagement from './RiskManagement';

/* ───────────────── types ───────────────── */

type TabKey = 'dashboard' | 'cronograma' | 'orcamento' | 'stakeholders' | 'riscos';

interface WorkspaceProps {
  activeUser: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  organizations: Organization[];
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  memberships: ProjectMember[];
  setMemberships: React.Dispatch<React.SetStateAction<ProjectMember[]>>;
  config: OrgConfig;
  setConfig: React.Dispatch<React.SetStateAction<OrgConfig>>;
  visibility: MemberProjectVisibility;
  setVisibility: React.Dispatch<React.SetStateAction<MemberProjectVisibility>>;
  onLogout: () => void;
}

/* ───────────────── tabs config ───────────────── */

const ALL_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'cronograma', label: 'Cronograma', icon: Calendar },
  { key: 'orcamento', label: 'Orçamento', icon: DollarSign },
  { key: 'stakeholders', label: 'Stakeholders', icon: Users },
  { key: 'riscos', label: 'Riscos', icon: ShieldAlert },
];

/* ───────────────── component ───────────────── */

export default function Workspace({
  activeUser,
  users,
  setUsers,
  organizations,
  projects,
  setProjects,
  memberships,
  setMemberships,
  config,
  setConfig,
  visibility,
  setVisibility,
  onLogout,
}: WorkspaceProps) {
  const queryClient = useQueryClient();

  const [tabPermissionsMap, setTabPermissionsMap] = useState<Record<string, UserTabPermissions>>(() => {
    const data = localStorage.getItem('stem_tab_permissions');
    if (data) return JSON.parse(data);
    
    const defaults: Record<string, UserTabPermissions> = {};
    projects.forEach(p => {
      defaults[`${p.id}_user_pedro`] = { dashboard: true, cronograma: true, orcamento: true, stakeholders: true, riscos: true, convidar: true };
    });
    defaults['proj_engenharia_user_ana'] = { dashboard: true, cronograma: true, orcamento: true, stakeholders: true, riscos: true, convidar: true };
    defaults['proj_marketing_user_bruno'] = { dashboard: true, cronograma: true, orcamento: false, stakeholders: false, riscos: true, convidar: false };
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('stem_tab_permissions', JSON.stringify(tabPermissionsMap));
  }, [tabPermissionsMap]);

  // Determina se o usuário atual é gestor/admin em qualquer projeto ou no sistema
  const isGestorGlobal = memberships.some(
    m => m.userId === activeUser.id && m.role === 'admin'
  );

  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    const userMemberProjects = memberships
      .filter(m => m.userId === activeUser.id)
      .map(m => projects.find(p => p.id === m.projectId))
      .filter(Boolean) as Project[];
    const filtered = userMemberProjects.filter(p => p.name !== 'Visão Geral' || isGestorGlobal);
    return filtered[0] || null;
  });

  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');

  const hasTabPermission = (tabKey: TabKey): boolean => {
    if (!activeProject || !activeUser) return false;
    const mem = memberships.find(m => m.projectId === activeProject.id && m.userId === activeUser.id);
    if (!mem) return false;
    if (mem.role === 'admin' || mem.role === 'technical_lead' || activeUser.id === 'user_pedro') return true;
    
    const permKey = `${activeProject.id}_${activeUser.id}`;
    const userPerms = tabPermissionsMap[permKey];
    if (!userPerms) {
      if (tabKey === 'dashboard' || tabKey === 'cronograma') return true;
      return false;
    }
    return (userPerms as any)[tabKey] ?? false;
  };

  useEffect(() => {
    if (activeUser && activeProject) {
      if (!hasTabPermission(currentTab)) {
        const tabsOrder: TabKey[] = ['dashboard', 'cronograma', 'orcamento', 'stakeholders', 'riscos'];
        const firstAllowed = tabsOrder.find(t => hasTabPermission(t));
        if (firstAllowed) {
          setCurrentTab(firstAllowed);
        }
      }
    }
  }, [activeUser, activeProject, currentTab, tabPermissionsMap, memberships]);
  const [showSettings, setShowSettings] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper date function for auto-progression
  function calculateDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
  }

  // Dashboard Data and Simulation Timeline states
  const [currentDate, setCurrentDate] = useState<string>('2026-06-20');
  const [tasks, setTasks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);

  // Load dashboard data whenever activeProject or currentTab changes
  useEffect(() => {
    if (!activeProject) return;
    
    // Tasks
    const storageKey = `tasks_${activeProject.id}`;
    const localTasks = localStorage.getItem(storageKey);
    let loadedTasks: any[] = [];
    if (localTasks) {
      try { loadedTasks = JSON.parse(localTasks); } catch(e) {}
    }

    // Auto-progression logic: if task is in 'todo' status, and simulated date is at least 2 days past startDate
    let changed = false;
    if (currentDate) {
      loadedTasks = loadedTasks.map(t => {
        if (t.status === 'todo' && t.startDate) {
          const diff = calculateDaysDifference(currentDate, t.startDate);
          if (diff >= 2) {
            changed = true;
            return { ...t, status: 'in_progress' };
          }
        }
        return t;
      });
    }

    if (changed) {
      localStorage.setItem(storageKey, JSON.stringify(loadedTasks));
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProject.id] });
    }

    setTasks(loadedTasks);

    // Cash flow transactions
    const localTrans = localStorage.getItem(`stem_cash_flow_${activeProject.id}`);
    if (localTrans) {
      try { setTransactions(JSON.parse(localTrans)); } catch(e) {}
    } else {
      setTransactions([]);
    }

    // Risks
    const localRisks = localStorage.getItem(`stem_risks_${activeProject.id}`);
    if (localRisks) {
      try { setRisks(JSON.parse(localRisks)); } catch(e) {}
    } else {
      setRisks([]);
    }
  }, [activeProject, currentTab, currentDate, queryClient]);

  // Database Connection Status Checker
  const [dbStatus, setDbStatus] = useState<string>('Verificando Banco...');
  const [isDbActive, setIsDbActive] = useState<boolean>(false);

  useEffect(() => {
    if (!showSettings) return;
    setDbStatus('Verificando Conexão...');
    fetch('http://localhost:3001/stakeholders', {
      headers: { 'Authorization': 'Bearer dev-token' }
    })
      .then(res => {
        if (res.ok) {
          setDbStatus('Banco Cloud PostgreSQL Conectado');
          setIsDbActive(true);
        } else {
          setDbStatus('Banco Local Ativo (Offline Sync)');
          setIsDbActive(false);
        }
      })
      .catch(() => {
        setDbStatus('Banco Local Ativo (Offline Sync)');
        setIsDbActive(false);
      });
  }, [showSettings]);

  // Estados locais para formulário de novo membro dentro do Workspace
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('member');

  // Permissions for current user in current project
  const currentMembership = memberships.find(
    m => m.projectId === activeProject?.id && m.userId === activeUser.id
  );
  const isAdmin = currentMembership?.role === 'admin' || currentMembership?.role === 'technical_lead';

  // Full permissions object for child components
  const permissions = {
    role: currentMembership?.role || 'member',
    area: null,
    canEditWbs: isAdmin,
    canEditTasks: isAdmin,
    canEditBudget: isAdmin,
    canEditRisks: isAdmin,
    canEditStakeholders: isAdmin,
    canEditStatusReports: isAdmin,
    canEditScopeChanges: isAdmin,
    canComment: true,
    canCommentOnly: !isAdmin,
    isSponsor: false,
    isMentor: currentMembership?.role === 'mentor',
    isAdmin: isAdmin,
  };

  // Available projects for current user (exibe "Visão Geral" apenas se for gestor)
  const availableProjects = projects.filter(p => {
    if (p.name === 'Visão Geral') {
      return isGestorGlobal;
    }
    return memberships.some(m => m.projectId === p.id && m.userId === activeUser.id);
  });

  const currentOrg = organizations[0];

  /* ── theme helpers ── */
  const isDark = config.theme === 'dark';
  const bg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const cardBg = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const textPrimary = isDark ? 'text-white' : 'text-stone-900';
  const sidebarBg = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-stone-100' : 'text-stone-900'} flex flex-col font-sans antialiased`}>
      {/* Floating Exit Button in Fullscreen Mode */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-50 p-2 py-1 px-3 bg-red-600 hover:bg-red-750 text-white font-mono text-[10px] uppercase font-black tracking-widest rounded-full shadow-2xl flex items-center gap-1.5 transition-all select-none hover:scale-105 cursor-pointer border border-red-500/20"
          style={{ color: '#ffffff' }}
          title="Sair da Tela Cheia"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Sair da Tela Cheia</span>
        </button>
      )}

      {/* ── Header ── */}
      {!isFullscreen && (
        <header className={`${cardBg} border-b px-4 py-2 flex justify-between items-center sticky top-0 z-40 shadow-sm select-none gap-4 flex-wrap lg:flex-nowrap`}>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-9 h-9 accent-bg rounded-lg flex items-center justify-center font-black text-base italic text-white tracking-tight cursor-pointer shadow-lg">
              M
            </div>
            <div>
              <h1 className={`text-xs font-display font-black tracking-tight ${textPrimary} leading-none`}>
                {config.orgName || 'Mach Control'}
              </h1>
              <p className={`text-[9px] font-mono uppercase tracking-widest ${textMuted} mt-0.5`}>
                Gestão de Projetos
              </p>
            </div>
            
            {/* Seletor de Projetos no Cabeçalho */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className={`text-left px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-stone-950 border-stone-850 text-stone-200 hover:border-stone-700'
                    : 'bg-stone-50 border-stone-200 text-stone-900 hover:border-stone-300'
                }`}
              >
                <span className="truncate max-w-[120px]">{activeProject?.name || 'Selecionar...'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showProjectDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`absolute z-50 top-full mt-1 w-48 rounded-lg border shadow-xl overflow-hidden ${
                      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                    }`}
                  >
                    {availableProjects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProject(p);
                          setShowProjectDropdown(false);
                          setCurrentTab('dashboard');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                          p.id === activeProject?.id
                            ? 'accent-bg text-white font-bold'
                            : isDark
                            ? 'text-stone-305 hover:bg-stone-808'
                            : 'text-stone-707 hover:bg-stone-50'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Abas no Cabeçalho (Horizontal e Responsivo) */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-full no-scrollbar py-1 px-2 select-none flex-grow justify-center">
            {ALL_TABS.filter(tab => hasTabPermission(tab.key)).map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'accent-bg text-white font-bold shadow-sm'
                      : isDark
                      ? 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Botões de Configurações, User e Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botão de Tela Cheia */}
            <button
              onClick={() => setIsFullscreen(true)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 bg-stone-900'
                  : 'border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300 bg-white'
              }`}
              title="Tela Cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 bg-stone-900'
                  : 'border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300 bg-white'
              }`}
              title="Configurações"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* User info */}
            <div className={`hidden md:flex flex-col text-right font-mono text-[9px] ${textMuted} border-r pr-2 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
              <span className="uppercase">{isAdmin ? 'Gestor' : 'Membro'}</span>
              <span className={`font-bold ${textPrimary}`}>{activeUser.name}</span>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'border-stone-800 text-stone-400 hover:text-red-505 hover:border-red-650/50 bg-stone-900'
                  : 'border-stone-200 text-stone-500 hover:text-red-500 hover:border-red-300 bg-white'
              }`}
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* ── Settings Panel ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/98 backdrop-blur-md flex flex-col p-6 md:p-10 text-stone-850 dark:text-stone-100"
          >
            <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col space-y-6">
              {/* Header do Modal */}
              <div className="flex justify-between items-center pb-6 border-b border-stone-250 dark:border-stone-800">
                <div>
                  <h2 className="text-xl font-display font-black uppercase text-stone-900 dark:text-stone-100 tracking-wider">
                    Configurações do Sistema
                  </h2>
                  <p className="text-xs text-stone-450 font-mono mt-1">
                    Mach Control • Painel de Gestão e Customização
                  </p>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 px-4 rounded-lg border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-50 dark:bg-stone-900 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono text-xs uppercase shadow"
                >
                  <X className="w-4 h-4" /> Fechar
                </button>
              </div>

              {/* Seção 1: Configurações Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Org Name */}
                <div className="space-y-1.5">
                  <label className="mach-label text-stone-450">Nome da Org</label>
                  <input
                    type="text"
                    value={config.orgName}
                    onChange={e => setConfig(prev => ({ ...prev, orgName: e.target.value }))}
                    className="mach-input w-full"
                  />
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <label className="mach-label text-stone-500 dark:text-stone-400">Cor</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, primaryColor: 'red' }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        config.primaryColor === 'red' ? 'border-red-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: '#DC2626' }}
                    />
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, primaryColor: 'cyan' }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        config.primaryColor === 'cyan' ? 'border-cyan-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: '#06B6D4' }}
                    />
                  </div>
                </div>

                {/* Theme */}
                <div className="space-y-1.5">
                  <label className="mach-label text-stone-450">Tema</label>
                  <button
                    onClick={() =>
                      setConfig(prev => ({
                        ...prev,
                        theme: prev.theme === 'dark' ? 'light' : 'dark',
                      }))
                    }
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-250 dark:border-stone-800 text-stone-750 dark:text-stone-300 text-xs font-bold transition-all cursor-pointer bg-stone-50 dark:bg-stone-900 w-full justify-center"
                  >
                    {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    {isDark ? 'Escuro' : 'Claro'}
                  </button>
                </div>

                {/* Nível de Competição */}
                <div className="space-y-1.5">
                  <label className="mach-label text-stone-450">Nível de Competição</label>
                  <select
                    value={config.competitionLevel || 'regional'}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        competitionLevel: e.target.value as any,
                      }))
                    }
                    className="mach-input py-1.5 text-xs font-bold capitalize cursor-pointer w-full"
                  >
                    <option value="regional">Regional</option>
                    <option value="nacional">Nacional</option>
                    <option value="mundial">Mundial</option>
                  </select>
                </div>
              </div>

              {/* Seção 2: Métodos e Sub-módulos Ativos por Área */}
              <div className="pt-6 border-t border-stone-250 dark:border-stone-800 space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Métodos e Sub-módulos Ativos por Área
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cronograma */}
                  <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Cronograma</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                      {[
                        { key: 'enableWbs', label: 'WBS / EAP' },
                        { key: 'enable5w2h', label: 'Planilha 5W2H' },
                        { key: 'enableKanban', label: 'Quadro Kanban' },
                        { key: 'enableEisenhower', label: 'Matriz Eisenhower' },
                        { key: 'enableGantt', label: 'Gráfico de Gantt' },
                        { key: 'enableFlowchart', label: 'CANVAS / ReactFlow' },
                        { key: 'enablePendingWarnings', label: 'Sinalizar Info Pendente' }
                      ].map(method => {
                        const isEnabled = config[method.key as keyof OrgConfig] !== false;
                        return (
                          <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={e => {
                                setConfig(prev => ({ ...prev, [method.key]: e.target.checked }));
                              }}
                              className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                            />
                            <span>{method.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Orçamento / Finanças */}
                  <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Orçamento & Finanças</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                      {[
                        { key: 'enableFinancePlanning', label: 'Planilha de Recursos' },
                        { key: 'enableFinanceQuotations', label: 'Cotações & Comparações' },
                        { key: 'enableFinanceBudget', label: 'Linhas de Baseline' },
                        { key: 'enableFinanceCashflow', label: 'Fluxo de Caixa / Ledger' },
                        { key: 'enableFinanceContingency', label: 'Reserva de Contingência' },
                        { key: 'enableFinanceReconciliation', label: 'Reconciliação Bancária' }
                      ].map(method => {
                        const isEnabled = config[method.key as keyof OrgConfig] !== false;
                        return (
                          <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={e => {
                                setConfig(prev => ({ ...prev, [method.key]: e.target.checked }));
                              }}
                              className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                            />
                            <span>{method.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stakeholders */}
                  <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Stakeholders</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                      {[
                        { key: 'enableStakeholdersMap', label: 'Mapeamento Mendelow' },
                        { key: 'enableStakeholdersMatrix', label: 'Matriz de Engajamento' },
                        { key: 'enableStakeholdersLog', label: 'Registro de Comunicações' }
                      ].map(method => {
                        const isEnabled = config[method.key as keyof OrgConfig] !== false;
                        return (
                          <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={e => {
                                setConfig(prev => ({ ...prev, [method.key]: e.target.checked }));
                              }}
                              className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                            />
                            <span>{method.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Riscos */}
                  <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Riscos e Escopo</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                      {[
                        { key: 'enableRisksList', label: 'Identificação de Riscos' },
                        { key: 'enableRisksReports', label: 'Relatórios de Status' },
                        { key: 'enableRisksScope', label: 'Controle de Escopo' },
                        { key: 'enableRisksEvm', label: 'Análise EVM / Valor Agregado' }
                      ].map(method => {
                        const isEnabled = config[method.key as keyof OrgConfig] !== false;
                        return (
                          <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={e => {
                                setConfig(prev => ({ ...prev, [method.key]: e.target.checked }));
                              }}
                              className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                            />
                            <span>{method.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Nova: Status de Integração e Banco de Dados */}
              <div className="pt-6 border-t border-stone-250 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Infraestrutura & Banco de Dados
                </h3>
                <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-stone-800 dark:text-stone-200">Integração Relacional Híbrida</p>
                    <p className="text-stone-500 dark:text-stone-400 font-mono text-[10.5px]">Sincronização bidirecional entre LocalStorage offline e servidor cloud NestJS PostgreSQL.</p>
                  </div>
                  <div className="flex items-center gap-2.5 font-mono text-[10px]">
                    <span className={`px-2.5 py-1 rounded font-bold border flex items-center gap-1.5 ${isDbActive ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-500' : 'bg-stone-100 dark:bg-stone-950/50 border-stone-255 dark:border-stone-800 text-stone-600 dark:text-stone-400'}`}>
                      <Database className="w-3.5 h-3.5" />
                      {dbStatus}
                    </span>
                    <span className="bg-stone-100 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 px-2.5 py-1 rounded font-bold uppercase">
                      Sincronização Ativa
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção 3: Gerenciar Membros (Apenas Gestor) */}
              {isGestorGlobal && (
                <div className="pt-6 border-t border-stone-250 dark:border-stone-800 space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Gerenciar Membros da Equipe
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Members List */}
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                      {users.map(u => {
                        const userMemberships = memberships.filter(m => m.userId === u.id);
                        const role = userMemberships[0]?.role || 'member';
                        const isUserAdmin = role === 'admin';
                        const memberVisibleProjects = visibility[u.id] || [];
                        const allUserProjects = projects.filter(p => p.name !== 'Visão Geral');

                        return (
                          <div
                            key={u.id}
                            className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{u.name}</p>
                                <p className="text-xs font-mono text-stone-500">{u.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isUserAdmin
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-250 dark:border-stone-750'
                                }`}>
                                  {role === 'technical_lead' ? 'Técnico' : role === 'admin' ? 'Gestor' : role}
                                </span>
                                {u.id !== activeUser.id && (
                                  <button
                                    onClick={() => {
                                      setUsers(prev => prev.filter(usr => usr.id !== u.id));
                                      setMemberships(prev => prev.filter(m => m.userId !== u.id));
                                      setVisibility(prev => {
                                        const copy = { ...prev };
                                        delete copy[u.id];
                                        return copy;
                                      });
                                    }}
                                    className="text-stone-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                    title="Remover Membro da Organização"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Project visibility checkboxes */}
                            {u.id !== activeUser.id && (
                              <div className="pt-2 border-t border-stone-200 dark:border-stone-800/40">
                                <p className="text-[9px] font-mono uppercase tracking-wider mb-2 text-stone-500">
                                  Projetos visíveis:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {allUserProjects.map(proj => {
                                    const isVisible = memberVisibleProjects.includes(proj.id);
                                    return (
                                      <button
                                        key={proj.id}
                                        onClick={() => {
                                          setVisibility(prev => {
                                            const current = prev[u.id] || [];
                                            const updated = isVisible
                                              ? current.filter(id => id !== proj.id)
                                              : [...current, proj.id];
                                            return { ...prev, [u.id]: updated };
                                          });

                                          if (isVisible) {
                                            setMemberships(prev =>
                                              prev.filter(m => !(m.projectId === proj.id && m.userId === u.id))
                                            );
                                          } else {
                                            const exists = memberships.some(
                                              m => m.projectId === proj.id && m.userId === u.id
                                            );
                                            if (!exists) {
                                              setMemberships(prev => [
                                                ...prev,
                                                {
                                                  id: `mem_${Date.now()}_${u.id}_${proj.id}`,
                                                  projectId: proj.id,
                                                  userId: u.id,
                                                  role: role,
                                                  userEmail: u.email,
                                                  userName: u.name,
                                                },
                                              ]);
                                            }
                                          }
                                        }}
                                        className={`text-[10px] font-mono px-2 py-1 rounded border transition-all cursor-pointer ${
                                          isVisible
                                            ? 'bg-red-655 border-red-500 text-white shadow font-bold bg-[#DC2626]'
                                            : 'bg-stone-100 dark:bg-stone-950 border-stone-250 dark:border-stone-850 text-stone-500 hover:border-stone-400 dark:hover:border-stone-750'
                                        }`}
                                      >
                                        {proj.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Tab visibility checkboxes */}
                            {u.id !== activeUser.id && (
                              <div className="pt-2 border-t border-stone-200 dark:border-stone-800/40">
                                <p className="text-[9px] font-mono uppercase tracking-wider mb-2 text-stone-500">
                                  Abas visíveis no projeto atual:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(['dashboard', 'cronograma', 'orcamento', 'stakeholders', 'riscos'] as TabKey[]).map(tabKey => {
                                    const permKey = `${activeProject?.id}_${u.id}`;
                                    const userPerms = tabPermissionsMap[permKey] || {
                                      dashboard: true,
                                      cronograma: true,
                                      orcamento: tabKey === 'dashboard' || tabKey === 'cronograma',
                                      stakeholders: tabKey === 'dashboard' || tabKey === 'cronograma',
                                      riscos: tabKey === 'dashboard' || tabKey === 'cronograma',
                                      convidar: false
                                    };
                                    const isTabVisible = !!userPerms[tabKey];

                                    return (
                                      <button
                                        key={tabKey}
                                        onClick={() => {
                                          setTabPermissionsMap(prev => {
                                            const current = prev[permKey] || {
                                              dashboard: true,
                                              cronograma: true,
                                              orcamento: false,
                                              stakeholders: false,
                                              riscos: false,
                                              convidar: false
                                            };
                                            const updated = {
                                              ...current,
                                              [tabKey]: !isTabVisible
                                            };
                                            return { ...prev, [permKey]: updated };
                                          });
                                        }}
                                        className={`text-[9px] font-mono px-2 py-1 rounded border transition-all cursor-pointer capitalize ${
                                          isTabVisible
                                            ? 'bg-red-655 border-red-500 text-white shadow font-bold bg-[#DC2626]'
                                            : 'bg-stone-100 dark:bg-stone-950 border-stone-250 dark:border-stone-850 text-stone-500 hover:border-stone-400 dark:hover:border-stone-750'
                                        }`}
                                      >
                                        {tabKey}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Member Form */}
                    <div className="p-4 rounded-xl border border-stone-250 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850 dark:text-stone-100">
                        Adicionar Novo Membro
                      </h4>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={e => setNewMemberName(e.target.value)}
                          placeholder="Nome"
                          className="mach-input w-full"
                        />
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={e => setNewMemberEmail(e.target.value)}
                          placeholder="email@equipe.com"
                          className="mach-input w-full"
                        />
                        <input
                          type="password"
                          value={newMemberPassword}
                          onChange={e => setNewMemberPassword(e.target.value)}
                          placeholder="Senha temporária"
                          className="mach-input w-full"
                        />
                        <select
                          value={newMemberRole}
                          onChange={e => setNewMemberRole(e.target.value as ProjectRole)}
                          className="mach-input w-full cursor-pointer text-xs"
                        >
                          <option value="member">Membro</option>
                          <option value="technical_lead">Técnico</option>
                          <option value="admin">Gestor</option>
                          <option value="mentor">Mentor</option>
                        </select>
                        <button
                          onClick={() => {
                            if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()) return;
                            
                            const newUserId = `user_member_${Date.now()}`;
                            const newUser: User = {
                              id: newUserId,
                              name: newMemberName.trim(),
                              email: newMemberEmail.trim().toLowerCase(),
                              passwordHash: newMemberPassword.trim(),
                            };

                            setUsers(prev => [...prev, newUser]);
                            setVisibility(prev => ({
                              ...prev,
                              [newUserId]: []
                            }));

                            // Adicionar o membership inicial no projeto atual para que ele apareça na lista de memberships
                            setMemberships(prev => [
                              ...prev,
                              {
                                id: `mem_${Date.now()}_${newUserId}_${activeProject?.id}`,
                                projectId: activeProject?.id || '',
                                userId: newUserId,
                                role: newMemberRole,
                                userEmail: newUser.email,
                                userName: newUser.name,
                              }
                            ]);
                            
                            // Adicionar à visibilidade o projeto atual
                            setVisibility(prev => ({
                              ...prev,
                              [newUserId]: [activeProject?.id || '']
                            }));

                            setNewMemberName('');
                            setNewMemberEmail('');
                            setNewMemberPassword('');
                            setNewMemberRole('member');
                          }}
                          disabled={!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()}
                          className="mach-button-primary w-full flex items-center justify-center gap-2 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Membro
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body ── */}
      <div className="flex-grow flex flex-col">
        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!activeProject ? (
              <motion.div
                key="no-project"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center p-12"
              >
                <div className="text-center">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className={`text-sm ${textMuted}`}>
                    Selecione um projeto na barra lateral.
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Dashboard */}
                {currentTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 lg:p-10"
                  >
                    <Dashboard
                      tasks={tasks}
                      transactions={transactions}
                      risks={risks}
                      currentDate={currentDate}
                      setCurrentDate={setCurrentDate}
                      isFullscreen={isFullscreen}
                      setIsFullscreen={setIsFullscreen}
                    />
                  </motion.div>
                )}

                {/* Cronograma */}
                {currentTab === 'cronograma' && (
                  <motion.div
                    key="cronograma"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-2"
                  >
                    <CronogramaDashboard
                      activeProject={activeProject}
                      activeUser={activeUser}
                      memberships={memberships}
                      users={users}
                      permissions={permissions}
                      config={config}
                      currentDate={currentDate}
                      isFullscreen={isFullscreen}
                      setIsFullscreen={setIsFullscreen}
                    />
                  </motion.div>
                )}

                {/* Orçamento */}
                {currentTab === 'orcamento' && (
                  <motion.div
                    key="orcamento"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 lg:p-10"
                  >
                    <Finance
                      activeProject={activeProject}
                      activeUser={activeUser}
                      memberships={memberships}
                      users={users}
                      permissions={permissions}
                      config={config}
                      isFullscreen={isFullscreen}
                      setIsFullscreen={setIsFullscreen}
                    />
                  </motion.div>
                )}

                {/* Stakeholders */}
                {currentTab === 'stakeholders' && (
                  <motion.div
                    key="stakeholders"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 lg:p-10"
                  >
                    <Stakeholders
                      activeProject={activeProject}
                      activeUser={activeUser}
                      permissions={permissions}
                      config={config}
                      isFullscreen={isFullscreen}
                      setIsFullscreen={setIsFullscreen}
                    />
                  </motion.div>
                )}

                {/* Riscos */}
                {currentTab === 'riscos' && (
                  <motion.div
                    key="riscos"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 lg:p-10"
                  >
                    <RiskManagement
                      activeProject={activeProject}
                      activeUser={activeUser}
                      permissions={permissions}
                      config={config}
                      isFullscreen={isFullscreen}
                      setIsFullscreen={setIsFullscreen}
                    />
                  </motion.div>
                )}

              </>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
