import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Check, 
  AlertTriangle, 
  Inbox, 
  Eye, 
  EyeOff, 
  Trash2, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  Activity, 
  Layers, 
  ChevronRight, 
  History, 
  RotateCcw, 
  Database,
  ArrowRightLeft,
  XCircle,
  HelpCircle,
  Clock,
  User,
  Star,
  ExternalLink
} from 'lucide-react';
import { Risk, ScopeChangeLog, StatusReport, Project, User as ProjectUser } from '../types';
import EvmDashboard from './EvmDashboard';

interface RiskManagementProps {
  activeProject: Project;
  activeUser: ProjectUser;
  permissions?: any;
}

const DEFAULT_RISKS = (projectId: string): Risk[] => [
  {
    id: `risk_chassis_${projectId}`,
    projectId,
    title: 'Corte incoerente nos tubos de cromo-molibdênio do Chassi',
    description: 'Risco técnico de corte incorreto por falha na calibragem da serra de fita no gabarito.',
    category: 'threat',
    area: 'Técnico',
    probability: 2,
    impact: 4,
    riskScore: 8,
    status: 'active',
    mitigationPlan: 'Exigir assinatura dupla de projetista antes de cada corte e medição a laser.',
    contingencyPlan: 'Acoplar insertos usinados de união ou solicitar tubos extras da reserva.'
  },
  {
    id: `risk_damper_${projectId}`,
    projectId,
    title: 'Atraso na liberação alfandegária dos amortecedores Öhlins',
    description: 'Atraso em importações diretas que compromete cronograma de testes dinâmicos de suspensão.',
    category: 'threat',
    area: 'Aquisições',
    probability: 4,
    impact: 3,
    riskScore: 12,
    status: 'active',
    mitigationPlan: 'Iniciar processo aduaneiro com despachante parceiro especializado.',
    contingencyPlan: 'Adaptar os amortecedores recondicionados e re-viciados do protótipo FSAE 2025.'
  },
  {
    id: `risk_sponsorship_${projectId}`,
    projectId,
    title: 'Nova parceria estratégica com usina para corte CNC integral',
    description: 'Oportunidade de barter com grande fabricante metalúrgico para manufaturar mangas e cubos a custo zero.',
    category: 'opportunity',
    area: 'Financeiro',
    probability: 3,
    impact: 5,
    riskScore: 15,
    status: 'active',
    mitigationPlan: 'Apresentar plano de contrapartida de marketing premium e convites VIP no Box.',
    contingencyPlan: 'Utilizar horas subsidiadas do SENAI ou verba coletiva emergencial.'
  },
  {
    id: `risk_engine_blow_${projectId}`,
    projectId,
    title: 'Superaquecimento ou quebra interna do motor Honda CBR 600 nos testes',
    description: 'Falha grave no motor de testes devido a mapa de rotações experimental excessivamente agressivo.',
    category: 'threat',
    area: 'Técnico',
    probability: 2,
    impact: 5,
    riskScore: 10,
    status: 'watch_list',
    mitigationPlan: 'Travar limite de giro eletrônico em mapa conservador e acompanhar telemetria térmica em tempo real.',
    contingencyPlan: 'Utilizar motor reserva cadastrado e realizar trocas rápidas de cabeçote.'
  }
];

const DEFAULT_STATUS_REPORTS = (projectId: string): StatusReport[] => [
  {
    id: `sr_p1_${projectId}`,
    projectId,
    reportDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0], // 7 days ago
    projectStatus: 'good',
    accomplishments: 'Soldagem de 60% das barras do frame estrutural com êxito. Chegada das pinças de freio Wilwood.',
    ongoingTasks: 'Acoplamento do template de motor na bancada, desenvolvimento eletrônico da fiação principal.',
    blockers: 'Aguardando chegada das bobinas de ignição do distribuidor nacional, prazo estendido em 4 dias.'
  },
  {
    id: `sr_p2_${projectId}`,
    projectId,
    reportDate: new Date().toISOString().split('T')[0], // Today
    projectStatus: 'at_risk',
    accomplishments: 'Frame 100% finalizado. Geometria de suspensão dianteira validada em software CAD.',
    ongoingTasks: 'Usinagem das mangas no torno mecânico, montagem preliminar dos suportes da suspensão.',
    blockers: 'Impedimentos térmicos no motor devido à trinca no radiador sob pressão. Substituição necessária.'
  }
];

const DEFAULT_SCOPE_CHANGES = (projectId: string): ScopeChangeLog[] => [
  {
    id: `sc_1_${projectId}`,
    projectId,
    taskId: null,
    wbsItemId: null,
    title: 'Transição estrutural de alumínio para alumínio aeronáutico 7075-T6',
    description: 'Alteração do metal das mangas de suspensão para liga premium de alta tenacidade mecânica.',
    impactOnTime: 5,
    impactOnBudget: 620.00,
    decision: 'approved',
    justification: 'Aprovado pelo orientador mecânico de forma de mitigar fadiga e quebra catastrófica em curvas rápidas.',
    requestedBy: 'Ana Clara (Líder Aero/Suspensão)'
  },
  {
    id: `sc_2_${projectId}`,
    projectId,
    taskId: null,
    wbsItemId: null,
    title: 'Manufatura de carenagem traseira complexa (Difusor Ativo)',
    description: 'Adicionar asas aerodinâmicas ativas nas laterais traseiras com acionamento servo-motorizado.',
    impactOnTime: 15,
    impactOnBudget: 1500.00,
    decision: 'rejected',
    justification: 'Rejeitado por ultrapassar drasticamente a tolerância orçamentária estipulada e infringir regras da competição.',
    requestedBy: 'Pedro Henrique (Gestão de Projetos)'
  }
];

