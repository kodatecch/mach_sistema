/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  TrendingUp, 
  CheckSquare, 
  DollarSign, 
  ShieldAlert, 
  Users, 
  Calendar, 
  HelpCircle,
  Flag,
  RotateCcw,
  Sliders,
  Settings,
  Flame
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
  INITIAL_MEMBERS,
  INITIAL_TASKS,
  INITIAL_TRANSACTIONS,
  INITIAL_RISKS,
  INITIAL_STAKEHOLDERS,
  INITIAL_COMMUNICATION_LOGS,
  INITIAL_RACI,
  INITIAL_LESSONS_LEARNED
} from './types';

import Dashboard from './components/Dashboard';
import TasksSchedule from './components/TasksSchedule';
import Finance from './components/Finance';
import RiskManagement from './components/RiskManagement';
import Stakeholders from './components/Stakeholders';
import TeamLessons from './components/TeamLessons';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'finance' | 'risks' | 'stakeholders' | 'team'>('dashboard');
  const [currentDate, setCurrentDate] = useState<string>('2026-06-17');

  // Unified State Engine with LocalStorage synchronization
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

  // Effects to synchronize to localStorage for durability
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

  // Fast reset handler
  const handleClearHistory = () => {
    if (window.confirm('Deseja resetar todos os dados para o padrão de simulação da Equipe Mach One/Two?')) {
      localStorage.clear();
      setMembers(INITIAL_MEMBERS);
      setTasks(INITIAL_TASKS);
      setTransactions(INITIAL_TRANSACTIONS);
      setRisks(INITIAL_RISKS);
      setStakeholders(INITIAL_STAKEHOLDERS);
      setCommunicationLogs(INITIAL_COMMUNICATION_LOGS);
      setRaciRow(INITIAL_RACI);
      setLessons(INITIAL_LESSONS_LEARNED);
      setCurrentDate('2026-06-17');
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="mach-app-wrapper">
      {/* GLOBAL TOP TELEMETRY NAV BAR */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl italic text-white select-none shadow-lg shadow-pink-500/20" id="mach-logo">
            M2
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">MACH ONE <span className="text-indigo-400 font-light">CENTRAL</span></span>
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-mono px-1.5 py-0.5 rounded leading-none">
                FSAE v2.6.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono uppercase tracking-[0.15em]">Gerenciamento Integrado • Universidade Federal</p>
          </div>
        </div>

        {/* Live Date controller Slider */}
        <div className="flex items-center gap-3.5 bg-slate-950 border border-slate-800 py-1.5 px-4 rounded-xl flex-grow max-w-md w-full">
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 shrink-0 select-none">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> TIMELINE:
          </span>
          <input 
            type="range" 
            min="17625" // Date slider representing timestamps roughly Jan 2026 to Dec 2026
            max="18100" 
            value={new Date(currentDate).getTime() / (86400000) - 2900} 
            onChange={(e) => {
              const daysFromBase = Number(e.target.value) + 2900;
              const dateMs = daysFromBase * 86400000;
              const dateStr = new Date(dateMs).toISOString().split('T')[0];
              setCurrentDate(dateStr);
            }}
            className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono font-bold text-indigo-400 shrink-0 select-none">
            {new Date(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* Quick controls reset */}
        <div className="flex items-center gap-3.5 shrink-0 bg-slate-900 border-l border-slate-800 pl-4">
          <button 
            onClick={handleClearHistory}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-mono transition"
            title="Resetar Banco de Dados Simulação"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE CONTAINERS */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDE BAR NAVIGATION RACK (Lg: col-span-3) */}
        <nav className="lg:col-span-3 flex flex-col gap-2.5" id="mach-nav-rack">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider font-bold mb-1 uppercase select-none">Módulos de Controle Integrado</span>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition font-sans ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 border-pink-400 text-white font-bold shadow-lg shadow-pink-500/25 scale-102'
                : 'bg-slate-900 border-slate-850 text-slate-350 hover:text-white hover:border-slate-800'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <div className="leading-tight">
              <div className="text-xs font-bold uppercase tracking-wide">Módulo 1 — Dashboard</div>
              <p className={`text-[10px] mt-0.5 ${activeTab === 'dashboard' ? 'text-white/80' : 'text-slate-500'}`}>
                Métricas EVM, Alertas & Mach Wheel
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition font-sans ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 border-pink-400 text-white font-bold shadow-lg shadow-pink-500/25 scale-102'
                : 'bg-slate-900 border-slate-850 text-slate-355 hover:text-white hover:border-slate-800'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <div className="leading-tight">
              <div className="text-xs font-bold uppercase tracking-wide">Módulo 2 — Cronograma</div>
              <p className={`text-[10px] mt-0.5 ${activeTab === 'tasks' ? 'text-white/80' : 'text-slate-500'}`}>
                Gantt, WBS, Kanban & PERT
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition font-sans ${
              activeTab === 'finance'
                ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 border-pink-400 text-white font-bold shadow-lg shadow-pink-500/25 scale-102'
                : 'bg-slate-900 border-slate-850 text-slate-355 hover:text-white hover:border-slate-800'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <div className="leading-tight">
              <div className="text-xs font-bold uppercase tracking-wide">Módulo 3 — Financeiro</div>
              <p className={`text-[10px] mt-0.5 ${activeTab === 'finance' ? 'text-white/80' : 'text-slate-500'}`}>
                Cenários, Fluxo & Contingência
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('risks')}
            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition font-sans ${
              activeTab === 'risks'
                ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 border-pink-400 text-white font-bold shadow-lg shadow-pink-500/25 scale-102'
                : 'bg-slate-900 border-slate-850 text-slate-355 hover:text-white hover:border-slate-800'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <div className="leading-tight">
              <div className="text-xs font-bold uppercase tracking-wide">Módulo 4 — Riscos</div>
              <p className={`text-[10px] mt-0.5 ${activeTab === 'risks' ? 'text-white/80' : 'text-slate-500'}`}>
                Matriz Probabilidade × Impacto
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('stakeholders')}
            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition font-sans ${
              activeTab === 'stakeholders'
                ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 border-pink-400 text-white font-bold shadow-lg shadow-pink-500/25 scale-102'
                : 'bg-slate-900 border-slate-850 text-slate-355 hover:text-white hover:border-slate-800'
            }`}
          >
            <Compass className="w-5 h-5" />
            <div className="leading-tight">
              <div className="text-xs font-bold uppercase tracking-wide">Módulo 5 — Stakeholders</div>
              <p className={`text-[10px] mt-0.5 ${activeTab === 'stakeholders' ? 'text-white/80' : 'text-slate-500'}`}>
                Mapa Mendelow & Claude IA
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition font-sans ${
              activeTab === 'team'
                ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 border-pink-400 text-white font-bold shadow-lg shadow-pink-500/25 scale-102'
                : 'bg-slate-900 border-slate-850 text-slate-355 hover:text-white hover:border-slate-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <div className="leading-tight">
              <div className="text-xs font-bold uppercase tracking-wide">Módulo 6 — Equipe & EAP</div>
              <p className={`text-[10px] mt-0.5 ${activeTab === 'team' ? 'text-white/80' : 'text-slate-500'}`}>
                Skills Map, RACI & Feedbacks
              </p>
            </div>
          </button>

          {/* SIMULATION SUMMARY INFO CARD */}
          <div className="bg-slate-950 border border-slate-850/60 rounded-xl p-4 mt-6 text-xs text-slate-500 font-mono space-y-2">
            <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase select-none">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> RESUMO DE TELEMETRIA:
            </span>
            <div className="flex justify-between">
              <span>Tarefas:</span>
              <span className="text-slate-300 font-semibold">{tasks.length} total ({tasks.filter(t => t.status==='Concluído').length} feito)</span>
            </div>
            <div className="flex justify-between">
              <span>Rendimento:</span>
              <span className="text-slate-300 font-semibold">
                {transactions.filter(t=>t.type==='despesa').length} saídas
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ameaças:</span>
              <span className="text-slate-300 font-semibold">
                {risks.filter(r=>r.type==='ameaça' && r.status==='ativo').length} pendentes
              </span>
            </div>
          </div>
        </nav>

        {/* MAIN INTERACTIVE CORE VIEW (Lg: col-span-9) */}
        <main className="lg:col-span-9" id="mach-main-container">
          {activeTab === 'dashboard' && (
            <Dashboard 
              tasks={tasks} 
              transactions={transactions} 
              risks={risks} 
              currentDate={currentDate} 
            />
          )}

          {activeTab === 'tasks' && (
            <TasksSchedule 
              tasks={tasks} 
              setTasks={setTasks} 
              members={members} 
            />
          )}

          {activeTab === 'finance' && (
            <Finance 
              transactions={transactions} 
              setTransactions={setTransactions} 
            />
          )}

          {activeTab === 'risks' && (
            <RiskManagement 
              risks={risks} 
              setRisks={setRisks} 
              members={members} 
            />
          )}

          {activeTab === 'stakeholders' && (
            <Stakeholders 
              stakeholders={stakeholders} 
              setStakeholders={setStakeholders} 
              logs={communicationLogs} 
              setLogs={setCommunicationLogs} 
            />
          )}

          {activeTab === 'team' && (
            <TeamLessons 
              members={members} 
              setMembers={setMembers} 
              tasks={tasks} 
              raciRow={raciRow} 
              setRaciRow={setRaciRow} 
              lessons={lessons} 
              setLessons={setLessons} 
            />
          )}
        </main>
      </div>

      {/* FOOTER METRICS RACK */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-center text-[10px] font-mono text-slate-600 uppercase select-none">
        MACH ONE & MACH TWO RACING CLUBS INTEGRADOS • DESENVOLVIDO EM AMBIENTE DE SIMULAÇÃO DE CORRIDA
      </footer>
    </div>
  );
}
