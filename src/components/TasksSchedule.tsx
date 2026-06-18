/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  CheckSquare, 
  Users, 
  Activity, 
  Calculator, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Clock
} from 'lucide-react';
import { Task, TeamMember } from '../types';

interface TasksScheduleProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  members: TeamMember[];
}

export default function TasksSchedule({ tasks, setTasks, members }: TasksScheduleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'gantt' | 'kanban' | 'eisenhower' | 'pert'>('gantt');
  
  // State for creating or editing tasks
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
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
  const [formAssigned, setFormAssigned] = useState('m1');
  const [formPlannedCost, setFormPlannedCost] = useState(3000);
  const [formDependency, setFormDependency] = useState('none');

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
    setFormPlannedCost(3000);
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
      // Edit
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
      // Add
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
        dependency: depVal
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
        // Automatically sync progress for ease of use
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

  // Eisenhower Quadrants labels definers
  const quadrantLabels = {
    Q1: { title: 'Urgente & Importante', desc: 'Fazer Imediatamente (ex. Problemas Críticos de Pista)', bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400' },
    Q2: { title: 'Não Urgente, mas Importante', desc: 'Planejar Horários (ex. Projetar Peças, FEA/CFD)', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    Q3: { title: 'Urgente, mas Não Importante', desc: 'Delegar ou Automatizar (ex. Relatórios Secundários)', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400' },
    Q4: { title: 'Não Urgente & Não Importante', desc: 'Eliminar / Arquivar (ex. Perfumes estéticos não requisitados)', bg: 'bg-slate-500/5', border: 'border-slate-800', text: 'text-slate-400' }
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

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <h1 className="text-2xl font-bold font-sans text-white">Módulo 2 — Cronograma, EAP & Tarefas</h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle do desenvolvimento físico integrada à Estrutura Analítica do Projeto (EAP/WBS), Kanban, Matriz de Eisenhower e estimativa estatística PERT.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-gradient-to-tr from-pink-500 to-indigo-600 hover:opacity-90 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-pink-500/10"
        >
          <Plus className="w-4 h-4" /> Nova Tarefa WBS
        </button>
      </div>

      {/* CORE NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 gap-2">
        <button 
          onClick={() => setActiveSubTab('gantt')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'gantt' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          📅 WBS & Diagrama Gantt
        </button>
        <button 
          onClick={() => setActiveSubTab('kanban')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'kanban' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          📋 Quadro Kanban
        </button>
        <button 
          onClick={() => setActiveSubTab('eisenhower')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'eisenhower' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          🎯 Matriz de Eisenhower
        </button>
        <button 
          onClick={() => setActiveSubTab('pert')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'pert' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          🧮 Analisador PERT
        </button>
      </div>

      {/* RENDER TASKS SUBTABS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[400px]">
         {activeSubTab === 'gantt' && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white uppercase font-mono">Estrutura Analítica do Projeto (EAP / WBS):</span>
                <p className="mt-1">
                  Cada tarefa inicia com seu código hierárquico da EAP. A barra horizontal quantifica o andamento gráfico atual. Clique nas ações para modificar progresso ou excluir tarefas de engenharia.
                </p>
              </div>
            </div>

            {/* HIGH QUALITY RESPONSIVE GANTT WIDGET */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                {/* Gantt Header */}
                <div className="grid grid-cols-12 bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs font-mono font-bold text-slate-400">
                  <div className="col-span-1">WBS</div>
                  <div className="col-span-4">Atividade & Responsável</div>
                  <div className="col-span-5 text-center">Gantt (Fase do Projeto / Progresso Visual)</div>
                  <div className="col-span-1 text-center">Início / Fim</div>
                  <div className="col-span-1 text-right">Ação</div>
                </div>

                {/* Gantt Rows */}
                <div className="divide-y divide-slate-800/60">
                  {tasks.map(task => {
                    const assigned = members.find(m => m.id === task.assignedTo);
                    const dependenciesLabel = tasks.find(t => t.id === task.dependency)?.wbsCode;

                    return (
                      <div key={task.id} className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-slate-900/55 transition group">
                        {/* WBS Code */}
                        <div className="col-span-1 font-mono font-bold text-pink-400">
                          {task.wbsCode}
                        </div>

                        {/* Task Name & Assingee */}
                        <div className="col-span-4 pr-3">
                          <div className="font-semibold text-white truncate group-hover:text-pink-300 transition">{task.name}</div>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1 font-mono">
                            <span className="flex items-center gap-1 select-none">
                              <Users className="w-3 h-3 text-slate-500" />
                              {assigned ? assigned.name : 'Sem responsável'}
                            </span>
                            {dependenciesLabel && (
                              <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 px-1 rounded text-[9px]">
                                Req: {dependenciesLabel}
                              </span>
                            )}
                            <span className="bg-slate-900 px-1 rounded text-[9px] border border-slate-800 text-slate-500 font-mono">
                              Val: R${task.plannedCost}
                            </span>
                          </div>
                        </div>

                        {/* Visual Timeline Bar */}
                        <div className="col-span-5 px-4">
                          <div className="relative w-full h-5 bg-slate-900/80 border border-slate-800/80 rounded flex items-center overflow-hidden">
                            {/* Color bar representing progress */}
                            <div 
                              className={`h-full transition-all duration-500 ${
                                task.status === 'Concluído' ? 'bg-pink-500/20 border-r-2 border-pink-400' :
                                task.status === 'Revisão' ? 'bg-indigo-500/25 border-r-2 border-indigo-400 font-semibold' :
                                'bg-slate-850/40 border-r-2 border-slate-600'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            ></div>
                            <span className="absolute inset-x-0 text-center font-mono text-[10px] font-bold text-slate-300">
                              {task.progress}% — {task.status.toUpperCase()} ({Math.round(task.duration)} dias PERT)
                            </span>
                          </div>
                        </div>

                        {/* Date schedule */}
                        <div className="col-span-1 font-mono text-[10px] text-slate-400 text-center space-y-0.5">
                          <div>{task.startDate}</div>
                          <div className="text-slate-500">até</div>
                          <div>{task.endDate}</div>
                        </div>

                        {/* Action buttons */}
                        <div className="col-span-1 text-right flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleOpenEdit(task)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Editar Tarefa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* SUBTAB KANBAN */}
        {activeSubTab === 'kanban' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-2">
              📋 Administre o fluxo de trabalho clicando nos botões de controle de cada tarefa para movê-las de status. O progresso físico se alinha automaticamente para retroalimentar o EVM de forma ágil.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['Pendente', 'Em execução', 'Revisão', 'Concluído'] as Task['status'][]).map(colStatus => {
                const columnTasks = tasks.filter(t => t.status === colStatus);
                const colColors = {
                  Pendente: { border: 'border-slate-800', headerBg: 'bg-slate-950', badge: 'bg-slate-800 text-slate-300' },
                  'Em execução': { border: 'border-indigo-500/20', headerBg: 'bg-indigo-950/20', badge: 'bg-indigo-500/20 text-indigo-400' },
                  Revisão: { border: 'border-amber-500/20', headerBg: 'bg-amber-950/20', badge: 'bg-amber-500/25 text-amber-400' },
                  Concluído: { border: 'border-emerald-500/20', headerBg: 'bg-emerald-950/20', badge: 'bg-emerald-500/20 text-emerald-400' }
                };

                return (
                  <div key={colStatus} className={`bg-slate-950/60 rounded-xl border ${colColors[colStatus].border} overflow-hidden flex flex-col min-h-[450px]`}>
                    <div className={`p-4 ${colColors[colStatus].headerBg} border-b border-slate-800 flex justify-between items-center`}>
                      <span className="font-sans font-bold text-xs text-white uppercase tracking-wider">{colStatus}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${colColors[colStatus].badge}`}>
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="p-3 gap-3 flex flex-col flex-1 overflow-y-auto">
                      {columnTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-600 text-xs font-mono border border-dashed border-slate-900 rounded-lg flex-1 flex flex-col justify-center items-center">
                          Vazio
                        </div>
                      ) : (
                        columnTasks.map(task => {
                          const assigned = members.find(m => m.id === task.assignedTo);
                          return (
                            <div key={task.id} className="bg-slate-900 hover:border-slate-700 transition border border-slate-850 p-3.5 rounded-xl space-y-3 shadow-md relative">
                              <div className="space-y-1">
                                <span className="font-mono text-[9px] text-emerald-400 font-bold bg-slate-950/80 border border-slate-800 px-1 py-0.5 rounded">
                                  EAP {task.wbsCode}
                                </span>
                                <h3 className="text-xs font-semibold text-white leading-tight mt-1">{task.name}</h3>
                              </div>

                              <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800/50 text-[10px]">
                                <span className="text-slate-400 truncate">{assigned ? assigned.name : 'Ninguém'}</span>
                                <span className="font-mono font-bold text-slate-300">{task.progress}%</span>
                              </div>

                              {/* Action tools for moving */}
                              <div className="flex justify-between items-center border-t border-slate-800 pt-2 text-[10px]">
                                <span className="text-[9px] text-slate-500 font-mono">Pert: {Math.round(task.duration)}D</span>
                                <div className="flex gap-1.5">
                                  {colStatus !== 'Pendente' && (
                                    <button 
                                      onClick={() => {
                                        const steps: Task['status'][] = ['Pendente', 'Em execução', 'Revisão', 'Concluído'];
                                        const prevStatus = steps[steps.indexOf(colStatus) - 1];
                                        moveTaskStatus(task.id, prevStatus);
                                      }}
                                      className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white"
                                      title="Desfazer"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleOpenEdit(task)}
                                    className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-indigo-400"
                                    title="Modificar"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {colStatus !== 'Concluído' && (
                                    <button 
                                      onClick={() => {
                                        const steps: Task['status'][] = ['Pendente', 'Em execução', 'Revisão', 'Concluído'];
                                        const nextStatus = steps[steps.indexOf(colStatus) + 1];
                                        moveTaskStatus(task.id, nextStatus);
                                      }}
                                      className="p-1 rounded bg-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white"
                                      title="Avançar"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
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

        {/* SUBTAB EISENHOWER */}
        {activeSubTab === 'eisenhower' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-xs text-slate-400">
              <span className="font-bold text-white uppercase font-mono">Matriz de Prioridade Eisenhower:</span>
              <p className="mt-1">
                Classifique atividades de acordo com Urgência e Importância. Clique no ícone de círculo (<Shuffle className="inline w-3.5 h-3.5 text-indigo-400" />) para ciclar a atividade entre os quadrantes da matriz dinamicamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as Task['eisenhower'][]).map(quad => {
                const quadTasks = tasks.filter(t => t.eisenhower === quad);
                const info = quadrantLabels[quad];

                return (
                  <div key={quad} className={`p-4 rounded-xl border ${info.border} ${info.bg} flex flex-col justify-between space-y-3 min-h-[220px]`}>
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className={`font-sans font-bold text-sm ${info.text}`}>{info.title}</h3>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-300">
                          {quad}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 italic">{info.desc}</p>

                      <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {quadTasks.length === 0 ? (
                          <div className="text-[10px] font-mono text-slate-500 py-4 text-center">Nenhuma tarefa neste quadrante.</div>
                        ) : (
                          quadTasks.map(task => (
                            <div key={task.id} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-xs flex justify-between items-center hover:border-slate-700 transition">
                              <span className="text-slate-300 font-semibold truncate max-w-[250px]">
                                <span className="font-mono text-emerald-400 mr-1.5">{task.wbsCode}</span>
                                {task.name}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => toggleEisenhower(task.id, task.eisenhower)}
                                  className="p-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-slate-400 hover:text-white"
                                  title="Ciclar Quadrante"
                                >
                                  <Shuffle className="w-3 h-3 text-indigo-400" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(task)}
                                  className="p-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-slate-400 hover:text-white"
                                  title="Modificar"
                                >
                                  <Edit3 className="w-3 h-3" />
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

        {/* SUBTAB PERT */}
        {activeSubTab === 'pert' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl text-xs text-slate-400 flex items-start gap-2">
              <Calculator className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white uppercase font-mono">Técnica de Avaliação e Revisão de Programas (PERT):</span>
                <p className="mt-1">
                  Estime a duração de tarefas complexas de Fórmula SAE de forma estatística. Modifique os valores diretamente de forma instantânea abaixo. A Duração Esperada é automaticamente salva via:
                  <code className="text-emerald-400 font-bold ml-1.5">Duração = (Otimista + 4 × Mais Provável + Pessimista) / 6</code>
                </p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="grid grid-cols-12 bg-slate-900 border-b border-slate-800 p-3 text-[10px] font-mono font-bold text-slate-400">
                <div className="col-span-1">WBS</div>
                <div className="col-span-5">Tarefa de Engenharia</div>
                <div className="col-span-1.5 text-center px-1">Otimista (O)</div>
                <div className="col-span-1.5 text-center px-1">Mais Provável (L)</div>
                <div className="col-span-1.5 text-center px-1">Pessimista (P)</div>
                <div className="col-span-1.5 text-right font-bold text-emerald-400">Duração PERT</div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {tasks.map(task => (
                  <div key={task.id} className="grid grid-cols-12 p-3 items-center hover:bg-slate-900/40 text-xs">
                    <div className="col-span-1 font-mono font-bold text-slate-400">{task.wbsCode}</div>
                    <div className="col-span-5 font-semibold text-white truncate pr-2">{task.name}</div>
                    
                    {/* Optimistic Input */}
                    <div className="col-span-1.5 px-2">
                      <input 
                        type="number" 
                        min="1" 
                        value={task.pertOptimistic || 1} 
                        onChange={(e) => updatePertValue(task.id, 'pertOptimistic', Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full text-center bg-slate-900 border border-slate-800 text-white rounded p-1 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Likely Input */}
                    <div className="col-span-1.5 px-2">
                      <input 
                        type="number" 
                        min="1" 
                        value={task.pertLikely || 1} 
                        onChange={(e) => updatePertValue(task.id, 'pertLikely', Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full text-center bg-slate-900 border border-slate-800 text-white rounded p-1 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Pessimistic Input */}
                    <div className="col-span-1.5 px-2">
                      <input 
                        type="number" 
                        min="1" 
                        value={task.pertPessimistic || 1} 
                        onChange={(e) => updatePertValue(task.id, 'pertPessimistic', Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full text-center bg-slate-900 border border-slate-800 text-white rounded p-1 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Calculated Expected Duration */}
                    <div className="col-span-1.5 text-right font-mono font-bold text-emerald-400 animate-pulse">
                      {task.duration.toFixed(1)} dias
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TASK DIALOG MODAL */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <CheckSquare className="text-emerald-400 w-4 h-4" />
                {editingTaskId ? 'Editar Atividade WBS' : 'Nova Atividade EAP / WBS'}
              </h3>
              <button 
                onClick={() => setShowTaskForm(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">DESIGNAÇÃO DA ATIVIDADE</label>
                  <input 
                    type="text" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)}
                    required
                    placeholder="ex. Laminação da carenagem lateral"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">CÓDIGO HIERÁRQUICO WBS</label>
                  <input 
                    type="text" 
                    value={formWbsCode} 
                    onChange={e => setFormWbsCode(e.target.value)}
                    required
                    placeholder="ex. 4.3"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">PLANEJAMENTO DE CUSTO (R$)</label>
                  <input 
                    type="number" 
                    value={formPlannedCost} 
                    onChange={e => setFormPlannedCost(Number(e.target.value))}
                    required
                    min="0"
                    placeholder="Custo planejado para EVM"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">RESPONSÁVEL</label>
                  <select 
                    value={formAssigned} 
                    onChange={e => setFormAssigned(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">DEPENDE DA ATIVIDADE</label>
                  <select 
                    value={formDependency} 
                    onChange={e => setFormDependency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="none">Nenhuma</option>
                    {tasks.filter(t => t.id !== editingTaskId).map(t => (
                      <option key={t.id} value={t.id}>{t.wbsCode} — {t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">DATA DE INÍCIO</label>
                  <input 
                    type="date" 
                    value={formStart} 
                    onChange={e => setFormStart(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">DATA DE CONCLUSÃO</label>
                  <input 
                    type="date" 
                    value={formEnd} 
                    onChange={e => setFormEnd(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">STATUS INICIAL</label>
                  <select 
                    value={formStatus} 
                    onChange={e => setFormStatus(e.target.value as Task['status'])}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em execução">Em execução</option>
                    <option value="Revisão">Revisão</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">MATRIZ EISENHOWER</label>
                  <select 
                    value={formEisenhower} 
                    onChange={e => setFormEisenhower(e.target.value as Task['eisenhower'])}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Q1">Q1 — Urgência Alta, Importância Alta</option>
                    <option value="Q2">Q2 — Urgência Baixa, Importância Alta</option>
                    <option value="Q3">Q3 — Urgência Alta, Importância Baixa</option>
                    <option value="Q4">Q4 — Urgência Baixa, Importância Baixa</option>
                  </select>
                </div>

                {editingTaskId && (
                  <div className="col-span-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <label className="block text-xs font-mono text-slate-400 mb-1">PROGRESSED QUANTIDADE DE ENTREGA ({formProgress}%)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={formProgress} 
                      onChange={e => {
                        setFormProgress(Number(e.target.value));
                        if(Number(e.target.value) === 100) setFormStatus('Concluído');
                        else if(Number(e.target.value) > 0 && formStatus === 'Pendente') setFormStatus('Em execução');
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                )}

                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">Estimativa de Prazos PERT (Dias de Trabalho)</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-emerald-400 mb-1">Otimista (O)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formO} 
                        onChange={e => setFormO(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs focus:border-emerald-500 focus:outline-none text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-amber-400 mb-1">Mais Provável (L)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formL} 
                        onChange={e => setFormL(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs focus:border-emerald-500 focus:outline-none text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-rose-400 mb-1">Pessimista (P)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formP} 
                        onChange={e => setFormP(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs focus:border-emerald-500 focus:outline-none text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3.5 border-t border-slate-800 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTaskForm(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold px-4 py-2 rounded-xl transition text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4  py-2 rounded-xl transition text-xs"
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