export default function RiskManagement({ activeProject, activeUser, permissions }: RiskManagementProps) {
  // Navigation: Sub-tabs within Risks e Monitoramento
  const [subTab, setSubTab] = useState<'riscos' | 'relatorios' | 'escopo' | 'evm'>('riscos');

  // Backend state indicator
  const [isBackendActive, setIsBackendActive] = useState(false);
  const [dbStateBadge, setDbStateBadge] = useState('Verificando Banco...');

  // Data States
  const [risks, setRisks] = useState<Risk[]>([]);
  const [matrixData, setMatrixData] = useState<{ threats: Record<string, any[]>; opportunities: Record<string, any[]> }>({ threats: {}, opportunities: {} });
  const [statusReports, setStatusReports] = useState<StatusReport[]>([]);
  const [scopeChanges, setScopeChanges] = useState<ScopeChangeLog[]>([]);

  // Selection & UI Filters
  const [heatmapCategory, setHeatmapCategory] = useState<'threat' | 'opportunity'>('threat');
  const [selectedCell, setSelectedCell] = useState<string | null>(null); // "p-i" e.g., "5-5"
  const [riskAreaFilter, setRiskAreaFilter] = useState<string>('all');
  const [riskStatusFilter, setRiskStatusFilter] = useState<string>('all');
  const [riskSortKey, setRiskSortKey] = useState<'riskScore' | 'probability' | 'impact'>('riskScore');

  // Interactive Form States
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDesc, setRiskDesc] = useState('');
  const [riskCategory, setRiskCategory] = useState<'threat' | 'opportunity'>('threat');
  const [riskArea, setRiskArea] = useState('Técnico');
  const [riskProb, setRiskProb] = useState(3);
  const [riskImp, setRiskImp] = useState(3);
  const [riskMitigation, setRiskMitigation] = useState('');
  const [riskContingency, setRiskContingency] = useState('');

  // Watch List Threshold Suggestions Popup
  const [suggestedRiskToWatch, setSuggestedRiskToWatch] = useState<Risk | null>(null);

  // Status Report Form
  const [repStatus, setRepStatus] = useState<'good' | 'at_risk' | 'critical'>('good');
  const [repAccomplishments, setRepAccomplishments] = useState('');
  const [repOngoingTasks, setRepOngoingTasks] = useState('');
  const [repBlockers, setRepBlockers] = useState('');
  const [selectedReportHistoryIndex, setSelectedReportHistoryIndex] = useState<number>(0);

  // Scope Change Form
  const [scTitle, setScTitle] = useState('');
  const [scDesc, setScDesc] = useState('');
  const [scImpactTime, setScImpactTime] = useState<number>(0);
  const [scImpactBudget, setScImpactBudget] = useState<number>(0);
  const [scDecision, setScDecision] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [scJustification, setScJustification] = useState('');
  const [scRequestedBy, setScRequestedBy] = useState('');

  // S3 / Upload simulations
  const apiBase = 'http://localhost:3001';

  // Local Storage Keys
  const risksKey = `stem_risks_${activeProject.id}`;
  const reportsKey = `stem_reports_${activeProject.id}`;
  const scopeKey = `stem_scope_changes_${activeProject.id}`;

  // 1. Initial Data Load & Backend Sync
  useEffect(() => {
    // Load local seed fallbacks
    const localRisks = localStorage.getItem(risksKey);
    const localReports = localStorage.getItem(reportsKey);
    const localScope = localStorage.getItem(scopeKey);

    const initialR = localRisks ? JSON.parse(localRisks) : DEFAULT_RISKS(activeProject.id);
    const initialRep = localReports ? JSON.parse(localReports) : DEFAULT_STATUS_REPORTS(activeProject.id);
    const initialS = localScope ? JSON.parse(localScope) : DEFAULT_SCOPE_CHANGES(activeProject.id);

    setRisks(initialR);
    setStatusReports(initialRep);
    setScopeChanges(initialS);

    // Initial load sync
    fetchRisksData();
  }, [activeProject.id]);

  useEffect(() => {
    const handleRiskStatusChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedRisk = customEvent.detail;
      if (updatedRisk && updatedRisk.projectId === activeProject.id) {
        setRisks(prev => prev.map(r => r.id === updatedRisk.id ? { ...r, ...updatedRisk } : r));
      }
    };

    window.addEventListener('rt:risk.status.changed', handleRiskStatusChanged);
    return () => {
      window.removeEventListener('rt:risk.status.changed', handleRiskStatusChanged);
    };
  }, [activeProject.id]);

  // Synchronize with NestJS Server
  const fetchRisksData = async () => {
    try {
      const headers = {
        'Authorization': 'Bearer dev-token',
        'projectId': activeProject.id
      };

      // Risks Fetch
      const resRisks = await fetch(`${apiBase}/risks`, { headers });
      if (resRisks.ok) {
        const remoteRisks = await resRisks.json();
        if (Array.isArray(remoteRisks)) {
          setRisks(remoteRisks);
          localStorage.setItem(risksKey, JSON.stringify(remoteRisks));
        }
      }

      // Matrix Fetch
      const resMatrix = await fetch(`${apiBase}/risks/matrix`, { headers });
      if (resMatrix.ok) {
        const matrix = await resMatrix.json();
        setMatrixData(matrix);
      }

      // Reports Fetch
      const resReports = await fetch(`${apiBase}/status-reports`, { headers });
      if (resReports.ok) {
        const remoteReports = await resReports.json();
        if (Array.isArray(remoteReports)) {
          setStatusReports(remoteReports);
          localStorage.setItem(reportsKey, JSON.stringify(remoteReports));
        }
      }

      // Scope Changes Fetch
      const resScope = await fetch(`${apiBase}/scope-changes`, { headers });
      if (resScope.ok) {
        const remoteScope = await resScope.json();
        if (Array.isArray(remoteScope)) {
          setScopeChanges(remoteScope);
          localStorage.setItem(scopeKey, JSON.stringify(remoteScope));
        }
      }

      setIsBackendActive(true);
      setDbStateBadge('Banco Cloud PostgreSQL Ativo');
    } catch (err) {
      console.log('Using Local Fallback Sync Storage for Risks e Monitoramento');
      setIsBackendActive(false);
      setDbStateBadge('Banco Local Ativo (Offline Sync)');
    }
  };

  // Helper: Persist specific data locally as safe redundancy fallback
  const saveLocalAndSync = async (type: 'risks' | 'reports' | 'scope', updatedData: any) => {
    if (type === 'risks') {
      setRisks(updatedData);
      localStorage.setItem(risksKey, JSON.stringify(updatedData));
    } else if (type === 'reports') {
      setStatusReports(updatedData);
      localStorage.setItem(reportsKey, JSON.stringify(updatedData));
    } else if (type === 'scope') {
      setScopeChanges(updatedData);
      localStorage.setItem(scopeKey, JSON.stringify(updatedData));
    }
  };

  // 2. Action: Create Risk
  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle.trim()) return;

    const prob = Math.max(1, Math.min(5, riskProb));
    const imp = Math.max(1, Math.min(5, riskImp));
    const score = prob * imp;

    const localNewRisk: Risk = {
      id: `risk_local_${Date.now()}`,
      projectId: activeProject.id,
      title: riskTitle.trim(),
      description: riskDesc.trim() || null,
      category: riskCategory,
      area: riskArea,
      probability: prob,
      impact: imp,
      riskScore: score,
      status: 'active',
      mitigationPlan: riskMitigation.trim() || null,
      contingencyPlan: riskContingency.trim() || null
    };

    // Try API POST
    try {
      const res = await fetch(`${apiBase}/risks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token',
          'projectId': activeProject.id
        },
        body: JSON.stringify({
          title: riskTitle.trim(),
          description: riskDesc.trim(),
          category: riskCategory,
          area: riskArea,
          probability: prob,
          impact: imp,
          status: 'active',
          mitigationPlan: riskMitigation.trim(),
          contingencyPlan: riskContingency.trim(),
          watchListThreshold: 4 // default threshold
        })
      });

      if (res.ok) {
        const savedRisk = await res.json();
        // If API suggested watch list
        if (savedRisk.suggestion?.move_to_watch_list) {
          // Keep response savedRisk but open UI confirmation prompt to watch list move
          setSuggestedRiskToWatch(savedRisk);
        }
        
        const updated = [savedRisk, ...risks];
        saveLocalAndSync('risks', updated);
      } else {
        throw new Error('Fallback to offline');
      }
    } catch (err) {
      console.log('Saving locally:', err);
      // Trigger local suggestion if score <= 4
      if (score <= 4) {
        setSuggestedRiskToWatch(localNewRisk);
      }
      const updated = [localNewRisk, ...risks];
      saveLocalAndSync('risks', updated);
    }

    // Reset Form Fields
    setRiskTitle('');
    setRiskDesc('');
    setRiskMitigation('');
    setRiskContingency('');
    setRiskProb(3);
    setRiskImp(3);
    setShowAddRisk(false);
    
    // Refresh
    fetchRisksData();
  };

  // Confirm user relocation suggestion for low score items
  const acceptWatchListSuggestion = async (riskToMove: Risk) => {
    await handlePatchRiskStatus(riskToMove.id, 'watch_list');
    setSuggestedRiskToWatch(null);
  };

  // 3. Action: Patch Risk Status
  const handlePatchRiskStatus = async (id: string, newStatus: Risk['status']) => {
    // Optimistic local state update
    const updatedRisks = risks.map(r => r.id === id ? { ...r, status: newStatus } : r);
    saveLocalAndSync('risks', updatedRisks);

    try {
      const res = await fetch(`${apiBase}/risks/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token',
          'projectId': activeProject.id
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error();
      }
    } catch (err) {
      console.log('Offline status updated successfully in fallback state');
    }

    fetchRisksData();
  };

  // 4. Action: Save Status Report
  const handleCreateStatusReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repAccomplishments.trim() || !repOngoingTasks.trim() || !repBlockers.trim()) return;

    const localReport: StatusReport = {
      id: `sr_local_${Date.now()}`,
      projectId: activeProject.id,
      reportDate: new Date().toISOString().split('T')[0],
      projectStatus: repStatus,
      accomplishments: repAccomplishments.trim(),
      ongoingTasks: repOngoingTasks.trim(),
      blockers: repBlockers.trim()
    };

    try {
      const res = await fetch(`${apiBase}/status-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token',
          'projectId': activeProject.id
        },
        body: JSON.stringify({
          projectStatus: repStatus,
          accomplishments: repAccomplishments.trim(),
          ongoingTasks: repOngoingTasks.trim(),
          blockers: repBlockers.trim()
        })
      });

      if (res.ok) {
        const savedRep = await res.json();
        const updated = [savedRep, ...statusReports];
        saveLocalAndSync('reports', updated);
        setSelectedReportHistoryIndex(0);
      } else {
        throw new Error();
      }
    } catch (err) {
      const updated = [localReport, ...statusReports];
      saveLocalAndSync('reports', updated);
      setSelectedReportHistoryIndex(0);
    }

    setRepAccomplishments('');
    setRepOngoingTasks('');
    setRepBlockers('');
    fetchRisksData();
  };

  // 5. Action: Create Scope Change
  const handleCreateScopeChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scTitle.trim() || !scRequestedBy.trim()) return;

    const localSC: ScopeChangeLog = {
      id: `sc_local_${Date.now()}`,
      projectId: activeProject.id,
      taskId: null,
      wbsItemId: null,
      title: scTitle.trim(),
      description: scDesc.trim() || null,
      impactOnTime: scImpactTime,
      impactOnBudget: scImpactBudget,
      decision: scDecision,
      justification: scJustification.trim() || null,
      requestedBy: scRequestedBy.trim()
    };

    // Immutability Check: Verification in frontend
    if (scDecision === 'rejected') {
      console.log('REJECTION RULE ACTIVATED: This record remains purely an audit trail.');
    }

    try {
      const res = await fetch(`${apiBase}/scope-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token',
          'projectId': activeProject.id
        },
        body: JSON.stringify({
          title: scTitle.trim(),
          description: scDesc.trim(),
          impactOnTime: Number(scImpactTime),
          impactOnBudget: Number(scImpactBudget),
          decision: scDecision,
          justification: scJustification.trim(),
          requestedBy: scRequestedBy.trim()
        })
      });

      if (res.ok) {
        const savedSC = await res.json();
        const updated = [savedSC, ...scopeChanges];
        saveLocalAndSync('scope', updated);
      } else {
        throw new Error();
      }
    } catch (err) {
      const updated = [localSC, ...scopeChanges];
      saveLocalAndSync('scope', updated);
    }

    setScTitle('');
    setScDesc('');
    setScImpactTime(0);
    setScImpactBudget(0);
    setScDecision('pending');
    setScJustification('');
    setScRequestedBy('');
    fetchRisksData();
  };

  // 6. Heatmap Styling Helpers
  const cellColorClass = (p: number, i: number) => {
    const score = p * i;
    if (score >= 15) return 'bg-[#7f1d1d]/90 text-red-100 hover:bg-[#991b1b] border-[#ef4444]/40';
    if (score >= 9) return 'bg-[#78350f]/90 text-amber-100 hover:bg-[#92400e] border-[#f59e0b]/40';
    return 'bg-[#1c1917]/90 text-stone-300 hover:bg-stone-800 border-stone-800';
  };

  // Counts of elements inside Heatmap cells based on category (threat / opportunity)
  const cellCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => {
      if (r.category === heatmapCategory) {
        const key = `${r.probability}-${r.impact}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [risks, heatmapCategory]);

  // 7. Filter & Sort Risks List
  const processedRisks = useMemo(() => {
    let result = [...risks];

    // Filter by area
    if (riskAreaFilter !== 'all') {
      result = result.filter(r => r.area === riskAreaFilter);
    }

    // Filter by status OR selected Heatmap cell
    if (selectedCell) {
      const [p, i] = selectedCell.split('-').map(Number);
      result = result.filter(r => r.probability === p && r.impact === i && r.category === heatmapCategory);
    } else if (riskStatusFilter !== 'all') {
      result = result.filter(r => r.status === riskStatusFilter);
    }

    // Sorter logic
    result.sort((a, b) => {
      if (riskSortKey === 'riskScore') return b.riskScore - a.riskScore;
      if (riskSortKey === 'probability') return b.probability - a.probability;
      return b.impact - a.impact;
    });

    return result;
  }, [risks, selectedCell, riskAreaFilter, riskStatusFilter, riskSortKey, heatmapCategory]);

  return (
    <div className="w-full space-y-6" id="riscos-monitoramento-root">
      
      {/* HEADER WITH METADATA BADGES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-stone-900 border border-stone-850 rounded-lg gap-4">
        <div>
          <span className="text-[9px] bg-red-650/10 border border-red-505/25 text-red-505 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest">
            Fase de Execução de Engenharia • FSAE
          </span>
          <h1 className="text-lg font-display font-black text-white uppercase tracking-wider flex items-center gap-2 mt-1">
            <ShieldAlert className="w-5.5 h-5.5 text-red-500" />
            Riscos e Monitoramento Sistemático
          </h1>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Modulo integrador de salvaguardas mecânicas, relatórios semafóricos e logs oficiais de auditoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className={`px-2.5 py-1 rounded font-bold border ${isBackendActive ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500' : 'bg-stone-950/50 border-stone-800 text-stone-500'}`}>
            <Database className="w-3 h-3 inline mr-1" />
            {dbStateBadge}
          </span>
          <span className="bg-stone-955 border border-stone-800 text-stone-400 px-2.5 py-1 rounded font-bold uppercase">
            Sincronização Ativa
          </span>
        </div>
      </div>

      {/* DASHBOARD LEVEL LEVEL SUB NAVIGATION */}
      <div className="flex border-b border-stone-850 gap-2 overflow-x-auto pb-px select-none">
        <button 
          onClick={() => { setSubTab('riscos'); setSelectedCell(null); }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 font-mono shrink-0 transition-colors cursor-pointer ${
            subTab === 'riscos' 
              ? 'border-red-500 text-red-502' 
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Qualificação de Riscos ({risks.length})
        </button>

        <button 
          onClick={() => setSubTab('relatorios')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 font-mono shrink-0 transition-colors cursor-pointer ${
            subTab === 'relatorios' 
              ? 'border-red-500 text-red-502' 
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Relatórios de Status
        </button>

        <button 
          onClick={() => setSubTab('escopo')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 font-mono shrink-0 transition-colors cursor-pointer ${
            subTab === 'escopo' 
              ? 'border-red-500 text-red-502' 
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Registro de Mudança de Escopo
        </button>

        <button 
          onClick={() => setSubTab('evm')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 font-mono shrink-0 transition-colors cursor-pointer ${
            subTab === 'evm' 
              ? 'border-red-500 text-red-502' 
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Earned Value Management (EVM)
        </button>
      </div>

      {/* SUGGESTION MODAL IF ACTIONABLE THRESHOLD TRIGGERS */}
      {suggestedRiskToWatch && (
        <div className="p-4 bg-[#78350f]/20 border border-amber-600/30 text-amber-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Sugestão Recomendada pela Diretoria: Mapear para Watch List?
            </div>
            <p className="text-[11px] text-amber-200/80">
              O risco <strong className="text-white">"{suggestedRiskToWatch.title}"</strong> apresentou score baixo ({suggestedRiskToWatch.riskScore} ≤ 4). Gostaria de movê-lo de "Ativo" para a <strong className="text-white">Watch List (Alerta)</strong>? Ele não mudará até sua confirmação.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => acceptWatchListSuggestion(suggestedRiskToWatch)}
              className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-mono font-extrabold px-3 py-1 text-[10px] rounded uppercase transition cursor-pointer"
            >
              Sim, Arquivar em Watch List
            </button>
            <button 
              onClick={() => setSuggestedRiskToWatch(null)}
              className="border border-stone-700 hover:bg-stone-850 text-stone-400 px-3 py-1 font-mono text-[10px] rounded uppercase transition cursor-pointer"
            >
              Não, manter ativo
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT VIEWPORTS */}
      <div className="w-full">
        
        {/* SUBTAB 1: RISKS MANAGEMENT & MATRIX */}
        {subTab === 'riscos' && (
          <div className="space-y-6">
            
            {/* MATRIX AND SUMMARY CARDS GRAPHICAL HEATMAP */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* INTERACTIVE 5x5 HEATMAP GRID */}
              <div className="lg:col-span-7 bg-stone-900 border border-stone-850 rounded-lg p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 select-none">
                  <div>
                    <h2 className="text-xs font-bold font-mono uppercase text-[#e5e5e5]">Heatmap de Engenharia 5x5</h2>
                    <p className="text-[10px] text-stone-450 mt-0.5">Clique nas células para isolar os riscos correspondentes no Registro.</p>
                  </div>

                  {/* CHANGER SWITCH THREATS VS OPPORTUNITIES */}
                  <div className="flex border border-stone-800 rounded bg-stone-955 p-0.5 text-[9px] font-mono leading-none">
                    <button 
                      type="button"
                      onClick={() => { setHeatmapCategory('threat'); setSelectedCell(null); }}
                      className={`px-3 py-1.5 font-bold uppercase rounded ${heatmapCategory === 'threat' ? 'bg-[#991b1b] text-white' : 'text-stone-400'}`}
                    >
                      Ameaças (Threats)
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setHeatmapCategory('opportunity'); setSelectedCell(null); }}
                      className={`px-3 py-1.5 font-bold uppercase rounded ${heatmapCategory === 'opportunity' ? 'bg-[#15803d] text-white' : 'text-stone-400'}`}
                    >
                      Oportunidades (Opps)
                    </button>
                  </div>
                </div>

                {/* 5X5 HEATMAP LAYOUT GRID */}
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((pVal) => (
                    <div key={pVal} className="flex items-center gap-2">
                      <span className="w-10 text-right font-mono text-[9px] text-[#DC2626] font-bold">P: {pVal}</span>
                      <div className="grid grid-cols-5 gap-1 select-none flex-grow">
                        {[1, 2, 3, 4, 5].map((iVal) => {
                          const cellKey = `${pVal}-${iVal}`;
                          const count = cellCountsByCategory[cellKey] || 0;
                          const isSelected = selectedCell === cellKey;

                          return (
                            <button
                              key={iVal}
                              type="button"
                              onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                              className={`h-11 border rounded font-mono text-center flex flex-col justify-center items-center transition relative ${cellColorClass(pVal, iVal)} ${
                                isSelected ? 'ring-2 ring-red-500 scale-102 border-transparent' : 'border-stone-850'
                              }`}
                              title={`Probabilidade ${pVal} × Impacto ${iVal} (Score: ${pVal * iVal})`}
                            >
                              {count > 0 ? (
                                <span className="bg-white text-stone-950 rounded-full w-5.5 h-5.5 flex items-center justify-center text-[11px] font-extrabold border border-stone-300 shadow-lg animate-bounce">
                                  {count}
                                </span>
                              ): (
                                <span className="text-[9px] opacity-25">{pVal * iVal}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* X-AXIS LABELS */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="w-10 text-right font-mono text-[8px] text-stone-400 font-bold uppercase">IMP:</span>
                    <div className="grid grid-cols-5 gap-1 flex-grow text-center text-stone-400 text-[10px] font-mono">
                      {['Mínimo', 'Baixo', 'Moderado', 'Crítico', 'Grave'].map((lbl, idx) => (
                        <span key={lbl} className="truncate select-none text-[9px]" title={`Impacto ${idx+1}`}>{lbl}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-stone-500 font-mono mt-4 pt-4 border-t border-stone-850 select-none">
                  <span>🟢 Baixo Risco (Score 1-8)</span>
                  <span>🟡 Atenção (Score 9-14)</span>
                  <span>🔴 Alto Risco (Score 15-25)</span>
                </div>
              </div>

              {/* ACTION RECOMMENDATIONS WIDGET */}
              <div className="lg:col-span-5 bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between">
                <div className="space-y-4 text-xs font-sans">
                  <div className="flex items-center gap-2 text-red-500 font-mono text-[9px] uppercase font-bold tracking-wider">
                    <Compass className="w-4 h-4" /> Diretrizes de Contingenciamento
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">Metodologia Trino: Isolar e Mitigar</h3>
                  
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    Todas as classificações de risco são calculadas em tempo real pelo motor de persistência. A Watch List garante monitoramento estendido de itens marginais, sem comprometer o fluxo de sprint de usinagem.
                  </p>

                  <div className="p-3 bg-stone-950 border border-stone-850 rounded space-y-1.5 font-mono text-[11px]">
                    <div className="text-amber-500 font-extrabold uppercase text-[9px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      ALERTA RECOMENDADO SUSPENSÃO:
                    </div>
                    <p className="text-stone-400 italic leading-relaxed text-[10px]">
                      "A folga residual nos cubos dianteiros exige ensaio não-destrutivo térmico. Em caso de torção plástica, o plano B deve acionar as mangas reservas de titânio usinadas."
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2 border-t border-stone-850 pt-4 mt-4 select-none">
                  <button 
                    onClick={() => setShowAddRisk(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-xs uppercase font-bold font-mono tracking-wider transition-colors cursor-pointer text-center"
                  >
                    + Qualificar Novo Risco
                  </button>
                </div>
              </div>
            </div>

            {/* RISKS REGISTER TABLE AND WATCH LIST VIEWS */}
            <div className="bg-stone-900 border border-stone-850 rounded-lg p-5 space-y-4">
              
              {/* FILTERS TOOLBAR */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-[#e5e5e5]">Registro Geral de Riscos</h3>
                  <p className="text-[10px] text-stone-450 mt-0.5">Tabela dinâmica classificada por severidade de impacto.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  {/* Category Filter */}
                  <div>
                    <label className="text-[9px] text-stone-400 block mb-1">Status</label>
                    <select 
                      value={riskStatusFilter} 
                      onChange={e => { setRiskStatusFilter(e.target.value); setSelectedCell(null); }}
                      className="bg-stone-955 border border-stone-800 text-stone-300 rounded px-2.5 py-1 text-xs"
                    >
                      <option value="all">Filtro: Todos os Riscos</option>
                      <option value="active">Status: Ativo</option>
                      <option value="watch_list">Status: Watch List (Alerta)</option>
                      <option value="mitigated">Status: Mitigado</option>
                      <option value="triggered">Status: Ocorrido (Disparado)</option>
                    </select>
                  </div>

                  {/* Area Filter */}
                  <div>
                    <label className="text-[9px] text-stone-400 block mb-1">Área</label>
                    <select 
                      value={riskAreaFilter} 
                      onChange={e => { setRiskAreaFilter(e.target.value); setSelectedCell(null); }}
                      className="bg-stone-955 border border-stone-800 text-stone-300 rounded px-2.5 py-1 text-xs"
                    >
                      <option value="all">Área: Todas</option>
                      <option value="Técnico">Área: Técnico</option>
                      <option value="Financeiro">Área: Financeiro</option>
                      <option value="Aquisições">Área: Aquisições</option>
                      <option value="Cronograma">Área: Cronograma</option>
                    </select>
                  </div>

                  {/* Sort Key */}
                  <div>
                    <label className="text-[9px] text-stone-400 block mb-1">Ordenar por</label>
                    <select 
                      value={riskSortKey} 
                      onChange={e => setRiskSortKey(e.target.value as any)}
                      className="bg-stone-955 border border-stone-800 text-stone-300 rounded px-2.5 py-1 text-xs"
                    >
                      <option value="riskScore">Severidade (Score)</option>
                      <option value="probability">Crescente Probabilidade</option>
                      <option value="impact">Crescente Impacto</option>
                    </select>
                  </div>

                  {selectedCell && (
                    <div className="mt-4 flex items-center">
                      <button 
                        onClick={() => setSelectedCell(null)}
                        className="bg-red-950/40 border border-red-500/20 text-red-400 px-3 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1 cursor-pointer"
                      >
                        Limpar Filtro Célula [{selectedCell}] ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* REGISTER TABLE GRID */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300 select-text font-sans">
                  <thead>
                    <tr className="border-b border-stone-850 text-stone-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3">Risco / Categoria</th>
                      <th className="py-2.5 px-3">Área / Proprietário</th>
                      <th className="py-2.5 px-3">P × I = Score</th>
                      <th className="py-2.5 px-3">Planos Proativos & Contingência</th>
                      <th className="py-2.5 px-3">Status Atual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRisks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-stone-500 font-mono text-[11px]">
                          <Inbox className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                          Nenhum risco categorizado com filtros ativos nesta célula de severidade.
                        </td>
                      </tr>
                    ) : (
                      processedRisks.map((risk) => {
                        const scoreColor = risk.riskScore >= 15 ? 'text-red-500 bg-red-950/20 border-red-900/60' : risk.riskScore >= 9 ? 'text-amber-500 bg-amber-950/20 border-amber-900/60' : 'text-emerald-500 bg-emerald-950/20 border-emerald-900/60';
                        return (
                          <tr key={risk.id} className="border-b border-stone-850 hover:bg-stone-955 transition-colors">
                            <td className="py-3 px-3 max-w-sm">
                              <div className="flex items-center gap-1.5 mb-1 select-none">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase border ${
                                  risk.category === 'threat' ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-emerald-955/40 border-emerald-900 text-emerald-400'
                                }`}>
                                  {risk.category === 'threat' ? 'Ameaça' : 'Oportunidade'}
                                </span>
                                {risk.status === 'watch_list' && (
                                  <span className="bg-[#78350f]/30 border border-amber-900 text-amber-500 px-1.5 py-0.5 font-mono text-[8px] rounded uppercase font-extrabold flex items-center gap-0.5">
                                    <Star className="w-2 h-2 fill-current" /> Watch List
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-white tracking-tight leading-relaxed">{risk.title}</div>
                              {risk.description && <div className="text-[10px] text-stone-450 mt-1 select-text">{risk.description}</div>}
                            </td>
                            
                            <td className="py-3 px-3 uppercase font-mono text-[10px] text-stone-400">
                              <div>{risk.area}</div>
                              <div className="mt-1 text-stone-500 flex items-center gap-1 font-sans capitalize normal-case text-xs">
                                <User className="w-3.5 h-3.5" /> Responsável
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-1 rounded inline-block font-mono font-bold text-xs uppercase border ${scoreColor}`}>
                                Score {risk.riskScore}
                              </span>
                              <div className="text-[9px] text-stone-550 font-mono mt-1">P: {risk.probability} × I: {risk.impact}</div>
                            </td>

                            <td className="py-3 px-3 text-[10px] font-mono max-w-md">
                              <div className="space-y-1 select-text">
                                <div><strong className="text-stone-400 uppercase text-[9px]">Mitigação:</strong> <span className="text-stone-300 italic">"{risk.mitigationPlan || 'Sem plano estabelecido'}"</span></div>
                                <div className="mt-1"><strong className="text-red-500 uppercase text-[9px]">Contingência:</strong> <span className="text-stone-300 italic">"{risk.contingencyPlan || 'Nenhum'}"</span></div>
                              </div>
                            </td>

                            <td className="py-3 px-3 select-none">
                              <div className="flex flex-col gap-1">
                                {risk.status === 'watch_list' ? (
                                  <button 
                                    onClick={() => handlePatchRiskStatus(risk.id, 'active')}
                                    className="bg-amber-652 hover:bg-amber-600 text-stone-950 font-mono font-bold text-[9px] py-1 px-2.5 rounded uppercase leading-none transition-colors cursor-pointer flex items-center gap-1 justify-center shadow"
                                  >
                                    <RotateCcw className="w-3 h-3 text-stone-950" /> Reativar para Ativo
                                  </button>
                                ) : (
                                  <select 
                                    value={risk.status} 
                                    onChange={e => handlePatchRiskStatus(risk.id, e.target.value as any)}
                                    className="bg-stone-955 border border-stone-800 text-stone-200 text-[10px] font-mono rounded px-2 py-0.5 text-center uppercase cursor-pointer"
                                  >
                                    <option value="active">Ativo</option>
                                    <option value="watch_list">Mover l/ Watch List</option>
                                    <option value="mitigated">Mitigado</option>
                                    <option value="triggered">Disparado (Ocorrido)</option>
                                  </select>
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
          </div>
        )}

        {/* SUBTAB 2: STATUS REPORTS MODULE */}
        {subTab === 'relatorios' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* RECORD CREATOR FORM FORM */}
            <div className="lg:col-span-4 bg-stone-900 border border-stone-850 p-5 rounded-lg h-fit space-y-4">
              <div className="border-b border-stone-850 pb-3">
                <h3 className="text-xs font-bold font-mono uppercase text-[#e5e5e5] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-red-500" /> Registar Relatório Semanal
                </h3>
                <p className="text-[10px] text-stone-450 mt-0.5">Formalize o progresso acumulado na semana para os mentores.</p>
              </div>

              <form onSubmit={handleCreateStatusReport} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="mach-label">Semáforo de Saúde do Projeto</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5 select-none">
                    <button 
                      type="button"
                      onClick={() => setRepStatus('good')}
                      className={`py-2 px-1.5 rounded text-center border font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                        repStatus === 'good' 
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-500' 
                          : 'bg-stone-955 border-stone-850 text-stone-400 hover:text-[#fff]'
                      }`}
                    >
                      🟢 Estável (Good)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRepStatus('at_risk')}
                      className={`py-2 px-1.5 rounded text-center border font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                        repStatus === 'at_risk' 
                          ? 'bg-amber-952/40 border-amber-500 text-amber-500' 
                          : 'bg-stone-955 border-stone-850 text-stone-400 hover:text-[#fff]'
                      }`}
                    >
                      🟡 Em Risco (Warn)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRepStatus('critical')}
                      className={`py-2 px-1.5 rounded text-center border font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                        repStatus === 'critical' 
                          ? 'bg-red-952/40 border-red-500 text-red-500' 
                          : 'bg-stone-955 border-stone-850 text-stone-400 hover:text-[#fff]'
                      }`}
                    >
                      🔴 Alerta Crítico
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mach-label">Principais Realizações (Accomplishments)</label>
                  <textarea 
                    rows={3} 
                    required
                    value={repAccomplishments}
                    onChange={e => setRepAccomplishments(e.target.value)}
                    placeholder="Conquistas concluídas na última semana de sprint..."
                    className="mach-input"
                  />
                </div>

                <div>
                  <label className="mach-label">Atividades em Andamento (Ongoing Tasks)</label>
                  <textarea 
                    rows={3} 
                    required
                    value={repOngoingTasks}
                    onChange={e => setRepOngoingTasks(e.target.value)}
                    placeholder="Quais frentes estão ativas no bólido neste instante..."
                    className="mach-input"
                  />
                </div>

                <div>
                  <label className="mach-label">Gargalos / Impedimentos (Blockers)</label>
                  <textarea 
                    rows={3} 
                    required
                    value={repBlockers}
                    onChange={e => setRepBlockers(e.target.value)}
                    placeholder="Bobinas ausentes, falhas de solda, atraso de peças, etc..."
                    className="mach-input"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-mono font-extrabold uppercase py-2.5 rounded tracking-wider transition-colors text-xs cursor-pointer text-center"
                >
                  Confirmar Envio Oficial
                </button>
              </form>
            </div>

            {/* PROGRESS HISTORY NAVIGATOR VIEW */}
            <div className="lg:col-span-8 bg-stone-900 border border-stone-850 p-5 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-stone-850 pb-3">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-[#e5e5e5] flex items-center gap-1.5">
                    <History className="w-4 h-4 text-red-500" /> Relatório Executivo Semanal (Histórico)
                  </h3>
                  <p className="text-[10px] text-stone-450 mt-0.5">Histórico navegável de lançamentos executivos da engenharia.</p>
                </div>

                {statusReports.length > 0 && (
                  <span className="bg-stone-955 border border-stone-800 text-[10px] font-mono text-stone-400 px-2 py-0.5 rounded font-bold">
                    Total: {statusReports.length} Relatórios
                  </span>
                )}
              </div>

              {statusReports.length === 0 ? (
                <div className="py-20 text-center select-none">
                  <Inbox className="w-12 h-12 text-stone-550 mx-auto mb-3" />
                  <p className="text-stone-450 font-mono text-xs">A equipe ainda não registrou nenhum boletim de progresso para este projeto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Date Sidebar Navigator */}
                  <div className="md:col-span-4 bg-stone-955/50 rounded-lg border border-stone-850 overflow-hidden divide-y divide-stone-850/60 select-none">
                    {statusReports.map((report, idx) => {
                      const isSelected = selectedReportHistoryIndex === idx;
                      const statusCircle = report.projectStatus === 'good' ? 'bg-emerald-500' : report.projectStatus === 'at_risk' ? 'bg-amber-500' : 'bg-red-500';
                      return (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReportHistoryIndex(idx)}
                          className={`w-full text-left p-3 flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                            isSelected ? 'bg-red-952/10 text-red-400 font-extrabold' : 'text-stone-400 hover:bg-stone-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${statusCircle}`} />
                            <span>{report.reportDate}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE DATA VIEWER */}
                  <div className="md:col-span-8 bg-stone-955/20 border border-stone-852/40 p-5 rounded-lg space-y-4 font-sans select-text">
                    {(() => {
                      const activeRep = statusReports[selectedReportHistoryIndex];
                      if (!activeRep) return null;
                      const lightIndicator = activeRep.projectStatus === 'good' ? 'text-emerald-500 bg-emerald-950/20 border-emerald-900/60' : activeRep.projectStatus === 'at_risk' ? 'text-amber-500 bg-[#78350f]/20 border-amber-900/60' : 'text-red-500 bg-red-952/20 border-red-900/60';
                      const lightLabel = activeRep.projectStatus === 'good' ? 'Estável (Operação Normal)' : activeRep.projectStatus === 'at_risk' ? 'Em Atenção / Alerta de Riscos' : 'Crítico / Intervenção Recomenda';
                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-stone-850 select-none">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-stone-500" />
                              <span className="text-xs text-white font-bold font-mono">Emissão: {activeRep.reportDate}</span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${lightIndicator}`}>
                              {lightLabel}
                            </span>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <h4 className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider mb-1">🏁 Principais Realizações (Concluídos)</h4>
                              <p className="text-stone-300 text-xs leading-relaxed italic bg-stone-990 p-3 rounded border border-stone-850/40 select-text">
                                "{activeRep.accomplishments}"
                              </p>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider mb-1">🔧 Atividades em Andamento</h4>
                              <p className="text-stone-300 text-xs leading-relaxed italic bg-stone-990 p-3 rounded border border-stone-850/40 select-text">
                                "{activeRep.ongoingTasks}"
                              </p>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-mono text-[#DC2626] font-bold uppercase tracking-wider mb-1">🚧 Impedimentos e Gargalos Técnicos</h4>
                              <p className="text-red-300/90 text-xs leading-relaxed italic bg-stone-990 p-3 rounded border border-stone-850/40 select-text">
                                "{activeRep.blockers}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 3: SCOPE CHANGE LOGGER */}
        {subTab === 'escopo' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* ROW LAYOUT GRID FOR CHANGE FORM & LOG TABLE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* CHANGE FORM */}
              <div className="lg:col-span-4 bg-stone-900 border border-stone-850 p-5 rounded-lg h-fit space-y-4">
                <div className="border-b border-stone-850 pb-3">
                  <h3 className="text-xs font-bold font-mono uppercase text-[#e5e5e5] flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-red-500" /> Propor Ajuste de Escopo
                  </h3>
                  <p className="text-[10px] text-stone-450 mt-0.5">Registre alterações que causem desvios de tempo ou orçamento.</p>
                </div>

                <form onSubmit={handleCreateScopeChange} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="mach-label">Título da Proposta de Escopo</label>
                    <input 
                      type="text" 
                      required
                      value={scTitle}
                      onChange={e => setScTitle(e.target.value)}
                      placeholder="ex. Redesenhar admissão lateral de fluxo reverso..."
                      className="mach-input"
                    />
                  </div>

                  <div>
                    <label className="mach-label">Descrição da Modificação Mecânica</label>
                    <textarea 
                      rows={2}
                      value={scDesc}
                      onChange={e => setScDesc(e.target.value)}
                      placeholder="Detalhes mecânicos ou operacionais que requerem esta mudança de design..."
                      className="mach-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mach-label">Impacto no Cronograma (Dias +/-)</label>
                      <input 
                        type="number"
                        value={scImpactTime}
                        onChange={e => setScImpactTime(Number(e.target.value))}
                        className="mach-input font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="mach-label">Impacto Orçamentário (R$ +/-)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-stone-500 font-bold">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={scImpactBudget}
                          onChange={e => setScImpactBudget(Number(e.target.value))}
                          className="mach-input font-mono text-center pl-6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 select-none">
                    <div>
                      <label className="mach-label">Proponente (Solicitante)</label>
                      <input 
                        type="text"
                        required
                        value={scRequestedBy}
                        onChange={e => setScRequestedBy(e.target.value)}
                        placeholder="Nome e Cargo"
                        className="mach-input"
                      />
                    </div>

                    <div>
                      <label className="mach-label">Decisão Inicial</label>
                      <select 
                        value={scDecision}
                        onChange={e => setScDecision(e.target.value as any)}
                        className="mach-input font-medium font-mono"
                      >
                        <option value="pending">PENDENTE (Avaliação)</option>
                        <option value="approved">APROVADO (Incorporar)</option>
                        <option value="rejected">REJEITADO (Auditoria)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mach-label">Justificativa Executiva da Decisão</label>
                    <textarea 
                      rows={2}
                      value={scJustification}
                      onChange={e => setScJustification(e.target.value)}
                      placeholder="Parecer técnico ou financeiro para justificar aprovação ou veto..."
                      className="mach-input"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-mono font-extrabold uppercase py-2.5 rounded tracking-wider transition-colors text-xs cursor-pointer text-center"
                  >
                    Lançar no Registro Oficial
                  </button>
                </form>
              </div>

              {/* ACTION IMMUTABILITY AUDIT LOG TABLE */}
              <div className="lg:col-span-8 bg-stone-900 border border-stone-850 p-5 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-stone-850 pb-3">
                  <div>
                    <h3 className="text-xs font-bold font-mono uppercase text-[#e5e5e5] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-red-500" /> Registro Auditável de Escopo (Cadastro Imutável)
                    </h3>
                    <p className="text-[10px] text-stone-450 mt-0.5">As mudanças com veto REJEITADO permanecem exclusivamente salvaguardadas como prova de auditoria.</p>
                  </div>
                </div>

                <div className="overflow-x-auto select-text">
                  <table className="w-full text-left text-xs text-stone-300 font-sans">
                    <thead>
                      <tr className="border-b border-stone-850 text-stone-400 font-mono text-[10px] uppercase">
                        <th className="py-2.5 px-3">Título / Descrição</th>
                        <th className="py-2.5 px-3">Desvios Estimados</th>
                        <th className="py-2.5 px-3">Solicitado por</th>
                        <th className="py-2.5 px-3">Parecer da Bancada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scopeChanges.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-stone-500 font-mono text-[11px]">
                            <Inbox className="w-8 h-8 text-stone-550 mx-auto mb-2" />
                            Nenhuma mudança de escopo foi submetida até o momento.
                          </td>
                        </tr>
                      ) : (
                        scopeChanges.map((change) => {
                          const stateColor = change.decision === 'approved' ? 'text-emerald-500 bg-emerald-950/20 border-emerald-900/60' : change.decision === 'rejected' ? 'text-red-500 bg-red-952/20 border-red-900/60' : 'text-stone-400 bg-stone-955 border-stone-800';
                          return (
                            <tr key={change.id} className="border-b border-stone-850 hover:bg-stone-955 transition-colors">
                              <td className="py-3 px-3 max-w-xs">
                                <div className="font-bold text-white tracking-tight leading-relaxed">{change.title}</div>
                                {change.description && <div className="text-[10px] text-stone-450 mt-1">{change.description}</div>}
                              </td>

                              <td className="py-3 px-3 font-mono text-[10px] text-stone-400">
                                <div className="flex flex-col gap-1">
                                  <span>⏰ Tempo: <strong className={change.impactOnTime >= 0 ? 'text-red-400' : 'text-emerald-400'}>{change.impactOnTime >= 0 ? `+${change.impactOnTime}` : change.impactOnTime} dias</strong></span>
                                  <span>💵 Orçamento: <strong className={change.impactOnBudget >= 0 ? 'text-red-400' : 'text-emerald-400'}>{change.impactOnBudget >= 0 ? `+R$ ${change.impactOnBudget.toFixed(2)}` : `-R$ ${Math.abs(change.impactOnBudget).toFixed(2)}`}</strong></span>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-stone-400 uppercase font-mono text-[10px]">
                                {change.requestedBy}
                              </td>

                              <td className="py-3 px-3">
                                <div className="space-y-1.5">
                                  <span className={`px-2 py-0.5 rounded inline-block font-mono font-black text-[9px] uppercase border ${stateColor}`}>
                                    {change.decision}
                                  </span>
                                  
                                  {change.decision === 'rejected' && (
                                    <div className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 font-mono uppercase tracking-widest leading-none rounded w-fit font-bold select-none">
                                      Registro Bloqueado (Imutável)
                                    </div>
                                  )}

                                  {change.justification && (
                                    <div className="text-[10px] text-stone-450 italic max-w-xs select-text">
                                      "{change.justification}"
                                    </div>
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

                <div className="p-3 bg-stone-955 border border-stone-850 rounded text-stone-500 flex items-center justify-between text-[11px] font-mono select-none">
                  <div className="flex items-center gap-1.5 text-stone-400 font-extrabold uppercase text-[9px]">
                    <ShieldCheck className="w-4 h-4 text-stone-400" /> CONTROLE LEGAL DE INTEGRIDADE:
                  </div>
                  <span>Garantia de auditoria estrita • Norma de conformidade FSAE 2026</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'evm' && (
          <EvmDashboard activeProject={activeProject} />
        )}
      </div>

      {/* COMPACT MODAL POPUP FOR ADDING RISKS */}
      {showAddRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-[#121212] border border-stone-800 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-stone-900 p-4 border-b border-stone-800 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-red-500 uppercase font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Registrar Novo Risco
              </h3>
              <button onClick={() => setShowAddRisk(false)} className="text-stone-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateRisk} className="p-4 space-y-4 text-xs font-sans">
              <div>
                <label className="mach-label">Título da Ameaça ou Oportunidade</label>
                <input 
                  type="text" 
                  value={riskTitle} 
                  required
                  onChange={e => setRiskTitle(e.target.value)}
                  placeholder="ex. Trincas na soldagem da manga de alumínio dianteira"
                  className="mach-input"
                />
              </div>

              <div>
                <label className="mach-label">Área Envolvida</label>
                <select value={riskArea} onChange={e => setRiskArea(e.target.value)} className="mach-input select-none text-white bg-stone-950">
                  <option value="Técnico">Técnico (Engenharia / Solda / CNC)</option>
                  <option value="Financeiro">Financeiro (Orçamento / Patrocínio)</option>
                  <option value="Aquisições">Aquisições (Logística / Fornecedores)</option>
                  <option value="Cronograma">Cronograma (Sprint / Prazos)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 select-none">
                <div>
                  <label className="mach-label">Gênero / Categoria</label>
                  <select value={riskCategory} onChange={e => setRiskCategory(e.target.value as any)} className="mach-input text-white bg-stone-950">
                    <option value="threat">Ameaça (Threat)</option>
                    <option value="opportunity">Oportunidade (Opportunity)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="mach-label">P (1-5)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={riskProb} 
                      required 
                      onChange={e => setRiskProb(Number(e.target.value))} 
                      className="mach-input text-center font-mono" 
                    />
                  </div>
                  <div>
                    <label className="mach-label">I (1-5)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={riskImp} 
                      required 
                      onChange={e => setRiskImp(Number(e.target.value))} 
                      className="mach-input text-center font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mach-label">Descrição Breve do Impacto Físico</label>
                <textarea 
                  rows={2} 
                  value={riskDesc} 
                  onChange={e => setRiskDesc(e.target.value)} 
                  placeholder="Rachadura interna devido a vibrações intensas comprometendo a suspensão..." 
                  className="mach-input" 
                />
              </div>

              <div>
                <label className="mach-label text-emerald-500">Plano de Mitigação Técnica (Ação Preventiva)</label>
                <textarea 
                  rows={2} 
                  value={riskMitigation} 
                  onChange={e => setRiskMitigation(e.target.value)} 
                  placeholder="Implementar ensaio líquido penetrante nos pontos de soldadura e regular mapa..." 
                  className="mach-input" 
                />
              </div>

              <div>
                <label className="mach-label text-red-500">Plano de Contingência (Ação Corretiva se Disparar)</label>
                <textarea 
                  rows={2} 
                  value={riskContingency} 
                  onChange={e => setRiskContingency(e.target.value)} 
                  placeholder="Substituir imediatamente pelas peças de reserva usinadas em alumínio premium..." 
                  className="mach-input" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800 select-none">
                <button type="button" onClick={() => setShowAddRisk(false)} className="mach-button-secondary text-xs">Cancelar</button>
                <button type="submit" className="mach-button-primary text-xs font-bold">Salvar Qualificação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
