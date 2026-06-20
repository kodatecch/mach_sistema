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

export default function EvmDashboard({ activeProject }: EvmDashboardProps) {
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
  const getSemaforoText = (val?: number) => {
    if (val === undefined || val === null) return { color: 'text-stone-500 bg-stone-900 border-stone-800', label: 'Inexistente', barColor: '#78716c' };
    if (val < 0.95) {
      return { 
        color: 'text-red-400 bg-red-950/20 border-red-900/40', 
        label: 'Abaixo do planejado (Crítico)', 
        icon: <TrendingDown className="w-4 h-4 text-red-500" />
      };
    }
    if (val > 1.05) {
      return { 
        color: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40', 
        label: 'Melhor que o planejado (Excelente)', 
        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />
      };
    }
    return { 
      color: 'text-yellow-400 bg-yellow-950/20 border-yellow-900/40', 
      label: 'Dentro da tolerância (Saudável)', 
      icon: <CheckCircle2 className="w-4 h-4 text-yellow-500" />
    };
  };

  const cpiMeta = getSemaforoText(latestMetrics?.cpi);
  const spiMeta = getSemaforoText(latestMetrics?.spi);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-850 pb-4 select-none">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <TrendingUp className="w-4.5 h-4.5 text-red-500" />
            Análise de Valor Agregado (EVM)
          </h3>
          <p className="text-[10px] text-stone-450 mt-0.5">
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
        <div className="bg-emerald-950/30 border border-emerald-900/50 p-3 rounded text-[11px] text-emerald-400 font-sans flex items-center gap-2 animate-pulse leading-none select-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 p-3 rounded text-[11px] text-red-400 font-sans flex items-center gap-2 select-none">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CORE KPI CARDS BOX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPI CARD */}
        <div className="bg-stone-900 border border-stone-850 p-4.5 rounded shadow-sm relative overflow-hidden" id="card_cpi">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-stone-400 uppercase font-black tracking-wider block">CPI Indice</span>
            <div className="w-2.5 h-2.5 rounded-full bg-stone-950 border border-transparent" style={{ backgroundColor: latestMetrics?.cpi && latestMetrics.cpi >= 1.05 ? '#10b981' : (latestMetrics?.cpi && latestMetrics.cpi >= 0.95 ? '#eab308' : '#ef4444') }} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-black text-white">{latestMetrics?.cpi?.toFixed(3) || '1.000'}</span>
            <span className="text-[10px] text-stone-500 font-mono">EV / AC</span>
          </div>

          <div className={`mt-3 py-1.5 px-2.5 rounded text-[9px] border font-mono flex items-center gap-1.5 ${cpiMeta.color}`}>
            {cpiMeta.icon}
            <span>{cpiMeta.label}</span>
          </div>
        </div>

        {/* SPI CARD */}
        <div className="bg-stone-900 border border-stone-850 p-4.5 rounded shadow-sm relative overflow-hidden" id="card_spi">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-stone-400 uppercase font-black tracking-wider block">SPI Indice</span>
            <div className="w-2.5 h-2.5 rounded-full bg-stone-950 border border-transparent" style={{ backgroundColor: latestMetrics?.spi && latestMetrics.spi >= 1.05 ? '#10b981' : (latestMetrics?.spi && latestMetrics.spi >= 0.95 ? '#eab308' : '#ef4444') }} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-black text-white">{latestMetrics?.spi?.toFixed(3) || '1.000'}</span>
            <span className="text-[10px] text-stone-500 font-mono">EV / PV</span>
          </div>

          <div className={`mt-3 py-1.5 px-2.5 rounded text-[9px] border font-mono flex items-center gap-1.5 ${spiMeta.color}`}>
            {spiMeta.icon}
            <span>{spiMeta.label}</span>
          </div>
        </div>

        {/* EAC PROJECTION CARD */}
        <div className="bg-stone-900 border border-stone-850 p-4.5 rounded shadow-sm relative overflow-hidden" id="card_eac">
          <span className="text-[9px] font-mono text-stone-400 uppercase font-black tracking-wider block">Projeção Final (EAC)</span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-lg font-mono font-black text-red-400">{formatBRL(latestMetrics?.eac)}</span>
            <span className="text-[10px] text-stone-500 font-mono">Custos Totais</span>
          </div>
          <p className="text-[9px] text-stone-450 mt-3 flex items-center gap-1.5">
            <span>BAC Orçado:</span>
            <strong className="text-stone-300 font-mono">{formatBRL(latestMetrics?.bac || 0)}</strong>
          </p>
        </div>

        {/* EFFICIENCY / RATINGS */}
        <div className="bg-stone-900 border border-stone-850 p-4.5 rounded shadow-sm relative overflow-hidden" id="card_variation">
          <span className="text-[9px] font-mono text-stone-400 uppercase font-black tracking-wider block">Variação de Ritmo</span>
          <div className="mt-2.5 flex flex-col justify-center">
            {latestMetrics?.cpi !== undefined && latestMetrics.cpi < 1 ? (
              <span className="text-red-400 text-xs font-bold font-mono">Orçamento Estourando</span>
            ) : (
              <span className="text-emerald-400 text-xs font-bold font-mono">Eficiência Financeira Otimizada</span>
            )}

            {latestMetrics?.spi !== undefined && latestMetrics.spi < 1 ? (
              <span className="text-red-400 text-[10px] font-mono mt-1">Sprints de Engenharia em Atraso</span>
            ) : (
              <span className="text-emerald-400 text-[10px] font-mono mt-1">Cronograma de Entrega Saudável</span>
            )}
          </div>
        </div>
      </div>

      {/* S-CURVE GRAPHICS / DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART COL-SPAN-2 */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-850 p-5 rounded shadow">
          <h3 className="text-xs font-bold uppercase text-white tracking-wider font-mono mb-4 flex items-center gap-1.5 select-none">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Curva S de Engenharia (PV vs EV vs AC)
          </h3>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis 
                  dataKey="snapshotDate" 
                  tickFormatter={formatXAxisDate} 
                  stroke="#737373" 
                  fontSize={9} 
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#737373" 
                  fontSize={9} 
                  fontFamily="monospace" 
                  tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c0a09', borderColor: '#262626', borderRadius: '4px' }} 
                  labelStyle={{ color: '#a3a3a3', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                  formatter={(value: number) => [formatBRL(value), '']}
                  labelFormatter={(lbl) => `Data: ${new Date(lbl).toLocaleString('pt-BR', { dateStyle: 'short' })}`}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
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
        <div className="bg-stone-900 border border-stone-850 p-5 rounded shadow flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-white tracking-wider font-mono mb-4 select-none flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" /> Entenda as Métricas EVM
            </h3>

            <div className="space-y-4 text-[11px] leading-relaxed text-stone-400">
              <div>
                <p className="text-stone-300 font-bold uppercase text-[9px] font-mono tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> PV - Planned Value (Valor Planejado)
                </p>
                <p className="mt-1">
                  Soma do custo orçado (soma de <code className="text-stone-300">tasks.how_much</code>) de todas as atividades que deveriam ter sido concluídas até hoje. Representa o orçamento previsto no cronograma de engenharia.
                </p>
              </div>

              <div>
                <p className="text-stone-300 font-bold uppercase text-[9px] font-mono tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> EV - Earned Value (Valor Agregado)
                </p>
                <p className="mt-1">
                  Valor orçado das atividades efetivamente realizadas. Calculado como o custo da atividade vezes seu progresso físico (<code className="text-stone-300">how_much * % concl.</code>). Representa o trabalho que realmente confere valor ao carro.
                </p>
              </div>

              <div>
                <p className="text-stone-300 font-bold uppercase text-[9px] font-mono tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> AC - Actual Cost (Custo Real)
                </p>
                <p className="mt-1">
                  Total de saídas de dinheiro efetivamente pagas no módulo orçamentário até agora. É o dinheiro real debitado da conta da equipe.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-850/60 pt-4 mt-4 text-[10px] text-stone-450 leading-relaxed font-sans">
            📌 O gráfico e projeções acima são sincronizados diretamente com os bancos de dados Postgres, cruzando todas as ordens de tarefas completadas no cronograma dinâmico e o livro de saídas financeiras de caixa da equipe.
          </div>
        </div>
      </div>
    </div>
  );
}
