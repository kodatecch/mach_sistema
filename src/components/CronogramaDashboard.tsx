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
  Sliders
} from 'lucide-react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WbsItem, Task, Project, ProjectMember, User, TaskDependency } from '../types';

interface CronogramaDashboardProps {
  activeProject: Project;
  activeUser: User;
  memberships: ProjectMember[];
  users: User[];
  permissions?: any;
}

// -----------------------------------------------------------------
// LOCAL STORAGE IMMUTABLE RETRIEVER SIMULATOR
// Provides beautiful, fast, and authentic REST API queries & mutations
// -----------------------------------------------------------------
const getInitialWbs = (): WbsItem[] => [
  { id: 'wbs-chassis', projectId: 'proj_fsae_2026', parentId: null, code: '1.0', name: 'CHASSIS & ESTRUTURA', description: 'Nível macro da engenharia estrutural do bólido.' },
  { id: 'wbs-monocoque', projectId: 'proj_fsae_2026', parentId: 'wbs-chassis', code: '1.1', name: 'Monocoque de Fibra de Carbono', description: 'Laminação artesanal e cura secundária.' },
  { id: 'wbs-santoantonio', projectId: 'proj_fsae_2026', parentId: 'wbs-chassis', code: '1.2', name: 'Santo Antônio e Soldagem TIG', description: 'Estrutura tubular de proteção de aço cromo-molibdênio.' },
  { id: 'wbs-aero', projectId: 'proj_fsae_2026', parentId: null, code: '2.0', name: 'AERODINÂMICA & FLUIDODINÂMICA', description: 'Aprimoramentos de arrasto e coeficiente aerodinâmico.' },
  { id: 'wbs-cfd', projectId: 'proj_fsae_2026', parentId: 'wbs-aero', code: '2.1', name: 'Simulações CFD de Escoamento', description: 'Estudo de esteira aerodinâmica e geração de downforce.' },
  { id: 'wbs-drs', projectId: 'proj_fsae_2026', parentId: 'wbs-aero', code: '2.2', name: 'Asa Traseira com Flaps de DRS', description: 'Asa ativa pneumática com acionamento na reta.' }
];

