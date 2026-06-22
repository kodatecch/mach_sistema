import React, { useState, useMemo } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { 
  GitBranch, 
  Table, 
  Kanban, 
  Grid, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Check, 
  Edit2, 
  User as UserIcon, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Info,
  SlidersHorizontal,
  FolderPlus,
  Save,
  HelpCircle,
  X,
  Workflow,
  Layers,
  Sparkles,
  ArrowRight,
  Sliders,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  NodeChange,
  applyNodeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WbsItem, Task, Project, ProjectMember, User, TaskDependency, OrgConfig } from '../types';

export type CanvasShape = 'rectangle' | 'diamond' | 'rounded-rectangle' | 'circle';

// Custom Node Component for CANVAS
const CustomCanvasNode = ({ id, data, selected }: any) => {
  const shape = data.shape || 'rectangle';
  const color = data.color || '#dc2626';
  const label = data.label || '';
  const isCritical = data.isCritical;
  const status = data.status;
  const startDate = data.startDate;
  const endDate = data.endDate;
  const isMilestone = data.isMilestone;
  const totalFloat = data.totalFloat;
  const type = data.type || 'free';

  let shapeClass = "w-44 h-24 flex flex-col justify-center items-center p-3 text-center border-2 transition-all relative";
  let contentStyle = "w-full h-full flex flex-col justify-center items-center overflow-hidden";

  if (shape === 'circle') {
    shapeClass = "rounded-full w-32 h-32 flex flex-col justify-center items-center p-3 text-center border-2 transition-all relative";
  } else if (shape === 'rounded-rectangle') {
    shapeClass = "rounded-2xl w-44 h-24 flex flex-col justify-center items-center p-3 text-center border-2 transition-all relative";
  } else if (shape === 'diamond') {
    shapeClass = "rotate-45 w-32 h-32 flex flex-col justify-center items-center p-3 text-center border-2 transition-all relative";
    contentStyle = "w-full h-full flex flex-col justify-center items-center -rotate-45 overflow-hidden";
  } else {
    shapeClass = "rounded w-44 h-24 flex flex-col justify-center items-center p-3 text-center border-2 transition-all relative";
  }

  const borderStyle = selected 
    ? 'ring-4 ring-offset-2 ring-blue-500 scale-105 shadow-2xl z-20 bg-white dark:bg-stone-900' 
    : 'shadow-md border-opacity-90 bg-white dark:bg-stone-900';

  return (
    <div 
      className={`${shapeClass} ${borderStyle}`}
      style={{
        backgroundColor: undefined,
        borderColor: color,
        color: 'inherit'
      }}
    >
      <Handle type="target" position={Position.Top} id="t" style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: color, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} id="r" style={{ background: color, width: 8, height: 8 }} />

      <div className={contentStyle}>
        {type === 'task' ? (
          <div className="flex flex-col text-left w-full h-full justify-between text-[9px] font-mono leading-tight">
            <div className="flex justify-between items-center w-full">
              <span className={`text-[7px] font-sans px-1 rounded text-white`} style={{ backgroundColor: color }}>
                {status === 'todo' ? 'PENDENTE' : status === 'in_progress' ? 'EXECUÇÃO' : 'CONCLUÍDO'}
              </span>
              {isCritical && <span className="text-[7px] bg-red-650 text-white px-1 rounded uppercase font-black">CRÍTICO</span>}
            </div>
            <div className="font-extrabold text-[10px] truncate max-w-[150px] my-1 text-stone-800 dark:text-stone-100">{label}</div>
            <div className="text-[8px] text-stone-500 dark:text-stone-400">📅 {startDate}</div>
            <div className="flex justify-between items-center mt-1 text-[7.5px] text-stone-400">
              <span>Folga: {totalFloat}d</span>
              {isMilestone && <span className="text-orange-500 font-extrabold">◆ MARCO</span>}
            </div>
          </div>
        ) : (
          <div className="font-bold text-[10px] leading-tight break-words max-w-[110px] text-stone-800 dark:text-stone-100">
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  canvasNode: CustomCanvasNode
};


interface CronogramaDashboardProps {
  activeProject: Project;
  activeUser: User;
  memberships: ProjectMember[];
  users: User[];
  permissions?: any;
  config?: OrgConfig;
}

// -----------------------------------------------------------------
// LOCAL STORAGE IMMUTABLE RETRIEVER SIMULATOR
// Provides beautiful, fast, and authentic REST API queries & mutations
// -----------------------------------------------------------------
const getInitialWbs = (): WbsItem[] => [
  { id: 'wbs-chassis', projectId: 'proj_fsae_2026', parentId: null, code: '1.0', name: 'PROJETO MECÂNICO & MODELO', description: 'Nível macro da engenharia estrutural e aerodinâmica do modelo.' },
  { id: 'wbs-monocoque', projectId: 'proj_fsae_2026', parentId: 'wbs-chassis', code: '1.1', name: 'Usinagem CNC do Chassi', description: 'Fresagem do chassi a partir do bloco de ABS ou poliuretano.' },
  { id: 'wbs-santoantonio', projectId: 'proj_fsae_2026', parentId: 'wbs-chassis', code: '1.2', name: 'Aerofólios e Rodas (Impressão 3D)', description: 'Impressão 3D das asas dianteira e traseira e fabricação das rodas oficiais.' },
  { id: 'wbs-aero', projectId: 'proj_fsae_2026', parentId: null, code: '2.0', name: 'CFD & DINÂMICA DE FLUIDOS', description: 'Análise virtual de arrasto e esteira aerodinâmica.' },
  { id: 'wbs-cfd', projectId: 'proj_fsae_2026', parentId: 'wbs-aero', code: '2.1', name: 'Simulações CFD em Túnel de Vento', description: 'Simulação computacional com cartucho de CO2 acoplado.' },
  { id: 'wbs-drs', projectId: 'proj_fsae_2026', parentId: 'wbs-aero', code: '2.2', name: 'Sistema de Rodagem e Eixos (Buchas)', description: 'Montagem de rolamentos de baixo atrito nos eixos do carrinho.' }
];

const getInitialTasks = (): Task[] => [
  {
    id: 't-fea-santoantonio',
    projectId: 'proj_fsae_2026',
    wbsItemId: 'wbs-santoantonio',
    name: 'Estudo de Tolerâncias e Massa das Rodas',
    description: 'Avaliar resistência e conformidade de peso das rodas usinadas/impressas no regulamento da temporada.',
    status: 'todo',
    startDate: '2026-06-05',
    endDate: '2026-06-20',
    what: 'Cálculo de Inércia e Flexão da Roda',
    why: 'Garantir conformidade obrigatória com os limites de peso e medidas oficiais da temporada.',
    where: 'Laboratório de Elementos Finitos e Design 3D',
    whenDate: '2026-06-20',
    whoOwnerId: 'user_pedro',
    how: 'Computação e simulações estáticas no Ansys Workbench com malha refinada.',
    howMuch: 400,
    durationOptimistic: 3,
    durationLikely: 6,
    durationPessimistic: 12,
    durationExpected: 6.5,
    isUrgent: true,
    isImportant: true
  },
  {
    id: 't-curva-monocoque',
    projectId: 'proj_fsae_2026',
    wbsItemId: 'wbs-monocoque',
    name: 'Usinagem CNC do Bloco de Poliuretano',
    description: 'Usinagem do modelo principal do chassi a partir do bloco oficial da temporada no CNC.',
    status: 'in_progress',
    startDate: '2026-06-10',
    endDate: '2026-06-28',
    what: 'Fresar chassi principal do dragster',
    why: 'Manufaturar o corpo aerodinâmico principal de acordo com o CAD final homologado.',
    where: 'Oficina de Usinagem CNC e Prototipagem',
    whenDate: '2026-06-28',
    whoOwnerId: 'user_ana',
    how: 'Fresa CNC de 3 ou 5 eixos utilizando o percurso gerado no software CAM.',
    howMuch: 1800,
    durationOptimistic: 4,
    durationLikely: 8,
    durationPessimistic: 15,
    durationExpected: 8.5,
    isUrgent: false,
    isImportant: true
  },
  {
    id: 't-ensaio-tracao',
    projectId: 'proj_fsae_2026',
    wbsItemId: 'wbs-monocoque',
    name: 'Pesagem e Inspeção do Modelo Físico',
    description: 'Verificação empírica de peso mínimo e dimensões limite do carrinho usinado.',
    status: 'done',
    startDate: '2026-06-01',
    endDate: '2026-06-08',
    what: 'Conformidade Scrutineering de 3 protótipos de teste',
    why: 'Assegurar que o carrinho não infringirá o limite mínimo de 50.0g e demais cotas regulamentares.',
    where: 'Bancada de Pesagem e Gabarito de Medição',
    whenDate: '2026-06-08',
    whoOwnerId: 'user_bruno',
    how: 'Uso de balança de precisão calibrada e paquímetro digital.',
    howMuch: 150,
    durationOptimistic: 1,
    durationLikely: 2,
    durationPessimistic: 3,
    durationExpected: 2.0,
    isUrgent: false,
    isImportant: false
  },
  {
    id: 't-drs-transiente',
    projectId: 'proj_fsae_2026',
    wbsItemId: 'wbs-drs',
    name: 'Detalhamento do Suporte do Cartucho de CO2',
    description: 'Projeto do furo traseiro de inserção do cartucho de gás carbônico.',
    status: 'todo',
    startDate: '25/06/2026',
    endDate: '2026-07-05',
    what: 'Câmara de acoplamento da cápsula de CO2',
    why: 'Garantir vedação perfeita e alinhamento do centro de gravidade durante o disparo na pista.',
    where: 'Laboratório de CAD e Prototipagem',
    whenDate: '2026-07-05',
    whoOwnerId: 'user_ana',
    how: 'Modelagem paramétrica 3D e teste de encaixe com cartucho padrão de 8g.',
    howMuch: 650,
    durationOptimistic: 2,
    durationLikely: 4,
    durationPessimistic: 9,
    durationExpected: 4.5,
    isUrgent: true,
    isImportant: false
  }
];

// -----------------------------------------------------------------
// CRITICAL PATH METHOD (CPM) ALGORITHM (AUTO-PROPAGATES LATE SLIPS)
// -----------------------------------------------------------------
const parseDate = (str: string | null | undefined): Date => {
  if (!str) return new Date();
  const clean = str.trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else if (parts[0].length === 4) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
  }
  const d = new Date(clean);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function computeCPM(tasksList: Task[], dependenciesList: TaskDependency[]): Task[] {
  if (tasksList.length === 0) return [];

  // 1. Calculate durations for each task in days
  const durations: Record<string, number> = {};
  tasksList.forEach(t => {
    const s = parseDate(t.startDate);
    const e = parseDate(t.endDate);
    const ms = e.getTime() - s.getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    durations[t.id] = days > 0 ? days : 1;
  });

  // 2. Build adjacency & predecessor maps
  const adj: Record<string, string[]> = {};
  const preds: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  tasksList.forEach(t => {
    adj[t.id] = [];
    preds[t.id] = [];
    inDegree[t.id] = 0;
  });

  dependenciesList.forEach(dep => {
    if (adj[dep.dependsOnTaskId] && adj[dep.taskId]) {
      adj[dep.dependsOnTaskId].push(dep.taskId);
      preds[dep.taskId].push(dep.dependsOnTaskId);
      inDegree[dep.taskId]++;
    }
  });

  // 3. Topological Sort (Kahn's Algorithm)
  const queue: string[] = [];
  tasksList.forEach(t => {
    if (inDegree[t.id] === 0) {
      queue.push(t.id);
    }
  });

  const topoOrder: string[] = [];
  const inDegreeCopy = { ...inDegree };
  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);
    (adj[u] || []).forEach(v => {
      inDegreeCopy[v]--;
      if (inDegreeCopy[v] === 0) {
        queue.push(v);
      }
    });
  }

  // Handle cycle safely
  if (topoOrder.length < tasksList.length) {
    tasksList.forEach(t => {
      if (!topoOrder.includes(t.id)) {
        topoOrder.push(t.id);
      }
    });
  }

  // 4. Forward Pass with dates shift propagation
  let minProjStart = parseDate(tasksList[0]?.startDate);
  tasksList.forEach(t => {
    const d = parseDate(t.startDate);
    if (d.getTime() < minProjStart.getTime()) {
      minProjStart = d;
    }
  });

  const propagatedStartDates: Record<string, Date> = {};
  const propagatedEndDates: Record<string, Date> = {};
  const earlyStartOffset: Record<string, number> = {};
  const earlyFinishOffset: Record<string, number> = {};

  topoOrder.forEach(id => {
    const t = tasksList.find(x => x.id === id)!;
    if (!t) return;
    let tStart = parseDate(t.startDate);
    
    // Check predecessors to push start date if predecessor finishes later
    (preds[id] || []).forEach(pId => {
      const pEnd = propagatedEndDates[pId];
      if (pEnd && pEnd.getTime() > tStart.getTime()) {
        tStart = new Date(pEnd.getTime());
      }
    });

    propagatedStartDates[id] = tStart;
    const duration = durations[id] || 1;
    const tEnd = new Date(tStart.getTime() + duration * 1000 * 3600 * 24);
    propagatedEndDates[id] = tEnd;

    // Relative offsets from minimum start
    const es = Math.round((tStart.getTime() - minProjStart.getTime()) / (1000 * 3600 * 24));
    earlyStartOffset[id] = es;
    earlyFinishOffset[id] = es + duration;
  });

  // 5. Backward Pass
  let maxEF = 0;
  topoOrder.forEach(id => {
    maxEF = Math.max(maxEF, earlyFinishOffset[id] || 0);
  });

  const lateStartOffset: Record<string, number> = {};
  const lateFinishOffset: Record<string, number> = {};

  topoOrder.forEach(id => {
    lateFinishOffset[id] = maxEF;
  });

  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const duration = durations[id] || 1;

    if ((adj[id] || []).length > 0) {
      let minLS = Infinity;
      adj[id].forEach(sId => {
        if (lateStartOffset[sId] !== undefined) {
          minLS = Math.min(minLS, lateStartOffset[sId]);
        }
      });
      if (minLS !== Infinity) {
        lateFinishOffset[id] = minLS;
      }
    }
    lateStartOffset[id] = lateFinishOffset[id] - duration;
  }

  // 6. Map back results containing isCritical and totalFloat
  return tasksList.map(t => {
    const id = t.id;
    const es = earlyStartOffset[id] || 0;
    const ls = lateStartOffset[id] || 0;
    const totalFloat = Math.max(0, ls - es);
    const isCritical = totalFloat === 0;

    const startDatePropagated = propagatedStartDates[id] ? formatDate(propagatedStartDates[id]) : t.startDate;
    const endDatePropagated = propagatedEndDates[id] ? formatDate(propagatedEndDates[id]) : t.endDate;

    return {
      ...t,
      startDate: startDatePropagated,
      endDate: endDatePropagated,
      isCritical,
      totalFloat,
    };
  });
}

