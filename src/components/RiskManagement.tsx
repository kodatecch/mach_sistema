import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Check, 
  AlertTriangle, 
  Inbox, 
  Eye, 
  Star, 
  Trash2, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { Risk, TeamMember } from '../types';

interface RiskManagementProps {
  risks: Risk[];
  setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
  members: TeamMember[];
}

export default function RiskManagement({ risks, setRisks, members }: RiskManagementProps) {
  const [activeTab, setActiveTabTab] = useState<'all' | 'watchlist' | 'opportunities' | 'threats'>('all');
  const [selectedPI, setSelectedPI] = useState<{ p: number; i: number } | null>(null);
  const [showAddRisk, setShowAddRisk] = useState(false);

  // Inline modal for risk resolution (prompt substitute)
  const [resolvingRiskId, setResolvingRiskId] = useState<string | null>(null);
  const [resolverResponse, setResolverResponse] = useState('');
  const [resolverEfficacy, setResolverEfficacy] = useState<Risk['mitigationEfficacy']>('Alta');

  // Form states for creating a new risk
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'ameaça' | 'oportunidade'>('ameaça');
  const [prob, setProb] = useState(3);
  const [imp, setImp] = useState(3);
  const [status, setStatus] = useState<Risk['status']>('ativo');
  const [watchlist, setWatchlist] = useState(false);
  const [ownerName, setOwnerName] = useState(members[0]?.name || 'João Silva');
  const [mitigation, setMitigation] = useState('');
  const [contingency, setContingency] = useState('');

  const cellColor = (p: number, i: number) => {
    const score = p * i;
    if (score >= 15) return 'bg-red-50 dark:bg-rose-950/20 text-[#DC2626] border-red-200 dark:border-rose-900/60';
    if (score >= 9) return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
    return 'bg-stone-50 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-850';
  };

  const filteredRisks = useMemo(() => {
    let result = risks;

    if (selectedPI) {
      result = result.filter(r => r.probability === selectedPI.p && r.impact === selectedPI.i);
    }

    if (activeTab === 'watchlist') {
      result = result.filter(r => r.watchList);
    } else if (activeTab === 'opportunities') {
      result = result.filter(r => r.type === 'oportunidade');
    } else if (activeTab === 'threats') {
      result = result.filter(r => r.type === 'ameaça');
    }

    return result;
  }, [risks, activeTab, selectedPI]);

  const handleAddNewRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRisk: Risk = {
      id: `r_${Date.now()}`,
      title: title.trim(),
      type,
      probability: prob,
      impact: imp,
      score: prob * imp,
      status,
      watchList: watchlist,
      ownerName,
      mitigationPlan: mitigation,
      contingencyPlan: contingency,
      mitigationEfficacy: 'Não testada'
    };

    setRisks(prev => [newRisk, ...prev]);
    setShowAddRisk(false);
    
    // Reset
    setTitle('');
    setMitigation('');
    setContingency('');
    setWatchlist(false);
  };

  const toggleWatchList = (id: string) => {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, watchList: !r.watchList } : r));
  };

  const handleResolveRiskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRiskId) return;

    setRisks(prev => prev.map(r => r.id === resolvingRiskId ? {
      ...r,
      status: 'ocorrido',
      actualResponse: resolverResponse.trim() || 'Resposta padrão de mitigação executada.',
      mitigationEfficacy: resolverEfficacy
    } : r));

    setResolvingRiskId(null);
    setResolverResponse('');
  };

  const updateRiskStatus = (id: string, newStats: Risk['status']) => {
    if (newStats === 'ocorrido') {
      setResolvingRiskId(id);
      return;
    }

    setRisks(prev => prev.map(r => r.id === id ? {
      ...r,
      status: newStats,
      mitigationEfficacy: newStats === 'mitigado' || newStats === 'evitado' ? 'Alta' : 'Não testada'
    } : r));
  };

  const removeRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
  };

  const cellCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    risks.forEach(r => {
      const key = `${r.probability}-${r.impact}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [risks]);

  return (
    <div className="space-y-6" id="risks-module-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <ShieldAlert className="w-5.5 h-5.5 text-[#DC2626]" />
            Matriz de Riscos & Contramedidas
          </h1>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-2 text-stone-450">
            Qualificação sistemática e visual de ameaças de engenharia e oportunidades estratégicas da equipe FSAE
          </p>
        </div>
        <button 
          onClick={() => {
            setProb(3);
            setImp(3);
            setShowAddRisk(true);
          }}
          className="mach-button-primary text-xs font-bold shrink-0"
        >
          + Qualificar Novo Risco
        </button>
      </div>

      {/* MATRIX AND SUMMARY CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="risks-matrix-section">
        {/* INTERACTIVE COMPREHENSIVE 5x5 HEATMAP MATRIX */}
        <div className="lg:col-span-6 mach-card p-5">
          <div className="flex justify-between items-center mb-4 select-none">
            <div>
              <h2 className="text-xs font-bold uppercase text-stone-800 dark:text-stone-205">Matriz de Probabilidade vs Impacto</h2>
              <p className="text-[10px] text-stone-450 mt-0.5">Filtre seus riscos clicando nos quadrantes correspondentes.</p>
            </div>
            {selectedPI && (
              <button 
                onClick={() => setSelectedPI(null)}
                className="text-[10px] text-[#DC2626] font-mono hover:underline cursor-pointer"
              >
                Limpar Filtro [P:{selectedPI.p}, I:{selectedPI.i}] ✕
              </button>
            )}
          </div>

          <div className="flex flex-col space-y-1 select-none">
            {[5, 4, 3, 2, 1].map((pVal) => (
              <div key={pVal} className="flex items-center gap-2">
                <span className="w-6 text-right font-mono text-[10px] text-stone-450 font-bold pr-1">P:{pVal}</span>
                <div className="grid grid-cols-5 gap-1.5 flex-grow">
                  {[1, 2, 3, 4, 5].map((iVal) => {
                    const cellKey = `${pVal}-${iVal}`;
                    const count = cellCounts[cellKey] || 0;
                    const isSelected = selectedPI?.p === pVal && selectedPI?.i === iVal;

                    return (
                      <button
                        key={iVal}
                        type="button"
                        onClick={() => setSelectedPI({ p: pVal, i: iVal })}
                        className={`h-11 border rounded font-mono text-center flex flex-col justify-center items-center transition cursor-pointer relative ${cellColor(pVal, iVal)} ${
                          isSelected ? 'ring-2 ring-[#DC2626] scale-102 border-transparent' : ''
                        }`}
                        title={`Probabilidade ${pVal} × Impacto ${iVal} (Score: ${pVal * iVal})`}
                      >
                        {count > 0 && (
                          <span className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-extrabold border border-stone-300 dark:border-stone-700 shadow-sm">
                            {count}
                          </span>
                        )}
                        <span className="text-[8px] opacity-40 font-mono absolute bottom-0.5 right-1">
                          {pVal * iVal}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* X-AXIS */}
            <div className="flex items-center gap-2 pt-1.5">
              <span className="w-6 text-right font-mono text-[9px] text-stone-400 font-bold uppercase">IMP:</span>
              <div className="grid grid-cols-5 gap-1.5 flex-grow text-center text-stone-500 text-[10px] font-mono">
                {['Mínimo', 'Menor', 'Médio', 'Forte', 'Gravíssimo'].map((lbl, idx) => (
                  <span key={lbl} className="truncate" title={`Nível ${idx+1}`}>{lbl}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-stone-450 font-mono mt-4 pt-4 border-t border-stone-150 dark:border-stone-850 select-none">
            <span>🟢 Baixo Risco (Score 1-8)</span>
            <span>🟡 Médio Risco (Score 9-14)</span>
            <span>🔴 Alto Risco (Score 15-25)</span>
          </div>
        </div>

        {/* STUDY WIDGET */}
        <div className="lg:col-span-6 bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 p-5 rounded-lg flex flex-col justify-between">
          <div className="space-y-4">
            <span className="flex items-center gap-2 text-[#DC2626] font-mono text-[10px] uppercase font-bold tracking-wider">
              <Compass className="w-4 h-4" /> Diretrizes de Proteção Patrimonial
            </span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-105">Separação Estrutural de Escopo</h3>
            <p className="text-xs text-stone-505 dark:text-stone-400 leading-relaxed select-text">
              Diferente de metodologias lineares convencionais, o Mach Control gerencia de forma ágil <span className="text-red-650 font-bold">Ameaças</span> físicas mecânicas (evitando atrasos) e <span className="text-emerald-600 font-bold">Oportunidades</span> estratégicas comerciais (captação ativa de apoiadores financeiros).
            </p>
            <div className="p-3 bg-white dark:bg-stone-900/60 border border-stone-150 dark:border-stone-850/80 rounded space-y-1">
              <div className="flex items-center gap-1.5 text-[#DC2626] text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5" /> RECOMENDAÇÃO ACADÊMICA:
              </div>
              <p className="text-[11px] text-stone-500 italic leading-relaxed select-text">
                "O monitoramento das tolerâncias de usinagem e fornecimento de tubos polímeros deve ser acompanhado bi-semanalmente. A ausência de redundância nas buchas de suspensão traseira exige mitigação imediata de fornecedores."
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-1 border-t border-stone-200 dark:border-stone-850 pt-4 mt-4 text-xs font-mono select-none">
            <div className="bg-white dark:bg-stone-950/40 p-2 border border-stone-150 dark:border-stone-850 rounded text-center">
              <p className="text-[9px] text-stone-450 uppercase">Ameaças Ativas</p>
              <p className="text-lg font-bold text-red-500 mt-1">{risks.filter(r => r.type === 'ameaça' && r.status === 'ativo').length}</p>
            </div>
            <div className="bg-white dark:bg-stone-950/40 p-2 border border-stone-150 dark:border-stone-850 rounded text-center">
              <p className="text-[9px] text-stone-450 uppercase">Oportunidades Concluídas</p>
              <p className="text-lg font-bold text-emerald-500 mt-1">{risks.filter(r => r.type === 'oportunidade' && r.status === 'ocorrido').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-850 gap-1 select-none text-xs">
        <button 
          onClick={() => { setActiveTabTab('all'); setSelectedPI(null); }}
          className={`px-3 py-2 font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeTab === 'all' && !selectedPI ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          📂 Todos ({risks.length})
        </button>
        <button 
          onClick={() => { setActiveTabTab('watchlist'); setSelectedPI(null); }}
          className={`px-3 py-2 font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeTab === 'watchlist' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          🚨 Alerta — Watch List ({risks.filter(r => r.watchList).length})
        </button>
        <button 
          onClick={() => { setActiveTabTab('threats'); setSelectedPI(null); }}
          className={`px-3 py-2 font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeTab === 'threats' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          ⛔ Ameaças ({risks.filter(r => r.type === 'ameaça').length})
        </button>
        <button 
          onClick={() => { setActiveTabTab('opportunities'); setSelectedPI(null); }}
          className={`px-3 py-2 font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeTab === 'opportunities' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          💎 Oportunidades ({risks.filter(r => r.type === 'oportunidade').length})
        </button>
      </div>

      {/* RISKS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="risks-lists-grid">
        {filteredRisks.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-stone-50 dark:bg-stone-950/20 border border-stone-200 dark:border-stone-850/60 border-dashed rounded flex flex-col items-center justify-center select-none">
            <Inbox className="w-8 h-8 text-stone-400 mb-2" />
            <p className="text-xs text-stone-450 font-mono">Nenhum risco correspondente aos filtros de visualização ativos.</p>
          </div>
        ) : (
          filteredRisks.map((risk) => {
            const score = risk.probability * risk.impact;
            const scoreColor = score >= 15 ? 'text-red-500 border-red-200 bg-red-50/20' : score >= 9 ? 'text-amber-500 border-amber-200 bg-amber-50/20' : 'text-emerald-500 border-emerald-250 bg-emerald-50/20';

            return (
              <div 
                key={risk.id} 
                className="mach-card p-5 hover:shadow-md transition flex flex-col justify-between space-y-4 select-text"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-grow">
                      <div className="flex flex-wrap gap-1.5 items-center select-none text-[9px] font-mono">
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${
                          risk.type === 'ameaça' ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-950 text-[#DC2626]' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-105 dark:border-emerald-950 text-emerald-600'
                        }`}>
                          {risk.type}
                        </span>
                        {risk.watchList && (
                          <span className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-450 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Watch List
                          </span>
                        )}
                        <span className="text-stone-400">Responsável: {risk.ownerName}</span>
                      </div>
                      <h3 className="text-xs font-bold text-stone-850 dark:text-stone-200 tracking-tight leading-normal">{risk.title}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-1 select-none">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${scoreColor}`}>
                        Score {score}
                      </span>
                      <span className="text-[9px] text-stone-400 font-mono">P:{risk.probability} × I:{risk.impact}</span>
                    </div>
                  </div>

                  {/* PLANS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-[11px] font-mono select-text">
                    <div className="p-2.5 bg-stone-50 dark:bg-[#151515] rounded border border-stone-205 dark:border-stone-850">
                      <span className="font-bold text-stone-500 uppercase text-[9px]">Ação Proativa</span>
                      <p className="text-stone-600 dark:text-stone-350 mt-1 italic">"{risk.mitigationPlan || 'Sem plano definido'}"</p>
                    </div>
                    <div className="p-2.5 bg-stone-50 dark:bg-[#151515] rounded border border-stone-205 dark:border-stone-850">
                      <span className="font-bold text-[#DC2626] uppercase text-[9px]">Ação de Contingência</span>
                      <p className="text-stone-600 dark:text-stone-350 mt-1 italic">"{risk.contingencyPlan || 'Sem contingência listada'}"</p>
                    </div>
                  </div>

                  {/* LOG RESOLUTION INFO */}
                  {risk.actualResponse && (
                    <div className="p-2.5 bg-stone-100 dark:bg-stone-900/60 border-l-2 border-[#DC2626] rounded mt-2 text-[11px] select-text">
                      <div className="flex justify-between items-center text-stone-450 font-mono font-bold mb-1 uppercase text-[9px]">
                        <span>Registro de Ocorrência Real:</span>
                        <span className="text-[#DC2626] font-extrabold">Eficácia: {risk.mitigationEfficacy}</span>
                      </div>
                      <p className="text-stone-650 dark:text-stone-300 italic">"{risk.actualResponse}"</p>
                    </div>
                  )}
                </div>

                {/* ROW ACTIONS */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-3 border-t border-stone-100 dark:border-stone-850 gap-2 text-xs select-none">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] text-stone-400 font-mono uppercase font-bold">Status:</span>
                    {(['ativo', 'mitigado', 'ocorrido', 'evitado'] as Risk['status'][]).map(st => (
                      <button
                        key={st}
                        onClick={() => updateRiskStatus(risk.id, st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer uppercase ${
                          risk.status === st 
                            ? 'bg-[#DC2626] border-transparent text-white font-extrabold' 
                            : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => toggleWatchList(risk.id)}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
                        risk.watchList 
                          ? 'bg-amber-100 border-amber-200 text-amber-700' 
                          : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-700'
                      }`}
                      title={risk.watchList ? 'Retirar de Alerta' : 'Adicionar em Alerta'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeRisk(risk.id)}
                      className="p-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-[#DC2626] rounded transition-colors cursor-pointer"
                      title="Deletar Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL RISK ADD */}
      {showAddRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-white dark:bg-[#121212] border border-stone-300 dark:border-stone-800 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-[#DC2626] uppercase font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                Registrar & Qualificar Risco
              </h3>
              <button onClick={() => setShowAddRisk(false)} className="text-stone-400 hover:text-stone-800 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddNewRisk} className="p-4 space-y-4 text-xs font-sans">
              <div>
                <label className="mach-label">Título da Ameaça ou Oportunidade</label>
                <input 
                  type="text" 
                  value={title} 
                  required
                  onChange={e => setTitle(e.target.value)}
                  placeholder="ex. Atraso na entrega dos adaptadores CNC por corte elétrico"
                  className="mach-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mach-label">Tipo de Risco</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="mach-input font-medium">
                    <option value="ameaça">Ameaça (Minimizar)</option>
                    <option value="oportunidade">Oportunidade (Explorar)</option>
                  </select>
                </div>

                <div>
                  <label className="mach-label">Proprietário (Dono)</label>
                  <select value={ownerName} onChange={e => setOwnerName(e.target.value)} className="mach-input font-medium">
                    {members.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mach-label">Probabilidade (1-5)</label>
                  <input type="number" min="1" max="5" value={prob} required onChange={e => setProb(Number(e.target.value))} className="mach-input font-mono text-center" />
                </div>

                <div>
                  <label className="mach-label">Impacto Estimado (1-5)</label>
                  <input type="number" min="1" max="5" value={imp} required onChange={e => setImp(Number(e.target.value))} className="mach-input font-mono text-center" />
                </div>
              </div>

              <div>
                <label className="mach-label">Plano de Mitigação Técnica</label>
                <textarea rows={2} value={mitigation} required onChange={e => setMitigation(e.target.value)} placeholder="Ações tomadas para reduzir a probabilidade ou impacto do evento..." className="mach-input" />
              </div>

              <div>
                <label className="mach-label font-bold text-[#DC2626]">Plano de Contingência (Plano B)</label>
                <textarea rows={2} value={contingency} required onChange={e => setContingency(e.target.value)} placeholder="Se o evento ocorrer de fato, o que faremos para conter o estrago..." className="mach-input" />
              </div>

              <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900 p-2.5 border border-stone-200 dark:border-stone-800 rounded select-none">
                <input type="checkbox" id="form-wl" checked={watchlist} onChange={e => setWatchlist(e.target.checked)} className="w-4 h-4 text-[#DC2626]" />
                <label htmlFor="form-wl" className="font-mono text-[10px] text-stone-500 cursor-pointer">Adicionar às prioridades da Watch List</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-150 dark:border-stone-850">
                <button type="button" onClick={() => setShowAddRisk(false)} className="mach-button-secondary text-xs">Cancelar</button>
                <button type="submit" className="mach-button-primary text-xs font-bold">Salvar Qualificação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION RESPONSE MODAL (Substitute for browser prompt()) */}
      {resolvingRiskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-white dark:bg-[#121212] border border-stone-300 dark:border-stone-800 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-[#DC2626] uppercase font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#DC2626]" /> 
                Registrar Resposta Contingente Real
              </h3>
              <button onClick={() => setResolvingRiskId(null)} className="text-stone-400 hover:text-stone-800 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleResolveRiskSubmit} className="p-4 space-y-4 text-xs font-sans">
              <div>
                <label className="mach-label">Ações de Resposta e Consequências de Contenção</label>
                <textarea 
                  rows={3} 
                  required
                  value={resolverResponse}
                  onChange={e => setResolverResponse(e.target.value)}
                  placeholder="ex. Acionado fornecedor de contingência em São Paulo. O custo extra de R$ 400 foi coberto pela reserva de contingências acumuladas..." 
                  className="mach-input"
                />
              </div>

              <div>
                <label className="mach-label">Eficácia Geral Recomendada</label>
                <select 
                  value={resolverEfficacy} 
                  onChange={e => setResolverEfficacy(e.target.value as any)}
                  className="mach-input font-medium"
                >
                  <option value="Alta">Alta (Incidente mitigado totalmente)</option>
                  <option value="Média">Média (Atraso aceitável, impacto financeiro baixo)</option>
                  <option value="Baixa">Baixa (Problemas técnicos residuais persistentes)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-150 dark:border-stone-850">
                <button type="button" onClick={() => setResolvingRiskId(null)} className="mach-button-secondary text-xs">Cancelar</button>
                <button type="submit" className="mach-button-primary text-xs font-bold">Salvar Resposta de Risco</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
