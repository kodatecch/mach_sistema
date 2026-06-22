import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle,
  HelpCircle,
  Zap, 
  Target, 
  DollarSign, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  Layers,
  ChevronRight,
  Sliders,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Task, Transaction, Risk } from '../types';

interface DashboardProps {
  tasks: Task[];
  transactions: Transaction[];
  risks: Risk[];
  currentDate: string;
  setCurrentDate?: (date: string) => void;
}

export default function Dashboard({ tasks, transactions, risks, currentDate, setCurrentDate }: DashboardProps) {
  const [selectedSeason, setSelectedSeason] = useState<'comparativo' | 'mach2' | 'mach1'>('comparativo');
  const [showTimelineSlider, setShowTimelineSlider] = useState(false);
  const [hoveredWheelParam, setHoveredWheelParam] = useState<string | null>(null);

  const [machWheelScores, setMachWheelScores] = useState<any[]>(() => {
    const data = localStorage.getItem('stem_mach_wheel_scores');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing mach_wheel_scores', e);
      }
    }
    return [
      { id: 'score_eng', projectId: 'proj_fsae_2026', category: 'Engineering Portfolio', scoreBefore: 5.5, scoreAfter: 8.5 },
      { id: 'score_ent', projectId: 'proj_fsae_2026', category: 'Enterprise Portfolio', scoreBefore: 6.0, scoreAfter: 9.0 },
      { id: 'score_soc', projectId: 'proj_fsae_2026', category: 'Social Development / Sustainability Portfolio', scoreBefore: 4.0, scoreAfter: 7.5 },
      { id: 'score_verb', projectId: 'proj_fsae_2026', category: 'Verbal Presentation', scoreBefore: 5.0, scoreAfter: 8.0 },
      { id: 'score_pit', projectId: 'proj_fsae_2026', category: 'Pit Display', scoreBefore: 4.5, scoreAfter: 8.5 },
      { id: 'score_id', projectId: 'proj_fsae_2026', category: 'Team Identity', scoreBefore: 6.5, scoreAfter: 9.5 }
    ];
  });

  const [regulationRules, setRegulationRules] = useState<any[]>(() => {
    const data = localStorage.getItem('stem_regulation_rules');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing regulation_rules', e);
      }
    }
    return [
      { id: 'rule_weight', projectId: 'proj_fsae_2026', parameterName: 'weight_limit_g', limitValue: 50.0, unit: 'g', description: 'Peso mínimo do carrinho sem cartucho de CO2' },
      { id: 'rule_length', projectId: 'proj_fsae_2026', parameterName: 'length_limit_mm', limitValue: 210.0, unit: 'mm', description: 'Comprimento total máximo permitido para o dragster' },
      { id: 'rule_width', projectId: 'proj_fsae_2026', parameterName: 'width_limit_mm', limitValue: 65.0, unit: 'mm', description: 'Largura máxima com as rodas traseiras montadas' },
      { id: 'rule_co2', projectId: 'proj_fsae_2026', parameterName: 'co2_canister_g', limitValue: 8.0, unit: 'g', description: 'Massa padrão do cartucho de gás carbônico descartável' }
    ];
  });

  const categoryDescs: Record<string, string> = {
    'Engineering Portfolio': 'Usinagem CNC de bloco ABS, CFD aerodinâmica, WBS cronograma e projeto mecânico.',
    'Enterprise Portfolio': 'Business plan, captação de patrocínios e fluxo de caixa financeiro.',
    'Social Development / Sustainability Portfolio': 'Projetos sustentáveis (neutralização de CO2), incentivo STEM e impacto comunitário.',
    'Verbal Presentation': 'Apresentação oral e pitch do projeto técnico e administrativo da escuderia.',
    'Pit Display': 'Ergonomia de box, design de interação do estande físico e marketing corporativo.',
    'Team Identity': 'Identidade de marca, uniformes oficiais da escuderia e marketing de mídias sociais.'
  };

  // Format dataset for recharts Radar chart
  const radarData = useMemo(() => {
    return machWheelScores.map(score => ({
      subject: score.category,
      'Temporada Atual (2026)': score.scoreAfter,
      'Temporada Anterior (2025)': score.scoreBefore,
      fullMark: 10,
    }));
  }, [machWheelScores]);

  // Normalize milestones data or generate fallback F1 in Schools milestones
  const milestones = useMemo(() => {
    const list = tasks.filter(t => t.isMilestone);
    if (list.length > 0) {
      return list.slice(0, 5).map(t => ({
        id: t.id,
        name: t.name,
        endDate: t.endDate || t.whenDate || '2026-12-31',
        status: t.status,
        progress: t.progress || (t.status === 'done' || t.status === 'completed' ? 100 : 0)
      }));
    }
    return [
      { id: 'm1', name: 'R1: Briefing de Engenharia & CFD', endDate: '2026-06-30', status: 'done', progress: 100 },
      { id: 'm2', name: 'R2: Usinagem do Bloco Modelo', endDate: '2026-07-15', status: 'in_progress', progress: 60 },
      { id: 'm3', name: 'R3: Pintura e Montagem do Eixo', endDate: '2026-08-10', status: 'pending', progress: 0 },
      { id: 'm4', name: 'R4: Homologação no Trilho CO2', endDate: '2026-09-05', status: 'pending', progress: 0 },
      { id: 'm5', name: 'R5: Estande Físico e Pit Display', endDate: '2026-10-15', status: 'pending', progress: 0 }
    ];
  }, [tasks]);

  // 1. CALCULATE REAL-TIME EVM METRICS
  const evm = useMemo(() => {
    const BAC = tasks.reduce((sum, t) => sum + t.plannedCost, 0);

    const AC = transactions
      .filter(tr => tr.type === 'despesa' || tr.type === 'expense')
      .reduce((sum, tr) => sum + tr.amount, 0);

    const EV = tasks.reduce((sum, t) => sum + (t.plannedCost * (t.progress / 100)), 0);

    const PV = tasks.reduce((sum, t) => {
      const start = new Date(t.startDate).getTime();
      const end = new Date(t.endDate).getTime();
      const current = new Date(currentDate).getTime();

      if (current >= end) {
        return sum + t.plannedCost;
      } else if (current < start) {
        return sum + 0;
      } else {
        const totalDuration = Math.max(end - start, 86400000);
        const elapsed = current - start;
        return sum + t.plannedCost * (elapsed / totalDuration);
      }
    }, 0);

    const CV = EV - AC;
    const SV = EV - PV;
    const CPI = AC > 0 ? EV / AC : 1;
    const SPI = PV > 0 ? EV / PV : 1;

    return {
      BAC,
      PV,
      EV,
      AC,
      CV,
      SV,
      CPI,
      SPI
    };
  }, [tasks, transactions, currentDate]);

  // Generates S-Curve data points sequentially
  const evmHistoryData = useMemo(() => {
    const sortedTasks = [...tasks].sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (sortedTasks.length === 0) return [];

    const minDateStr = sortedTasks[0].startDate;
    const maxDateStr = sortedTasks.reduce((max, t) => t.endDate > max ? t.endDate : max, sortedTasks[0].endDate);

    const start = new Date(minDateStr);
    const end = new Date(maxDateStr);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) || 30;

    const pointsCount = 10;
    const data = [];

    for (let i = 0; i <= pointsCount; i++) {
      const fraction = i / pointsCount;
      const targetTime = start.getTime() + fraction * totalDays * 24 * 3600 * 1000;
      const targetDate = new Date(targetTime);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      let ptPV = 0;
      let ptEV = 0;
      let ptAC = 0;

      tasks.forEach(t => {
        const tStart = new Date(t.startDate).getTime();
        const tEnd = new Date(t.endDate).getTime();

        if (targetTime >= tEnd) {
          ptPV += t.plannedCost;
        } else if (targetTime > tStart) {
          const dur = Math.max(tEnd - tStart, 8640000);
          ptPV += t.plannedCost * ((targetTime - tStart) / dur);
        }
      });

      tasks.forEach(t => {
        const tEnd = new Date(t.endDate).getTime();
        const tStart = new Date(t.startDate).getTime();
        if (targetTime >= tEnd) {
          ptEV += t.plannedCost * (t.progress / 100);
        } else if (targetTime > tStart) {
          ptEV += t.plannedCost * (t.progress / 100) * ((targetTime - tStart) / (tEnd - tStart));
        }
      });

      transactions.forEach(tr => {
        if ((tr.type === 'despesa' || tr.type === 'expense') && tr.date <= targetDateStr) {
          ptAC += tr.amount;
        }
      });

      data.push({
        name: `Etapa ${i}`,
        dataStr: targetDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        'VA (Valor Agregado - EV)': Math.round(ptEV),
        'VP (Valor Planejado - PV)': Math.round(ptPV),
        'CR (Custo Real - AC)': Math.round(ptAC)
      });
    }

    return data;
  }, [tasks, transactions]);

  // 2. DETECT SCOPE DEVIATIONS
  const scopeAlerts = useMemo(() => {
    const alerts: { id: string; type: 'critical' | 'warning'; msg: string; taskName?: string }[] = [];
    const todayMs = new Date(currentDate).getTime();

    tasks.forEach(t => {
      const endMs = new Date(t.endDate).getTime();
      if (t.progress < 100 && todayMs > endMs) {
        alerts.push({
          id: `del-${t.id}`,
          type: 'critical',
          msg: `Vencimento ultrapassado para entrega da tarefa crítica. Progresso atual: ${t.progress}%`,
          taskName: t.name
        });
      } else if (t.progress < 30 && t.status === 'Em execução' && (endMs - todayMs) < 3 * 24 * 3600 * 1000) {
        alerts.push({
          id: `warn-${t.id}`,
          type: 'warning',
          msg: `Tarefa próxima do vencimento com baixo índice de execução.`,
          taskName: t.name
        });
      }
    });

    if (evm.CPI < 0.9 && evm.AC > 0) {
      alerts.push({
        id: 'cpi-alert',
        type: 'critical',
        msg: `CPI Crítico (${evm.CPI.toFixed(2)}): Estouro orçamentário. O Custo Real está significativamente acima do Valor Agregado.`
      });
    } else if (evm.CPI < 0.95 && evm.AC > 0) {
      alerts.push({
        id: 'cpi-warn',
        type: 'warning',
        msg: `Sinalização de desvio financeiro: Custo Real superando as margens de contingência seguras.`
      });
    }

    if (evm.SPI < 0.85) {
      alerts.push({
        id: 'spi-alert',
        type: 'critical',
        msg: `SPI Crítico (${evm.SPI.toFixed(2)}): Ritmo de cronograma comprometido. Taxa abaixo de 85% do planejado.`
      });
    }

    return alerts;
  }, [tasks, evm, currentDate]);

  // 3. RETRIEVE HIGH-PRIORITY CRITICAL RISKS (Risk Score >= 12)
  const criticalRisks = useMemo(() => {
    return risks
      .filter(r => r.probability * r.impact >= 12 && r.status === 'active')
      .sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));
  }, [risks]);

  return (
    <div className="space-y-6" id="mach-dashboard-view">
      
      {/* HEADER HERO AREA - CLEAN LIGHT/DARK CARD */}
      <div className="mach-card md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden" id="dash-header">
        <div>
          <span className="font-mono text-xs uppercase text-[#DC2626] font-bold select-none tracking-wide">
            Operações do Projeto • Tempos e Indicadores Integrados
          </span>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 tracking-tight mt-1">
            Painel Central Mach Control
          </h1>
          <p className="text-xs text-stone-500 max-w-2xl mt-1">
            Análise em tempo real de Valor Agregado (EVM), curva em S físico-financeira e índice de prontidão técnica da Equipe Mach One.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto shrink-0">
          {setCurrentDate && (
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="toggle-slider-opt"
                checked={showTimelineSlider}
                onChange={e => setShowTimelineSlider(e.target.checked)}
                className="rounded border-stone-300 dark:border-stone-800 text-[#DC2626] focus:ring-[#DC2626]"
              />
              <label htmlFor="toggle-slider-opt" className="text-xs font-mono text-stone-500 font-semibold cursor-pointer select-none">
                TIMELINE DINÂMICA
              </label>
            </div>
          )}

          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-1.5 flex flex-col items-end select-none">
            <span className="text-[9px] text-stone-400 font-mono font-bold uppercase">Hoje de Controle</span>
            <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 mt-0.5">
              {new Date(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* OPTIONAL TIMELINE SLIDER CONTROL PANEL */}
      {showTimelineSlider && setCurrentDate && (
        <div className="mach-card bg-stone-50 dark:bg-stone-900/40 p-4 border border-stone-200 dark:border-stone-850 space-y-2 select-none">
          <div className="flex justify-between text-xs text-stone-500 font-mono font-bold">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#DC2626]" /> 
              CONTROLE TIMELINE DE SIMULAÇÃO:
            </span>
            <span className="text-xs text-[#DC2626]">{currentDate}</span>
          </div>
          <input 
            type="range" 
            min="17625"
            max="18100" 
            value={new Date(currentDate).getTime() / 86400000 - 2900} 
            onChange={(e) => {
              const daysFromBase = Number(e.target.value) + 2900;
              const dateMs = daysFromBase * 86400000;
              const dateStr = new Date(dateMs).toISOString().split('T')[0];
              setCurrentDate(dateStr);
            }}
            className="w-full h-1 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
          />
          <div className="flex justify-between text-[10px] text-stone-400 font-mono">
            <span>Inicio da Temporada (Jan 26)</span>
            <span>Final da Temporada (Dez 26)</span>
          </div>
        </div>
      )}

      {/* METRICS ROW (EVM CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="evm-metrics-grid">
        {/* Card 1 */}
        <div className="mach-card hover:border-[#DC2626]/40 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-stone-500 font-mono text-[11px] font-bold">BAC (Orçamento Total)</span>
            <span className="p-1 rounded bg-[#DC2626]/10 text-[#DC2626]">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-mono font-bold text-stone-900 dark:text-stone-100">
              {evm.BAC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-stone-400 font-sans mt-0.5">Base orçamentária EAP</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="mach-card hover:border-slate-400 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-stone-500 font-mono text-[11px] font-bold">PV (Valor Planejado)</span>
            <span className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-mono font-bold text-stone-800 dark:text-stone-200">
              {evm.PV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-stone-400 font-sans mt-0.5">Meta planejada para hoje</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="mach-card hover:border-slate-400 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-stone-500 font-mono text-[11px] font-bold">EV (Valor Agregado)</span>
            <span className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              <Target className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-mono font-bold text-stone-800 dark:text-stone-200">
              {evm.EV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-stone-400 font-sans mt-0.5">Meta física entregue real</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="mach-card hover:border-slate-400 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-stone-500 font-mono text-[11px] font-bold">AC (Custo Real)</span>
            <span className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-mono font-bold text-stone-800 dark:text-stone-200">
              {evm.AC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-stone-400 font-sans mt-0.5">Saídas totais acumuladas</p>
          </div>
        </div>

        {/* Card 5 (CPI vs SPI Panel) */}
        <div className="col-span-2 lg:col-span-1 border border-stone-200 dark:border-stone-850 rounded-lg p-2.5 grid grid-cols-2 gap-2 bg-stone-50 dark:bg-[#121212]/80">
          <div className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800/80 rounded p-1.5 text-center flex flex-col justify-center">
            <span className="text-stone-450 font-mono text-[9px] uppercase font-bold">CPI (Custos)</span>
            <span className={`text-sm font-mono font-bold mt-0.5 ${evm.CPI >= 0.95 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {evm.CPI.toFixed(2)}
            </span>
          </div>
          <div className="bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800/80 rounded p-1.5 text-center flex flex-col justify-center">
            <span className="text-stone-450 font-mono text-[9px] uppercase font-bold">SPI (Prazo)</span>
            <span className={`text-sm font-mono font-bold mt-0.5 ${evm.SPI >= 0.95 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {evm.SPI.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ROADMAP DE MARCOS CRÍTICOS - NEW ADDITION */}
      <div className="mach-card space-y-4" id="roadmap-milestones-card">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-150 flex items-center gap-2">
            <Target className="text-[#DC2626] w-4.5 h-4.5" />
            Roadmap e Progresso de Marcos Críticos (F1 in Schools)
          </h2>
          <span className="text-[10px] font-mono font-bold text-stone-400">
            Frentes de Engenharia e Gestão
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {milestones.map((m: any, idx: number) => {
            const isCompleted = m.status === 'done' || m.progress === 100 || m.status === 'completed';
            const isInProgress = m.status === 'in_progress' || (m.progress > 0 && m.progress < 100);
            return (
              <div 
                key={m.id} 
                className={`p-3 rounded-xl border transition-all ${
                  isCompleted 
                    ? 'bg-emerald-50/10 border-emerald-500/20 dark:border-emerald-500/10 text-emerald-800 dark:text-emerald-300' 
                    : isInProgress 
                      ? 'bg-[#DC2626]/5 border-[#DC2626]/20 dark:border-[#DC2626]/10 shadow-sm' 
                      : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-850'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-mono font-bold text-stone-400">Etapa {idx + 1}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isCompleted 
                      ? 'bg-emerald-500' 
                      : isInProgress 
                        ? 'bg-[#DC2626] animate-pulse' 
                        : 'bg-stone-300 dark:bg-stone-700'
                  }`} />
                </div>
                <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 line-clamp-2 h-8 leading-tight">
                  {m.name}
                </h3>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-stone-500">
                    <span>Progresso</span>
                    <span className={isInProgress ? 'text-[#DC2626] font-bold' : isCompleted ? 'text-emerald-500 font-bold' : ''}>
                      {m.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[#DC2626]'}`} 
                      style={{ width: `${m.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-mono text-stone-400 mt-1.5">
                    Prazo: {new Date(m.endDate || '2026-12-31').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE S-CURVE AND MACH WHEEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-graphics">
        {/* S-CURVE CHART */}
        <div className="lg:col-span-7 mach-card flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-150 flex items-center gap-2">
                  <TrendingUp className="text-[#DC2626] w-4.5 h-4.5" />
                  Curva em S do Projeto (Análise EVM integrada)
                </h2>
                <p className="text-[11px] text-stone-400 mt-0.5">Tendências do valor planejado (PV) vs físico efetivo entregue (EV) e custo real (AC)</p>
              </div>
              <div className="flex gap-2 text-[10px] font-mono select-none">
                <span className="text-stone-500 border border-stone-200 dark:border-stone-800 px-2 py-0.5 rounded bg-stone-50 dark:bg-stone-900">
                  CV: <span className={evm.CV >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{evm.CV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </span>
                <span className="text-stone-500 border border-stone-200 dark:border-stone-800 px-2 py-0.5 rounded bg-stone-50 dark:bg-stone-900">
                  SV: <span className={evm.SV >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{evm.SV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </span>
              </div>
            </div>

            <div className="h-60 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evmHistoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-[#202020]" />
                  <XAxis dataKey="dataStr" stroke="#78716c" fontSize={10} tickLine={false} />
                  <YAxis stroke="#78716c" fontSize={10} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '4px', color: '#1c1917' }}
                    labelStyle={{ color: '#78716c', fontFamily: 'monospace', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line type="monotone" name="VP (Valor Planejado - PV)" dataKey="VP (Valor Planejado - PV)" stroke="#78716c" strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" name="VA (Valor Agregado - EV)" dataKey="VA (Valor Agregado - EV)" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" name="CR (Custo Real - AC)" dataKey="CR (Custo Real - AC)" stroke="#d97706" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="mt-4 p-2.5 bg-stone-50 dark:bg-stone-900/60 rounded border border-stone-150 dark:border-stone-800/80 text-[11px] flex justify-between items-center text-stone-500 font-mono">
            <span>📈 Aderência e desvios de escopo acumulados da temporada F1 in Schools.</span>
            <span>STATUS: <span className={`font-bold ${evm.CPI >= 0.95 && evm.SPI >= 0.95 ? 'text-emerald-600' : 'text-amber-600'}`}>{evm.CPI >= 0.95 && evm.SPI >= 0.95 ? 'CONFORME' : 'ATENÇÃO'}</span></span>
          </div>
        </div>

        {/* RADAR CHART - THE REDESIGNED "MACH WHEEL" WITH PM METRICS */}
        <div className="lg:col-span-5 mach-card flex flex-col justify-between" id="mach-wheel-card">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-150 flex items-center gap-1.5 leading-none">
                  <Zap className="text-[#DC2626] w-4.5 h-4.5" />
                  Mach Wheel — Maturidade em PM
                </h2>
                <p className="text-[11px] text-stone-400 mt-1">Comparativo de performance em Gestão de Projetos: Temporada Atual vs Anterior</p>
              </div>
            </div>

            {/* SELECTION TABS */}
            <div className="grid grid-cols-3 bg-stone-50 dark:bg-stone-950 p-1 rounded border border-stone-200 dark:border-stone-850 text-[10px] font-mono mb-3 select-none">
              <button 
                onClick={() => setSelectedSeason('comparativo')}
                className={`py-1 rounded transition cursor-pointer ${selectedSeason === 'comparativo' ? 'bg-[#DC2626] text-white font-bold' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
              >
                Comparativo
              </button>
              <button 
                onClick={() => setSelectedSeason('mach2')}
                className={`py-1 rounded transition cursor-pointer ${selectedSeason === 'mach2' ? 'bg-[#DC2626] text-white font-bold' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
              >
                Atual (2026)
              </button>
              <button 
                onClick={() => setSelectedSeason('mach1')}
                className={`py-1 rounded transition cursor-pointer ${selectedSeason === 'mach1' ? 'bg-[#DC2626] text-white font-bold' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
              >
                Anterior (2025)
              </button>
            </div>

            {/* RADAR CHART VISUALIZER */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" className="dark:stroke-[#202020]" />
                    <PolarAngleAxis dataKey="subject" stroke="#78716c" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#a8a29e" fontSize={8} />
                    
                    {selectedSeason !== 'mach2' && (
                      <Radar 
                        name="Anterior (2025)" 
                        dataKey="Temporada Anterior (2025)" 
                        stroke="#a8a29e" 
                        fill="#78716c" 
                        fillOpacity={0.15} 
                      />
                    )}
                    {selectedSeason !== 'mach1' && (
                      <Radar 
                        name="Atual (2026)" 
                        dataKey="Temporada Atual (2026)" 
                        stroke="#DC2626" 
                        fill="#DC2626" 
                        fillOpacity={0.25} 
                      />
                    )}
                    <Legend wrapperStyle={{ fontSize: '9px', marginTop: '-5px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* METER DETAILED LIST */}
              <div className="w-full mt-2.5 space-y-1 max-h-44 overflow-y-auto pr-1">
                {machWheelScores.map((score) => {
                  const isHovered = hoveredWheelParam === score.category;
                  const desc = categoryDescs[score.category] || '';
                  return (
                    <div 
                      key={score.category} 
                      className={`p-1.5 rounded transition text-xs border ${
                        isHovered 
                          ? 'bg-stone-50 dark:bg-stone-900 border-[#DC2626]/30' 
                          : 'bg-transparent border-transparent'
                      }`}
                      onMouseEnter={() => setHoveredWheelParam(score.category)}
                      onMouseLeave={() => setHoveredWheelParam(null)}
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                          {isHovered && <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>}
                          {score.category}
                        </span>
                        <div className="font-mono flex items-center gap-2">
                          {selectedSeason !== 'mach2' && (
                            <span className="text-stone-400 line-through text-[10px]">{score.scoreBefore.toFixed(1)}/10</span>
                          )}
                          {selectedSeason !== 'mach1' && (
                            <span className="text-[#DC2626] font-bold text-xs">{score.scoreAfter.toFixed(1)}/10</span>
                          )}
                          {selectedSeason === 'comparativo' && (
                            <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap">
                              (+{Math.round(((score.scoreAfter - score.scoreBefore) / score.scoreBefore) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                      {isHovered && (
                        <p className="text-[10px] text-stone-500 mt-1">
                          {desc}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER ROW: ALERTS AND CRITICAL THREATS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="alerts-and-risks-section">
        {/* SCOPE DEVIATION ALERTS */}
        <div className="mach-card space-y-3">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-150 flex items-center gap-2">
            <AlertTriangle className="text-amber-500 w-4.5 h-4.5" />
            Alertas de Controle & Desvios de Escopo
          </h2>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {scopeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-stone-400 border border-dashed border-stone-200 dark:border-stone-850 rounded bg-stone-50 dark:bg-stone-900/10 text-center">
                <span className="text-emerald-500 font-bold text-lg mb-1 leading-none">✔️</span>
                <p className="text-xs font-semibold">Parâmetros operacionais em total estabilidade!</p>
                <p className="text-[10px] text-stone-500 font-mono mt-0.5">Nenhum desvio crítico detectado nas metas.</p>
              </div>
            ) : (
              scopeAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-2.5 rounded border text-xs flex gap-2 items-start ${
                    alert.type === 'critical' 
                      ? 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-950/40 text-red-700 dark:text-red-300' 
                      : 'bg-amber-50 dark:bg-amber-950/10 border-amber-250 dark:border-amber-950/40 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {alert.type === 'critical' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    {alert.taskName && (
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wide text-stone-400 mb-0.5 select-none">
                        TAREFA: {alert.taskName}
                      </div>
                    )}
                    <p className="font-sans leading-relaxed">{alert.msg}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CRITICAL THREATS & RISKS */}
        <div className="mach-card space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-150 flex items-center gap-2">
              <ShieldAlert className="text-[#DC2626] w-4.5 h-4.5" />
              Resumo de Ameaças Críticas Ativas
            </h2>
            <span className="text-[9px] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded text-[#DC2626] border border-red-100 dark:border-red-950 font-mono font-bold select-none">
              SCORE ≥ 12
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {criticalRisks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-stone-400 border border-dashed border-stone-200 dark:border-stone-850 rounded bg-stone-50 dark:bg-stone-900/10 text-center">
                <span className="text-stone-400 font-bold text-lg mb-1 leading-none">🛡️</span>
                <p className="text-xs font-semibold">Zelo Operacional: Nenhuma ameaça crítica ativa.</p>
                <p className="text-[10px] text-stone-500 font-mono mt-0.5">Mantenha a mitigação preventiva sempre atualizada.</p>
              </div>
            ) : (
              criticalRisks.map((risk) => {
                const score = risk.probability * risk.impact;
                return (
                  <div key={risk.id} className="p-2.5 bg-stone-50 dark:bg-[#121212] border border-stone-150 dark:border-stone-850 rounded flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-stone-850 dark:text-stone-100 leading-tight">{risk.title}</h4>
                      <p className="text-[10.5px] text-stone-400 font-sans mt-0.5 leading-none">
                        Dono da Entrega: <span className="font-semibold text-stone-550">{risk.ownerName}</span>
                      </p>
                      <p className="text-[10px] text-stone-500 bg-white dark:bg-stone-950 p-1.5 rounded border border-stone-100 dark:border-stone-900/80 mt-1 lines-clamp-2 leading-relaxed">
                        <span className="font-bold text-[#DC2626]">Mitigação:</span> {risk.mitigationPlan}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0 mt-0.5">
                      <div className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 text-[#DC2626]">
                        Grau {score}
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 select-none">
                        P:{risk.probability}×I:{risk.impact}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TECHNICAL REGULATION PANEL */}
      <div className="mach-card border border-stone-250 dark:border-stone-850 bg-stone-50 dark:bg-stone-900/40 p-4 rounded-lg space-y-4">
        <details className="group">
          <summary className="flex justify-between items-center font-bold text-sm text-stone-900 dark:text-stone-150 cursor-pointer list-none select-none">
            <span className="flex items-center gap-2">
              <Sliders className="text-[#DC2626] w-4.5 h-4.5" />
              Regulamento Técnico da Temporada (CO2 Dragster)
            </span>
            <span className="text-stone-400 group-open:rotate-180 transition-transform duration-200">▼</span>
          </summary>
          
          <div className="mt-4 space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
            <p className="text-xs text-stone-400 font-sans">
              Esses limites definem as regras técnicas e dimensionais da temporada para o dragster de CO2. 
              Mudanças nestes valores são salvas localmente e integradas dinamicamente às validações de escopo e matriz de riscos.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regulationRules.map((rule) => (
                <div key={rule.id} className="p-3 bg-white dark:bg-stone-950 rounded border border-stone-250 dark:border-stone-850 flex flex-col justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-stone-450 uppercase tracking-wide block">
                      Parâmetro: <code className="text-[#DC2626]">{rule.parameterName}</code>
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{rule.description}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={rule.limitValue}
                      onChange={(e) => {
                        const newVal = parseFloat(e.target.value) || 0;
                        const updatedRules = regulationRules.map(r => r.id === rule.id ? { ...r, limitValue: newVal } : r);
                        setRegulationRules(updatedRules);
                        localStorage.setItem('stem_regulation_rules', JSON.stringify(updatedRules));
                        window.dispatchEvent(new CustomEvent('stem_rules_changed'));
                      }}
                      className="w-24 p-1 text-xs border border-stone-300 dark:border-stone-800 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-center"
                    />
                    <span className="text-xs font-mono text-stone-550 font-bold">{rule.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
