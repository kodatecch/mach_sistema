import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  TrendingDown,
  Calendar,
  Sparkles,
  DollarSign,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Project } from '../types';

interface EvmDashboardProps {
  activeProject: Project;
  isDark?: boolean;
}

interface EvmSnapshotData {
  id: string;
  projectId: string;
  snapshotDate: string;
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  bac: number;
  eac: number;
}

export default function EvmDashboard({ activeProject, isDark = true }: EvmDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<EvmSnapshotData[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<Partial<EvmSnapshotData> | null>(null);

  const apiBase = 'http://localhost:3001';

  const fetchEvmData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        'Authorization': 'Bearer dev-token',
        'x-project-id': activeProject.id,
        'projectId': activeProject.id
      };

      // 1. Fetch series for the S-Curve
      const resSeries = await fetch(`${apiBase}/evm/series?projectId=${activeProject.id}`, { headers });
      if (!resSeries.ok) {
        throw new Error('Falha ao buscar a série histórica de EVM.');
      }
      const dataSeries = await resSeries.json();
      setSeriesData(dataSeries);

      // 2. Fetch latest snapshot (the closest one to today)
      const resLatest = await fetch(`${apiBase}/evm/snapshot?projectId=${activeProject.id}`, { headers });
      if (resLatest.ok) {
        const dataLatest = await resLatest.json();
        setLatestMetrics(dataLatest);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro inesperado ao buscar dados do EVM.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvmData();
  }, [activeProject.id]);

  const handleRecalculate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const headers = {
        'Authorization': 'Bearer dev-token',
        'x-project-id': activeProject.id,
        'projectId': activeProject.id
      };

      const resRecalc = await fetch(`${apiBase}/evm/recalculate?projectId=${activeProject.id}`, {
        method: 'POST',
        headers
      });

      if (!resRecalc.ok) {
        throw new Error('Falha ao recalcular snapshot.');
      }

      setSuccessMsg('Métricas de EVM recalculadas com sucesso para hoje!');
      setTimeout(() => setSuccessMsg(null), 4000);
      
      // Refresh S-curve and metrics
      await fetchEvmData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao recalcular os indicadores.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatBRL = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper to get traffic light color/badge for CPI & SPI
  // Red (val < 0.95), Yellow (val >= 0.95 && val <= 1.05), Green (val > 1.05)
  const getSemaforoText = (val?: number, isDark = true) => {
    if (val === undefined || val === null) {
      return { 
        color: isDark ? 'text-stone-500 bg-stone-900 border-stone-800' : 'text-stone-600 bg-stone-100 border-stone-200', 
        label: 'Inexistente', 
        barColor: '#78716c' 
      };
    }
    if (val < 0.95) {
      return { 
        color: isDark ? 'text-red-400 bg-red-950/20 border-red-900/40' : 'text-red-700 bg-red-50 border-red-200 font-semibold', 
        label: 'Abaixo do planejado (Crítico)', 
        icon: <TrendingDown className="w-4 h-4 text-red-500" />
      };
    }
    if (val > 1.05) {
      return { 
        color: isDark ? 'text-emerald-450 bg-emerald-950/20 border-emerald-900/40' : 'text-emerald-700 bg-emerald-50 border-emerald-250 font-semibold', 
        label: 'Melhor que o planejado (Excelente)', 
        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />
      };
    }
    return { 
      color: isDark ? 'text-yellow-450 bg-yellow-950/20 border-yellow-900/40' : 'text-yellow-800 bg-yellow-50 border-yellow-250 font-semibold', 
      label: 'Dentro da tolerância (Saudável)', 
      icon: <CheckCircle2 className="w-4 h-4 text-yellow-500" />
    };
  };

  const cpiMeta = getSemaforoText(latestMetrics?.cpi, isDark);
  const spiMeta = getSemaforoText(latestMetrics?.spi, isDark);

  // Format dates nicely on the X axis
  const formatXAxisDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pt-2 select-text" id="evm_dashboard_main">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 select-none ${
        isDark ? 'border-stone-850' : 'border-stone-200'
      }`}>
        <div>
          <h3 className={`text-sm font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            <TrendingUp className="w-4.5 h-4.5 text-red-500" />
            Análise de Valor Agregado (EVM)
          </h3>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-450' : 'text-stone-500'}`}>
            Monitoramento de custos e prazos do projeto cruzando dados do Cronograma e Orçamento.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="mach-button-primary text-[10px] uppercase font-mono tracking-widest font-bold px-3 py-1.5 rounded cursor-pointer transition flex items-center gap-1.5 self-stretch sm:self-auto text-center justify-center"
          id="btn_recalculate_evm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalcular agora
        </button>
      </div>

      {successMsg && (
        <div className={`p-3 rounded text-[11px] font-sans flex items-center gap-2 animate-pulse leading-none select-none border ${
          isDark 
            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className={`p-3 rounded text-[11px] font-sans flex items-center gap-2 select-none border ${
          isDark 
            ? 'bg-red-950/30 border-red-900/50 text-red-400' 
            : 'bg-red-50 border-red-200 text-red-700 font-semibold'
        }`}>
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CORE KPI CARDS BOX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPI CARD */}
        <div className={`p-4.5 rounded shadow-sm relative overflow-hidden border ${
          isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
        }`} id="card_cpi">
          <div className="flex justify-between items-start">
            <span className={`text-[9px] font-mono uppercase font-black tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>CPI Indice</span>
            <div className={`w-2.5 h-2.5 rounded-full border ${isDark ? 'bg-stone-950 border-transparent' : 'bg-stone-105 border-stone-200'}`} style={{ backgroundColor: latestMetrics?.cpi && latestMetrics.cpi >= 1.05 ? '#10b981' : (latestMetrics?.cpi && latestMetrics.cpi >= 0.95 ? '#eab308' : '#ef4444') }} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className={`text-xl font-mono font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{latestMetrics?.cpi?.toFixed(3) || '1.000'}</span>
            <span className="text-[10px] text-stone-500 font-mono">EV / AC</span>
          </div>

          <div className={`mt-3 py-1.5 px-2.5 rounded text-[9px] border font-mono flex items-center gap-1.5 ${cpiMeta.color}`}>
            {cpiMeta.icon}
            <span>{cpiMeta.label}</span>
          </div>
        </div>

        {/* SPI CARD */}
        <div className={`p-4.5 rounded shadow-sm relative overflow-hidden border ${
          isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
        }`} id="card_spi">
          <div className="flex justify-between items-start">
            <span className={`text-[9px] font-mono uppercase font-black tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>SPI Indice</span>
            <div className={`w-2.5 h-2.5 rounded-full border ${isDark ? 'bg-stone-950 border-transparent' : 'bg-stone-105 border-stone-200'}`} style={{ backgroundColor: latestMetrics?.spi && latestMetrics.spi >= 1.05 ? '#10b981' : (latestMetrics?.spi && latestMetrics.spi >= 0.95 ? '#eab308' : '#ef4444') }} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className={`text-xl font-mono font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{latestMetrics?.spi?.toFixed(3) || '1.000'}</span>
            <span className="text-[10px] text-stone-500 font-mono">EV / PV</span>
          </div>

          <div className={`mt-3 py-1.5 px-2.5 rounded text-[9px] border font-mono flex items-center gap-1.5 ${spiMeta.color}`}>
            {spiMeta.icon}
            <span>{spiMeta.label}</span>
          </div>
        </div>

        {/* EAC PROJECTION CARD */}
        <div className={`p-4.5 rounded shadow-sm relative overflow-hidden border ${
          isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
        }`} id="card_eac">
          <span className={`text-[9px] font-mono uppercase font-black tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Projeção Final (EAC)</span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className={`text-lg font-mono font-black ${isDark ? 'text-red-400' : 'text-red-650'}`}>{formatBRL(latestMetrics?.eac)}</span>
            <span className="text-[10px] text-stone-500 font-mono">Custos Totais</span>
          </div>
          <p className={`text-[9px] mt-3 flex items-center gap-1.5 ${isDark ? 'text-stone-450' : 'text-stone-500'}`}>
            <span>BAC Orçado:</span>
            <strong className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>{formatBRL(latestMetrics?.bac || 0)}</strong>
          </p>
        </div>

        {/* EFFICIENCY / RATINGS */}
        <div className={`p-4.5 rounded shadow-sm relative overflow-hidden border ${
          isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
        }`} id="card_variation">
          <span className={`text-[9px] font-mono uppercase font-black tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Variação de Ritmo</span>
          <div className="mt-2.5 flex flex-col justify-center">
            {latestMetrics?.cpi !== undefined && latestMetrics.cpi < 1 ? (
              <span className="text-red-600 dark:text-red-400 text-xs font-bold font-mono">Orçamento Estourando</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">Eficiência Financeira Otimizada</span>
            )}

            {latestMetrics?.spi !== undefined && latestMetrics.spi < 1 ? (
              <span className="text-red-600 dark:text-red-400 text-[10px] font-mono mt-1">Sprints de Engenharia em Atraso</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-mono mt-1">Cronograma de Entrega Saudável</span>
            )}
          </div>
        </div>
      </div>

      {/* S-CURVE GRAPHICS / DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART COL-SPAN-2 */}
        <div className={`p-5 rounded border ${
          isDark ? 'bg-stone-900 border-stone-850 shadow' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5 select-none ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Curva S de Engenharia (PV vs EV vs AC)
          </h3>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#262626" : "#e5e5e5"} />
                <XAxis 
                  dataKey="snapshotDate" 
                  tickFormatter={formatXAxisDate} 
                  stroke={isDark ? "#737373" : "#525252"} 
                  fontSize={9} 
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke={isDark ? "#737373" : "#525252"} 
                  fontSize={9} 
                  fontFamily="monospace" 
                  tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0c0a09' : '#ffffff', 
                    borderColor: isDark ? '#262626' : '#d4d4d8', 
                    borderRadius: '4px',
                    color: isDark ? '#fff' : '#000'
                  }} 
                  labelStyle={{ color: isDark ? '#a3a3a3' : '#27272a', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                  formatter={(value: number) => [formatBRL(value), '']}
                  labelFormatter={(lbl) => `Data: ${new Date(lbl).toLocaleString('pt-BR', { dateStyle: 'short' })}`}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: isDark ? '#d4d4d4' : '#27272a' }}
                  verticalAlign="top" 
                  height={36} 
                />
                <Line 
                  name="PV (Valor Planejado)" 
                  type="monotone" 
                  dataKey="pv" 
                  stroke="#f97316" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 5 }} 
                />
                <Line 
                  name="EV (Valor Agregado)" 
                  type="monotone" 
                  dataKey="ev" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 5 }} 
                />
                <Line 
                  name="AC (Custo Real)" 
                  type="monotone" 
                  dataKey="ac" 
                  stroke="#ef4444" 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MATHEMATICAL EXPLANATIONS & PROJECTIONS */}
        <div className={`p-5 rounded flex flex-col justify-between border ${
          isDark ? 'bg-stone-900 border-stone-850 shadow' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono mb-4 select-none flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}>
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" /> Entenda as Métricas EVM
            </h3>

            <div className={`space-y-4 text-[11px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-605'}`}>
              <div>
                <p className={`font-bold uppercase text-[9px] font-mono tracking-wider flex items-center gap-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> PV - Planned Value (Valor Planejado)
                </p>
                <p className="mt-1">
                  Soma do custo orçado (soma de <code className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-800 bg-stone-100 px-1 rounded'}`}>tasks.how_much</code>) de todas as atividades que deveriam ter sido concluídas até hoje. Representa o orçamento previsto no cronograma de engenharia.
                </p>
              </div>

              <div>
                <p className={`font-bold uppercase text-[9px] font-mono tracking-wider flex items-center gap-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> EV - Earned Value (Valor Agregado)
                </p>
                <p className="mt-1">
                  Valor orçado das atividades efetivamente realizadas. Calculado como o custo da atividade vezes seu progresso físico (<code className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-800 bg-stone-100 px-1 rounded'}`}>how_much * % concl.</code>). Representa o trabalho que realmente confere valor ao carro.
                </p>
              </div>

              <div>
                <p className={`font-bold uppercase text-[9px] font-mono tracking-wider flex items-center gap-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> AC - Actual Cost (Custo Real)
                </p>
                <p className="mt-1">
                  Total de saídas de dinheiro efetivamente pagas no módulo orçamentário até agora. É o dinheiro real debitado da conta da equipe.
                </p>
              </div>
            </div>
          </div>

          <div className={`pt-4 mt-4 text-[10px] leading-relaxed font-sans border-t ${
            isDark ? 'border-stone-850/60 text-stone-450' : 'border-stone-200 text-stone-500'
          }`}>
            📌 O gráfico e projeções acima são sincronizados diretamente com os bancos de dados Postgres, cruzando todas as ordens de tarefas completadas no cronograma dinâmico e o livro de saídas financeiras de caixa da equipe.
          </div>
        </div>
      </div>
    </div>
  );
}
