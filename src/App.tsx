import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckSquare, 
  DollarSign, 
  ShieldAlert, 
  FileText, 
  MessageSquare, 
  Compass, 
  Users, 
  Award, 
  Settings, 
  Sliders, 
  RotateCcw,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

import { 
  Task, 
  Transaction, 
  Risk, 
  Stakeholder, 
  CommunicationLog, 
  TeamMember, 
  RACIRow, 
  LessonLearned,
  ProjectCharter,
  KickoffMeeting,
  INITIAL_MEMBERS,
  INITIAL_TASKS,
  INITIAL_TRANSACTIONS,
  INITIAL_RISKS,
  INITIAL_STAKEHOLDERS,
  INITIAL_COMMUNICATION_LOGS,
  INITIAL_RACI,
  INITIAL_LESSONS_LEARNED,
  INITIAL_CHARTER,
  INITIAL_KICKOFF
} from './types';

import Dashboard from './components/Dashboard';
import TasksSchedule from './components/TasksSchedule';
import Finance from './components/Finance';
import RiskManagement from './components/RiskManagement';
import Stakeholders from './components/Stakeholders';
import TeamLessons from './components/TeamLessons';
import ProjectCharterModule from './components/ProjectCharter';
import Kickoff from './components/Kickoff';
import LessonsLearnedModule from './components/LessonsLearnedModule';

