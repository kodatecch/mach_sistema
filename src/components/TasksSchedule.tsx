import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  CheckSquare, 
  Users, 
  Calculator, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Sliders,
  DollarSign,
  Briefcase,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Task, TeamMember } from '../types';

interface TasksScheduleProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  members: TeamMember[];
}

export default function TasksSchedule({ tasks, setTasks, members }: TasksScheduleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'gantt' | 'kanban' | 'eisenhower' | 'pert' | '5w2h'>('gantt');
  
  // State for creating or editing tasks
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expanded5W2HTaskId, setExpanded5W2HTaskId] = useState<string | null>(null);
  
  // Task form states
  const [formName, setFormName] = useState('');
  const [formWbsCode, setFormWbsCode] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formStatus, setFormStatus] = useState<Task['status']>('Pendente');
  const [formEisenhower, setFormEisenhower] = useState<Task['eisenhower']>('Q2');
  const [formO, setFormO] = useState(5);
  const [formL, setFormL] = useState(10);
  const [formP, setFormP] = useState(15);
  const [formStart, setFormStart] = useState('2026-06-01');
  const [formEnd, setFormEnd] = useState('2026-06-15');
  const [formAssigned, setFormAssigned] = useState('');
  const [formPlannedCost, setFormPlannedCost] = useState(2500);
  const [formDependency, setFormDependency] = useState('none');

  // 12-Week Timeline parameters for proportional Gantt chart (starts 2026-06-01, ends 2026-08-24 - 84 days)
  const ganttStartDate = useMemo(() => new Date('2026-06-01'), []);
  const ganttTotalDays = 84; // 12 Weeks exactly

  const calculateGanttPosition = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Days since project start
    const diffStartMs = start.getTime() - ganttStartDate.getTime();
    const startDay = Math.max(0, Math.floor(diffStartMs / (1000 * 3600 * 24)));
    
    // Duration in days
    const diffDurationMs = end.getTime() - start.getTime();
    const durationDays = Math.max(1, Math.ceil(diffDurationMs / (1000 * 3600 * 24)));

    // Proportional percents
    let leftPercent = (startDay / ganttTotalDays) * 100;
    let widthPercent = (durationDays / ganttTotalDays) * 100;

    // Boundary constraints
    if (leftPercent < 0) leftPercent = 0;
    if (leftPercent > 100) leftPercent = 95;
    if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;
    if (widthPercent < 2) widthPercent = 2; // minimum visual bar

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingTaskId(null);
    setFormName('');
    setFormWbsCode('2.2');
    setFormProgress(0);
    setFormStatus('Pendente');
    setFormEisenhower('Q2');
    setFormO(5);
    setFormL(10);
    setFormP(15);
    setFormStart('2026-06-01');
    setFormEnd('2026-06-15');
    setFormAssigned(members[0]?.id || '');
    setFormPlannedCost(2000);
    setFormDependency('none');
    setShowTaskForm(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setFormName(task.name);
    setFormWbsCode(task.wbsCode);
    setFormProgress(task.progress);
    setFormStatus(task.status);
    setFormEisenhower(task.eisenhower);
    setFormO(task.pertOptimistic);
    setFormL(task.pertLikely);
    setFormP(task.pertPessimistic);
    setFormStart(task.startDate);
    setFormEnd(task.endDate);
    setFormAssigned(task.assignedTo);
    setFormPlannedCost(task.plannedCost);
    setFormDependency(task.dependency || 'none');
    setShowTaskForm(true);
  };

  // Submit Task Form
  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseFloat(((formO + 4 * formL + formP) / 6).toFixed(1));
    const depVal = formDependency === 'none' ? null : formDependency;

    if (editingTaskId) {
      setTasks(prev => prev.map(t => t.id === editingTaskId ? {
        ...t,
        name: formName,
        wbsCode: formWbsCode,
        progress: Number(formProgress),
        status: formStatus,
        eisenhower: formEisenhower,
        pertOptimistic: Number(formO),
        pertLikely: Number(formL),
        pertPessimistic: Number(formP),
        duration,
        startDate: formStart,
        endDate: formEnd,
        assignedTo: formAssigned,
        plannedCost: Number(formPlannedCost),
        dependency: depVal
      } : t));
    } else {
      const newTask: Task = {
        id: `t_${Date.now()}`,
        name: formName,
        wbsCode: formWbsCode,
        progress: Number(formProgress),
        status: formStatus,
        eisenhower: formEisenhower,
        pertOptimistic: Number(formO),
        pertLikely: Number(formL),
        pertPessimistic: Number(formP),
        duration,
        startDate: formStart,
        endDate: formEnd,
        assignedTo: formAssigned,
        plannedCost: Number(formPlannedCost),
        dependency: depVal,
        w5h2: {
          what: formName,
          why: 'Garantir conformidade regulatória nas avaliações do protótipo.',
          where: 'Laboratório de Manufatura / Área de Usinagem CNC',
          when: formEnd,
          who: members.find(m => m.id === formAssigned)?.name || 'Responsável',
          how: 'Uso de ferramentais calibrados seguindo o regulamento técnico.',
          howMuch: Number(formPlannedCost)
        }
      };
      setTasks(prev => [...prev, newTask]);
    }
    setShowTaskForm(false);
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Kanban status change
  const moveTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let autoProg = t.progress;
        if (newStatus === 'Concluído') autoProg = 100;
        else if (newStatus === 'Pendente') autoProg = 0;
        else if (newStatus === 'Em execução' && t.progress === 0) autoProg = 20;
        else if (newStatus === 'Revisão' && t.progress < 80) autoProg = 85;

        return { ...t, status: newStatus, progress: autoProg };
      }
      return t;
    }));
  };

  // Eisenhower Quadrants labels
  const quadrantLabels = {
    Q1: { title: 'Urgente & Importante', desc: 'Soluções imediatas (ex: Falhas estruturais de pista)', bg: 'bg-red-50/20 dark:bg-red-950/10', border: 'border-red-200 dark:border-red-950/40', text: 'text-[#DC2626]' },
    Q2: { title: 'Importante (Não Urgente)', desc: 'Foco técnico planejado (ex: CFD aerodinâmico e simulações FEA)', bg: 'bg-stone-50 dark:bg-stone-900/40', border: 'border-stone-200 dark:border-stone-850', text: 'text-stone-800 dark:text-stone-300' },
    Q3: { title: 'Urgente (Não Importante)', desc: 'Delegar ou otimizar (ex: Aquisição de parafusos comerciais padrão)', bg: 'bg-amber-50/20 dark:bg-amber-950/10', border: 'border-amber-200 dark:border-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
    Q4: { title: 'Não Urgente & Não Importante', desc: 'Eliminar prioridade (ex: Adereços meramente decorativos de box)', bg: 'bg-stone-100 dark:bg-[#1a1a1a]/60', border: 'border-stone-200 dark:border-stone-800', text: 'text-stone-400' }
  };

  // Shift Eisenhower Quadrant
  const toggleEisenhower = (taskId: string, currentQuad: Task['eisenhower']) => {
    const order: Task['eisenhower'][] = ['Q1', 'Q2', 'Q3', 'Q4'];
    const nextIndex = (order.indexOf(currentQuad) + 1) % order.length;
    const nextQuad = order[nextIndex];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, eisenhower: nextQuad } : t));
  };

  // Direct PERT adjustments inside list
  const updatePertValue = (taskId: string, field: 'pertOptimistic' | 'pertLikely' | 'pertPessimistic', val: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, [field]: val };
        const O = updated.pertOptimistic;
        const L = updated.pertLikely;
        const P = updated.pertPessimistic;
        updated.duration = parseFloat(((O + 4 * L + P) / 6).toFixed(1));
        return updated;
      }
      return t;
    }));
  };

  // Update 5W2H parameters for a task
  const handleUpdate5W2H = (taskId: string, key: string, val: string | number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const current5W2H = t.w5h2 || {
          what: t.name,
          why: '',
          where: '',
          when: t.endDate,
          who: members.find(m => m.id === t.assignedTo)?.name || '',
          how: '',
          howMuch: t.plannedCost
        };
        return {
          ...t,
          w5h2: {
            ...current5W2H,
            [key]: val
          }
        };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-6" id="tasks-schedule-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <CheckSquare className="w-5.5 h-5.5 text-[#DC2626]" />
            Cronograma, EAP & Tarefas
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Planejamento sequencial estruturado na EAP, Quadro Kanban, Alinhamento de Prioridades Eisenhower, Estimativa PERT e Matriz 5W2H
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="mach-button-primary text-xs font-bold"
        >
          + Nova Tarefa EAP
        </button>
      </div>

      {/* CORE NAVIGATION SUBTABS */}
      <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-850 gap-1 select-none">
        <button 
          onClick={() => setActiveSubTab('gantt')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'gantt' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          📅 Gráfico Gantt
        </button>
        <button 
          onClick={() => setActiveSubTab('kanban')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'kanban' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          📋 Quadro Kanban
        </button>
        <button 
          onClick={() => setActiveSubTab('eisenhower')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'eisenhower' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          🎯 Prioridades
        </button>
        <button 
          onClick={() => setActiveSubTab('pert')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'pert' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          🧮 Analisador PERT
        </button>
        <button 
          onClick={() => setActiveSubTab('5w2h')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === '5w2h' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          📝 Plano 5W2H
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="mach-card" id="subtab-workspace">
        {/* GRÁFICO GANTT */}
        {activeSubTab === 'gantt' && (
          <div className="space-y-4">
            <div className="bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-250 dark:border-stone-850 rounded-lg text-xs leading-relaxed text-stone-550 flex gap-2">
              <Info className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <p>
                <strong>Eixo de Tempo Visual proporcional de 12 Semanas:</strong> Semana 1 à Semana 12 iniciando em <strong>01/06/2026</strong>. Cada barra representa o offset proporcional do cronograma de desenvolvimento e progresso físico das atividades.
              </p>
            </div>

            <div className="overflow-x-auto select-text font-sans">
              <div className="min-w-[850px] border border-stone-200 dark:border-stone-850 rounded overflow-hidden">
                {/* Visual Header Axis */}
                <div className="grid grid-cols-12 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-850 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-450">
                  <div className="col-span-1 font-mono">WBS</div>
                  <div className="col-span-3">Atividade / Responsável</div>
                  <div className="col-span-6 relative border-l border-r border-stone-200 dark:border-stone-800 h-6">
                    <div className="absolute inset-0 grid grid-cols-12 divide-x divide-stone-200 dark:divide-stone-850 text-center items-center">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="text-[9px] font-mono font-bold">S{i + 1}</div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-1.5 text-center font-mono">Datas</div>
                  <div className="col-span-0.5 text-right"></div>
                </div>

                {/* Content Rows */}
                <div className="divide-y divide-stone-150 dark:divide-stone-850 bg-white dark:bg-[#121212]">
                  {tasks.map(task => {
                    const assigned = members.find(m => m.id === task.assignedTo);
                    const positions = calculateGanttPosition(task.startDate, task.endDate);
                    
                    return (
                      <div key={task.id} className="grid grid-cols-12 px-3 py-3 text-xs items-center hover:bg-stone-50 dark:hover:bg-stone-900/40 transition group">
                        <div className="col-span-1 font-mono font-bold text-[#DC2626]">{task.wbsCode}</div>
                        <div className="col-span-3 pr-2">
                          <p className="font-bold text-stone-800 dark:text-stone-200 truncate">{task.name}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5 font-mono">Líder: {assigned ? assigned.name : 'Ninguém'}</p>
                        </div>
                        
                        {/* THE PROPORTIONAL GANTT TIMELINE BAR */}
                        <div className="col-span-6 px-1 relative h-6 flex items-center select-none border-l border-r border-stone-100 dark:border-stone-850/60">
                          {/* Dotted Week boundaries guidelines */}
                          <div className="absolute inset-0 grid grid-cols-12 divide-x divide-stone-100 dark:divide-stone-900/40 pointer-events-none">
                            {Array.from({ length: 12 }).map((_, i) => <div key={i} />)}
                          </div>

                          {/* Task Bar */}
                          <div 
                            className="absolute h-5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded flex items-center overflow-hidden transition-all"
                            style={{ left: positions.left, width: positions.width }}
                          >
                            <div 
                              className="h-full bg-red-105 border-r border-[#DC2626] transition-all"
                              style={{ width: `${task.progress}%`, backgroundColor: 'rgba(220, 38, 38, 0.15)' }}
                            />
                            <span className="absolute inset-x-2 truncate text-[9px] font-mono text-stone-600 dark:text-stone-300 font-bold flex justify-between items-center">
                              <span>{task.progress}%</span>
                              <span className="text-[8px] opacity-75">{Math.round(task.duration)}d</span>
                            </span>
                          </div>
                        </div>

                        <div className="col-span-1.5 font-mono text-[9px] text-stone-500 text-center space-y-0.5 leading-tight">
                          <div>{task.startDate.slice(5)}</div>
                          <div className="opacity-40">até</div>
                          <div>{task.endDate.slice(5)}</div>
                        </div>

                        <div className="col-span-0.5 text-right flex justify-end gap-1 select-none opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenEdit(task)}
                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-900 rounded text-stone-500 hover:text-stone-900 dark:hover:text-stone-150 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KANBAN BOARD */}
        {activeSubTab === 'kanban' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              📋 Acesse o fluxo clicando nos direcionadores laterais para ciclar tarefas entre pendentes e concluídas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(['Pendente', 'Em execução', 'Revisão', 'Concluído'] as Task['status'][]).map(statusCol => {
                const colTasks = tasks.filter(t => t.status === statusCol);
                const styleMap = {
                  Pendente: 'border-l-stone-300 dark:border-l-stone-700 bg-stone-50/50 dark:bg-[#121212]/30',
                  'Em execução': 'border-l-amber-400 bg-stone-50/50 dark:bg-[#121212]/30',
                  Revisão: 'border-l-blue-400 bg-stone-50/50 dark:bg-[#121212]/30',
                  Concluído: 'border-l-emerald-500 bg-stone-50/50 dark:bg-[#121212]/30'
                };

                return (
                  <div key={statusCol} className={`p-4 border-l-2 rounded-lg border border-stone-200 dark:border-stone-850 flex flex-col min-h-[400px] ${styleMap[statusCol]}`}>
                    <div className="flex justify-between items-center mb-3 border-b border-stone-150 dark:border-stone-850/60 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">{statusCol}</span>
                      <span className="text-[10px] bg-stone-150 dark:bg-stone-900 px-2 py-0.5 rounded font-mono font-bold text-stone-600 dark:text-stone-400">{colTasks.length}</span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {colTasks.length === 0 ? (
                        <p className="text-[10px] text-stone-400 italic text-center py-8">Nenhuma tarefa.</p>
                      ) : (
                        colTasks.map(task => {
                          const assigned = members.find(m => m.id === task.assignedTo);
                          return (
                            <div key={task.id} className="p-3 bg-white dark:bg-[#161618] border border-stone-200 dark:border-stone-850 rounded shadow-sm hover:shadow transition space-y-3">
                              <div>
                                <span className="text-[9px] font-mono text-[#DC2626] font-bold bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded border border-red-100 dark:border-red-950/50">WBS {task.wbsCode}</span>
                                <h4 className="text-xs font-bold text-stone-850 dark:text-stone-250 mt-1.5 leading-snug">{task.name}</h4>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-stone-400 border-t border-stone-100 dark:border-stone-800/80 pt-2 shrink-0">
                                <span className="truncate max-w-[85px]">{assigned ? assigned.name : 'Vazio'}</span>
                                <div className="flex gap-1.5 items-center">
                                  {statusCol !== 'Pendente' && (
                                    <button 
                                      onClick={() => {
                                        const steps: Task['status'][] = ['Pendente', 'Em execução', 'Revisão', 'Concluído'];
                                        moveTaskStatus(task.id, steps[steps.indexOf(statusCol) - 1]);
                                      }}
                                      className="text-stone-400 hover:text-stone-750"
                                      title="Voltar"
                                    >
                                      ‹
                                    </button>
                                  )}
                                  <button onClick={() => handleOpenEdit(task)} className="text-[#DC2626]" title="Editar">✏️</button>
                                  {statusCol !== 'Concluído' && (
                                    <button 
                                      onClick={() => {
                                        const steps: Task['status'][] = ['Pendente', 'Em execução', 'Revisão', 'Concluído'];
                                        moveTaskStatus(task.id, steps[steps.indexOf(statusCol) + 1]);
                                      }}
                                      className="text-stone-400 hover:text-stone-750"
                                      title="Avançar"
                                    >
                                      ›
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MATH PRIORITIES EISENHOWER */}
        {activeSubTab === 'eisenhower' && (
          <div className="space-y-4">
            <div className="bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-250 dark:border-stone-850 rounded-lg text-xs leading-relaxed text-stone-550 flex gap-2">
              <Info className="w-4 h-4 text-[#DC2626]" />
              <p>Clicando no ícone (<Shuffle className="inline-block w-3 h-3 text-[#DC2626]" />) você cicla as atividades rapidamente entre os quadrantes da matriz.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as Task['eisenhower'][]).map(quad => {
                const quadTasks = tasks.filter(t => t.eisenhower === quad);
                const opt = quadrantLabels[quad];

                return (
                  <div key={quad} className={`p-4 border rounded-lg flex flex-col justify-between space-y-4 min-h-[220px] ${opt.bg} ${opt.border}`}>
                    <div>
                      <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-850 pb-2">
                        <span className={`text-xs font-bold font-display ${opt.text}`}>{opt.title}</span>
                        <span className="text-[10px] font-mono font-bold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded px-1.5">{quad}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 italic">{opt.desc}</p>

                      <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                        {quadTasks.length === 0 ? (
                          <p className="text-[10px] text-stone-400 italic text-center py-4">Vazio</p>
                        ) : (
                          quadTasks.map(t => (
                            <div key={t.id} className="p-2 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-850 rounded flex justify-between items-center text-xs">
                              <span className="truncate font-sans font-medium text-stone-750 dark:text-stone-300">
                                <span className="font-mono text-[#DC2626] mr-1.5 font-bold">{t.wbsCode}</span>
                                {t.name}
                              </span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => toggleEisenhower(t.id, t.eisenhower)}
                                  className="p-1 hover:bg-stone-100 dark:hover:bg-stone-900 rounded cursor-pointer"
                                  title="Ciclar Quadrante"
                                >
                                  <Shuffle className="w-3.5 h-3.5 text-stone-500 hover:text-[#DC2626]" />
                                </button>
                                <button 
                                  onClick={() => handleOpenEdit(t)} 
                                  className="p-1 text-stone-450 hover:text-stone-800"
                                >
                                  ✏️
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALISADOR PERT INLINE EDITING */}
        {activeSubTab === 'pert' && (
          <div className="space-y-4">
            <div className="bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-250 dark:border-stone-850 rounded-lg text-xs leading-relaxed text-stone-550 flex gap-2">
              <Calculator className="w-4.5 h-4.5 text-[#DC2626] shrink-0 mt-0.5" />
              <p>
                <strong>Técnica de Estimativa e Revisão de Programas (PERT):</strong> Ajuste os prazos estimados em dias de trabalho por subprocesso. A duração esperada recalcula em tempo real: 
                <code className="text-[#DC2626] font-bold font-mono ml-2">Duração = (Otimista + 4L + Pessimista) / 6</code>.
              </p>
            </div>

            <div className="overflow-x-auto select-text font-sans">
              <div className="min-w-[800px] border border-stone-200 dark:border-stone-850 rounded overflow-hidden">
                <div className="grid grid-cols-12 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-850 p-3 text-[10px] font-bold uppercase tracking-wider text-stone-450">
                  <div className="col-span-1">WBS</div>
                  <div className="col-span-5">Atividade de Engenharia</div>
                  <div className="col-span-2 text-center">Estimativa Otimista (O)</div>
                  <div className="col-span-2 text-center">Mais Provável (L)</div>
                  <div className="col-span-2 text-right text-[#DC2626] font-bold">Duração Estimada PERT</div>
                </div>

                <div className="divide-y divide-stone-150 dark:divide-stone-850 bg-white dark:bg-[#121212]">
                  {tasks.map(task => (
                    <div key={task.id} className="grid grid-cols-12 p-3.5 items-center hover:bg-stone-50 dark:hover:bg-stone-900/30 transition text-xs">
                      <div className="col-span-1 font-mono font-bold text-stone-400">{task.wbsCode}</div>
                      <div className="col-span-5 font-bold text-stone-800 dark:text-stone-250 truncate pr-4">{task.name}</div>
                      
                      {/* Interactive inline inputs */}
                      <div className="col-span-2 px-6 flex justify-center">
                        <div className="flex items-center gap-1.5 border border-stone-200 dark:border-stone-800 rounded bg-stone-50 dark:bg-stone-950 px-2 py-0.5">
                          <span className="text-[10px] text-stone-400 font-mono font-semibold">O:</span>
                          <input 
                            type="number" 
                            min="1"
                            value={task.pertOptimistic}
                            onChange={e => updatePertValue(task.id, 'pertOptimistic', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-10 text-center bg-transparent border-0 focus:ring-0 p-0 font-mono text-xs text-stone-800 dark:text-stone-200 font-bold"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 px-6 flex justify-center">
                        <div className="flex items-center gap-1.5 border border-stone-200 dark:border-stone-800 rounded bg-stone-50 dark:bg-stone-950 px-2 py-0.5">
                          <span className="text-[10px] text-stone-400 font-mono font-semibold">L:</span>
                          <input 
                            type="number" 
                            min="1"
                            value={task.pertLikely}
                            onChange={e => updatePertValue(task.id, 'pertLikely', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-10 text-center bg-transparent border-0 focus:ring-0 p-0 font-mono text-xs text-stone-800 dark:text-stone-200 font-bold"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 text-right font-mono font-bold text-[#DC2626] text-sm">
                        {task.duration.toFixed(1)} dias
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5W2H TAB INTEGRATION */}
        {activeSubTab === '5w2h' && (
          <div className="space-y-4">
            <div className="bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-250 dark:border-stone-850 rounded-lg text-xs leading-relaxed text-stone-550 flex gap-2">
              <FileCheck className="w-4.5 h-4.5 text-[#DC2626] shrink-0 mt-0.5" />
              <p>
                <strong>Planejamento 5W2H:</strong> O checklist 5W2H detalha a execução prática de cada atividade da EAP. Clique sobre qualquer tarefa para expandir e ajustar os parâmetros operacionais de forma totalmente inline.
              </p>
            </div>

            <div className="space-y-2">
              {tasks.map(task => {
                const assigned = members.find(m => m.id === task.assignedTo);
                const isExpanded = expanded5W2HTaskId === task.id;
                const pl = task.w5h2 || {
                  what: task.name,
                  why: 'Garantir conformidade regulatória nas avaliações do protótipo.',
                  where: 'Oficina / Laboratório da equipe',
                  when: task.endDate,
                  who: assigned?.name || 'Responsável',
                  how: 'Atendimento estrito das diretrizes F1 in Schools.',
                  howMuch: task.plannedCost
                };

                return (
                  <div key={task.id} className="border border-stone-200 dark:border-stone-850 rounded overflow-hidden">
                    {/* Header trigger */}
                    <div 
                      onClick={() => setExpanded5W2HTaskId(isExpanded ? null : task.id)}
                      className="flex justify-between items-center p-3 text-xs font-semibold cursor-pointer bg-stone-50 dark:bg-[#151515] hover:bg-stone-100 dark:hover:bg-stone-900 select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-stone-450">[ {task.wbsCode} ]</span>
                        <span className="text-stone-900 dark:text-stone-150 font-bold">{task.name}</span>
                      </div>
                      <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-[#DC2626] px-2 py-0.5 rounded font-mono font-bold">
                        {isExpanded ? ' Recolher [-]' : 'Expandir 5W2H [+]'}
                      </span>
                    </div>

                    {/* Inline Content Edit fields */}
                    {isExpanded && (
                      <div className="p-4 bg-white dark:bg-stone-950 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-150 dark:border-stone-850/60 select-text">
                        <div>
                          <label className="mach-label">WHAT (O que será feito?)</label>
                          <input 
                            type="text" 
                            value={pl.what} 
                            onChange={e => handleUpdate5W2H(task.id, 'what', e.target.value)}
                            className="mach-input font-medium"
                          />
                        </div>
                        <div>
                          <label className="mach-label">WHY (Por que será feito?)</label>
                          <input 
                            type="text" 
                            value={pl.why} 
                            onChange={e => handleUpdate5W2H(task.id, 'why', e.target.value)}
                            className="mach-input"
                          />
                        </div>
                        <div>
                          <label className="mach-label">WHERE (Onde será feito?)</label>
                          <input 
                            type="text" 
                            value={pl.where} 
                            onChange={e => handleUpdate5W2H(task.id, 'where', e.target.value)}
                            className="mach-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mach-label">WHEN (Quando?)</label>
                            <input 
                              type="date" 
                              value={pl.when} 
                              onChange={e => handleUpdate5W2H(task.id, 'when', e.target.value)}
                              className="mach-input font-mono"
                            />
                          </div>
                          <div>
                            <label className="mach-label">WHO (Quem executará?)</label>
                            <input 
                              type="text" 
                              value={pl.who} 
                              onChange={e => handleUpdate5W2H(task.id, 'who', e.target.value)}
                              className="mach-input"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mach-label">HOW (Como será realizado?)</label>
                          <textarea 
                            rows={2}
                            value={pl.how} 
                            onChange={e => handleUpdate5W2H(task.id, 'how', e.target.value)}
                            className="mach-input"
                          />
                        </div>
                        <div>
                          <label className="mach-label">HOW MUCH (Quanto custará?)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={pl.howMuch} 
                              onChange={e => handleUpdate5W2H(task.id, 'howMuch', Number(e.target.value) || 0)}
                              className="mach-input font-bold font-mono"
                            />
                            <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded px-3 flex items-center justify-center font-mono text-[10px] text-stone-500 font-bold">R$</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TASK FORM MODAL (ONLY OPEN FROM GANTT OR ACTION ADD) */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#121212] border border-stone-300 dark:border-stone-800 w-full max-w-lg rounded-lg overflow-hidden shadow-2xl animate-fade-in select-text">
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-850 dark:text-stone-100 uppercase tracking-wide">
                {editingTaskId ? 'Editar Atividade WBS' : 'Nova Atividade EAP / WBS'}
              </h3>
              <button 
                onClick={() => setShowTaskForm(false)}
                className="text-stone-400 hover:text-stone-800 dark:hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mach-label">Nome da Atividade</label>
                  <input 
                    type="text" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)}
                    required
                    placeholder="ex. Laminação do spoiler traseiro em fibra de carbono"
                    className="mach-input font-medium"
                  />
                </div>

                <div>
                  <label className="mach-label">Hierarquia EAP / WBS Code</label>
                  <input 
                    type="text" 
                    value={formWbsCode} 
                    onChange={e => setFormWbsCode(e.target.value)}
                    required
                    placeholder="ex. 4.2"
                    className="mach-input"
                  />
                </div>

                <div>
                  <label className="mach-label font-bold text-[#DC2626]">Orçamento Planejado (R$)</label>
                  <input 
                    type="number" 
                    value={formPlannedCost} 
                    onChange={e => setFormPlannedCost(Number(e.target.value))}
                    required
                    min="0"
                    placeholder="Valor para análise EVM"
                    className="mach-input font-bold"
                  />
                </div>

                <div>
                  <label className="mach-label">Líder / Responsável</label>
                  <select 
                    value={formAssigned} 
                    onChange={e => setFormAssigned(e.target.value)}
                    className="mach-input"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mach-label">Dependência Teórica</label>
                  <select 
                    value={formDependency} 
                    onChange={e => setFormDependency(e.target.value)}
                    className="mach-input"
                  >
                    <option value="none">Nenhuma</option>
                    {tasks.filter(t => t.id !== editingTaskId).map(t => (
                      <option key={t.id} value={t.id}>{t.wbsCode} — {t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mach-label">Início Programado</label>
                  <input 
                    type="date" 
                    value={formStart} 
                    onChange={e => setFormStart(e.target.value)}
                    required
                    className="mach-input font-mono"
                  />
                </div>

                <div>
                  <label className="mach-label font-bold text-[#DC2626]">Fim Programado</label>
                  <input 
                    type="date" 
                    value={formEnd} 
                    onChange={e => setFormEnd(e.target.value)}
                    required
                    className="mach-input font-mono"
                  />
                </div>

                <div>
                  <label className="mach-label">Status do Trabalho</label>
                  <select 
                    value={formStatus} 
                    onChange={e => setFormStatus(e.target.value as Task['status'])}
                    className="mach-input font-medium"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em execução">Em execução</option>
                    <option value="Revisão">Revisão (Validável)</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="mach-label">Matriz de Prioridade</label>
                  <select 
                    value={formEisenhower} 
                    onChange={e => setFormEisenhower(e.target.value as Task['eisenhower'])}
                    className="mach-input"
                  >
                    <option value="Q1">Q1 — Urgência Alta, Importância Alta</option>
                    <option value="Q2">Q2 — Urgência Baixa, Importância Alta</option>
                    <option value="Q3">Q3 — Urgência Alta, Importância Baixa</option>
                    <option value="Q4">Q4 — Urgência Baixa, Importância Baixa</option>
                  </select>
                </div>

                {editingTaskId && (
                  <div className="col-span-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 rounded space-y-1">
                    <label className="mach-label">Entrega Física Praticada ({formProgress}%)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={formProgress} 
                      onChange={e => {
                        setFormProgress(Number(e.target.value));
                        if (Number(e.target.value) === 100) setFormStatus('Concluído');
                        else if (Number(e.target.value) > 0 && formStatus === 'Pendente') setFormStatus('Em execução');
                      }}
                      className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded appearance-none cursor-pointer accent-[#DC2626]"
                    />
                  </div>
                )}

                {/* PERT parameters nested inside Form */}
                <div className="col-span-2 border-t border-stone-150 dark:border-stone-850 pt-2.5">
                  <span className="text-[10px] font-bold text-stone-400 block uppercase mb-2">Estimativas de Tempo PERT (Dias Úteis)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-stone-500 text-center mb-1">Otimista (O)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formO} 
                        onChange={e => setFormO(Number(e.target.value) || 1)}
                        className="mach-input text-xs font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[#DC2626] text-center mb-1">Mais Provável (L)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formL} 
                        onChange={e => setFormL(Number(e.target.value) || 1)}
                        className="mach-input text-xs font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-stone-500 text-center mb-1">Pessimista (P)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formP} 
                        onChange={e => setFormP(Number(e.target.value) || 1)}
                        className="mach-input text-xs font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-stone-100 dark:border-stone-850 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTaskForm(false)}
                  className="mach-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="mach-button-primary text-xs font-bold"
                >
                  Salvar Mudanças
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