const getInitialTasks = (): Task[] => [
  {
    id: 't-fea-santoantonio',
    projectId: 'proj_fsae_2026',
    wbsItemId: 'wbs-santoantonio',
    name: 'Cálculo FEA de Torção Estrutural',
    description: 'Avaliar resistências do Santo Antônio nas acelerações críticas regulamentares.',
    status: 'todo',
    startDate: '2026-06-05',
    endDate: '2026-06-20',
    what: 'Cálculo de Torção e Impacto FEA',
    why: 'Demonstrar conformidade obrigatória com as normas de pista do regulamento de Fórmula SAE.',
    where: 'Laboratório de Fluidos e Elementos Finitos',
    whenDate: '2026-06-20',
    whoOwnerId: 'user_pedro',
    how: 'Computação em malha poliédrica com modelo elasto-plástico no Ansys Workbench.',
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
    name: 'Usinagem CNC da Espuma de Poliuretano',
    description: 'Modelo macho em espessura nominal para laminação de fibra de carbono em autoclave.',
    status: 'in_progress',
    startDate: '2026-06-10',
    endDate: '2026-06-28',
    what: 'Modelo macho moldado do monocoque',
    why: 'Criar a fôrma primária do cockpit essencial ao encaixe do piloto.',
    where: 'Oficina do Patrocinador Metalúrgico',
    whenDate: '2026-06-28',
    whoOwnerId: 'user_ana',
    how: 'Fresa CNC de 5 eixos seguindo modelo do CAD exportado.',
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
    name: 'Ensaios Destrutivos de Tração da Fibra',
    description: 'Verificação empírica de corpos de prova curados sob vácuo.',
    status: 'done',
    startDate: '2026-06-01',
    endDate: '2026-06-08',
    what: 'Ensaios de tração e flexão de 5 corpos de prova',
    why: 'Alimentar o software FEA com dados reais de rigidez mecânica compósita.',
    where: 'Prensa Hidráulica do Departamento de Materiais',
    whenDate: '2026-06-08',
    whoOwnerId: 'user_bruno',
    how: 'Carga de transição contínua com extensômetro óptico acoplado.',
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
    name: 'Detalhamento do Acionador Pneumático do DRS',
    description: 'Projeto físico do pistão sob a carcaça do aerofólio.',
    status: 'todo',
    startDate: '25/06/2026',
    endDate: '2026-07-05',
    what: 'Sistema de transmissão mecânica DRS',
    why: 'Minimizar arrasto aerodinâmico em mais de 25% nas retas principais de teste.',
    where: 'Prédio da Oficina Mecânica Acadêmica',
    whenDate: '2026-07-05',
    whoOwnerId: 'user_ana',
    how: 'Montagem de rolamentos autolubrificantes e válvula magnética de CO2.',
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
          <div className={`p-3 rounded border text-left flex flex-col gap-1 w-52 bg-stone-950 text-white shadow-xl ${t.isCritical ? 'border-red-505 shadow-red-500/10 animate-pulse' : 'border-stone-850'}`}>
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
            <div className="font-extrabold text-[11px] truncate leading-tight mt-1 text-white">{t.name}</div>
            <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
              📅 {t.startDate} até {t.endDate}
            </div>
            {t.totalFloat !== undefined && (
              <div className="text-[9px] text-stone-500 mt-1 font-mono flex justify-between">
                <span>Slack: <strong className={t.totalFloat === 0 ? "text-red-400" : "text-stone-400"}>{t.totalFloat} d</strong></span>
                {t.isMilestone && <span className="text-[9px] text-orange-400 font-extrabold">◆ MARCO</span>}
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

export default function CronogramaDashboard({ activeProject, activeUser, memberships, users, permissions }: CronogramaDashboardProps) {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'wbs' | '5w2h' | 'kanban' | 'eisenhower' | 'gantt' | 'flow'>('wbs');
  
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
          { id: 'ann-1', text: 'Revisão crítica de conformidade com regulamento FSAE Artigo 4.', position: { x: 50, y: 350 } },
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
          <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-1">
            Planejamento estruturado por WBS/EAP, Matriz 5W2H e Fluxogramas Operacionais
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* USER AUTONOMY CARD */}
          <div className="bg-stone-900 border border-stone-800 text-[11px] font-mono rounded px-3 py-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-stone-400">Direitos de Acesso:</span>
            <span className="text-white font-extrabold uppercase">
              {currentUserRole === 'admin' && 'Administrador (Admin)'}
              {currentUserRole === 'area_lead' && 'Líder Técnico (Lead)'}
              {currentUserRole === 'member' && 'Membro do Projeto (Member)'}
              {currentUserRole === 'mentor' && 'Mentor'}
              {currentUserRole === 'sponsor' && 'Sponsor'}
            </span>
          </div>

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
        <button
          onClick={() => setActiveSubTab('wbs')}
          className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'wbs' 
              ? 'border-red-505 text-white bg-stone-900/40' 
              : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-900/20'
          }`}
        >
          <GitBranch className="w-4 h-4 text-stone-400" />
          Árvore EAP / WBS
        </button>

        <button
          onClick={() => setActiveSubTab('5w2h')}
          className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeSubTab === '5w2h' 
              ? 'border-red-505 text-white bg-stone-900/40' 
              : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-900/20'
          }`}
        >
          <Table className="w-4 h-4 text-stone-400" />
          Planilha 5W2H Inline
        </button>

        <button
          onClick={() => setActiveSubTab('kanban')}
          className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'kanban' 
              ? 'border-red-505 text-white bg-stone-900/40' 
              : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-900/20'
          }`}
        >
          <Kanban className="w-4 h-4 text-stone-400" />
          Quadro Kanban
        </button>

        <button
          onClick={() => setActiveSubTab('eisenhower')}
          className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'eisenhower' 
              ? 'border-red-505 text-white bg-stone-900/40' 
              : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-900/20'
          }`}
        >
          <Grid className="w-4 h-4 text-stone-400" />
          Priorização Eisenhower
        </button>

        <button
          onClick={() => setActiveSubTab('gantt')}
          className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'gantt' 
              ? 'border-red-505 text-white bg-stone-900/40' 
              : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-900/20'
          }`}
        >
          <Layers className="w-4 h-4 text-stone-400 animate-pulse" />
          Cronograma Gantt (PERT/CPM)
        </button>

        <button
          onClick={() => setActiveSubTab('flow')}
          className={`px-4 py-3 text-xs font-mono font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'flow' 
              ? 'border-red-505 text-white bg-stone-900/40' 
              : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-900/20'
          }`}
        >
          <Workflow className="w-4 h-4 text-stone-400" />
          Fluxograma de Precedência
        </button>
      </div>

      {/* FILTER CONTROL PANEL BAR */}
      {(activeSubTab === '5w2h' || activeSubTab === 'kanban' || activeSubTab === 'eisenhower') && (
        <div className="bg-stone-900 border border-stone-850 p-4 rounded flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-mono uppercase font-black text-stone-400">Filtrar Ativos:</span>
            
            <div className="flex flex-col">
              <select
                value={filterOwner}
                onChange={e => setFilterOwner(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-xs font-mono px-3 py-1.5 rounded text-white"
              >
                <option value="">-- Todos os Proprietários --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-xs font-mono px-3 py-1.5 rounded text-white"
              >
                <option value="">-- Todos Status --</option>
                <option value="todo">Pendente (Todo)</option>
                <option value="in_progress">Em Execução</option>
                <option value="done">Concluído</option>
              </select>
            </div>

            <div className="flex flex-col">
              <select
                value={filterUrgency}
                onChange={e => setFilterUrgency(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-xs font-mono px-3 py-1.5 rounded text-white"
              >
                <option value="">-- Nível de Criticidade --</option>
                <option value="critical">Alto (Urgente & Importante)</option>
                <option value="urgent">Apenas Urgente</option>
                <option value="important">Apenas Importante</option>
                <option value="normal">Baixo / Normal</option>
              </select>
            </div>
          </div>

          {(filterOwner || filterStatus || filterUrgency) && (
            <button
              onClick={() => { setFilterOwner(''); setFilterStatus(''); setFilterUrgency(''); }}
              className="text-stone-400 hover:text-white font-mono text-[11px] underline"
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
            {rootWbsItems.length === 0 ? (
              <div className="text-center py-20 text-stone-500 font-mono text-xs">
                Nenhum item EAP raiz registrado. Clique em "Novo Item Raiz" para modelar a árvore.
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
          <div className="bg-stone-900 border border-stone-850 rounded overflow-hidden select-text">
          <div className="p-4 bg-stone-900 border-b border-stone-850 flex items-center gap-2">
            <Table className="w-4 h-4 text-red-550" />
            <h3 className="text-xs font-black font-mono uppercase text-white tracking-widest">Planilha Dinâmica de 5W2H</h3>
            <span className="text-[10px] font-mono text-stone-500 ml-auto uppercase bg-stone-950 px-2 py-0.5 rounded border border-stone-850">
              Autosalvamento em tempo real (OnBlur)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-stone-300 min-w-[1200px]">
              <thead className="bg-[#121212] border-b border-stone-850 text-stone-400 font-black uppercase text-[10px] tracking-wider">
                <tr>
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
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-stone-500 font-mono text-xs">
                      Nenhuma tarefa encontrada nos filtros ativos.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const isAllowed = checkTaskPermission(task);
                    return (
                      <tr key={task.id} className="hover:bg-stone-850/40 group transition">
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
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-950 text-white focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
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
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
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
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                          />
                        </td>

                        {/* WHO */}
                        <td className="p-1 text-center">
                          <select
                            defaultValue={task.whoOwnerId || ''}
                            disabled={!isAllowed}
                            onChange={(e) => handleInlineChange(task.id, 'whoOwnerId', e.target.value)}
                            className="w-full bg-transparent p-1.5 text-xs rounded border-transparent hover:border-stone-800 focus:bg-stone-950 text-stone-200 focus:outline-none disabled:opacity-50 cursor-pointer"
                          >
                            <option value="" className="bg-stone-900 text-stone-400">Pendente</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id} className="bg-stone-900 text-white">
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
                            className="w-full bg-transparent p-2 text-xs rounded focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-red-500 text-center disabled:opacity-50"
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
                            className="w-full bg-transparent p-2 text-xs rounded focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-red-500 text-center disabled:opacity-50"
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
                            className="w-full bg-transparent p-2 text-xs truncate rounded focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                          />
                        </td>

                        {/* HOW MUCH */}
                        <td className="p-1">
                          <input
                            type="number"
                            defaultValue={task.howMuch || 0}
                            disabled={!isAllowed}
                            onBlur={(e) => handleInlineChange(task.id, 'howMuch', isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))}
                            className="w-full bg-transparent p-2 text-xs text-right rounded focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-red-500 text-yellow-500 font-extrabold disabled:opacity-50"
                          />
                        </td>

                        {/* ACTION ROW */}
                        <td className="p-1 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              title="Editar Detalhes / PERT"
                              className="p-1 bg-stone-950 hover:bg-stone-850 hover:text-white rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isAllowed && (
                              <button
                                onClick={() => deleteTask(task.id)}
                                title="Deletar Tarefa"
                                className="p-1 bg-stone-950 hover:bg-red-950 text-stone-400 hover:text-red-500 rounded"
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
                          <div className="flex justify-end gap-1.5 pt-1.5 mt-1 hover:opacity-100 opacity-20 transition border-t border-stone-900/10">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              className="text-[9px] font-mono bg-stone-900 text-stone-400 hover:text-white px-2 py-0.5 rounded"
                            >
                              EDITAR
                            </button>
                            {isAllowed && colStatus !== 'todo' && (
                              <button
                                onClick={() => handleMoveAction(task.id, 'todo')}
                                className="text-[8px] font-mono uppercase bg-stone-900 text-stone-500 hover:text-white px-1.5 py-0.5 rounded"
                              >
                                Todo
                              </button>
                            )}
                            {isAllowed && colStatus !== 'in_progress' && (
                              <button
                                onClick={() => handleMoveAction(task.id, 'in_progress')}
                                className="text-[8px] font-mono uppercase bg-stone-900 text-stone-500 hover:text-white px-1.5 py-0.5 rounded"
                              >
                                Run
                              </button>
                            )}
                            {isAllowed && colStatus !== 'done' && (
                              <button
                                onClick={() => handleMoveAction(task.id, 'done')}
                                className="text-[8px] font-mono uppercase bg-stone-900 text-stone-500 hover:text-white px-1.5 py-0.5 rounded"
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
              <div className="flex items-center gap-2 border-b border-stone-850 pb-3 mb-4">
                <span className="text-xs bg-red-950 border border-red-800 text-red-550 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q1 • URGENTE & IMPORTANTE
                </span>
                <span className="text-[10px] font-mono text-stone-400">AGIR (Foco Crítico Imediato)</span>
              </div>
              {renderEisenhowerTaskContainer(true, true)}
            </div>

            {/* QUADRANT 2: NÃO URGENTE + IMPORTANTE */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleEisenhowerDrop(e, { isUrgent: false, isImportant: true })}
              className="bg-stone-900 border border-stone-850 rounded-lg p-5 flex flex-col min-h-[300px] border-l-4 border-l-orange-400 transition-all hover:bg-stone-900/60"
            >
              <div className="flex items-center gap-2 border-b border-stone-850 pb-3 mb-4">
                <span className="text-xs bg-orange-950 border border-orange-850 text-orange-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q2 • IMPORTANTE (NÃO URGENTE)
                </span>
                <span className="text-[10px] font-mono text-stone-400">REGRAR (Planejar e Modelar)</span>
              </div>
              {renderEisenhowerTaskContainer(false, true)}
            </div>

            {/* QUADRANT 3: URGENTE + NÃO IMPORTANTE */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleEisenhowerDrop(e, { isUrgent: true, isImportant: false })}
              className="bg-stone-900 border border-stone-850 rounded-lg p-5 flex flex-col min-h-[300px] border-l-4 border-l-yellow-500 transition-all hover:bg-stone-900/60"
            >
              <div className="flex items-center gap-2 border-b border-stone-850 pb-3 mb-4">
                <span className="text-xs bg-yellow-950 border border-yellow-800 text-yellow-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q3 • URGENTE (NÃO IMPORTANTE)
                </span>
                <span className="text-[10px] font-mono text-stone-400">DELEGAR (Agilizar ou Filtrar)</span>
              </div>
              {renderEisenhowerTaskContainer(true, false)}
            </div>

            {/* QUADRANT 4: NÃO URGENTE + NÃO IMPORTANTE */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleEisenhowerDrop(e, { isUrgent: false, isImportant: false })}
              className="bg-stone-900 border border-stone-850 rounded-lg p-5 flex flex-col min-h-[300px] border-l-4 border-l-stone-600 transition-all hover:bg-stone-900/60"
            >
              <div className="flex items-center gap-2 border-b border-stone-850 pb-3 mb-4">
                <span className="text-xs bg-stone-950 border border-stone-800 text-stone-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Q4 • NÃO URGENTE & NÃO IMPORTANTE
                </span>
                <span className="text-[10px] font-mono text-stone-500">ELIMINAR (Deixar para depois)</span>
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
            <div className="bg-stone-900 border border-stone-850 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black text-stone-400">Escala (Zoom):</span>
                <div className="flex bg-stone-950 border border-stone-880 rounded p-0.5">
                  {(['day', 'week', 'month'] as const).map(scale => (
                    <button
                      key={scale}
                      onClick={() => setGanttScale(scale)}
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase transition ${
                        ganttScale === scale
                          ? 'bg-red-505 text-white'
                          : 'text-stone-400 hover:text-white'
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
                  onClick={() => setShowAddMilestone(true)}
                  className="bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 font-extrabold uppercase py-1.5 px-3.5 rounded flex items-center gap-1.5 transition text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5 text-red-505" />
                  Novo Marco Datas-Chave
                </button>
              </div>
            </div>

            {/* Manual milestones list panel */}
            {customMilestones.length > 0 && (
              <div className="bg-stone-950 border border-stone-850 rounded p-3 flex flex-wrap gap-3 items-center">
                <span className="text-[9px] font-black uppercase text-red-505">Marcos Ativos:</span>
                {customMilestones.map(m => (
                  <div key={m.id} className="bg-stone-900 border border-stone-800 text-[10px] px-2.5 py-1 rounded flex items-center gap-2 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    <strong>{m.name}</strong> ({m.date})
                    <button onClick={() => handleRemoveMilestone(m.id)} className="text-stone-500 hover:text-red-400 font-black pl-1">X</button>
                  </div>
                ))}
              </div>
            )}

            {/* Gantt Grid Panel */}
            <div className="border border-stone-850 rounded-lg overflow-hidden flex flex-col md:flex-row bg-stone-950">
              {/* Left Task Sheet List */}
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-stone-850 flex flex-col shrink-0 select-text">
                <div className="bg-stone-900 px-4 py-3 border-b border-stone-850 font-black tracking-wider uppercase text-stone-300 h-14 flex items-center">
                  Atividade / Cronograma
                </div>
                <div className="flex flex-col">
                  {tasks.map(t => (
                    <div key={t.id} className="h-12 border-b border-stone-850/60 px-4 flex items-center justify-between hover:bg-stone-900/20 text-[11px]">
                      <div className="truncate pr-2 font-bold text-stone-100 flex items-center gap-1.5">
                        {t.isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-505 animate-pulse" />}
                        {t.isMilestone && <span className="text-orange-400 font-extrabold pr-0.5">◆</span>}
                        {t.name}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 shrink-0 text-right">
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

      {/* =============================================================
          SUB-TAB DIALECT: PRECEDENCE FLOWCHART (REACTFLOW)
          ============================================================= */}
      {activeSubTab === 'flow' && (() => {
        // Compute elements dynamically
        const { nodes, edges } = getFlowElements(tasks, dependencies, annotations);

        const handleAddAnnotation = (e: React.FormEvent) => {
          e.preventDefault();
          if (newAnnotationText.trim()) {
            const newAnn = {
              id: `ann-${Date.now()}`,
              text: newAnnotationText.trim(),
              position: { x: 100, y: 350 }
            };
            mutateAnnotations([...annotations, newAnn]);
            setNewAnnotationText('');
          }
        };

        const handleClearAnnotations = () => {
          if (confirm('Deseja limpar todas as anotações do diagrama?')) {
            mutateAnnotations([]);
          }
        };

        return (
          <div className="space-y-4 font-mono text-xs select-text">
            {/* Annotation controls pane */}
            <div className="bg-stone-900 border border-stone-850 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
              <form onSubmit={handleAddAnnotation} className="flex items-center gap-2 flex-grow max-w-lg">
                <input
                  type="text"
                  required
                  placeholder="Inserir anotação livre ou indicador de decisão..."
                  value={newAnnotationText}
                  onChange={e => setNewAnnotationText(e.target.value)}
                  className="bg-stone-950 border border-stone-800 hover:border-stone-750 focus:border-red-505 text-xs px-3 py-1.5 rounded text-white placeholder-stone-600 outline-none flex-grow"
                />
                <button
                  type="submit"
                  className="mach-button-primary py-1.5 px-4 rounded text-white font-extrabold uppercase shrink-0 text-[10px]"
                >
                  Criar Nota
                </button>
              </form>

              {annotations.length > 0 && (
                <button
                  onClick={handleClearAnnotations}
                  className="text-stone-500 hover:text-red-400 font-bold uppercase text-[10px] bg-stone-950 border border-stone-800 px-3 py-1.5 rounded hover:border-stone-750 transition"
                >
                  Limpar Notas
                </button>
              )}
            </div>

            {/* React Flow Board Wrapper */}
            <div className="bg-stone-950 border border-stone-850 rounded-lg overflow-hidden relative" style={{ height: '560px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
                className="font-mono text-xs"
              >
                <Background color="#333" gap={16} />
                <Controls className="bg-stone-900 border border-stone-800 text-white rounded outline-none p-1 fill-white [&_button]:bg-stone-950 [&_button]:border-stone-800" />
                <MiniMap 
                  nodeStrokeColor={(n) => n.id.startsWith('ann') ? '#eab308' : '#333'}
                  nodeColor={(n) => n.id.startsWith('ann') ? '#eab308' : '#111'}
                  maskColor="rgba(0, 0, 0, 0.7)"
                  className="bg-stone-900 border border-stone-800 rounded hidden md:block" 
                />
              </ReactFlow>

              {/* Float guide panel */}
              <div className="absolute bottom-4 right-4 bg-stone-900/90 border border-stone-800 backdrop-blur p-3 rounded text-[10px] text-stone-300 space-y-1.5 pointer-events-none z-10 font-bold">
                <div className="text-[10px] uppercase font-black tracking-wider text-red-505 select-none text-center border-b border-stone-800 pb-1 mb-1">
                  Guia de Fluxograma
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1.5 bg-red-500 animate-pulse rounded" />
                  <span>Caminho Crítico (Animação ativa)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1.5 bg-zinc-650 rounded" />
                  <span>Precedências Normais (Sem folga zero)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3 bg-stone-900 border border-yellow-500/40 rounded" />
                  <span>Anotação de Engenharia Colada</span>
                </div>
              </div>
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
                <label className="text-stone-400 block font-bold uppercase tracking-wide">Código Identificador (WBS Code)</label>
                <input
                  type="text"
                  required
                  placeholder="ex. 1.1 ou 2.1.3"
                  value={wbsCodeInput}
                  onChange={e => setWbsCodeInput(e.target.value)}
                  className="mach-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 block font-bold uppercase tracking-wide">Título do Nó EDT</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Projeto do Chassi Monocoque"
                  value={wbsNameInput}
                  onChange={e => setWbsNameInput(e.target.value)}
                  className="mach-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 block font-bold uppercase tracking-wide">Filiado ao Nó de EAP Pai (Opcional)</label>
                <select
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
                <label className="text-stone-400 block font-bold uppercase tracking-wide">Descrição / Entregas Físicas</label>
                <textarea
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
                  <label className="text-stone-400 block font-bold uppercase tracking-wide">Nome Principal / Atividade (WHAT)</label>
                  <input
                    type="text"
                    required
                    placeholder="Quem/O quê deve ser realizado"
                    value={taskNameInput}
                    onChange={e => setTaskNameInput(e.target.value)}
                    className="mach-input font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-400 block font-bold uppercase tracking-wide">Filiação na EAP (WBS Node)</label>
                  <select
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
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">WHY (Propósito / Justificativa)</label>
                    <input
                      type="text"
                      placeholder="Por que esta meta é considerada estratégica?"
                      value={taskWhy}
                      onChange={e => setTaskWhy(e.target.value)}
                      className="mach-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">WHERE (Localização / Ambiente)</label>
                    <input
                      type="text"
                      placeholder="ex: Plataforma CAD / Laboratório Mecânico"
                      value={taskWhere}
                      onChange={e => setTaskWhere(e.target.value)}
                      className="mach-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">WHO (Proprietário principal)</label>
                    <select
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
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">HOW (Método de Execução)</label>
                    <input
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
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">WHEN (Data de Início)</label>
                    <input
                      type="text"
                      placeholder="AAAA-MM-DD"
                      value={taskStart}
                      onChange={e => setTaskStart(e.target.value)}
                      className="mach-input font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">WHEN (Data Limite)</label>
                    <input
                      type="text"
                      placeholder="AAAA-MM-DD"
                      value={taskEnd}
                      onChange={e => setTaskEnd(e.target.value)}
                      className="mach-input font-bold text-red-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">HOW MUCH (Custo Planejado R$)</label>
                    <input
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
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">Otimista (O)</label>
                    <input
                      type="number"
                      min={1}
                      value={pertOpt}
                      onChange={e => setPertOpt(Math.max(1, Number(e.target.value)))}
                      className="mach-input text-center text-green-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">Mais Provável (M)</label>
                    <input
                      type="number"
                      min={1}
                      value={pertLikely}
                      onChange={e => setPertLikely(Math.max(1, Number(e.target.value)))}
                      className="mach-input text-center text-blue-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">Pessimista (P)</label>
                    <input
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
                  <label className="text-stone-400 block font-bold uppercase tracking-wide font-mono">Status da Atividade</label>
                  <select
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
                  <label className="text-stone-400 block font-bold uppercase tracking-wide">Descrição complementar</label>
                  <input
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
                    <label className="text-stone-500 block font-bold uppercase tracking-wide">Tarefa Predecessora (Depende de)</label>
                    <select
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
                      className="w-4 h-4 rounded border-stone-850 bg-stone-950 text-red-505 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isMilestoneCheckbox" className="text-stone-300 font-bold uppercase tracking-wider text-[11px] cursor-pointer">
                      Esta Atividade é um marco / milestone?
                    </label>
                  </div>
                </div>
              </div>
              </fieldset>

              {/* COMENTÁRIO / FEEDBACK AUDITÁVEL */}
              <div className="space-y-1">
                <label className="text-stone-300 block font-bold uppercase tracking-wider text-[10.5px] font-mono">Comentário ou Notas de Auditoria (Mentor / Coordenadores)</label>
                <textarea
                  placeholder="Seja construtivo: adicione observações, diretrizes ou orientações estratégicas de mentoria."
                  value={taskComment}
                  onChange={e => setTaskComment(e.target.value)}
                  className="mach-input w-full min-h-[80px] p-3 rounded bg-stone-950 border border-stone-850 text-white font-mono text-xs focus:border-red-505 focus:outline-none focus:ring-1 focus:ring-red-505/50"
                />
                <p className="text-[9.5px] text-stone-500 font-mono">Nota: Mentores e Sponsors possuem autonomia de ler e comentar em todos os entregáveis do cronograma car.</p>
              </div>

              {/* ACTION DIALOG BOUNDARIES */}
              <div className="pt-2 flex justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="bg-stone-950 hover:bg-stone-850 px-4 py-2.5 rounded text-stone-300 font-bold uppercase tracking-wider text-[11px]"
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

                <p className="font-extrabold text-white mt-1.5 uppercase leading-normal">
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
        className="space-y-1.5 border-l border-stone-800 pl-4 py-1.5 transition-all relative"
      >
        {/* Visual Line tree markers */}
        <div className="absolute top-0 left-0 w-3.5 h-1/2 border-b border-stone-800"></div>

        <div className="bg-stone-950 border border-stone-850/80 rounded-lg p-3 hover:border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3 select-text group">
          <div className="flex items-center gap-2 flex-grow">
            {hasActiveChildren ? (
              <button
                onClick={toggleCollapse}
                className="p-1 hover:bg-stone-850 rounded text-stone-400 group-hover:text-white"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-4 h-4 inline-block"></span>
            )}

            <span className="font-mono text-xs bg-red-950/40 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-extrabold uppercase">
              {node.code}
            </span>

            <div className="flex flex-col">
              <span className="font-extrabold text-white text-[13px] uppercase tracking-wide">
                {node.name}
              </span>
              {node.description && (
                <span className="text-[10px] text-stone-500 font-sans leading-normal">
                  {node.description}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto uppercase font-mono text-[9px]">
            {/* Task Indicator counts */}
            {nodeTasks.length > 0 && (
              <span className="bg-stone-900 border border-stone-800 px-2.5 py-1 rounded text-stone-450 font-bold block">
                {nodeTasks.length} Atividades Fiscais
              </span>
            )}

            {/* ACTION TRIGGERS */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenAddTask(node.id)}
                className="bg-stone-900 border border-stone-800 hover:border-red-500 text-stone-300 hover:text-white px-2 py-1 rounded font-bold uppercase transition flex items-center gap-1 text-[9.5px]"
              >
                <Plus className="w-3.5 h-3.5" /> + Tarefa
              </button>

              {isAdminOrLead && (
                <>
                  <button
                    onClick={() => handleOpenAddWbs(node.id)}
                    title="Novo Subitem EDT/EAP"
                    className="p-1 bg-stone-900 hover:bg-stone-800 rounded border border-stone-800"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                  <button
                    onClick={() => handleOpenEditWbs(node)}
                    title="Editar edt"
                    className="p-1 bg-stone-900 hover:bg-stone-800 rounded border border-stone-800"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                  <button
                    onClick={() => deleteWbsItem(node.id)}
                    title="Deletar EDT"
                    className="p-1 bg-stone-900 hover:bg-red-950 text-stone-550 hover:text-red-500 rounded border border-stone-800"
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
                  className="bg-stone-950/40 hover:bg-stone-900 border border-stone-900 rounded-lg p-3 group/task flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs select-text relative transition"
                >
                  <div className="absolute top-0 left-0 w-3 h-1/2 border-b border-stone-800"></div>

                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-stone-600 mt-1.5 shrink-0"></span>
                    <div className="flex flex-col">
                      <p className="font-semibold text-white uppercase italic tracking-wide">
                        {task.name}
                      </p>
                      {task.why && (
                        <span className="text-[10.5px] text-stone-400 font-sans leading-normal">
                          Porquê: {task.why}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto text-[10px] font-mono leading-none">
                    <span className="text-stone-500 font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-850 select-none">
                      RESP: {userMap[task.whoOwnerId || ''] || 'Pendente'}
                    </span>

                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                      task.status === 'done' 
                        ? 'bg-green-950/20 border-green-800 text-green-500' 
                        : task.status === 'in_progress' 
                          ? 'bg-blue-950/20 border-blue-800 text-blue-500' 
                          : 'bg-orange-950/20 border-orange-800/60 text-orange-400'
                    }`}>
                      {task.status === 'done' ? 'CONCLUÍDO' : task.status === 'in_progress' ? 'EXECUÇÃO' : 'PENDENTE'}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[8.5px] border ${
                      remain.state === 'overdue' 
                        ? 'bg-red-950/40 border-red-800 text-red-500' 
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}>
                      {remain.text}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditTask(task)}
                        title="Editar Detalhes"
                        className="p-1 bg-stone-900 hover:bg-stone-800 rounded font-bold uppercase text-stone-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAllowed && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          title="Deletar Atividade"
                          className="p-1 bg-stone-900 hover:bg-red-950 rounded text-stone-500 hover:text-red-500"
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