export default function App() {
  const [activeArea, setActiveArea] = useState<'operational' | 'planning'>('operational');
  const [activeOperationalTab, setActiveOperationalTab] = useState<'dashboard' | 'tasks' | 'finance' | 'risks'>('dashboard');
  const [activePlanningTab, setActivePlanningTab] = useState<'charter' | 'kickoff' | 'stakeholders' | 'team' | 'lessons'>('charter');

  const [currentDate, setCurrentDate] = useState<string>(() => {
    return localStorage.getItem('mach_date') || '2026-06-17';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mach_theme') as 'light' | 'dark') || 'light';
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Unified State Engine
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const local = localStorage.getItem('mach_members');
    return local ? JSON.parse(local) : INITIAL_MEMBERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem('mach_tasks');
    return local ? JSON.parse(local) : INITIAL_TASKS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const local = localStorage.getItem('mach_transactions');
    return local ? JSON.parse(local) : INITIAL_TRANSACTIONS;
  });

  const [risks, setRisks] = useState<Risk[]>(() => {
    const local = localStorage.getItem('mach_risks');
    return local ? JSON.parse(local) : INITIAL_RISKS;
  });

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(() => {
    const local = localStorage.getItem('mach_stakeholders');
    return local ? JSON.parse(local) : INITIAL_STAKEHOLDERS;
  });

  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>(() => {
    const local = localStorage.getItem('mach_comm_logs');
    return local ? JSON.parse(local) : INITIAL_COMMUNICATION_LOGS;
  });

  const [raciRow, setRaciRow] = useState<RACIRow[]>(() => {
    const local = localStorage.getItem('mach_raci');
    return local ? JSON.parse(local) : INITIAL_RACI;
  });

  const [lessons, setLessons] = useState<LessonLearned[]>(() => {
    const local = localStorage.getItem('mach_lessons');
    return local ? JSON.parse(local) : INITIAL_LESSONS_LEARNED;
  });

  const [charter, setCharter] = useState<ProjectCharter>(() => {
    const local = localStorage.getItem('mach_charter');
    return local ? JSON.parse(local) : INITIAL_CHARTER;
  });

  const [kickoffMeetings, setKickoffMeetings] = useState<KickoffMeeting[]>(() => {
    const local = localStorage.getItem('mach_kickoff_meetings');
    return local ? JSON.parse(local) : INITIAL_KICKOFF;
  });

  // LocalStorage synchronizations
  useEffect(() => {
    localStorage.setItem('mach_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('mach_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('mach_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mach_risks', JSON.stringify(risks));
  }, [risks]);

  useEffect(() => {
    localStorage.setItem('mach_stakeholders', JSON.stringify(stakeholders));
  }, [stakeholders]);

  useEffect(() => {
    localStorage.setItem('mach_comm_logs', JSON.stringify(communicationLogs));
  }, [communicationLogs]);

  useEffect(() => {
    localStorage.setItem('mach_raci', JSON.stringify(raciRow));
  }, [raciRow]);

  useEffect(() => {
    localStorage.setItem('mach_lessons', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('mach_charter', JSON.stringify(charter));
  }, [charter]);

  useEffect(() => {
    localStorage.setItem('mach_kickoff_meetings', JSON.stringify(kickoffMeetings));
  }, [kickoffMeetings]);

  useEffect(() => {
    localStorage.setItem('mach_date', currentDate);
  }, [currentDate]);

  useEffect(() => {
    localStorage.setItem('mach_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Unified reset handler
  const handleClearHistory = () => {
    if (window.confirm('Deseja resetar todos os dados para o padrão de simulação da Equipe Mach One?')) {
      localStorage.clear();
      setMembers(INITIAL_MEMBERS);
      setTasks(INITIAL_TASKS);
      setTransactions(INITIAL_TRANSACTIONS);
      setRisks(INITIAL_RISKS);
      setStakeholders(INITIAL_STAKEHOLDERS);
      setCommunicationLogs(INITIAL_COMMUNICATION_LOGS);
      setRaciRow(INITIAL_RACI);
      setLessons(INITIAL_LESSONS_LEARNED);
      setCharter(INITIAL_CHARTER);
      setKickoffMeetings(INITIAL_KICKOFF);
      setCurrentDate('2026-06-17');
      setTheme('light');
      setActiveArea('operational');
      setActiveOperationalTab('dashboard');
      setShowSettingsModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-[#0a0a0a] dark:text-[#f5f5f5] flex flex-col font-sans transition-colors duration-200" id="mach-app-wrapper">
      
      {/* SIMPLIFIED MINIMALIST TOP BAR */}
      <header className="bg-white dark:bg-[#121212] border-b border-stone-250 dark:border-stone-850 px-6 py-3.5 sticky top-0 z-40 flex justify-between items-center select-none shadow-sm">
        <div className="flex items-center gap-2.5">
          {/* Solid Red Mini-Logo Accent */}
          <div className="w-8 h-8 bg-[#DC2626] rounded flex items-center justify-center font-black text-sm italic text-white" id="mach-logo">
            M1
          </div>
          <div>
            <h1 className="text-xs font-display font-extrabold tracking-wide text-stone-900 dark:text-stone-50">
              MACH CONTROL <span className="text-[#DC2626] font-mono select-none ml-1">v3.0.0</span>
            </h1>
            <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Gestão e Engenharia de Sprints • FSAE Racing</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          {/* Workspace Area Toggle Trigger (Season Planning Button) */}
          <button 
            onClick={() => {
              setActiveArea(activeArea === 'operational' ? 'planning' : 'operational');
            }}
            className={`mach-button-secondary text-xs px-3.5 py-1.5 font-bold transition-all flex items-center gap-1.5 ${
              activeArea === 'planning' 
                ? 'bg-[#DC2626] text-white border-transparent hover:bg-red-750' 
                : 'text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeArea === 'planning' ? '◄ Voltar Operational Area' : 'Season Planning Area'}</span>
          </button>

          {/* Quick Config Settings Button */}
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-md border border-stone-300 dark:border-stone-850 bg-stone-50 dark:bg-stone-900 text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
            title="Abrir Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CORE FRAMEWORK CONTAINER */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="app-grid-viewport">
        
        {/* NARROW DESIGNER SIDEBAR (Col-Span 3) */}
        <nav className="lg:col-span-3 flex flex-col gap-2.5" id="mach-nav-rack">
          <div className="pb-1 border-b border-stone-200 dark:border-stone-850 select-none flex justify-between items-center">
            <span className="text-[9px] font-mono text-stone-450 tracking-wider font-bold uppercase">
              {activeArea === 'operational' ? 'Painel Operacional (4 Módulos)' : 'Planejamento de Temporada'}
            </span>
          </div>

          {/* RENDER OPERATIONAL SIDEBAR BUTTONS */}
          {activeArea === 'operational' ? (
            <>
              <button
                onClick={() => setActiveOperationalTab('dashboard')}
                className={`w-full p-3.5 rounded border text-left flex items-center gap-3.5 transition-all text-xs cursor-pointer ${
                  activeOperationalTab === 'dashboard'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold shadow-sm'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800 dark:hover:text-stone-105'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-bold">Dashboard Geral</p>
                  <p className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-wide font-mono">Métricas EVM & Mach Wheel</p>
                </div>
              </button>

              <button
                onClick={() => setActiveOperationalTab('tasks')}
                className={`w-full p-3.5 rounded border text-left flex items-center gap-3.5 transition-all text-xs cursor-pointer ${
                  activeOperationalTab === 'tasks'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold shadow-sm'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800 dark:hover:text-stone-105'
                }`}
              >
                <CheckSquare className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-bold">Cronograma WBS</p>
                  <p className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-wide font-mono">Gantt, PERT & 5W2H</p>
                </div>
              </button>

              <button
                onClick={() => setActiveOperationalTab('finance')}
                className={`w-full p-3.5 rounded border text-left flex items-center gap-3.5 transition-all text-xs cursor-pointer ${
                  activeOperationalTab === 'finance'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold shadow-sm'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800 dark:hover:text-stone-105'
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-bold">Gestão Financeira</p>
                  <p className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-wide font-mono">Cenarios & Tesouraria</p>
                </div>
              </button>

              <button
                onClick={() => setActiveOperationalTab('risks')}
                className={`w-full p-3.5 rounded border text-left flex items-center gap-3.5 transition-all text-xs cursor-pointer ${
                  activeOperationalTab === 'risks'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold shadow-sm'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800 dark:hover:text-stone-105'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-bold">Matriz de Riscos</p>
                  <p className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-wide font-mono">Resposta Contingencial</p>
                </div>
              </button>
            </>
          ) : (
            /* RENDER PLANNING SIDEBAR BUTTONS */
            <>
              <button
                onClick={() => setActivePlanningTab('charter')}
                className={`w-full p-3 rounded border text-left flex items-center gap-3 transition-all text-xs cursor-pointer ${
                  activePlanningTab === 'charter'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">Termo de Abertura (TAP)</p>
                  <p className="text-[9px] text-stone-400 font-mono">Premissas & Escopo</p>
                </div>
              </button>

              <button
                onClick={() => setActivePlanningTab('kickoff')}
                className={`w-full p-3 rounded border text-left flex items-center gap-3 transition-all text-xs cursor-pointer ${
                  activePlanningTab === 'kickoff'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">Reunião Kickoff</p>
                  <p className="text-[9px] text-stone-400 font-mono">Histórico & Decisões</p>
                </div>
              </button>

              <button
                onClick={() => setActivePlanningTab('stakeholders')}
                className={`w-full p-3 rounded border text-left flex items-center gap-3 transition-all text-xs cursor-pointer ${
                  activePlanningTab === 'stakeholders'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">Matriz Mendelow</p>
                  <p className="text-[9px] text-stone-400 font-mono">Partes Interessadas</p>
                </div>
              </button>

              <button
                onClick={() => setActivePlanningTab('team')}
                className={`w-full p-3 rounded border text-left flex items-center gap-3 transition-all text-xs cursor-pointer ${
                  activePlanningTab === 'team'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">Clima, RACI & Equipe</p>
                  <p className="text-[9px] text-stone-400 font-mono">Saúde do Time & EAP</p>
                </div>
              </button>

              <button
                onClick={() => setActivePlanningTab('lessons')}
                className={`w-full p-3 rounded border text-left flex items-center gap-3 transition-all text-xs cursor-pointer ${
                  activePlanningTab === 'lessons'
                    ? 'border-[#DC2626] bg-red-50/5 dark:bg-red-950/5 text-[#DC2626] font-bold'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 text-stone-500 hover:text-stone-800'
                }`}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">Lições Aprendidas</p>
                  <p className="text-[9px] text-stone-400 font-mono">Registro de Correções</p>
                </div>
              </button>
            </>
          )}

          {/* DYNAMIC COMPRESSED STATUS OVERVIEW CARD */}
          <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-850 rounded p-4 mt-6 text-[10px] text-stone-500 space-y-1.5 select-none font-mono">
            <span className="text-[9px] font-bold text-[#DC2626] block uppercase tracking-wider mb-2 select-none">✓ Resumo Integrado</span>
            <div className="flex justify-between pb-1 border-b border-stone-200/50 dark:border-stone-850/50">
              <span>FSAE Sprints:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">{tasks.length} cadastradas ({tasks.filter(t => t.status === 'Concluído').length} feitas)</span>
            </div>
            <div className="flex justify-between pb-1 border-b border-stone-200/50 dark:border-stone-850/50">
              <span>Controle de Caixa:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">{transactions.length} registros</span>
            </div>
            <div className="flex justify-between">
              <span>Saúde do Clima:</span>
              <span className="font-bold text-[#DC2626]">Bi-semanal ativo</span>
            </div>
          </div>
        </nav>

        {/* MAIN DISPLAY PORT (Col-Span 9) */}
        <main className="lg:col-span-9" id="mach-main-container">

          {/* OPERATIONAL AREA SWITCH PORTS */}
          {activeArea === 'operational' && (
            <>
              {activeOperationalTab === 'dashboard' && (
                <Dashboard 
                  tasks={tasks} 
                  transactions={transactions} 
                  risks={risks} 
                  currentDate={currentDate} 
                />
              )}

              {activeOperationalTab === 'tasks' && (
                <TasksSchedule 
                  tasks={tasks} 
                  setTasks={setTasks} 
                  members={members} 
                />
              )}

              {activeOperationalTab === 'finance' && (
                <Finance 
                  transactions={transactions} 
                  setTransactions={setTransactions} 
                />
              )}

              {activeOperationalTab === 'risks' && (
                <RiskManagement 
                  risks={risks} 
                  setRisks={setRisks} 
                  members={members} 
                />
              )}
            </>
          )}

          {/* PLANNING AREA SWITCH PORTS */}
          {activeArea === 'planning' && (
            <>
              {activePlanningTab === 'charter' && (
                <ProjectCharterModule 
                  charter={charter}
                  setCharter={setCharter}
                />
              )}

              {activePlanningTab === 'kickoff' && (
                <Kickoff 
                  meetings={kickoffMeetings}
                  setMeetings={setKickoffMeetings}
                  members={members}
                />
              )}

              {activePlanningTab === 'stakeholders' && (
                <Stakeholders 
                  stakeholders={stakeholders} 
                  setStakeholders={setStakeholders} 
                  logs={communicationLogs} 
                  setLogs={setCommunicationLogs} 
                />
              )}

              {activePlanningTab === 'team' && (
                <TeamLessons 
                  members={members} 
                  setMembers={setMembers} 
                  tasks={tasks} 
                  raciRow={raciRow} 
                  setRaciRow={setRaciRow} 
                />
              )}

              {activePlanningTab === 'lessons' && (
                <LessonsLearnedModule 
                  lessons={lessons}
                  setLessons={setLessons}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#121212] border-t border-stone-200 dark:border-stone-850 py-3.5 text-center text-[9px] font-mono text-stone-400 uppercase select-none tracking-wide">
        FÓRMULA SAE • EQUIPE MACH ONE PLANALTO DE AUTOMOTIVA • SIMULADOR INTEGRADO DE GESTÃO DE SPRINT
      </footer>

      {/* CONFIGURATIONS SYSTEM MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-white dark:bg-[#121212] border border-stone-250 dark:border-stone-800 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold font-mono uppercase text-stone-850 dark:text-stone-205 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[#DC2626]" />
                Painel de Configurações
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="text-stone-400 hover:text-stone-800 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs font-sans">
              
              {/* Theme Selector */}
              <div className="space-y-1.5 select-none text-xs">
                <label className="mach-label font-bold">Prefência de Estilo (Aparência)</label>
                <div className="grid grid-cols-2 gap-2 text-center font-semibold font-mono text-[10px]">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`p-2 border rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      theme === 'light' 
                        ? 'border-[#DC2626] bg-[#DC2626]/5 text-[#DC2626]' 
                        : 'border-stone-200 text-stone-500 hover:text-stone-805'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Claro (Alvo)</span>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`p-2 border rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      theme === 'dark' 
                        ? 'border-[#DC2626] bg-[#DC2626]/5 text-[#DC2626]' 
                        : 'border-stone-200 text-stone-550 hover:text-stone-150'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Escuro (Carbon)</span>
                  </button>
                </div>
              </div>

              {/* Simulation Date slider representation (decluttered header) */}
              <div className="space-y-2 select-none">
                <div className="flex justify-between items-center">
                  <label className="mach-label font-bold mb-0">Linha de Tempo (Timeline)</label>
                  <span className="text-[11px] font-mono text-[#DC2626] font-bold">
                    {new Date(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-stone-400" />
                  <input 
                    type="range" 
                    min="17625" 
                    max="18100" 
                    value={new Date(currentDate).getTime() / (86400000) - 2900} 
                    onChange={(e) => {
                      const daysFromBase = Number(e.target.value) + 2900;
                      const dateMs = daysFromBase * 86400000;
                      const dateStr = new Date(dateMs).toISOString().split('T')[0];
                      setCurrentDate(dateStr);
                    }}
                    className="w-full h-1 bg-stone-205 dark:bg-stone-800 rounded appearance-none cursor-pointer accent-[#DC2626]"
                  />
                </div>
                <p className="text-[9px] text-stone-400 font-mono leading-none pt-0.5">Controlador mecânico de simulação temporal</p>
              </div>

              {/* Dangerous operations (Mova 'Reset' para Configurações) */}
              <div className="border-t border-stone-200 dark:border-stone-850 pt-4 space-y-2 select-none">
                <label className="mach-label font-bold text-red-650">Operações Destrutivas</label>
                <button 
                  onClick={handleClearHistory}
                  className="w-full py-2 px-3 border border-red-200 dark:border-red-900 rounded bg-red-50/10 dark:bg-red-950/5 text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-all text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Apagar dados e carregar base padrão da faculdade"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Database Simulação
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-stone-150 dark:border-stone-850 select-none">
                <button 
                  type="button" 
                  onClick={() => setShowSettingsModal(false)}
                  className="mach-button-secondary text-xs"
                >
                  Fechar Painel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
