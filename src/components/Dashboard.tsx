/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Task, Transaction, Risk } from '../types';

interface DashboardProps {
  tasks: Task[];
  transactions: Transaction[];
  risks: Risk[];
  currentDate: string;
}

export default function Dashboard({ tasks, transactions, risks, currentDate }: DashboardProps) {
  const [hoveredWheelParam, setHoveredWheelParam] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<'comparativo' | 'mach2' | 'mach1'>('comparativo');

  // Realistic Mach Wheel comparative telemetry data
  const wheelParams = useMemo(() => [
    { name: 'Potência do Motor (HP)', mach1: 76, mach2: 84, unit: 'hp', desc: 'Melhoria no mapa de injeção e coletores impressos em 3D' },
    { name: 'Peso Total (kg)', mach1: 220, mach2: 198, unit: 'kg', desc: 'Alívio de peso com braços de suspensão em fibra de carbono' },
    { name: 'Arrasto Aerodinâmico', mach1: 0.95, mach2: 0.82, unit: 'Cd', desc: 'Dutos S-Duct no bico e asa de triplo elemento otimizada' },
    { name: 'Downforce (N @ 80km/h)', mach1: 450, mach2: 580, unit: 'N', desc: 'Asa traseira redesenhada e extrator com efeito solo' },
    { name: 'Aderência Lateral (G)', mach1: 1.6, mach2: 1.85, unit: 'G', desc: 'Geometria de suspensão anti-squat e novos slicks' },
  ], []);

  // 1. CALCULATE REAL-TIME EVM METRICS
  const evm = useMemo(() => {
    // BAC: Budget at Completion = total planned cost of tasks
    const BAC = tasks.reduce((sum, t) => sum + t.plannedCost, 0);

    // AC: Actual Cost = sum of expenses paid (type "despesa")
    const AC = transactions
      .filter(tr => tr.type === 'despesa') // All expenses
      .reduce((sum, tr) => sum + tr.amount, 0);

    // EV: Earned Value = sum of (plannedCost * progress / 100)
    const EV = tasks.reduce((sum, t) => sum + (t.plannedCost * (t.progress / 100)), 0);

    // PV: Planned Value = calculated based on currentDate relative to start/end dates
    const PV = tasks.reduce((sum, t) => {
      const start = new Date(t.startDate).getTime();
      const end = new Date(t.endDate).getTime();
      const current = new Date(currentDate).getTime();

      if (current >= end) {
        return sum + t.plannedCost; // Should be fully done
      } else if (current < start) {
        return sum + 0; // Not scheduled to begin yet
      } else {
        // Linear schedule value progress
        const totalDuration = Math.max(end - start, 86400000); // at least 1 day
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

  // Generates S-Curve data points sequentially for charting the cumulative values
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

      // Calculate cumulative values for this point in time
      let ptPV = 0;
      let ptEV = 0;
      let ptAC = 0;

      // Cumulative PV on that date
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

      // Cumulative EV on that date (estimated historical build-up based on current status)
      tasks.forEach(t => {
        const tEnd = new Date(t.endDate).getTime();
        const tStart = new Date(t.startDate).getTime();
        // If date is past end, progress is assumed earned if currently complete
        if (targetTime >= tEnd) {
          ptEV += t.plannedCost * (t.progress / 100);
        } else if (targetTime > tStart) {
          // linear interpolation of progress up to the point
          ptEV += t.plannedCost * (t.progress / 100) * ((targetTime - tStart) / (tEnd - tStart));
        }
      });

      // Cumulative AC on that date (sum transactions with dates before or equal)
      transactions.forEach(tr => {
        if (tr.type === 'despesa' && tr.date <= targetDateStr) {
          ptAC += tr.amount;
        }
      });

      // Bound values in reasonable limits
      data.push({
        name: `Seq ${i}`,
        dataStr: targetDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        'VA (Valor Agregado - EV)': Math.round(ptEV),
        'VP (Valor Planejado - PV)': Math.round(ptPV),
        'CR (Custo Real - AC)': Math.round(ptAC)
      });
    }

    return data;
  }, [tasks, transactions]);

  // 2. DETECT SCOPE DEVIATIONS & HEALTH STATUS
  const scopeAlerts = useMemo(() => {
    const alerts: { id: string; type: 'critical' | 'warning'; msg: string; taskName?: string }[] = [];

    // Critical: Task behind schedule
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

    // Cost Deviation Alert
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
        msg: `Sinalização de desvio financeiro: Custo Real superando as margens seguras.`
      });
    }

    // Schedule Deviation Alert
    if (evm.SPI < 0.85) {
      alerts.push({
        id: 'spi-alert',
        type: 'critical',
        msg: `SPI Crítico (${evm.SPI.toFixed(2)}): Atraso de cronograma geral. O ritmo de entregas está abaixo de 85% do planejado.`
      });
    }

    return alerts;
  }, [tasks, evm, currentDate]);

  // 3. RETRIEVE HIGH-PRIORITY CRITICAL RISKS (Risk Score >= 12)
  const criticalRisks = useMemo(() => {
    return risks
      .filter(r => r.probability * r.impact >= 12 && r.status === 'ativo')
      .sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));
  }, [risks]);

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-xl" id="dash-header">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-tr from-pink-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 font-mono text-xs tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-pink-400" />
            Operações do Projeto FSAE — Temporada 2026
          </div>
          <h1 className="text-3xl font-sans font-bold text-white tracking-tight mt-1">
            Mach Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-400 italic">Suite</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Integração das métricas de engenharia automotiva, finanças e cronograma físico do veículo.
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/50 backdrop-blur rounded-xl px-4 py-2 flex flex-col items-end shadow-sm">
          <div className="text-xs text-indigo-300 font-mono">DATA DE CONTROLE DE HOJE</div>
          <div className="text-md font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">
            {new Date(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* METRICS ROW (EVM CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="evm-metrics-grid">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-pink-500/40 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-pink-500 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-[11px]">BAC (Orçamento Base)</span>
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-mono font-bold text-white">
              {evm.BAC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Custo total planejado</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/40 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-indigo-500 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-[11px]">VP (Valor Planejado)</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-mono font-bold text-indigo-400">
              {evm.PV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Meta física para hoje</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-cyan-500/40 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-cyan-400 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-[11px]">VA (Valor Agregado)</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-mono font-bold text-cyan-400">
              {evm.EV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Volume de trabalho concluído</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-pink-500/40 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-pink-400 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-[11px]">CR (Custo Real)</span>
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-mono font-bold text-pink-400">
              {evm.AC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total de saídas financeiras</p>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-2 gap-2 shadow-md hover:border-indigo-500/40 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-indigo-400 transition-all">
          {/* CPI */}
          <div className="bg-slate-950/80 rounded-lg p-2 flex flex-col justify-center border border-slate-800/50">
            <span className="text-slate-500 font-mono text-[10px] uppercase">CPI (Custos)</span>
            <div className={`text-lg font-mono font-bold mt-1 flex items-center gap-1 ${evm.CPI >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {evm.CPI.toFixed(2)}
              {evm.CPI >= 1 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            </div>
            <span className={`text-[9px] font-mono ${evm.CPI >= 1 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
              {evm.CPI >= 1 ? 'Sob orçamento' : 'Estouro'}
            </span>
          </div>

          {/* SPI */}
          <div className="bg-slate-950/80 rounded-lg p-2 flex flex-col justify-center border border-slate-800/50">
            <span className="text-slate-500 font-mono text-[10px] uppercase">SPI (Prazo)</span>
            <div className={`text-lg font-mono font-bold mt-1 flex items-center gap-1 ${evm.SPI >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {evm.SPI.toFixed(2)}
              {evm.SPI >= 1 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            </div>
            <span className={`text-[9px] font-mono ${evm.SPI >= 1 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
              {evm.SPI >= 1 ? 'Adiantado' : 'Atrasado'}
            </span>
          </div>
        </div>
      </div>

      {/* CORE S-CURVE AND MACH WHEEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-graphics">
        {/* S-CURVE CHART */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
                  <TrendingUp className="text-emerald-400 w-5 h-5" />
                  Curva em S do Projeto (Análise EVM)
                </h2>
                <p className="text-xs text-slate-400">Visualização acumulada do progresso e gastos ao longo do tempo</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-slate-400 font-mono border border-slate-800 px-2.5 py-1 rounded-md bg-slate-950">
                  CV: <span className={evm.CV >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{evm.CV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </span>
                <span className="text-slate-400 font-mono border border-slate-800 px-2.5 py-1 rounded-md bg-slate-950">
                  SV: <span className={evm.SV >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{evm.SV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </span>
              </div>
            </div>

            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evmHistoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dataStr" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontFamily: 'monospace' }}
                    itemStyle={{ fontSize: '13px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="VP (Valor Planejado - PV)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="VA (Valor Agregado - EV)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="CR (Custo Real - AC)" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex justify-between items-center text-slate-400 font-mono">
            <div>📈 Tendência de Entrega Física de Trabalho vs Orçamento real consumido.</div>
            <div>STATUS: <span className={`font-bold ${evm.CPI >= 0.95 && evm.SPI >= 0.95 ? 'text-pink-400' : 'text-amber-400'}`}>{evm.CPI >= 0.95 && evm.SPI >= 0.95 ? 'ESTÁVEL' : 'VULNERÁVEL'}</span></div>
          </div>
        </div>

        {/* INTEGRATED MACH WHEEL DIAL */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between" id="mach-wheel-card">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
                  <Zap className="text-pink-500 w-5 h-5 animate-pulse" />
                  Mach Wheel — Análise de Desempenho
                </h2>
                <p className="text-xs text-slate-400">Comparação interativa do protótipo atual (Mach Two) vs anterior (Mach One)</p>
              </div>
            </div>

            {/* SELECTION TABS */}
            <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono mb-4">
              <button 
                onClick={() => setSelectedSeason('comparativo')}
                className={`py-1.5 rounded transition ${selectedSeason === 'comparativo' ? 'bg-gradient-to-tr from-pink-500 to-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Comparativo
              </button>
              <button 
                onClick={() => setSelectedSeason('mach2')}
                className={`py-1.5 rounded transition ${selectedSeason === 'mach2' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Mach Two (2026)
              </button>
              <button 
                onClick={() => setSelectedSeason('mach1')}
                className={`py-1.5 rounded transition ${selectedSeason === 'mach1' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Mach One (2025)
              </button>
            </div>

            {/* WHEEL VISUALIZER */}
            <div className="flex flex-col items-center justify-center p-2 relative">
              <div className="relative w-44 h-44 flex items-center justify-center bg-slate-950 rounded-full border-4 border-slate-800 shadow-inner">
                {/* Visual wheel spinning rings on background */}
                <div className="absolute inset-2 rounded-full border border-dashed border-pink-500/20 animate-spin" style={{ animationDuration: '40s' }}></div>
                <div className="absolute inset-6 rounded-full border border-dashed border-indigo-500/20 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }}></div>
                
                {/* Absolute status pointer or inner circle */}
                <div className="z-10 text-center">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">PRODUTIVIDADE</div>
                  <div className="text-3xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 tracking-tight">
                    {Math.round(evm.SPI * 100)}%
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 font-semibold">Ritmo de Escopo</div>
                </div>

                {/* Simulated parameter dots inside the gauge */}
                {wheelParams.map((p, index) => {
                  const angle = (index * 360) / wheelParams.length;
                  const rad = (angle * Math.PI) / 180;
                  const x = Math.round(50 + 40 * Math.cos(rad));
                  const y = Math.round(50 + 40 * Math.sin(rad));

                  return (
                    <div 
                      key={p.name}
                      onMouseEnter={() => setHoveredWheelParam(p.name)}
                      onMouseLeave={() => setHoveredWheelParam(null)}
                      className="absolute w-3.5 h-3.5 rounded-full cursor-help hover:scale-125 transition-transform flex items-center justify-center bg-slate-900 border border-slate-700 hover:border-pink-400"
                      style={{ top: `${y}%`, left: `${x}%` }}
                    >
                      <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping"></span>
                    </div>
                  );
                })}
              </div>

              {/* METER COMPARISON LIST */}
              <div className="w-full mt-4 space-y-2">
                {wheelParams.map((param) => {
                  const isHovered = hoveredWheelParam === param.name;
                  return (
                    <div 
                      key={param.name} 
                      className={`p-2 rounded-lg border transition ${isHovered ? 'bg-slate-950 border-pink-500/40 shadow-inner' : 'bg-slate-950/40 border-slate-800/80'}`}
                      onMouseEnter={() => setHoveredWheelParam(param.name)}
                      onMouseLeave={() => setHoveredWheelParam(null)}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          {isHovered && <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>}
                          {param.name}
                        </span>
                        <div className="font-mono flex items-center gap-2">
                          {selectedSeason !== 'mach2' && (
                            <span className="text-slate-500 line-through text-[11px]">{param.mach1}{param.unit}</span>
                          )}
                          {selectedSeason !== 'mach1' && (
                            <span className="text-pink-400 font-bold text-[13px]">{param.mach2}{param.unit}</span>
                          )}
                          {selectedSeason === 'comparativo' && (
                            <span className="text-xs text-indigo-400">
                              (+{Math.round(((param.mach2 - param.mach1) / param.mach1) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                      {isHovered && (
                        <p className="text-[10px] text-slate-400 mt-1 transition-all">
                          ℹ️ {param.desc}
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

      {/* LOWER ROW: ALERTS AND CRITICAL RISKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="alerts-and-risks-section">
        {/* SCOPE DEVIATION ALERTS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="text-orange-400 w-5 h-5" />
            Alertas de Controle & Desvio de Escopo
          </h2>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {scopeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <span className="p-3 bg-pink-500/10 rounded-full text-pink-400 mb-2">✔️</span>
                <p className="text-sm">Parâmetros operacionais dentro das margens toleráveis!</p>
                <p className="text-[11px] text-slate-600 font-mono mt-1">Nenhum desvio físico ou financeiro grave detectado.</p>
              </div>
            ) : (
              scopeAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex gap-3.5 items-start ${
                    alert.type === 'critical' 
                      ? 'bg-rose-500/5 border-rose-500/25 text-rose-200' 
                      : 'bg-amber-500/5 border-amber-500/25 text-amber-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {alert.type === 'critical' ? (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    {alert.taskName && (
                      <div className="text-xs font-mono font-bold uppercase tracking-wider mb-0.5 select-none text-slate-400">
                        TAREFA: {alert.taskName}
                      </div>
                    )}
                    <p className="text-sm">{alert.msg}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CRITICAL THREATS & RISKS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-rose-500 w-5 h-5" />
              Resumo de Ameaças Críticas
            </h2>
            <span className="text-[11px] bg-rose-500/10 px-2.5 py-1 rounded-md text-rose-400 border border-rose-500/20 font-mono">
              SCORE ≥ 12
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {criticalRisks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <span className="p-3 bg-slate-500/10 rounded-full text-slate-400 mb-2">🛡️</span>
                <p className="text-sm">Nenhuma ameaça qualificada como crítica ativa!</p>
                <p className="text-[11px] text-slate-600 font-mono mt-1">Monitore o Módulo de Riscos periodicamente.</p>
              </div>
            ) : (
              criticalRisks.map((risk) => {
                const score = risk.probability * risk.impact;
                return (
                  <div key={risk.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-start hover:border-slate-700 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white leading-tight">{risk.title}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        <span className="font-mono text-slate-500">Dono:</span> {risk.ownerName}
                      </p>
                      <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800/60 mt-1">
                        <span className="font-semibold text-rose-400">Mitigação:</span> {risk.mitigationPlan}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                      <div className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
                        Grau {score}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        P:{risk.probability} × I:{risk.impact}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