function wouldFormCycle(taskId: string, dependsOnTaskId: string, depsList: TaskDependency[]): boolean {
  if (taskId === dependsOnTaskId) return true;
  const visited = new Set<string>();
  
  const dfs = (currId: string): boolean => {
    if (currId === taskId) return true;
    if (visited.has(currId)) return false;
    visited.add(currId);
    
    const relevantDeps = depsList.filter(d => d.taskId === currId);
    for (const d of relevantDeps) {
      if (dfs(d.dependsOnTaskId)) return true;
    }
    return false;
  };
  
  return dfs(dependsOnTaskId);
}

function getFlowElements(tasksList: any[], depsList: any[], annotationsList: any[]) {
  const levels: Record<string, number> = {};
  const taskMap = new Map(tasksList.map(t => [t.id, t]));

  tasksList.forEach(t => {
    levels[t.id] = 0;
  });

  // Calculate deep levels for layouting layered hierarchy
  for (let iter = 0; iter < 6; iter++) {
    depsList.forEach(dep => {
      const pLevel = levels[dep.dependsOnTaskId] ?? 0;
      const sLevel = levels[dep.taskId] ?? 0;
      if (sLevel <= pLevel) {
        levels[dep.taskId] = pLevel + 1;
      }
    });
  }

  const levelCounts: Record<number, number> = {};
  const nodes: any[] = tasksList.map(t => {
    const lvl = levels[t.id] || 0;
    levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1;
    const index = levelCounts[lvl] - 1;

    // Center standard coordinates
    const x = lvl * 260 + 30;
    const y = index * 140 + 50;

    let statusColor = 'bg-stone-500';
    if (t.status === 'completed' || t.status === 'done') statusColor = 'bg-green-500';
    else if (t.status === 'in_progress') statusColor = 'bg-amber-500';

    return {
      id: t.id,
      data: {
        label: (
          <div className={`p-3 rounded border text-left flex flex-col gap-1 w-52 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 shadow-xl ${t.isCritical ? 'border-red-500 shadow-red-500/10 animate-pulse' : 'border-stone-200 dark:border-stone-850'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black tracking-wider uppercase text-black ${statusColor}`}>
                {t.status === 'todo' ? 'PENDENTE' : t.status === 'in_progress' ? 'EXECUÇÃO' : 'CONCLUÍDO'}
              </span>
              {t.isCritical && (
                <span className="text-[9px] bg-red-650 text-white font-mono font-black px-1.5 py-0.5 rounded uppercase">
                  CRÍTICO
                </span>
              )}
            </div>
            <div className="font-extrabold text-[11px] truncate leading-tight mt-1 text-stone-900 dark:text-white">{t.name}</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-mono">
              📅 {t.startDate} até {t.endDate}
            </div>
            {t.totalFloat !== undefined && (
              <div className="text-[9px] text-stone-550 dark:text-stone-500 mt-1 font-mono flex justify-between">
                <span>Slack: <strong className={t.totalFloat === 0 ? "text-red-500 font-extrabold" : "text-stone-700 dark:text-stone-400"}>{t.totalFloat} d</strong></span>
                {t.isMilestone && <span className="text-[9px] text-orange-500 font-extrabold">◆ MARCO</span>}
              </div>
            )}
          </div>
        )
      },
      position: { x, y }
    };
  });

  // Map edges connecting dependencies
  const edges: any[] = depsList.map((dep, index) => {
    const isCriticalEdge = !!(taskMap.get(dep.dependsOnTaskId)?.isCritical && taskMap.get(dep.taskId)?.isCritical);
    return {
      id: `edge-${dep.id}-${index}`,
      source: dep.dependsOnTaskId,
      target: dep.taskId,
      animated: isCriticalEdge,
      style: {
        stroke: isCriticalEdge ? '#ef4444' : '#52525b',
        strokeWidth: isCriticalEdge ? 2.5 : 1.2,
      }
    };
  });

  // Map annotations (free yellow sticky-like node comments)
  annotationsList.forEach((ann, idx) => {
    nodes.push({
      id: ann.id,
      data: {
        label: (
          <div className="p-3 bg-stone-900 border border-yellow-500/40 text-yellow-500 rounded text-xs font-mono text-left w-48 relative shadow-lg">
            <span className="absolute -top-2 right-2 text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-black uppercase">
              Anotação Livre
            </span>
            <div className="text-[10px] leading-relaxed text-stone-300 break-words mt-1">{ann.text}</div>
          </div>
        )
      },
      position: ann.position || { x: 50, y: idx * 160 + 360 }
    });
  });

  return { nodes, edges };
}

export default function CronogramaDashboard({ activeProject, activeUser, memberships, users, permissions, config }: CronogramaDashboardProps) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'wbs' | '5w2h' | 'kanban' | 'eisenhower' | 'gantt' | 'flow'>('wbs');

  const enabledTabs = React.useMemo(() => {
    const tabs = [];
    if (config?.enableWbs !== false) tabs.push('wbs');
    if (config?.enable5w2h !== false) tabs.push('5w2h');
    if (config?.enableKanban !== false) tabs.push('kanban');
    if (config?.enableEisenhower !== false) tabs.push('eisenhower');
    if (config?.enableGantt !== false) tabs.push('gantt');
    if (config?.enableFlowchart !== false) tabs.push('flow');
    return tabs;
  }, [config]);

  React.useEffect(() => {
    if (enabledTabs.length > 0 && !enabledTabs.includes(activeSubTab)) {
      setActiveSubTab(enabledTabs[0] as any);
    }
  }, [enabledTabs, activeSubTab]);
  
  // Create / Edit WBS dialog states
  const [showWbsForm, setShowWbsForm] = useState(false);
  const [editingWbsId, setEditingWbsId] = useState<string | null>(null);
  const [wbsCodeInput, setWbsCodeInput] = useState('');
  const [wbsNameInput, setWbsNameInput] = useState('');
  const [wbsDescInput, setWbsDescInput] = useState('');
  const [wbsParentInput, setWbsParentInput] = useState<string>('');

  // Create / Edit Task form modal states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskNameInput, setTaskNameInput] = useState('');
  const [taskDescInput, setTaskDescInput] = useState('');
  const [taskStatusInput, setTaskStatusInput] = useState('todo');
  const [taskWbsInput, setTaskWbsInput] = useState('');
  const [taskComment, setTaskComment] = useState('');
  
  // 5W2H form fields
  const [taskWhat, setTaskWhat] = useState('');
  const [taskWhy, setTaskWhy] = useState('');
  const [taskWhere, setTaskWhere] = useState('');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');
  const [taskOwner, setTaskOwner] = useState('');
  const [taskHow, setTaskHow] = useState('');
  const [taskHowMuch, setTaskHowMuch] = useState(0);

  // PERT variables
  const [pertOpt, setPertOpt] = useState(1);
  const [pertLikely, setPertLikely] = useState(3);
  const [pertPess, setPertPess] = useState(6);

  // Predecessor & Milestone states
  const [taskPredecessor, setTaskPredecessor] = useState('');
  const [taskIsMilestone, setTaskIsMilestone] = useState(false);

  // Interactive Gantt & Flowchart states
  const [ganttScale, setGanttScale] = useState<'day' | 'week' | 'month'>('day');
  const [customMilestones, setCustomMilestones] = useState<{ id: string; name: string; date: string }[]>([
    { id: 'cm-1', name: 'Submissão do Relatório do Carro', date: '2026-06-15' },
    { id: 'cm-2', name: 'Apresentação de Design de Pista', date: '2026-06-25' }
  ]);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newAnnotationText, setNewAnnotationText] = useState('');

  // Filter States (Tabela 5W2H & Kanban)
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');

  // UI helpers
  const [collapsedWbsNodes, setCollapsedWbsNodes] = useState<Record<string, boolean>>({});
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  // Active Project Role Definition
  const currentUserRole = useMemo(() => {
    const mem = memberships.find(
      m => m.projectId === activeProject.id && m.userId === activeUser.id
    );
    return mem ? mem.role : 'member';
  }, [memberships, activeProject, activeUser]);

  const isAdminOrLead = currentUserRole === 'admin' || currentUserRole === 'area_lead';

  // Drag and drop task tracking state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // -----------------------------------------------------------------
  // 1. DATA QUERIES (React Query Integration)
  // Maintains local storage databases while exposing normal Query cache
  // -----------------------------------------------------------------
  const { data: wbsItems = [], isLoading: isLoadingWbs } = useQuery<WbsItem[]>({
    queryKey: ['wbsItems', activeProject.id],
    queryFn: async () => {
      // Direct load from localStorage or seed
      const storageKey = `wbs_items_${activeProject.id}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        return JSON.parse(localData);
      } else {
        const initial = getInitialWbs().filter(w => w.projectId === activeProject.id);
        localStorage.setItem(storageKey, JSON.stringify(initial));
        return initial;
      }
    }
  });

  const { data: dependencies = [], isLoading: isLoadingDeps } = useQuery<TaskDependency[]>({
    queryKey: ['taskDependencies', activeProject.id],
    queryFn: async () => {
      const storageKey = `task_dependencies_${activeProject.id}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        return JSON.parse(localData);
      } else {
        const initial: TaskDependency[] = [
          {
            id: 'dep-1',
            projectId: activeProject.id,
            taskId: 't-curva-monocoque',
            dependsOnTaskId: 't-ensaio-tracao',
            type: 'FS'
          },
          {
            id: 'dep-2',
            projectId: activeProject.id,
            taskId: 't-fea-santoantonio',
            dependsOnTaskId: 't-ensaio-tracao',
            type: 'FS'
          },
          {
            id: 'dep-3',
            projectId: activeProject.id,
            taskId: 't-drs-transiente',
            dependsOnTaskId: 't-curva-monocoque',
            type: 'FS'
          }
        ];
        localStorage.setItem(storageKey, JSON.stringify(initial));
        return initial;
      }
    }
  });

  const { data: annotations = [] } = useQuery<{ id: string; text: string; position: { x: number; y: number } }[]>({
    queryKey: ['annotations', activeProject.id],
    queryFn: async () => {
      const storageKey = `annotations_${activeProject.id}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        return JSON.parse(localData);
      } else {
        const initial = [
          { id: 'ann-1', text: 'Revisão crítica de conformidade com regulamento técnico oficial.', position: { x: 50, y: 350 } },
          { id: 'ann-2', text: 'Se o ensaio de tração falhar, o modelo FEA precisará ser recalibrado com novos limites de ruptura.', position: { x: 320, y: 250 } }
        ];
        localStorage.setItem(storageKey, JSON.stringify(initial));
        return initial;
      }
    }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks', activeProject.id, dependencies],
    queryFn: async () => {
      // Direct load from localStorage or seed with CPM calculation applied
      const storageKey = `tasks_${activeProject.id}`;
      const localData = localStorage.getItem(storageKey);
      let loadedTasks: Task[] = [];
      if (localData) {
        loadedTasks = JSON.parse(localData);
      } else {
        loadedTasks = getInitialTasks().filter(t => t.projectId === activeProject.id);
        localStorage.setItem(storageKey, JSON.stringify(loadedTasks));
      }
      return computeCPM(loadedTasks, dependencies);
    }
  });

  // -----------------------------------------------------------------
  // 2. DATA MUTATIONS (React Query Integration)
  // Handles automatic revalidation with elegant fallback structures
  // -----------------------------------------------------------------
  const { mutate: mutateWbs } = useMutation({
    mutationFn: async (updatedWbs: WbsItem[]) => {
      localStorage.setItem(`wbs_items_${activeProject.id}`, JSON.stringify(updatedWbs));
      return updatedWbs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wbsItems', activeProject.id] });
    }
  });

  const { mutate: mutateTasks } = useMutation({
    mutationFn: async (updatedTasks: Task[]) => {
      localStorage.setItem(`tasks_${activeProject.id}`, JSON.stringify(updatedTasks));
      return updatedTasks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProject.id] });
    }
  });

  const { mutate: mutateDependencies } = useMutation({
    mutationFn: async (updatedDeps: TaskDependency[]) => {
      localStorage.setItem(`task_dependencies_${activeProject.id}`, JSON.stringify(updatedDeps));
      return updatedDeps;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskDependencies', activeProject.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProject.id] });
    }
  });

  const { mutate: mutateAnnotations } = useMutation({
    mutationFn: async (updatedAnnots: any[]) => {
      localStorage.setItem(`annotations_${activeProject.id}`, JSON.stringify(updatedAnnots));
      return updatedAnnots;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', activeProject.id] });
    }
  });

  // -----------------------------------------------------------------
  // CANVAS HOOKS, STATES AND ACTIONS
  // -----------------------------------------------------------------
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  const [canvasPreset, setCanvasPreset] = useState<'precedence' | 'process' | 'wbs'>(() => {
    return (localStorage.getItem(`mach_canvas_preset_${activeProject.id}`) as any) || 'precedence';
  });

  const [localNodes, setLocalNodes, onNodesChange] = useNodesState([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState([]);

  // Sync canvasPreset on activeProject.id change
  React.useEffect(() => {
    const savedPreset = localStorage.getItem(`mach_canvas_preset_${activeProject.id}`) as any;
    setCanvasPreset(savedPreset || 'precedence');
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [activeProject.id]);

  // Load preset or cached values
  const changePreset = (preset: 'precedence' | 'process' | 'wbs') => {
    setCanvasPreset(preset);
    localStorage.setItem(`mach_canvas_preset_${activeProject.id}`, preset);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  // Sync nodes & edges based on active preset and dynamic tasks/dependencies
  React.useEffect(() => {
    if (canvasPreset === 'precedence') {
      const savedPositions = JSON.parse(localStorage.getItem(`mach_canvas_positions_${activeProject.id}`) || '{}');
      const savedCustoms = JSON.parse(localStorage.getItem(`mach_canvas_customizations_${activeProject.id}`) || '{}');

      const nodes = tasks.map((task, index) => {
        const custom = savedCustoms[task.id] || {};
        const pos = savedPositions[task.id] || { x: 100 + (index % 4) * 240, y: 80 + Math.floor(index / 4) * 180 };
        return {
          id: task.id,
          type: 'canvasNode',
          position: pos,
          data: {
            type: 'task',
            label: task.name,
            shape: custom.shape || 'rectangle',
            color: custom.color || (task.isUrgent && task.isImportant ? '#ef4444' : '#3b82f6'),
            status: task.status,
            startDate: task.startDate,
            endDate: task.endDate,
            isCritical: task.isCritical,
            totalFloat: task.totalFloat,
            isMilestone: task.durationExpected === 0
          }
        };
      });

      const savedEdgeCustoms = JSON.parse(localStorage.getItem(`mach_canvas_edge_customs_${activeProject.id}`) || '{}');
      const edges = dependencies
        .filter(dep => tasks.some(t => t.id === dep.taskId) && tasks.some(t => t.id === dep.dependsOnTaskId))
        .map(dep => {
          const custom = savedEdgeCustoms[dep.id] || {};
          const color = custom.color || '#52525b';
          return {
            id: dep.id,
            source: dep.dependsOnTaskId,
            target: dep.taskId,
            type: custom.type || 'smoothstep',
            style: {
              stroke: color,
              strokeDasharray: custom.dashed ? '5 5' : undefined
            },
            markerEnd: custom.arrow !== false ? {
              type: MarkerType.ArrowClosed,
              color: color
            } : undefined
          };
        });

      setLocalNodes(nodes);
      setLocalEdges(edges);
    } else if (canvasPreset === 'process') {
      const storedNodes = localStorage.getItem(`mach_canvas_nodes_${activeProject.id}_process`);
      const storedEdges = localStorage.getItem(`mach_canvas_edges_${activeProject.id}_process`);

      if (storedNodes && storedEdges) {
        setLocalNodes(JSON.parse(storedNodes));
        setLocalEdges(JSON.parse(storedEdges));
      } else {
        const initialNodes = [
          {
            id: 'process-start',
            type: 'canvasNode',
            position: { x: 100, y: 150 },
            data: { type: 'free', label: 'Início', shape: 'circle', color: '#10b981' }
          },
          {
            id: 'process-step1',
            type: 'canvasNode',
            position: { x: 280, y: 150 },
            data: { type: 'free', label: 'Fresar Protótipo CNC', shape: 'rectangle', color: '#3b82f6' }
          },
          {
            id: 'process-decision',
            type: 'canvasNode',
            position: { x: 500, y: 110 },
            data: { type: 'free', label: 'Aprovação da Qualidade?', shape: 'diamond', color: '#eab308' }
          },
          {
            id: 'process-rework',
            type: 'canvasNode',
            position: { x: 500, y: 320 },
            data: { type: 'free', label: 'Refazer Usinagem', shape: 'rounded-rectangle', color: '#ef4444' }
          },
          {
            id: 'process-end',
            type: 'canvasNode',
            position: { x: 740, y: 150 },
            data: { type: 'free', label: 'Fim', shape: 'circle', color: '#6b7280' }
          }
        ];

        const initialEdges = [
          {
            id: 'pe-1',
            source: 'process-start',
            target: 'process-step1',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
            style: { stroke: '#52525b' }
          },
          {
            id: 'pe-2',
            source: 'process-step1',
            target: 'process-decision',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
            style: { stroke: '#52525b' }
          },
          {
            id: 'pe-3',
            source: 'process-decision',
            target: 'process-end',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
            style: { stroke: '#52525b' },
            label: 'Sim'
          },
          {
            id: 'pe-4',
            source: 'process-decision',
            target: 'process-rework',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
            style: { stroke: '#52525b' },
            label: 'Não'
          },
          {
            id: 'pe-5',
            source: 'process-rework',
            target: 'process-step1',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
            style: { stroke: '#52525b' }
          }
        ];

        localStorage.setItem(`mach_canvas_nodes_${activeProject.id}_process`, JSON.stringify(initialNodes));
        localStorage.setItem(`mach_canvas_edges_${activeProject.id}_process`, JSON.stringify(initialEdges));
        setLocalNodes(initialNodes);
        setLocalEdges(initialEdges);
      }
    } else if (canvasPreset === 'wbs') {
      const storedNodes = localStorage.getItem(`mach_canvas_nodes_${activeProject.id}_wbs`);
      const storedEdges = localStorage.getItem(`mach_canvas_edges_${activeProject.id}_wbs`);

      if (storedNodes && storedEdges) {
        setLocalNodes(JSON.parse(storedNodes));
        setLocalEdges(JSON.parse(storedEdges));
      } else {
        const nodes: any[] = [];
        const edges: any[] = [];

        // Root project node
        nodes.push({
          id: 'wbs-root',
          type: 'canvasNode',
          position: { x: 450, y: 50 },
          data: { type: 'free', label: activeProject.name, shape: 'rounded-rectangle', color: '#8b5cf6' }
        });

        const lvl1 = wbsItems.filter((w: any) => w.parentId === null);
        lvl1.forEach((item1: any, i1: number) => {
          const x1 = 150 + i1 * 320;
          const y1 = 200;
          nodes.push({
            id: item1.id,
            type: 'canvasNode',
            position: { x: x1, y: y1 },
            data: { type: 'free', label: `${item1.code} ${item1.name}`, shape: 'rectangle', color: '#3b82f6' }
          });

          edges.push({
            id: `wbs-edge-root-${item1.id}`,
            source: 'wbs-root',
            target: item1.id,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
            style: { stroke: '#52525b' }
          });

          const lvl2 = wbsItems.filter((w: any) => w.parentId === item1.id);
          lvl2.forEach((item2: any, i2: number) => {
            const x2 = x1 - 100 + i2 * 200;
            const y2 = 360;
            nodes.push({
              id: item2.id,
              type: 'canvasNode',
              position: { x: x2, y: y2 },
              data: { type: 'free', label: `${item2.code} ${item2.name}`, shape: 'rounded-rectangle', color: '#10b981' }
            });

            edges.push({
              id: `wbs-edge-${item1.id}-${item2.id}`,
              source: item1.id,
              target: item2.id,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
              style: { stroke: '#52525b' }
            });
          });
        });

        localStorage.setItem(`mach_canvas_nodes_${activeProject.id}_wbs`, JSON.stringify(nodes));
        localStorage.setItem(`mach_canvas_edges_${activeProject.id}_wbs`, JSON.stringify(edges));
        setLocalNodes(nodes);
        setLocalEdges(edges);
      }
    }
  }, [canvasPreset, activeProject.id, tasks, dependencies, wbsItems]);

  // Persist nodes on update
  React.useEffect(() => {
    if (canvasPreset !== 'precedence' && localNodes.length > 0) {
      localStorage.setItem(`mach_canvas_nodes_${activeProject.id}_${canvasPreset}`, JSON.stringify(localNodes));
    }
  }, [localNodes, canvasPreset, activeProject.id]);

  // Persist edges on update
  React.useEffect(() => {
    if (canvasPreset !== 'precedence' && localEdges.length > 0) {
      localStorage.setItem(`mach_canvas_edges_${activeProject.id}_${canvasPreset}`, JSON.stringify(localEdges));
    }
  }, [localEdges, canvasPreset, activeProject.id]);

  const onNodesChangeHandler = React.useCallback((changes: NodeChange[]) => {
    setLocalNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      
      // Save changes
      if (canvasPreset === 'precedence') {
        const savedPositions = JSON.parse(localStorage.getItem(`mach_canvas_positions_${activeProject.id}`) || '{}');
        updated.forEach((n) => {
          if (n.position) {
            savedPositions[n.id] = n.position;
          }
        });
        localStorage.setItem(`mach_canvas_positions_${activeProject.id}`, JSON.stringify(savedPositions));
      }
      return updated;
    });
  }, [canvasPreset, activeProject.id, setLocalNodes]);

  const onConnectHandler = React.useCallback((params: Connection) => {
    setLocalEdges((eds) => {
      const newEdge = {
        ...params,
        id: `free-edge-${Date.now()}`,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
        style: { stroke: '#52525b' }
      } as Edge;
      const updated = addEdge(newEdge, eds);
      return updated;
    });
  }, [canvasPreset, activeProject.id, setLocalEdges]);

  const updateSelectedNodeStyle = (customs: { shape?: CanvasShape; color?: string; label?: string }) => {
    if (!selectedNodeId) return;

    setLocalNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          const updatedData = { ...node.data, ...customs };
          return { ...node, data: updatedData };
        }
        return node;
      })
    );

    if (canvasPreset === 'precedence') {
      const savedCustoms = JSON.parse(localStorage.getItem(`mach_canvas_customizations_${activeProject.id}`) || '{}');
      savedCustoms[selectedNodeId] = {
        ...(savedCustoms[selectedNodeId] || {}),
        ...customs
      };
      localStorage.setItem(`mach_canvas_customizations_${activeProject.id}`, JSON.stringify(savedCustoms));
    }
  };

  const updateSelectedEdgeStyle = (customs: { type?: string; dashed?: boolean; arrow?: boolean; color?: string }) => {
    if (!selectedEdgeId) return;

    setLocalEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdgeId) {
          const updated: any = { ...edge };
          if (customs.type) updated.type = customs.type;
          
          const strokeColor = customs.color !== undefined ? customs.color : (edge.style?.stroke || '#52525b');
          const isDashed = customs.dashed !== undefined ? customs.dashed : !!edge.style?.strokeDasharray;
          const hasArrow = customs.arrow !== undefined ? customs.arrow : !!edge.markerEnd;

          updated.style = {
            ...edge.style,
            stroke: strokeColor,
            strokeDasharray: isDashed ? '5 5' : undefined
          };

          updated.markerEnd = hasArrow ? {
            type: MarkerType.ArrowClosed,
            color: strokeColor
          } : undefined;

          return updated;
        }
        return edge;
      })
    );

    if (canvasPreset === 'precedence') {
      const savedEdgeCustoms = JSON.parse(localStorage.getItem(`mach_canvas_edge_customs_${activeProject.id}`) || '{}');
      savedEdgeCustoms[selectedEdgeId] = {
        ...(savedEdgeCustoms[selectedEdgeId] || {}),
        ...customs
      };
      localStorage.setItem(`mach_canvas_edge_customs_${activeProject.id}`, JSON.stringify(savedEdgeCustoms));
    }
  };

  const handleAddFreeNode = () => {
    const newNodeId = `free-node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'canvasNode',
      position: { x: 250, y: 150 },
      data: {
        type: 'free',
        label: 'Novo Bloco',
        shape: 'rounded-rectangle' as CanvasShape,
        color: '#3b82f6'
      }
    };
    setLocalNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNodeId);
    setSelectedEdgeId(null);
  };

  const handleClearCanvas = () => {
    if (window.confirm('Deseja realmente limpar todo o Canvas?')) {
      if (canvasPreset === 'precedence') {
        localStorage.removeItem(`mach_canvas_positions_${activeProject.id}`);
        localStorage.removeItem(`mach_canvas_customizations_${activeProject.id}`);
        localStorage.removeItem(`mach_canvas_edge_customs_${activeProject.id}`);
        setCanvasPreset('precedence');
      } else {
        setLocalNodes([]);
        setLocalEdges([]);
        localStorage.removeItem(`mach_canvas_nodes_${activeProject.id}_${canvasPreset}`);
        localStorage.removeItem(`mach_canvas_edges_${activeProject.id}_${canvasPreset}`);
      }
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setLocalNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setLocalEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setLocalEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  // -----------------------------------------------------------------
  // 3. WBS ACTIONS
  // -----------------------------------------------------------------
  const handleOpenAddWbs = (parentId?: string | null) => {
    if (!isAdminOrLead) return; 
    setEditingWbsId(null);
    setWbsCodeInput('');
    setWbsNameInput('');
    setWbsDescInput('');
    setWbsParentInput(parentId || '');
    setShowWbsForm(true);
  };

  const handleOpenEditWbs = (item: WbsItem) => {
    if (!isAdminOrLead) return;
    setEditingWbsId(item.id);
    setWbsCodeInput(item.code);
    setWbsNameInput(item.name);
    setWbsDescInput(item.description || '');
    setWbsParentInput(item.parentId || '');
    setShowWbsForm(true);
  };

  const saveWbsFormState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrLead) return;

    if (!wbsCodeInput.trim() || !wbsNameInput.trim()) {
      alert('Código e Título são obrigatórios.');
      return;
    }

    if (editingWbsId) {
      if (wbsParentInput === editingWbsId) {
        alert('Um item de EAP não pode ser apontado como o próprio pai!');
        return;
      }
      const updated = wbsItems.map(item => {
        if (item.id === editingWbsId) {
          return {
            ...item,
            code: wbsCodeInput.trim(),
            name: wbsNameInput.trim(),
            description: wbsDescInput.trim() || null,
            parentId: wbsParentInput ? wbsParentInput : null
          };
        }
        return item;
      });
      mutateWbs(updated);
    } else {
      const newItem: WbsItem = {
        id: `wbs_${Date.now()}`,
        projectId: activeProject.id,
        parentId: wbsParentInput ? wbsParentInput : null,
        code: wbsCodeInput.trim(),
        name: wbsNameInput.trim(),
        description: wbsDescInput.trim() || null
      };
      mutateWbs([...wbsItems, newItem]);
    }
    setShowWbsForm(false);
  };

  const deleteWbsItem = (id: string) => {
    if (!isAdminOrLead) return;
    if (confirm('Tem certeza que deseja deletar este item da EAP? Todas as tarefas e subitens filiados serão prejudicados.')) {
      const updated = wbsItems.filter(item => item.id !== id && item.parentId !== id);
      mutateWbs(updated);
    }
  };

  // Drag and Drop support for Wbs reparenting
  const [draggedWbsId, setDraggedWbsId] = useState<string | null>(null);

  const handleWbsDragStart = (e: React.DragEvent, id: string) => {
    if (!isAdminOrLead) return;
    setDraggedWbsId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleWbsDropOnNode = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!isAdminOrLead || !draggedWbsId || draggedWbsId === targetId) return;

    // Check ancestors to prevent cyclical parenting
    const isAncestor = (parentCheckId: string, itemCheckId: string): boolean => {
      const parent = wbsItems.find(w => w.id === parentCheckId);
      if (!parent || !parent.parentId) return false;
      if (parent.parentId === itemCheckId) return true;
      return isAncestor(parent.parentId, itemCheckId);
    };

    if (isAncestor(targetId, draggedWbsId)) {
      alert('Operação bloqueada: Não é possível reparentar um nó de árvore sob um de seus próprios descendentes.');
      return;
    }

    const updated = wbsItems.map(item => {
      if (item.id === draggedWbsId) {
        return { ...item, parentId: targetId };
      }
      return item;
    });
    mutateWbs(updated);
    setDraggedWbsId(null);
  };

  const handleWbsDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAdminOrLead || !draggedWbsId) return;

    const updated = wbsItems.map(item => {
      if (item.id === draggedWbsId) {
        return { ...item, parentId: null };
      }
      return item;
    });
    mutateWbs(updated);
    setDraggedWbsId(null);
  };

  // -----------------------------------------------------------------
  // 4. TASK ACTIONS & RBAC VALIDATION
  // Members can edit only tasks owned by themselves.
  // -----------------------------------------------------------------
  const checkTaskPermission = (task: Task) => {
    if (isAdminOrLead) return true;
    if (task.whoOwnerId === activeUser.id) return true;
    return false;
  };

  const handleOpenAddTask = (wbsItemId?: string) => {
    setEditingTaskId(null);
    setTaskNameInput('');
    setTaskDescInput('');
    setTaskStatusInput('todo');
    setTaskWbsInput(wbsItemId || '');
    
    // 5W2H default values
    setTaskWhat('');
    setTaskWhy('');
    setTaskWhere('');
    setTaskStart(new Date().toISOString().substring(0, 10));
    setTaskEnd(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().substring(0, 10));
    setTaskOwner(activeUser.id);
    setTaskHow('');
    setTaskHowMuch(0);

    // PERT default values
    setPertOpt(1);
    setPertLikely(3);
    setPertPess(6);

    // Dependency & milestone defaults
    setTaskPredecessor('');
    setTaskIsMilestone(false);
    setTaskComment('');

    setShowTaskForm(true);
  };

  const handleOpenEditTask = (task: Task) => {
    if (!checkTaskPermission(task)) {
      alert('Operação negada: Como Membro você somente possui autonomia para editar suas próprias tarefas registradas.');
      return;
    }
    setEditingTaskId(task.id);
    setTaskNameInput(task.name);
    setTaskDescInput(task.description || '');
    setTaskStatusInput(task.status);
    setTaskWbsInput(task.wbsItemId || '');
    setTaskComment((task as any).comment || '');
    
    setTaskWhat(task.what || '');
    setTaskWhy(task.why || '');
    setTaskWhere(task.where || '');
    setTaskStart(task.startDate || '');
    setTaskEnd(task.endDate || '');
    setTaskOwner(task.whoOwnerId || '');
    setTaskHow(task.how || '');
    setTaskHowMuch(task.howMuch || 0);

    setPertOpt(task.durationOptimistic || 1);
    setPertLikely(task.durationLikely || 3);
    setPertPess(task.durationPessimistic || 6);

    // Load existing dependency
    const dep = dependencies.find(d => d.taskId === task.id);
    setTaskPredecessor(dep ? dep.dependsOnTaskId : '');
    setTaskIsMilestone(task.isMilestone || false);

    setShowTaskForm(true);
  };

  const saveTaskFormState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskNameInput.trim()) {
      alert('Nome da tarefa é obrigatório.');
      return;
    }

    // Determine expected duration via PERT
    const durationExpected = parseFloat(((pertOpt + 4 * pertLikely + pertPess) / 6).toFixed(1));
    const targetTaskId = editingTaskId || `task_${Date.now()}`;

    // Cycle & Dependency Validation
    if (taskPredecessor) {
      if (taskPredecessor === targetTaskId) {
        alert('Não é possível salvar: Uma tarefa não pode depender de si mesma!');
        return;
      }
      if (wouldFormCycle(targetTaskId, taskPredecessor, dependencies)) {
        alert('Não é possível salvar: Detectado ciclo de precedência/dependência circular entre as tarefas!');
        return;
      }
    }

    if (editingTaskId) {
      const original = tasks.find(t => t.id === editingTaskId);
      if (!original || !checkTaskPermission(original)) {
        alert('Acesso negado.');
        return;
      }
      const updated = tasks.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            name: taskNameInput.trim(),
            description: taskDescInput.trim() || null,
            status: taskStatusInput,
            wbsItemId: taskWbsInput || null,
            what: taskWhat || taskNameInput.trim(),
            why: taskWhy || null,
            where: taskWhere || null,
            startDate: taskStart || null,
            endDate: taskEnd || null,
            whoOwnerId: taskOwner || null,
            how: taskHow || null,
            howMuch: isNaN(Number(taskHowMuch)) ? 0 : Number(taskHowMuch),
            durationOptimistic: pertOpt,
            durationLikely: pertLikely,
            durationPessimistic: pertPess,
            durationExpected,
            isMilestone: taskIsMilestone,
            comment: taskComment || null
          };
        }
        return t;
      });
      mutateTasks(updated);

      // Save/update dependency relation
      if (taskPredecessor) {
        const existingDep = dependencies.find(d => d.taskId === targetTaskId);
        if (existingDep) {
          const updatedDeps = dependencies.map(d => d.id === existingDep.id ? { ...d, dependsOnTaskId: taskPredecessor } : d);
          mutateDependencies(updatedDeps);
        } else {
          const newDep: TaskDependency = {
            id: `dep_${Date.now()}`,
            projectId: activeProject.id,
            taskId: targetTaskId,
            dependsOnTaskId: taskPredecessor,
            type: 'FS'
          };
          mutateDependencies([...dependencies, newDep]);
        }
      } else {
        // Clear dependency
        const updatedDeps = dependencies.filter(d => d.taskId !== targetTaskId);
        mutateDependencies(updatedDeps);
      }
    } else {
      const newTask: Task = {
        id: targetTaskId,
        projectId: activeProject.id,
        wbsItemId: taskWbsInput || null,
        name: taskNameInput.trim(),
        description: taskDescInput.trim() || null,
        status: taskStatusInput,
        startDate: taskStart || null,
        endDate: taskEnd || null,
        what: taskWhat || taskNameInput.trim(),
        why: taskWhy || null,
        where: taskWhere || null,
        whenDate: taskEnd || null,
        whoOwnerId: taskOwner || null,
        how: taskHow || null,
        howMuch: isNaN(Number(taskHowMuch)) ? 0 : Number(taskHowMuch),
        durationOptimistic: pertOpt,
        durationLikely: pertLikely,
        durationPessimistic: pertPess,
        durationExpected,
        isUrgent: false,
        isImportant: false,
        isMilestone: taskIsMilestone,
        comment: taskComment || null
      };
      mutateTasks([...tasks, newTask]);

      // Save dependency relation for new task
      if (taskPredecessor) {
        const newDep: TaskDependency = {
          id: `dep_${Date.now()}`,
          projectId: activeProject.id,
          taskId: targetTaskId,
          dependsOnTaskId: taskPredecessor,
          type: 'FS'
        };
        mutateDependencies([...dependencies, newDep]);
      }
    }

    setShowTaskForm(false);
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (!checkTaskPermission(task)) {
      alert('Permissão negada.');
      return;
    }

    if (confirm('Deletar permanentemente esta tarefa do cronograma?')) {
      const updated = tasks.filter(t => t.id !== id);
      mutateTasks(updated);
    }
  };

  // -----------------------------------------------------------------
  // 5. INLINE EDITING MATRIX 5W2H (DEBOUNCED BLUR ACTIONS)
  // Inline sheets save data immediately onBlur to the mutated server state
  // -----------------------------------------------------------------
  const handleInlineChange = (taskId: string, field: keyof Task, val: any) => {
    const original = tasks.find(t => t.id === taskId);
    if (!original) return;
    if (!checkTaskPermission(original)) {
      alert('Operação negada: Você não é proprietário cadastrado desta tarefa.');
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        // Build updated task with selected dynamic field
        return { 
          ...t, 
          [field]: val === '' ? null : val 
        };
      }
      return t;
    });
    mutateTasks(updated);
  };

  // -----------------------------------------------------------------
  // 6. PROCESS AND FILTER DATA
  // -----------------------------------------------------------------
  // Build lookup records for users
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  // Hierarchical list builder for visual WBS Tree view
  const rootWbsItems = useMemo(() => {
    return wbsItems.filter(item => !item.parentId);
  }, [wbsItems]);

  const getSubWbsItems = (parentId: string) => {
    return wbsItems.filter(item => item.parentId === parentId);
  };

  // Get tasks directly under a WBS node
  const getTasksForWbs = (wbsId: string) => {
    return tasks.filter(t => t.wbsItemId === wbsId);
  };

  // Filter tasks for grid interfaces
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterOwner && t.whoOwnerId !== filterOwner) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterUrgency) {
        if (filterUrgency === 'urgent' && !t.isUrgent) return false;
        if (filterUrgency === 'important' && !t.isImportant) return false;
        if (filterUrgency === 'critical' && (!t.isUrgent || !t.isImportant)) return false;
        if (filterUrgency === 'normal' && t.isUrgent && t.isImportant) return false;
      }
      return true;
    });
  }, [tasks, filterOwner, filterStatus, filterUrgency]);

  // -----------------------------------------------------------------
  // 7. DRAG AND DROP KANBAN AND EISENHOWER HANDLERS
  // -----------------------------------------------------------------
  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleKanbanDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const targetTask = tasks.find(t => t.id === draggedTaskId);
    if (!targetTask) return;

    if (!checkTaskPermission(targetTask)) {
      alert('Operação negada: Você não possui privilégios de edição nesta tarefa.');
      setDraggedTaskId(null);
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === draggedTaskId) {
        return { ...t, status };
      }
      return t;
    });
    mutateTasks(updated);
    setDraggedTaskId(null);
  };

  const handleEisenhowerDrop = (e: React.DragEvent, quadrant: { isUrgent: boolean, isImportant: boolean }) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const targetTask = tasks.find(t => t.id === draggedTaskId);
    if (!targetTask) return;

    if (!checkTaskPermission(targetTask)) {
      alert('Operação negada: Você não possui privilégios de edição nesta tarefa.');
      setDraggedTaskId(null);
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === draggedTaskId) {
        return {
          ...t,
          isUrgent: quadrant.isUrgent,
          isImportant: quadrant.isImportant
        };
      }
      return t;
    });
    mutateTasks(updated);
    setDraggedTaskId(null);
  };

  // Helper remaining days calculation
  const getRemainingDaysText = (endDateStr: string | null) => {
    if (!endDateStr) return { text: 'Sem prazo', state: 'normal' };
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return { text: endDateStr, state: 'normal' };
    
    // Set hours to midday for timezone stability
    end.setHours(12, 0, 0, 0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));

    if (days < 0) {
      return { text: `${Math.abs(days)} dias atrasado`, state: 'overdue' };
    } else if (days === 0) {
      return { text: 'Último dia!', state: 'urgent' };
    } else if (days <= 5) {
      return { text: `${days} dias restantes`, state: 'soon' };
    } else {
      return { text: `${days} d restantes`, state: 'normal' };
    }
  };

  return (
    <div className="space-y-6">
      {/* MODULE HEADER AND RBAC ROBUST OVERALL BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-850 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-red-505" />
            CRONOGRAMA & ENGENHARIA DE PROCESSOS (WBS)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAddTask()}
            className="mach-button-primary text-xs font-bold tracking-wider font-mono uppercase flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nova Tarefa 5W2H
          </button>
        </div>
      </div>

      {/* MODULE SUB-TAB NAVIGATION */}
      <div className="flex border-b border-stone-850 gap-1.5 flex-wrap">
        {enabledTabs.includes('wbs') && (
          <button
            onClick={() => setActiveSubTab('wbs')}
            className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'wbs' 
                ? 'border-red-505 text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-900/40' 
                : 'border-transparent text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-900/20'
            }`}
          >
            <GitBranch className="w-4 h-4 text-stone-400" />
            Árvore EAP / WBS
          </button>
        )}

        {enabledTabs.includes('5w2h') && (
          <button
            onClick={() => setActiveSubTab('5w2h')}
            className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === '5w2h' 
                ? 'border-red-505 text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-900/40' 
                : 'border-transparent text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-900/20'
            }`}
          >
            <Table className="w-4 h-4 text-stone-400" />
            Planilha 5W2H Inline
          </button>
        )}

        {enabledTabs.includes('kanban') && (
          <button
            onClick={() => setActiveSubTab('kanban')}
            className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'kanban' 
                ? 'border-red-505 text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-900/40' 
                : 'border-transparent text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-900/20'
            }`}
          >
            <Kanban className="w-4 h-4 text-stone-400" />
            Quadro Kanban
          </button>
        )}

        {enabledTabs.includes('eisenhower') && (
          <button
            onClick={() => setActiveSubTab('eisenhower')}
            className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'eisenhower' 
                ? 'border-red-505 text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-900/40' 
                : 'border-transparent text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-900/20'
            }`}
          >
            <Grid className="w-4 h-4 text-stone-400" />
            Priorização Eisenhower
          </button>
        )}

        {enabledTabs.includes('gantt') && (
          <button
            onClick={() => setActiveSubTab('gantt')}
            className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'gantt' 
                ? 'border-red-505 text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-900/40' 
                : 'border-transparent text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-900/20'
            }`}
          >
            <Layers className="w-4 h-4 text-stone-400 animate-pulse" />
            Cronograma Gantt (PERT/CPM)
          </button>
        )}

        {enabledTabs.includes('flow') && (
          <button
            onClick={() => setActiveSubTab('flow')}
            className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'flow' 
                ? 'border-red-505 text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-900/40' 
                : 'border-transparent text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-900/20'
            }`}
          >
            <Workflow className="w-4 h-4 text-stone-400" />
            CANVAS
          </button>
        )}
      </div>

      {/* FILTER CONTROL PANEL BAR */}
      {(activeSubTab === '5w2h' || activeSubTab === 'kanban' || activeSubTab === 'eisenhower') && (
        <div className="bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-850 p-4 rounded flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-mono uppercase font-black text-stone-500 dark:text-stone-400">Filtrar Ativos:</span>
            
            <div className="flex flex-col">
              <select
                value={filterOwner}
                onChange={e => setFilterOwner(e.target.value)}
                className="mach-input text-xs font-mono px-3 py-1.5 rounded text-stone-900 dark:text-stone-100"
              >
                <option value="" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">-- Todos os Proprietários --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="mach-input text-xs font-mono px-3 py-1.5 rounded text-stone-900 dark:text-stone-100"
              >
                <option value="" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">-- Todos Status --</option>
                <option value="todo" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">Pendente (Todo)</option>
                <option value="in_progress" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">Em Execução</option>
                <option value="done" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">Concluído</option>
              </select>
            </div>

            <div className="flex flex-col">
              <select
                value={filterUrgency}
                onChange={e => setFilterUrgency(e.target.value)}
                className="mach-input text-xs font-mono px-3 py-1.5 rounded text-stone-900 dark:text-stone-100"
              >
                <option value="" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">-- Nível de Criticidade --</option>
                <option value="critical" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">Alto (Urgente & Importante)</option>
                <option value="urgent" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">Apenas Urgente</option>
                <option value="important" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">Apenas Importante</option>
                <option value="normal" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">Baixo / Normal</option>
              </select>
            </div>
          </div>

          {(filterOwner || filterStatus || filterUrgency) && (
            <button
              onClick={() => { setFilterOwner(''); setFilterStatus(''); setFilterUrgency(''); }}
              className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white font-mono text-[11px] underline cursor-pointer"
            >
              Limpar Filtros Activos
            </button>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 1: WBS TREE VIEW WITH EXPANSION AND DND DRAG/REPARENT
          ------------------------------------------------------------- */}
      {activeSubTab === 'wbs' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-850 p-4 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-red-505" />
              <p className="text-xs text-stone-300 leading-normal">
                Disponibilize a organização hierárquica (EDT/EAP) do protótipo. 
                {isAdminOrLead ? (
                  <strong className="text-white"> Arraste e solte nós para reparentar visualmente</strong>
                ) : (
                  ' Você possui permissão apenas para visualização da árvore de EAP principal.'
                )}
              </p>
            </div>

            {isAdminOrLead && (
              <button
                onClick={() => handleOpenAddWbs(null)}
                className="bg-stone-950 border border-stone-800 text-stone-200 hover:text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" /> Novo Item Raiz
              </button>
            )}
          </div>

          {/* ARVORE ROOT ZONE */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleWbsDropOnRoot}
            className="p-6 bg-stone-900 border border-stone-850 rounded relative min-h-[400px] space-y-4"
          >
            {isLoadingWbs ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 mach-skeleton w-full" />
                ))}
              </div>
            ) : rootWbsItems.length === 0 ? (
              <div className="text-center py-20 text-stone-500 font-mono text-xs flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-850 flex items-center justify-center text-stone-400">
                  <Info className="w-6 h-6 text-stone-500" />
                </div>
                <div>
                  <p className="font-bold text-stone-300">Nenhum item EAP raiz registrado</p>
                  <p className="text-[10px] text-stone-500 mt-1">Configure os macro-entregáveis para decompor suas sprints.</p>
                </div>
                {isAdminOrLead && (
                  <button
                    onClick={() => handleOpenAddWbs(null)}
                    className="mach-button-primary bg-red-650 hover:bg-red-700 text-[10px] cursor-pointer"
                  >
                    Novo Item Raiz
                  </button>
                )}
              </div>
            ) : (
              rootWbsItems.map(rootNode => renderNodeTree(rootNode, 0))
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: HIGH-FIDELITY INLINE SPREADSHEET (5W2H GRID)
          ------------------------------------------------------------- */}
      {activeSubTab === '5w2h' && (
        permissions?.isSponsor ? (
          <div className="bg-stone-900 border border-stone-850 rounded p-12 text-center flex flex-col items-center justify-center space-y-4 font-mono">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 animate-pulse">
              ⚠️
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Acesso Restrito: Nível Sponsor</h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              Sponsors possuem acesso restrito ao cronograma macro e WBS estrutural, sem acesso à planilha detalhada de 5W2H operacional.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded overflow-hidden select-text">
          <div className="p-4 bg-stone-550/10 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-850 flex items-center gap-4">
            <Table className="w-4 h-4 text-red-550" />
            <h3 className="text-xs font-black font-mono uppercase text-stone-900 dark:text-white tracking-widest">Planilha Dinâmica de 5W2H</h3>
            
            <button
              type="button"
              onClick={() => {
                const mappedData = filteredTasks.map((t, idx) => ({
                  'Ref': t.id.slice(0, 5).toUpperCase(),
                  'WHAT (Nome)': t.name,
                  'WHY (Justificativa)': t.why || '',
                  'WHERE (Onde)': t.where || '',
                  'WHO (Membro)': users.find(u => u.id === t.whoOwnerId)?.name || t.whoOwnerId || '',
                  'WHEN (Início)': t.startDate || '',
                  'WHEN (Fim)': t.endDate || '',
                  'HOW (Metodologia)': t.how || '',
                  'HOW MUCH (Quanto)': t.howMuch || 0,
                  'Status': t.status === 'todo' ? 'Pendente' : t.status === 'in_progress' ? 'Execução' : 'Concluído',
                  'Duração PERT (Dias)': t.durationExpected || 0
                }));
                exportToExcel(mappedData, `5W2H_${activeProject.name.replace(/\s+/g, '_')}.xlsx`, '5W2H');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase py-1.5 px-3.5 rounded flex items-center gap-1.5 transition text-[10px] cursor-pointer ml-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exportar Excel
            </button>

            <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-950 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-850">
              Autosalvamento em tempo real (OnBlur)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-stone-800 dark:text-stone-300 min-w-[1200px]">
              <thead className="border-b border-stone-200 dark:border-stone-850 text-stone-800 dark:text-stone-400 font-black uppercase text-[10px] tracking-wider">
                <tr className="bg-stone-100 dark:bg-[#121212]">
                  <th className="p-3 w-12 text-center">Ref</th>
                  <th className="p-3 w-56">WHAT (Nome)</th>
                  <th className="p-3 w-56">WHY (Justificativa)</th>
                  <th className="p-3 w-40">WHERE (Onde)</th>
                  <th className="p-3 w-44">WHO (Membro da Equipe)</th>
                  <th className="p-3 w-32">WHEN (Início)</th>
                  <th className="p-3 w-32">WHEN (Final)</th>
                  <th className="p-3 w-36">HOW (Metodologia)</th>
                  <th className="p-3 w-28 text-right">HOW MUCH</th>
                  <th className="p-3 w-20 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {isLoadingTasks ? (
                  [1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      <td colSpan={10} className="p-4">
                        <div className="h-6 mach-skeleton w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-stone-500 font-mono text-xs">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-850 flex items-center justify-center text-stone-400">
                          <Info className="w-5 h-5 text-stone-500" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-300">Nenhuma tarefa encontrada</p>
                          <p className="text-[10px] text-stone-500 mt-0.5">Nenhuma tarefa corresponde aos filtros ou está cadastrada neste projeto.</p>
                        </div>
                        {isAdminOrLead && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddTask()}
                            className="mach-button-primary bg-red-650 hover:bg-red-700 text-[9px] py-1.5 px-3.5 mt-1 cursor-pointer"
                          >
                            Criar Primeira Tarefa da EAP
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const isAllowed = checkTaskPermission(task);
                    return (
                      <tr key={task.id} className="hover:bg-stone-100 dark:hover:bg-stone-850/40 group transition">
                        <td className="p-2 text-center text-stone-500 font-bold text-[10px]">
                          {task.id.slice(0, 5).toUpperCase()}
                        </td>

                        {/* WHAT */}
                        <td className="p-1">
                          <input
                            type="text"
                            defaultValue={task.name}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'name', e.target.value)}
                            placeholder="Nome / O quê fazer..."
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                          />
                        </td>

                        {/* WHY */}
                        <td className="p-1">
                          <input
                            type="text"
                            defaultValue={task.why || ''}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'why', e.target.value)}
                            placeholder="Motivo / Propósito do plano..."
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                          />
                        </td>

                        {/* WHERE */}
                        <td className="p-1">
                          <input
                            type="text"
                            defaultValue={task.where || ''}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'where', e.target.value)}
                            placeholder="Local / Plataforma..."
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                          />
                        </td>

                        {/* WHO */}
                        <td className="p-1 text-center">
                          <select
                            defaultValue={task.whoOwnerId || ''}
                            disabled={!isAllowed}
                            onChange={(e) => handleInlineChange(task.id, 'whoOwnerId', e.target.value)}
                            className="w-full bg-transparent p-1.5 text-xs rounded border-transparent hover:border-stone-200 dark:hover:border-stone-800 focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-stone-200 focus:outline-none disabled:opacity-50 cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400">Pendente</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* WHEN START */}
                        <td className="p-1">
                          <input
                            type="text"
                            defaultValue={task.startDate || ''}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'startDate', e.target.value)}
                            placeholder="AAAA-MM-DD"
                            className="w-full bg-transparent p-2 text-xs rounded focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 text-center disabled:opacity-50"
                          />
                        </td>

                        {/* WHEN END */}
                        <td className="p-1">
                          <input
                            type="text"
                            defaultValue={task.endDate || ''}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'endDate', e.target.value)}
                            placeholder="AAAA-MM-DD"
                            className="w-full bg-transparent p-2 text-xs rounded focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 text-center disabled:opacity-50"
                          />
                        </td>

                        {/* HOW */}
                        <td className="p-1">
                          <input
                            type="text"
                            defaultValue={task.how || ''}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'how', e.target.value)}
                            placeholder="Como realizar..."
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                          />
                        </td>

                        {/* HOW MUCH */}
                        <td className="p-1">
                          <input
                            type="number"
                            defaultValue={task.howMuch || 0}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'howMuch', isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))}
                            className="w-full bg-transparent p-2 text-xs text-right rounded focus:bg-stone-100 dark:focus:bg-stone-950 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 text-yellow-500 font-extrabold disabled:opacity-50"
                          />
                        </td>

                        {/* ACTION ROW */}
                        <td className="p-1 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              title="Editar Detalhes / PERT"
                              className="p-1 bg-stone-100 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-white rounded cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isAllowed && (
                              <button
                                onClick={() => deleteTask(task.id)}
                                title="Deletar Tarefa"
                                className="p-1 bg-stone-100 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 text-stone-550 dark:text-stone-500 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-650 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </div>
        )
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: THE QUADRO KANBAN
          ------------------------------------------------------------- */}
      {activeSubTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['todo', 'in_progress', 'done'].map(colStatus => {
            const colLabel = colStatus === 'todo' ? 'A FAZER (TODO)' : colStatus === 'in_progress' ? 'EM DESENVOLVIMENTO' : 'CONCLUÍDO (DONE)';
            const colColorBadge = colStatus === 'todo' ? 'bg-orange-500' : colStatus === 'in_progress' ? 'bg-blue-500' : 'bg-green-500';
            
            const colTasks = filteredTasks.filter(t => t.status === colStatus);

            return (
              <div
                key={colStatus}
                onDragOver={handleDragOver}
                onDrop={(e) => handleKanbanDrop(e, colStatus)}
                onDragEnter={() => setHoveredColumn(colStatus)}
                onDragLeave={() => setHoveredColumn(null)}
                className={`bg-stone-900 border ${
                  hoveredColumn === colStatus ? 'border-red-505/50 bg-[#161616]' : 'border-stone-850'
                } rounded p-4 flex flex-col min-h-[500px] transition-all`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-850 mb-4 select-none">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colColorBadge}`}></span>
                    <h3 className="font-mono text-xs font-black text-white uppercase tracking-wider">{colLabel}</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-stone-950 border border-stone-850 text-stone-400 px-2 py-0.5 rounded-full font-bold">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-grow space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="border border-dashed border-stone-850 rounded-lg p-6 text-center text-stone-500 font-mono text-[10px] select-none">
                      Arraste tarefas para mudar de status
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const remain = getRemainingDaysText(task.endDate);
                      const isAllowed = checkTaskPermission(task);
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleTaskDragStart(e, task.id)}
                          className={`p-4 bg-stone-950 border border-stone-850 hover:border-stone-700 rounded-lg cursor-grab active:cursor-grabbing transition space-y-3 ${
                            dragsActiveBorder(task)
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[8.5px] font-mono text-red-400 bg-stone-900 border border-stone-850 rounded px-1.5 py-0.5 uppercase tracking-wider font-bold">
                              {wbsItems.find(w => w.id === task.wbsItemId)?.code || 'EAP LIVRE'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {task.isUrgent && task.isImportant && (
                                <span className="w-2 h-2 rounded-full bg-red-650" title="Crítica / Máxima Prioridade"></span>
                              )}
                              <span className="text-[10px] font-mono text-stone-550">
                                {task.id.substring(0, 5).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-white leading-normal uppercase">
                            {task.name}
                          </h4>

                          {task.description && (
                            <p className="text-[10px] text-stone-400 font-sans leading-relaxed line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Task Footer Card Details */}
                          <div className="pt-2 border-t border-stone-900/60 flex items-center justify-between gap-2 text-[10px] font-mono">
                            <div className="flex items-center gap-1.5 text-stone-400 select-none">
                              <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                              <span className="truncate max-w-[90px] font-semibold text-stone-300">
                                {userMap[task.whoOwnerId || ''] || 'Sem Dono'}
                              </span>
                            </div>

                            {/* Remaining Days Badge */}
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                              remain.state === 'overdue' 
                                ? 'bg-red-950/40 border-red-800 text-red-500' 
                                : remain.state === 'urgent' || remain.state === 'soon' 
                                  ? 'bg-amber-950/20 border-amber-800 text-amber-500' 
                                  : 'bg-stone-900 border-stone-800 text-stone-400'
                            }`}>
                              {remain.text}
                            </span>
                          </div>

                          {/* Quick change actions if Drag/Drop isn't preferred or allowed */}
                          <div className="flex justify-end gap-1.5 pt-1.5 mt-1 hover:opacity-100 opacity-20 transition border-t border-stone-200 dark:border-stone-900/60">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              className="text-[9px] font-mono bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white px-2 py-0.5 rounded cursor-pointer"
                            >
                              EDITAR
                            </button>
                            {isAllowed && colStatus !== 'todo' && (
                              <button
                                onClick={() => handleMoveAction(task.id, 'todo')}
                                className="text-[8px] font-mono uppercase bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Todo
                              </button>
                            )}
                            {isAllowed && colStatus !== 'in_progress' && (
                              <button
                                onClick={() => handleMoveAction(task.id, 'in_progress')}
                                className="text-[8px] font-mono uppercase bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Run
                              </button>
                            )}
                            {isAllowed && colStatus !== 'done' && (
                              <button
                                onClick={() => handleMoveAction(task.id, 'done')}
                                className="text-[8px] font-mono uppercase bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Done
                              </button>
                            )}
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
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 4: DYNAMIC EISENHOWER DECISION MATRIX
          ------------------------------------------------------------- */}
      {activeSubTab === 'eisenhower' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-850 p-4 rounded flex items-center gap-2">
            <Info className="w-4 h-4 text-red-505" />
            <p className="text-xs text-stone-300">
              Gerencie a relevância operacional de cada tarefa. Arraste as caixas diretamente entre os quatro quadrantes 
              para atualizar seu nível crítico (<strong className="text-white">isUrgent</strong> / <strong className="text-white">isImportant</strong>) dinamicamente.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
            {/* QUADRANT 1: URGENTE + IMPORTANTE */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleEisenhowerDrop(e, { isUrgent: true, isImportant: true })}
              className="bg-stone-900 border border-stone-850 rounded-lg p-5 flex flex-col min-h-[300px] border-l-4 border-l-red-500 transition-all hover:bg-stone-900/60"
            >
              <div className="flex items-center gap-2 border-b border-stone-250 dark:border-stone-800 pb-3 mb-4">
                <span className="text-xs bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q1 • URGENTE & IMPORTANTE
                </span>
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">AGIR (Foco Crítico Imediato)</span>
              </div>
              {renderEisenhowerTaskContainer(true, true)}
            </div>

            {/* QUADRANT 2: NÃO URGENTE + IMPORTANTE */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleEisenhowerDrop(e, { isUrgent: false, isImportant: true })}
              className="bg-stone-900 border border-stone-850 rounded-lg p-5 flex flex-col min-h-[300px] border-l-4 border-l-orange-400 transition-all hover:bg-stone-900/60"
            >
              <div className="flex items-center gap-2 border-b border-stone-250 dark:border-stone-800 pb-3 mb-4">
                <span className="text-xs bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-750 dark:text-orange-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q2 • IMPORTANTE (NÃO URGENTE)
                </span>
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">REGRAR (Planejar e Modelar)</span>
              </div>
              {renderEisenhowerTaskContainer(false, true)}
            </div>

            {/* QUADRANT 3: URGENTE + NÃO IMPORTANTE */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleEisenhowerDrop(e, { isUrgent: true, isImportant: false })}
              className="bg-stone-900 border border-stone-850 rounded-lg p-5 flex flex-col min-h-[300px] border-l-4 border-l-yellow-500 transition-all hover:bg-stone-900/60"
            >
              <div className="flex items-center gap-2 border-b border-stone-250 dark:border-stone-800 pb-3 mb-4">
                <span className="text-xs bg-yellow-100 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900/60 text-yellow-750 dark:text-yellow-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q3 • URGENTE (NÃO IMPORTANTE)
                </span>
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">DELEGAR (Agilizar ou Filtrar)</span>
              </div>
              {renderEisenhowerTaskContainer(true, false)}
            </div>

            {/* QUADRANT 4: NÃO URGENTE + NÃO IMPORTANTE */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleEisenhowerDrop(e, { isUrgent: false, isImportant: false })}
              className="bg-stone-900 border border-stone-850 rounded-lg p-5 flex flex-col min-h-[300px] border-l-4 border-l-stone-600 transition-all hover:bg-stone-900/60"
            >
              <div className="flex items-center gap-2 border-b border-stone-250 dark:border-stone-800 pb-3 mb-4">
                <span className="text-xs bg-stone-100 dark:bg-stone-900 border border-stone-250 dark:border-stone-800 text-stone-800 dark:text-stone-300 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q4 • NÃO URGENTE & NÃO IMPORTANTE
                </span>
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-450">ELIMINAR (Deixar para depois)</span>
              </div>
              {renderEisenhowerTaskContainer(false, false)}
            </div>
          </div>
        </div>
      )}


      {/* =============================================================
          SUB-TAB DIALECT: CRONOGRAMA GANTT (PERT/CPM)
          ============================================================= */}
      {activeSubTab === 'gantt' && (() => {
        // Calculate the bounding dates for the Gantt timeline
        let minD = parseDate('2026-06-01');
        let maxD = parseDate('2026-07-20');

        if (tasks.length > 0) {
          minD = parseDate(tasks[0].startDate || '');
          maxD = parseDate(tasks[0].endDate || '');

          tasks.forEach(t => {
            const s = parseDate(t.startDate || '');
            const e = parseDate(t.endDate || '');
            if (s.getTime() < minD.getTime()) minD = s;
            if (e.getTime() > maxD.getTime()) maxD = e;
          });
        }

        // Pad timeline days
        const minPadded = new Date(minD.getTime() - 3 * 24 * 3600 * 1000);
        const maxPadded = new Date(maxD.getTime() + 10 * 24 * 3600 * 1000);

        const timelineDates: Date[] = [];
        let curr = new Date(minPadded);
        while (curr <= maxPadded) {
          timelineDates.push(new Date(curr));
          curr.setDate(curr.getDate() + 1);
        }

        // Width of single day column depending on zoom scale
        const colWidth = ganttScale === 'day' ? 44 : ganttScale === 'week' ? 22 : 9;
        const minDateMs = minPadded.getTime();

        const getTaskCoords = (task: Task) => {
          const s = parseDate(task.startDate);
          const e = parseDate(task.endDate);

          const startOffsetDays = Math.round((s.getTime() - minDateMs) / (1000 * 3600 * 24));
          const durationDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)));

          const left = startOffsetDays * colWidth;
          const width = durationDays * colWidth;

          return { left, width };
        };

        // Compute SVG lines connection overlay
        const connections: { path: string; isCritical: boolean }[] = [];
        const taskRowMap = new Map(tasks.map((t, idx) => [t.id, { task: t, index: idx }]));

        dependencies.forEach(dep => {
          const fromObj = taskRowMap.get(dep.dependsOnTaskId);
          const toObj = taskRowMap.get(dep.taskId);

          if (fromObj && toObj) {
            const fromRow = fromObj.index;
            const toRow = toObj.index;

            const fromCoords = getTaskCoords(fromObj.task);
            const toCoords = getTaskCoords(toObj.task);

            const xStart = fromCoords.left + fromCoords.width;
            const yStart = fromRow * 48 + 24; // Row height is 48px

            const xEnd = toCoords.left;
            const yEnd = toRow * 48 + 24;

            const isCritical = !!(fromObj.task.isCritical && toObj.task.isCritical);

            // Path calculation for a beautiful horizontal S-curve
            const controlX1 = xStart + (xEnd - xStart) / 2;
            const controlY1 = yStart;
            const controlX2 = xStart + (xEnd - xStart) / 2;
            const controlY2 = yEnd;

            connections.push({
              path: `M ${xStart} ${yStart} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${xEnd} ${yEnd}`,
              isCritical
            });
          }
        });

        const handleAddMilestoneSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (newMilestoneName.trim() && newMilestoneDate) {
            const newM = {
              id: `cm-${Date.now()}`,
              name: newMilestoneName.trim(),
              date: newMilestoneDate
            };
            setCustomMilestones([...customMilestones, newM]);
            setNewMilestoneName('');
            setNewMilestoneDate('');
            setShowAddMilestone(false);
          }
        };

        const handleRemoveMilestone = (id: string) => {
          setCustomMilestones(customMilestones.filter(m => m.id !== id));
        };

        return (
          <div className="space-y-6 font-mono text-xs select-text">
            {/* Header controls pane */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black text-stone-500 dark:text-stone-400">Escala (Zoom):</span>
                <div className="flex bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded p-0.5">
                  {(['day', 'week', 'month'] as const).map(scale => (
                    <button
                      key={scale}
                      onClick={() => setGanttScale(scale)}
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                        ganttScale === scale
                          ? 'accent-bg text-white'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {scale === 'day' ? 'Diário' : scale === 'week' ? 'Semanal' : 'Consolidado'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportToPDF('gantt-chart-export-container', `Gantt_${activeProject.name.replace(/\s+/g, '_')}.pdf`, 'l')}
                  className="accent-bg hover:opacity-90 text-white font-extrabold uppercase py-1.5 px-3.5 rounded flex items-center gap-1.5 transition text-[10px] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Exportar Gantt PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(true)}
                  className="bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300 font-extrabold uppercase py-1.5 px-3.5 rounded flex items-center gap-1.5 transition text-[10px] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                  Novo Marco Datas-Chave
                </button>
              </div>
            </div>

            {/* Manual milestones list panel */}
            {customMilestones.length > 0 && (
              <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded p-3 flex flex-wrap gap-3 items-center">
                <span className="text-[9px] font-black uppercase text-red-600">Marcos Ativos:</span>
                {customMilestones.map(m => (
                  <div key={m.id} className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[10px] px-2.5 py-1 rounded flex items-center gap-2 text-stone-800 dark:text-stone-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    <strong>{m.name}</strong> ({m.date})
                    <button onClick={() => handleRemoveMilestone(m.id)} className="text-stone-500 hover:text-red-600 font-black pl-1 cursor-pointer">X</button>
                  </div>
                ))}
              </div>
            )}

            {/* Gantt Grid Panel */}
            <div id="gantt-chart-export-container" className="border border-stone-200 dark:border-stone-850 rounded-lg overflow-hidden flex flex-col md:flex-row bg-white dark:bg-stone-950">
              {/* Left Task Sheet List */}
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-850 flex flex-col shrink-0 select-text">
                <div className="bg-stone-50 dark:bg-stone-900 px-4 py-3 border-b border-stone-200 dark:border-stone-850 font-black tracking-wider uppercase text-stone-800 dark:text-stone-300 h-14 flex items-center">
                  Atividade / Cronograma
                </div>
                <div className="flex flex-col">
                  {tasks.map(t => (
                    <div key={t.id} className="h-12 border-b border-stone-200 dark:border-stone-850/60 px-4 flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-900/20 text-[11px]">
                      <div className="truncate pr-2 font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                        {t.isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-505 animate-pulse" />}
                        {t.isMilestone && <span className="text-orange-400 font-extrabold pr-0.5">◆</span>}
                        {t.name}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 shrink-0 text-right">
                        <span className={`${t.isCritical ? 'text-red-400 font-black' : ''}`}>{t.isCritical ? 'CRITICAL' : `${t.totalFloat}d margem`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Timeline Canvas */}
              <div className="w-full md:w-2/3 overflow-x-auto scrollbar-thin">
                <div className="relative" style={{ width: `${timelineDates.length * colWidth}px` }}>
                  {/* Timeline Header Dates */}
                  <div className="bg-stone-900 border-b border-stone-850 flex divide-x divide-stone-850/40 h-14">
                    {timelineDates.map((date, idx) => {
                      const dayStr = date.getDate();
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isFirstOfMonth = dayStr === 1;
                      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

                      return (
                        <div
                          key={idx}
                          className={`flex-shrink-0 text-center flex flex-col justify-center h-full ${
                            isWeekend ? 'bg-stone-900/80 text-stone-500' : 'text-stone-300'
                          }`}
                          style={{ width: `${colWidth}px` }}
                        >
                          {ganttScale === 'day' ? (
                            <>
                              <span className="text-[10px] font-black">{dayStr}</span>
                              <span className="text-[8px] uppercase tracking-tighter opacity-60">
                                {isFirstOfMonth ? monthName : date.toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                              </span>
                            </>
                          ) : (
                            <>
                              {dayStr % 3 === 0 && <span className="text-[9px] font-bold">{dayStr}</span>}
                              <span className="text-[7px] text-stone-600">{isFirstOfMonth ? monthName : ''}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Canvas Body Rows */}
                  <div className="relative flex flex-col divide-y divide-stone-850/20 py-0">
                    {/* SVG lines connection */}
                    <svg
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{ width: '100%', height: `${tasks.length * 48}px` }}
                    >
                      {connections.map((c, i) => (
                        <path
                          key={i}
                          d={c.path}
                          fill="none"
                          stroke={c.isCritical ? '#ef4444' : '#52525b'}
                          strokeWidth={c.isCritical ? 2.5 : 1.5}
                          strokeDasharray={c.isCritical ? undefined : '3,3'}
                          className={c.isCritical ? 'animate-pulse' : undefined}
                        />
                      ))}
                    </svg>

                    {/* Vertical Manual Milestone Lines */}
                    {customMilestones.map(line => {
                      const d = parseDate(line.date);
                      const offsetDays = Math.round((d.getTime() - minDateMs) / (1000 * 3600 * 24));
                      const left = offsetDays * colWidth;
                      if (left < 0) return null;
                      return (
                        <div
                          key={line.id}
                          className="absolute pointer-events-none z-20 border-l border-dashed border-orange-500/80 h-full flex flex-col"
                          style={{ left: `${left}px`, height: `${tasks.length * 48}px` }}
                        >
                          <span className="bg-orange-500 text-black font-mono font-black text-[7px] px-1 py-0.5 rounded uppercase rotate-90 transform origin-top-left translate-x-1 translate-y-8 select-none absolute z-30 whitespace-nowrap">
                            🚩 {line.name}
                          </span>
                        </div>
                      );
                    })}

                    {/* Task rows timeline */}
                    {tasks.map((t, rowIdx) => {
                      const { left, width } = getTaskCoords(t);
                      let barColor = 'bg-stone-700 border-stone-600';
                      if (t.status === 'completed' || t.status === 'done') barColor = 'bg-emerald-650 border-emerald-500';
                      else if (t.status === 'in_progress') barColor = 'bg-amber-500 border-amber-400';

                      const isCriticalStyle = t.isCritical ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-stone-950 animate-pulse shadow-lg shadow-red-500/20' : '';

                      return (
                        <div key={t.id} className="h-12 relative flex items-center hover:bg-stone-900/10 transition">
                          {t.isMilestone ? (
                            /* Render Milestone as Diamond Shape */
                            <div
                              onClick={() => handleOpenEditTask(t)}
                              className={`absolute cursor-pointer w-4 h-4 bg-orange-500 transform rotate-45 border-2 border-white hover:bg-orange-400 transition z-30 flex items-center justify-center ${isCriticalStyle}`}
                              style={{ left: `${left}px` }}
                              title={`${t.name} (Milestone)`}
                            />
                          ) : (
                            /* Render regular Task Bar */
                            <div
                              onClick={() => handleOpenEditTask(t)}
                              className={`absolute cursor-pointer rounded-md h-7 border flex items-center justify-between px-2 text-[9px] font-bold text-white transition z-20 truncate hover:scale-[1.01] ${barColor} ${isCriticalStyle}`}
                              style={{ left: `${left}px`, width: `${width}px` }}
                            >
                              <span className="truncate">{t.name}</span>
                              <span className="text-[8px] font-mono shrink-0 pl-1">{Math.round((width / colWidth))}d</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend Pane */}
            <div className="bg-stone-900 border border-stone-850 p-4 rounded-lg flex flex-wrap gap-6 justify-center">
              <div className="flex items-center gap-2">
                <span className="w-4 h-3 bg-stone-700 border border-stone-600 rounded" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-3 bg-amber-500 border border-amber-400 rounded" />
                <span>Em Execução</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-3 bg-emerald-600 border border-emerald-555 rounded" />
                <span>Concluída</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-3 bg-emerald-600 border border-emerald-500 ring-2 ring-red-500" />
                <span className="text-red-400 font-extrabold animate-pulse">Caminho Crítico (Folga = 0)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-orange-500 transform rotate-45 border border-white" />
                <span className="text-orange-400">Marco / Milestone</span>
              </div>
            </div>

            {/* Milestone config modal dialog overlay */}
            {showAddMilestone && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-stone-900 border border-stone-850 rounded p-5 w-full max-w-sm font-mono text-xs text-white">
                  <h3 className="text-sm font-black uppercase tracking-wider pb-2 border-b border-stone-800 mb-4 text-orange-400">
                    Cadastrar Marco Datas-Chave
                  </h3>
                  <form onSubmit={handleAddMilestoneSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-stone-400 block font-bold uppercase text-[9px]">Nome do Evento</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Data de Submissão de Docs"
                        value={newMilestoneName}
                        onChange={e => setNewMilestoneName(e.target.value)}
                        className="mach-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-stone-400 block font-bold uppercase text-[9px]">Data Limite</label>
                      <input
                        type="text"
                        required
                        placeholder="AAAA-MM-DD"
                        value={newMilestoneDate}
                        onChange={e => setNewMilestoneDate(e.target.value)}
                        className="mach-input font-bold text-white bg-black border border-stone-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                      <button
                        type="button"
                        onClick={() => setShowAddMilestone(false)}
                        className="bg-stone-950 border border-stone-800 hover:border-stone-700 px-3 py-1 px-4 py-2 rounded font-bold uppercase"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="mach-button-primary px-4 py-2 rounded text-white font-bold uppercase"
                      >
                        Confirmar Marco
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeSubTab === 'flow' && (() => {
        return (
          <div className="space-y-4 font-mono text-xs select-text">
            {/* CANVAS CONTROLS */}
            <div className="bg-stone-900 border border-stone-850 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">Preset do Canvas:</span>
                <select
                  value={canvasPreset}
                  onChange={(e) => changePreset(e.target.value as any)}
                  className="mach-input py-1 px-3 text-xs bg-white dark:bg-stone-955 font-bold border border-stone-250 dark:border-stone-800 text-stone-850 dark:text-stone-100 rounded cursor-pointer max-w-xs"
                >
                  <option value="precedence">Fluxograma de Precedência (Dinâmico)</option>
                  <option value="process">Fluxograma de Processo (Clássico)</option>
                  <option value="wbs">WBS Visual (EAP Árvore)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddFreeNode}
                  className="mach-button-primary py-1.5 px-4 rounded text-white font-extrabold uppercase shrink-0 text-[10px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Bloco Livre
                </button>
                <button
                  onClick={handleClearCanvas}
                  className="text-stone-500 hover:text-red-400 font-bold uppercase text-[10px] bg-stone-955 border border-stone-800 px-3 py-1.5 rounded hover:border-stone-750 transition flex items-center gap-1.5 cursor-pointer"
                >
                  Limpar Canvas
                </button>
              </div>
            </div>

            {/* React Flow Board Wrapper */}
            <div className="bg-stone-950 border border-stone-850 rounded-lg overflow-hidden relative" style={{ height: '560px' }}>
              <ReactFlow
                nodes={localNodes}
                edges={localEdges}
                onNodesChange={onNodesChangeHandler}
                onEdgesChange={onEdgesChange}
                onConnect={onConnectHandler}
                onNodeClick={(e, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
                onEdgeClick={(e, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
                onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
                className="font-mono text-xs"
              >
                <Background color="#333" gap={16} />
                <Controls className="bg-stone-900 border border-stone-800 rounded outline-none p-1" />
                <MiniMap 
                  nodeStrokeColor={(n) => n.data?.color || '#333'}
                  nodeColor={(n) => n.data?.color || '#111'}
                  maskColor="rgba(0, 0, 0, 0.7)"
                  className="bg-stone-900 border border-stone-800 rounded hidden md:block" 
                />
              </ReactFlow>

              {/* Float guide panel - repositioned to top-4 right-4 */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 backdrop-blur p-3 rounded text-[10px] text-stone-800 dark:text-stone-300 space-y-1.5 pointer-events-none z-10 font-bold shadow-sm">
                <div className="text-[10px] uppercase font-black tracking-wider text-red-650 dark:text-red-500 select-none text-center border-b border-stone-200 dark:border-stone-800 pb-1 mb-1">
                  Guia de Canvas
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1.5 bg-red-500 animate-pulse rounded" />
                  <span>Caminho Crítico (Tarefas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1.5 bg-zinc-500 rounded" />
                  <span>Caminhos Normais</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3 bg-stone-50 dark:bg-stone-950 border border-yellow-500/40 rounded" />
                  <span>Blocos Livres / Notas</span>
                </div>
              </div>

              {/* Quick Styling Panel */}
              {(selectedNodeId || selectedEdgeId) && (
                <div className="absolute bottom-4 left-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-4 rounded-lg shadow-xl z-20 text-[10px] space-y-3 font-mono max-w-sm pointer-events-auto shadow-stone-200/50 dark:shadow-black/50">
                  <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2 mb-2">
                    <span className="font-extrabold uppercase text-stone-900 dark:text-stone-100">
                      {selectedNodeId ? 'Estilizar Bloco' : 'Estilizar Conexão'}
                    </span>
                    <button 
                      onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
                      className="text-stone-450 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {selectedNodeId && (() => {
                    const nodeObj = localNodes.find(n => n.id === selectedNodeId);
                    if (!nodeObj) return null;
                    const isTask = nodeObj.data?.type === 'task';
                    const shape = nodeObj.data?.shape || 'rectangle';
                    const color = nodeObj.data?.color || '#3b82f6';
                    const label = nodeObj.data?.label || '';

                    return (
                      <div className="space-y-3.5 text-stone-700 dark:text-stone-300">
                        {!isTask && (
                          <div className="space-y-1">
                            <label className="mach-label text-stone-450">Texto do Bloco</label>
                            <input
                              type="text"
                              value={typeof label === 'string' ? label : ''}
                              onChange={(e) => updateSelectedNodeStyle({ label: e.target.value })}
                              className="mach-input w-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="mach-label text-stone-450">Formato Geométrico</label>
                          <div className="grid grid-cols-4 gap-1.5 text-center font-bold">
                            {[
                              { key: 'rectangle', label: 'Retâng.' },
                              { key: 'rounded-rectangle', label: 'Ondul.' },
                              { key: 'diamond', label: 'Losan.' },
                              { key: 'circle', label: 'Círc.' }
                            ].map(opt => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => updateSelectedNodeStyle({ shape: opt.key as any })}
                                className={`p-1 border rounded text-[8px] cursor-pointer transition-colors ${
                                  shape === opt.key 
                                    ? 'border-red-500 bg-red-500/10 text-stone-900 dark:text-stone-100' 
                                    : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="mach-label text-stone-450">Cor do Elemento</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: '#ef4444', label: 'Vermelho' },
                              { key: '#3b82f6', label: 'Azul' },
                              { key: '#10b981', label: 'Verde' },
                              { key: '#eab308', label: 'Amarelo' },
                              { key: '#06b6d4', label: 'Ciano' },
                              { key: '#a855f7', label: 'Roxo' },
                              { key: '#6b7280', label: 'Cinza' },
                              { key: '#f97316', label: 'Laranja' }
                            ].map(cOpt => (
                              <button
                                key={cOpt.key}
                                type="button"
                                onClick={() => updateSelectedNodeStyle({ color: cOpt.key })}
                                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                  color === cOpt.key ? 'border-stone-850 dark:border-stone-100 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: cOpt.key }}
                                title={cOpt.label}
                              />
                            ))}
                          </div>
                        </div>

                        {!isTask && (
                          <button
                            type="button"
                            onClick={deleteSelectedNode}
                            className="mach-button-primary bg-red-650 hover:bg-red-750 w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir Bloco
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {selectedEdgeId && (() => {
                    const edgeObj = localEdges.find(e => e.id === selectedEdgeId);
                    if (!edgeObj) return null;
                    const type = edgeObj.type || 'smoothstep';
                    const color = edgeObj.style?.stroke || '#52525b';
                    const dashed = !!edgeObj.style?.strokeDasharray;
                    const hasArrow = !!edgeObj.markerEnd;

                    return (
                      <div className="space-y-3.5 text-stone-750 dark:text-stone-300">
                        <div className="space-y-1">
                          <label className="mach-label text-stone-450">Tipo de Linha</label>
                          <div className="grid grid-cols-3 gap-1.5 text-center font-bold">
                            {[
                              { key: 'straight', label: 'Reta' },
                              { key: 'default', label: 'Curva' },
                              { key: 'smoothstep', label: 'Ortog.' }
                            ].map(opt => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => updateSelectedEdgeStyle({ type: opt.key })}
                                className={`p-1.5 border rounded text-[9px] cursor-pointer transition-colors ${
                                  type === opt.key 
                                    ? 'border-red-500 bg-red-500/10 text-stone-900 dark:text-stone-100' 
                                    : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="mach-label text-stone-450">Tracejado</label>
                            <button
                              type="button"
                              onClick={() => updateSelectedEdgeStyle({ dashed: !dashed })}
                              className={`p-1 border rounded text-[9px] cursor-pointer transition-colors w-full font-bold ${
                                dashed 
                                  ? 'border-red-500 bg-red-500/10 text-stone-900 dark:text-stone-100' 
                                  : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white'
                              }`}
                            >
                              {dashed ? 'Sim' : 'Não'}
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className="mach-label text-stone-450">Ponta com Seta</label>
                            <button
                              type="button"
                              onClick={() => updateSelectedEdgeStyle({ arrow: !hasArrow })}
                              className={`p-1 border rounded text-[9px] cursor-pointer transition-colors w-full font-bold ${
                                hasArrow 
                                  ? 'border-red-505 bg-red-500/10 text-stone-900 dark:text-stone-100' 
                                  : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white'
                              }`}
                            >
                              {hasArrow ? 'Sim' : 'Não'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="mach-label text-stone-450">Cor da Conexão</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: '#52525b', label: 'Padrão' },
                              { key: '#ef4444', label: 'Vermelho' },
                              { key: '#3b82f6', label: 'Azul' },
                              { key: '#10b981', label: 'Verde' },
                              { key: '#eab308', label: 'Amarelo' }
                            ].map(cOpt => (
                              <button
                                key={cOpt.key}
                                type="button"
                                onClick={() => updateSelectedEdgeStyle({ color: cOpt.key })}
                                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                  color === cOpt.key ? 'border-stone-850 dark:border-stone-100 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: cOpt.key }}
                                title={cOpt.label}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={deleteSelectedEdge}
                          className="mach-button-primary bg-red-650 hover:bg-red-750 w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir Conexão
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        );
      })()}


      {/* =============================================================
          MODAL DIALOG DIALECT: CREATE / EDIT WBS ITEM
          ============================================================= */}
      {showWbsForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-800 rounded w-full max-w-md p-6 relative font-mono select-text">
            <button
              onClick={() => setShowWbsForm(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-stone-800 mb-4">
              {editingWbsId ? 'Atualizar Item EAP / WBS' : 'Novo Item na Estrutura EAP'}
            </h3>

            <form onSubmit={saveWbsFormState} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="wbsCodeInput" className="text-stone-400 block font-bold uppercase tracking-wide">Código Identificador (WBS Code)</label>
                <input
                  id="wbsCodeInput"
                  type="text"
                  required
                  placeholder="ex. 1.1 ou 2.1.3"
                  value={wbsCodeInput}
                  onChange={e => setWbsCodeInput(e.target.value)}
                  className="mach-input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="wbsNameInput" className="text-stone-400 block font-bold uppercase tracking-wide">Título do Nó EDT</label>
                <input
                  id="wbsNameInput"
                  type="text"
                  required
                  placeholder="ex: Projeto do Chassi Monocoque"
                  value={wbsNameInput}
                  onChange={e => setWbsNameInput(e.target.value)}
                  className="mach-input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="wbsParentInput" className="text-stone-400 block font-bold uppercase tracking-wide">Filiado ao Nó de EAP Pai (Opcional)</label>
                <select
                  id="wbsParentInput"
                  value={wbsParentInput}
                  onChange={e => setWbsParentInput(e.target.value)}
                  className="mach-input font-mono"
                >
                  <option value="">-- Nenhum (Nível Raiz) --</option>
                  {wbsItems
                    .filter(w => w.id !== editingWbsId)
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="wbsDescInput" className="text-stone-400 block font-bold uppercase tracking-wide">Descrição / Entregas Físicas</label>
                <textarea
                  id="wbsDescInput"
                  placeholder="Defina as entregas físicas agregadas neste item..."
                  value={wbsDescInput}
                  onChange={e => setWbsDescInput(e.target.value)}
                  rows={3}
                  className="mach-input py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWbsForm(false)}
                  className="bg-stone-950 hover:bg-stone-850 px-4 py-2 rounded text-stone-300 font-bold uppercase tracking-wider text-[11px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="mach-button-primary px-4 py-2 rounded text-white font-bold uppercase tracking-wider text-[11px]"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =============================================================
          MODAL DIALOG DIALECT: CREATE / EDIT TASK FORM (5W2H & PERT)
          ============================================================= */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded w-full max-w-3xl p-6 relative font-mono text-xs select-text my-8">
            <button
              onClick={() => setShowTaskForm(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-stone-800 mb-4">
              {editingTaskId ? 'Editar Detalhes Físicos de Tarefa (5W2H)' : 'Cadastrar Nova Tarefa no Cronograma'}
            </h3>

            <form onSubmit={saveTaskFormState} className="space-y-6">
              <fieldset disabled={permissions?.canCommentOnly} className="space-y-6">
              {/* ROW 1: BASICS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="task-name-input" className="text-stone-400 block font-bold uppercase tracking-wide">Nome Principal / Atividade (WHAT)</label>
                  <input
                    id="task-name-input"
                    type="text"
                    required
                    placeholder="Quem/O quê deve ser realizado"
                    value={taskNameInput}
                    onChange={e => setTaskNameInput(e.target.value)}
                    className="mach-input font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="task-wbs-input" className="text-stone-400 block font-bold uppercase tracking-wide">Filiação na EAP (WBS Node)</label>
                  <select
                    id="task-wbs-input"
                    value={taskWbsInput}
                    onChange={e => setTaskWbsInput(e.target.value)}
                    className="mach-input"
                  >
                    <option value="">-- Sem vínculo (EAP Livre) --</option>
                    {wbsItems.map(w => (
                      <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RETAILER: 5W2H FIELDSETS */}
              <div className="border border-stone-800/80 rounded p-4 space-y-4 bg-stone-950/40">
                <div className="flex items-center gap-1 text-red-505 font-bold uppercase tracking-wider">
                  <Table className="w-4 h-4" /> PARÂMETROS DA METODOLOGIA 5W2H
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="task-why" className="text-stone-500 block font-bold uppercase tracking-wide">WHY (Propósito / Justificativa)</label>
                    <input
                      id="task-why"
                      type="text"
                      placeholder="Por que esta meta é considerada estratégica?"
                      value={taskWhy}
                      onChange={e => setTaskWhy(e.target.value)}
                      className="mach-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="task-where" className="text-stone-500 block font-bold uppercase tracking-wide">WHERE (Localização / Ambiente)</label>
                    <input
                      id="task-where"
                      type="text"
                      placeholder="ex: Plataforma CAD / Laboratório Mecânico"
                      value={taskWhere}
                      onChange={e => setTaskWhere(e.target.value)}
                      className="mach-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="task-owner" className="text-stone-500 block font-bold uppercase tracking-wide">WHO (Proprietário principal)</label>
                    <select
                      id="task-owner"
                      value={taskOwner}
                      onChange={e => setTaskOwner(e.target.value)}
                      className="mach-input font-bold text-white cursor-pointer"
                    >
                      <option value="">Selecione o Integrante</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="task-how" className="text-stone-500 block font-bold uppercase tracking-wide">HOW (Método de Execução)</label>
                    <input
                      id="task-how"
                      type="text"
                      placeholder="ex: Laminação manual seguindo o processo de vácuo"
                      value={taskHow}
                      onChange={e => setTaskHow(e.target.value)}
                      className="mach-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="task-start" className="text-stone-500 block font-bold uppercase tracking-wide">WHEN (Data de Início)</label>
                    <input
                      id="task-start"
                      type="text"
                      placeholder="AAAA-MM-DD"
                      value={taskStart}
                      onChange={e => setTaskStart(e.target.value)}
                      className="mach-input font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="task-end" className="text-stone-500 block font-bold uppercase tracking-wide">WHEN (Data Limite)</label>
                    <input
                      id="task-end"
                      type="text"
                      placeholder="AAAA-MM-DD"
                      value={taskEnd}
                      onChange={e => setTaskEnd(e.target.value)}
                      className="mach-input font-bold text-red-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="task-howmuch" className="text-stone-500 block font-bold uppercase tracking-wide">HOW MUCH (Custo Planejado R$)</label>
                    <input
                      id="task-howmuch"
                      type="number"
                      placeholder="R$"
                      value={taskHowMuch}
                      onChange={e => setTaskHowMuch(Number(e.target.value))}
                      className="mach-input text-yellow-500 font-extrabold"
                    />
                  </div>
                </div>
              </div>

              {/* RETAILER: PERT DURATION ESTIMATION */}
              <div className="border border-stone-850 rounded p-4 space-y-4 bg-stone-950/20">
                <div className="flex items-center gap-1.5 text-stone-200 font-bold uppercase tracking-wider select-none">
                  <Clock className="w-4 h-4 text-amber-505" /> ESTIMATIVA PERT (DURAÇÃO EM DIAS)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <label htmlFor="pert-opt" className="text-stone-500 block font-bold uppercase tracking-wide">Otimista (O)</label>
                    <input
                      id="pert-opt"
                      type="number"
                      min={1}
                      value={pertOpt}
                      onChange={e => setPertOpt(Math.max(1, Number(e.target.value)))}
                      className="mach-input text-center text-green-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="pert-likely" className="text-stone-500 block font-bold uppercase tracking-wide">Mais Provável (M)</label>
                    <input
                      id="pert-likely"
                      type="number"
                      min={1}
                      value={pertLikely}
                      onChange={e => setPertLikely(Math.max(1, Number(e.target.value)))}
                      className="mach-input text-center text-blue-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="pert-pess" className="text-stone-500 block font-bold uppercase tracking-wide">Pessimista (P)</label>
                    <input
                      id="pert-pess"
                      type="number"
                      min={1}
                      value={pertPess}
                      onChange={e => setPertPess(Math.max(1, Number(e.target.value)))}
                      className="mach-input text-center text-red-500 font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-850 rounded font-mono text-[11px] leading-relaxed select-text">
                  Duração Estipada de Cálculo PERT: <strong className="text-white">{( (pertOpt + 4 * pertLikely + pertPess) / 6 ).toFixed(1)} dias</strong>. 
                  (Esta média ponderada dá peso 4 ao termo provável para maior precisão contra atrasos).
                </div>
              </div>

              {/* ROW SUMMARY: TASK DIRECT STATE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="task-status" className="text-stone-400 block font-bold uppercase tracking-wide font-mono">Status da Atividade</label>
                  <select
                    id="task-status"
                    value={taskStatusInput}
                    onChange={e => setTaskStatusInput(e.target.value)}
                    className="mach-input font-bold"
                  >
                    <option value="todo">Pendente (Todo)</option>
                    <option value="in_progress">Em Execução</option>
                    <option value="done">Concluída</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="task-desc" className="text-stone-400 block font-bold uppercase tracking-wide">Descrição complementar</label>
                  <input
                    id="task-desc"
                    type="text"
                    placeholder="Considerações físicas do engenheiro"
                    value={taskDescInput}
                    onChange={e => setTaskDescInput(e.target.value)}
                    className="mach-input"
                  />
                </div>
              </div>

              {/* DEPENDENCY & MILESTONE FIELDS */}
              <div className="border border-stone-850 rounded p-4 space-y-4 bg-stone-950/40">
                <div className="flex items-center gap-1.5 text-stone-200 font-bold uppercase tracking-wider select-none">
                  <Sliders className="w-4 h-4 text-red-505" /> PRECEDÊNCIA & MARCOS RELACIONADOS
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="task-predecessor" className="text-stone-500 block font-bold uppercase tracking-wide">Tarefa Predecessora (Depende de)</label>
                    <select
                      id="task-predecessor"
                      value={taskPredecessor}
                      onChange={e => setTaskPredecessor(e.target.value)}
                      className="mach-input"
                    >
                      <option value="">-- Nenhuma (Início Livre) --</option>
                      {tasks
                        .filter(t => t.id !== editingTaskId) // Cannot depend on self
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.startDate} - {t.endDate})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6 pl-2">
                    <input
                      type="checkbox"
                      id="isMilestoneCheckbox"
                      checked={taskIsMilestone}
                      onChange={e => setTaskIsMilestone(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-850 bg-stone-950 text-red-550 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isMilestoneCheckbox" className="text-stone-500 dark:text-stone-300 font-bold uppercase tracking-wider text-[11px] cursor-pointer">
                      Esta Atividade é um marco / milestone?
                    </label>
                  </div>
                </div>
              </div>
              </fieldset>

              {/* COMENTÁRIO / FEEDBACK AUDITÁVEL */}
              <div className="space-y-1">
                <label htmlFor="task-comment" className="text-stone-850 dark:text-stone-300 block font-bold uppercase tracking-wider text-[10.5px] font-mono">Comentário ou Notas de Auditoria (Mentor / Coordenadores)</label>
                <textarea
                  id="task-comment"
                  placeholder="Seja construtivo: adicione observações, diretrizes ou orientações estratégicas de mentoria."
                  value={taskComment}
                  onChange={e => setTaskComment(e.target.value)}
                  className="mach-input w-full min-h-[80px] p-3 rounded bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 text-stone-900 dark:text-white font-mono text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
                <p className="text-[9.5px] text-stone-500 dark:text-stone-400 font-mono">Nota: Mentores e Sponsors possuem autonomia de ler e comentar em todos os entregáveis do cronograma car.</p>
              </div>

              {/* ACTION DIALOG BOUNDARIES */}
              <div className="pt-2 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="bg-stone-100 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-850 px-4 py-2.5 rounded text-stone-800 dark:text-stone-300 font-bold uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="mach-button-primary px-5 py-2.5 rounded text-white font-bold uppercase tracking-wider text-[11px]"
                >
                  Confirmar e Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  // -------------------------------------------------------------
  // HELPER SUB-RENDERERS & LOCAL ACTIONS
  // -------------------------------------------------------------
  function handleMoveAction(taskId: string, targetStatus: string) {
    const original = tasks.find(t => t.id === taskId);
    if (!original) return;
    if (!checkTaskPermission(original)) {
      alert('Acesso negado.');
      return;
    }
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: targetStatus };
      }
      return t;
    });
    mutateTasks(updated);
  }

  function handleEisQuickChange(taskId: string, direction: 'urgent' | 'important') {
    const original = tasks.find(t => t.id === taskId);
    if (!original) return;
    if (!checkTaskPermission(original)) {
      alert('Acesso negado.');
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        if (direction === 'urgent') {
          return { ...t, isUrgent: !t.isUrgent };
        } else {
          return { ...t, isImportant: !t.isImportant };
        }
      }
      return t;
    });
    mutateTasks(updated);
  }

  function dragsActiveBorder(task: Task): string {
    if (draggedTaskId === task.id) {
      return 'border-red-505 bg-red-950/10 shadow-lg';
    }
    return '';
  }

  function renderEisenhowerTaskContainer(isUrgent: boolean, isImportant: boolean) {
    const quadrantTasks = filteredTasks.filter(
      t => (t.isUrgent === isUrgent || (!t.isUrgent && !isUrgent)) && 
           (t.isImportant === isImportant || (!t.isImportant && !isImportant))
    );

    return (
      <div className="flex-grow space-y-2.5 overflow-y-auto max-h-72">
        {quadrantTasks.length === 0 ? (
          <div className="border border-dashed border-stone-850 p-6 rounded text-center text-[10px] text-stone-550 italic font-mono select-none">
            Arraste atividades aqui
          </div>
        ) : (
          quadrantTasks.map(task => {
            const isAllowed = checkTaskPermission(task);
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleTaskDragStart(e, task.id)}
                className={`p-3 bg-stone-950 border border-stone-850 hover:border-stone-700 rounded transition text-xs relative ${
                  dragsActiveBorder(task)
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[8px] font-mono font-bold text-stone-500 bg-stone-900 border border-stone-850 px-1 rounded">
                    {wbsCodeForId(task.wbsItemId)}
                  </span>
                  <div className="flex gap-1">
                    {/* Toggle Switch helper for easy mouse control */}
                    <button
                      onClick={() => handleEisQuickChange(task.id, 'urgent')}
                      className={`text-[8px] font-mono font-bold px-1 rounded uppercase ${
                        task.isUrgent ? 'bg-red-950 border border-red-800 text-red-400' : 'bg-stone-900 text-stone-600'
                      }`}
                      title="Alternar Urgência"
                    >
                      Urg
                    </button>
                    <button
                      onClick={() => handleEisQuickChange(task.id, 'important')}
                      className={`text-[8px] font-mono font-bold px-1 rounded uppercase ${
                        task.isImportant ? 'bg-orange-950 border border-orange-800 text-orange-400' : 'bg-stone-900 text-stone-600'
                      }`}
                      title="Alternar Importância"
                    >
                      Imp
                    </button>
                  </div>
                </div>

                <p className="font-extrabold text-stone-100 dark:text-white mt-1.5 uppercase leading-normal">
                  {task.name}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-t border-stone-900 mt-2 pt-2">
                  <span className="truncate max-w-[120px] font-semibold text-stone-300">
                    {userMap[task.whoOwnerId || ''] || 'Responsável Pendente'}
                  </span>
                  <span className="text-yellow-600 font-bold whitespace-nowrap">
                    R$ {task.howMuch || 0}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  function wbsCodeForId(id: string | null): string {
    if (!id) return 'EDT LIVRE';
    const found = wbsItems.find(w => w.id === id);
    return found ? found.code : 'EDT LIVRE';
  }

  // Recursive formatter rendering for clean expandable WBS items
  function renderNodeTree(node: WbsItem, depth: number) {
    const children = getSubWbsItems(node.id);
    const nodeTasks = getTasksForWbs(node.id);
    const isCollapsed = !!collapsedWbsNodes[node.id];
    const hasActiveChildren = children.length > 0 || nodeTasks.length > 0;

    const toggleCollapse = () => {
      setCollapsedWbsNodes(prev => ({
        ...prev,
        [node.id]: !prev[node.id]
      }));
    };

    return (
      <div 
        key={node.id} 
        draggable
        onDragStart={(e) => handleWbsDragStart(e, node.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleWbsDropOnNode(e, node.id)}
        style={{ marginLeft: `${depth * 20}px` }}
        className="space-y-1.5 border-l border-stone-200 dark:border-stone-800 pl-4 py-1.5 transition-all relative"
      >
        {/* Visual Line tree markers */}
        <div className="absolute top-0 left-0 w-3.5 h-1/2 border-b border-stone-200 dark:border-stone-800"></div>

        <div className="bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-850/80 rounded-lg p-3 hover:border-stone-300 dark:hover:border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3 select-text group">
          <div className="flex items-center gap-2 flex-grow">
            {hasActiveChildren ? (
              <button
                onClick={toggleCollapse}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-850 rounded text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white cursor-pointer"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-4 h-4 inline-block"></span>
            )}

            <span className="font-mono text-xs bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 px-2 py-0.5 rounded font-extrabold uppercase">
              {node.code}
            </span>

            <div className="flex flex-col">
              <span className="font-extrabold text-stone-900 dark:text-white text-[13px] uppercase tracking-wide">
                {node.name}
              </span>
              {node.description && (
                <span className="text-[10px] text-stone-600 dark:text-stone-500 font-sans leading-normal">
                  {node.description}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto uppercase font-mono text-[9px]">
            {/* Task Indicator counts */}
            {nodeTasks.length > 0 && (
              <span className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2.5 py-1 rounded text-stone-600 dark:text-stone-400 font-bold block">
                {nodeTasks.length} Atividades Fiscais
              </span>
            )}

            {/* ACTION TRIGGERS */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenAddTask(node.id)}
                className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-500 text-stone-800 dark:text-stone-300 hover:text-red-500 dark:hover:text-white px-2 py-1 rounded font-bold uppercase transition flex items-center gap-1 text-[9.5px] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Tarefa
              </button>

              {isAdminOrLead && (
                <>
                  <button
                    onClick={() => handleOpenAddWbs(node.id)}
                    title="Novo Subitem EDT/EAP"
                    className="p-1 bg-stone-100 dark:bg-stone-900 hover:bg-stone-250 dark:hover:bg-stone-800 rounded border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditWbs(node)}
                    title="Editar edt"
                    className="p-1 bg-stone-100 dark:bg-stone-900 hover:bg-stone-250 dark:hover:bg-stone-800 rounded border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteWbsItem(node.id)}
                    title="Deletar EDT"
                    className="p-1 bg-stone-100 dark:bg-stone-900 hover:bg-red-100 dark:hover:bg-red-950/40 rounded border border-stone-200 dark:border-stone-800 text-stone-550 dark:text-stone-500 hover:text-red-650 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RECURSIVE GROUP TRANSITIONS */}
        {!isCollapsed && (
          <div className="space-y-1.5 pt-1">
            {/* Tasks directly bound to this specific level of the architecture tree */}
            {nodeTasks.map(task => {
              const remain = getRemainingDaysText(task.endDate);
              const isAllowed = checkTaskPermission(task);
              return (
                <div
                  key={task.id}
                  style={{ marginLeft: '24px' }}
                  className="bg-stone-100/40 dark:bg-stone-950/40 hover:bg-stone-100/80 dark:hover:bg-stone-900 border border-stone-200 dark:border-stone-900 rounded-lg p-3 group/task flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs select-text relative transition"
                >
                  <div className="absolute top-0 left-0 w-3 h-1/2 border-b border-stone-850 dark:border-stone-800"></div>

                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-stone-500 mt-1.5 shrink-0"></span>
                    <div className="flex flex-col">
                      <p className="font-semibold text-stone-900 dark:text-white uppercase italic tracking-wide">
                        {task.name}
                      </p>
                      {task.why && (
                        <span className="text-[10.5px] text-stone-500 dark:text-stone-400 font-sans leading-normal">
                          Porquê: {task.why}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto text-[10px] font-mono leading-none">
                    <span className="text-stone-600 dark:text-stone-450 font-bold bg-stone-100 dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-850 select-none">
                      RESP: {userMap[task.whoOwnerId || ''] || 'Pendente'}
                    </span>

                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                      task.status === 'done' 
                        ? 'bg-green-100 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-500' 
                        : task.status === 'in_progress' 
                          ? 'bg-blue-100 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-500' 
                          : 'bg-orange-100 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400'
                    }`}>
                      {task.status === 'done' ? 'CONCLUÍDO' : task.status === 'in_progress' ? 'EXECUÇÃO' : 'PENDENTE'}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[8.5px] border ${
                      remain.state === 'overdue' 
                        ? 'bg-red-100 dark:bg-red-955 border-red-200 dark:border-red-800 text-red-700 dark:text-red-500' 
                        : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                    }`}>
                      {remain.text}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditTask(task)}
                        title="Editar Detalhes"
                        className="p-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 rounded font-bold uppercase text-stone-650 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAllowed && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          title="Deletar Atividade"
                          className="p-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-red-100 dark:hover:bg-red-950 rounded text-stone-650 dark:text-stone-500 hover:text-red-650 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Recursive sub Wbs children elements */}
            {children.map(childNode => renderNodeTree(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  }
}
