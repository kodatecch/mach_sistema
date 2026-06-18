/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Check, 
  AlertTriangle, 
  Inbox, 
  HelpCircle,
  Eye, 
  Star, 
  Trash2, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp,
  X
} from 'lucide-react';
import { Risk, TeamMember } from '../types';

interface RiskManagementProps {
  risks: Risk[];
  setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
  members: TeamMember[];
}

export default function RiskManagement({ risks, setRisks, members }: RiskManagementProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist' | 'opportunities' | 'threats'>('all');
  const [selectedPI, setSelectedPI] = useState<{ p: number; i: number } | null>(null);
  const [showAddRisk, setShowAddRisk] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'ameaça' | 'oportunidade'>('ameaça');
  const [prob, setProb] = useState(3);
  const [imp, setImp] = useState(3);
  const [status, setStatus] = useState<Risk['status']>('ativo');
  const [watchlist, setWatchlist] = useState(false);
  const [ownerName, setOwnerName] = useState(members[0]?.name || 'João Silva');
  const [mitigation, setMitigation] = useState('');
  const [contingency, setContingency] = useState('');
  const [actualResponse, setActualResponse] = useState('');
  const [efficacy, setEfficacy] = useState<Risk['mitigationEfficacy']>('Não testada');

  // Multi-state selection handler
  const cellColor = (p: number, i: number) => {
    const score = p * i;
    if (score >= 15) return 'bg-rose-600/30 hover:bg-rose-650/40 text-rose-300 border-rose-500/30';
    if (score >= 9) return 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/20';
    return 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/10';
  };

  // Filter risks list
  const filteredRisks = useMemo(() => {
    let result = risks;

    // Filter by quadrant selection from matrix
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

  // Handle addition
  const handleAddNewRisk = (e: React.FormEvent) => {
    e.preventDefault();
    const newRisk: Risk = {
      id: `r_${Date.now()}`,
      title,
      type,
      probability: prob,
      impact: imp,
      score: prob * imp,
      status,
      watchList: watchlist,
      ownerName,
      mitigationPlan: mitigation,
      contingencyPlan: contingency,
      actualResponse: actualResponse || undefined,
      mitigationEfficacy: efficacy
    };

    setRisks(prev => [newRisk, ...prev]);
    setShowAddRisk(false);
    // Reset
    setTitle('');
    setMitigation('');
    setContingency('');
    setActualResponse('');
    setWatchlist(false);
  };

  // Fast action toggle watchlist
  const toggleWatchList = (id: string) => {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, watchList: !r.watchList } : r));
  };

  // Quick state update
  const updateRiskStatus = (id: string, newStats: Risk['status'], resp?: string, eff?: Risk['mitigationEfficacy']) => {
    setRisks(prev => prev.map(r => r.id === id ? { 
      ...r, 
      status: newStats, 
      actualResponse: resp !== undefined ? resp : r.actualResponse,
      mitigationEfficacy: eff !== undefined ? eff : r.mitigationEfficacy
    } : r));
  };

  const removeRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
  };

  // Pre-seed matrix counts
  const cellCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    risks.forEach(r => {
      const key = `${r.probability}-${r.impact}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [risks]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
        <div>
          <h1 className="text-2xl font-bold font-sans text-white">Módulo 4 — Matriz de Riscos & Plano de Resposta</h1>
          <p className="text-xs text-slate-400 mt-1">
            Qualificação sistemática e visual de ameaças de engenharia e oportunidades estratégicas da equipe FSAE, com planos de contingência automatizados.
          </p>
        </div>
        <button 
          onClick={() => {
            setProb(3);
            setImp(3);
            setShowAddRisk(true);
          }}
          className="bg-gradient-to-tr from-pink-500 to-indigo-600 hover:opacity-90 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-pink-500/10"
        >
          <Plus className="w-4 h-4" /> Qualificar Novo Risco
        </button>
      </div>

      {/* MATRIX AND SUMMARY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="risks-matrix-section">
        {/* INTERACTIVE COMPREHENSIVE 5x5 HEATMAP MATRIX */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider">Matriz Probabilidade × Impacto (Especializada)</h2>
              <p className="text-[11px] text-slate-400">Clique em qualquer quadrante para filtrar o registro de riscos correspondente.</p>
            </div>
            {selectedPI && (
              <button 
                onClick={() => setSelectedPI(null)}
                className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-mono hover:bg-slate-755"
              >
                Limpar Filtro [P:{selectedPI.p}, I:{selectedPI.i}] ✕
              </button>
            )}
          </div>

          {/* Graphical Heatmap */}
          <div className="flex flex-col space-y-1">
            {/* Probability ticks */}
            {[5, 4, 3, 2, 1].map((pVal) => (
              <div key={pVal} className="flex items-center gap-1.5">
                {/* Y-Axis scale label */}
                <span className="w-6 text-right font-mono text-[11px] text-slate-400 font-bold pr-1">P:{pVal}</span>
                
                {/* 5 cells on X axis per row */}
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
                        className={`h-11 border rounded-lg font-mono text-center flex flex-col justify-center items-center transition relative ${cellColor(pVal, iVal)} ${
                          isSelected ? 'ring-2 ring-white scale-102 border-white' : ''
                        }`}
                        title={`Probabilidade ${pVal} × Impacto ${iVal} (Score: ${pVal * iVal})`}
                      >
                        {count > 0 && (
                          <span className="bg-slate-950/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-slate-700 shadow-md">
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
            
            {/* X-Axis bottom labels */}
            <div className="flex items-center gap-1.5 pt-1.5">
              <span className="w-6 text-right rotate-[-45deg] font-mono text-[9px] text-slate-500 font-bold select-none">IMP:</span>
              <div className="grid grid-cols-5 gap-1.5 flex-grow text-center">
                {[1, 2, 3, 4, 5].map(iVal => (
                  <span key={iVal} className="font-mono text-[10px] text-slate-400 font-bold">Impacto {iVal}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-4 pt-4 border-t border-slate-800">
            <span>🟢 Baixo Risco (Score 1-8)</span>
            <span>🟡 Médio Risco (Score 9-14)</span>
            <span>🔴 Alto Risco (Score 15-25)</span>
          </div>
        </div>

        {/* CASE STUDY AND RESPONSIVENESS INDEX WIDGET */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4" /> Caso Histórico de Oportunidades: Mach One
            </div>
            <h3 className="text-sm font-bold text-white">Classificação Surpresa para o Campeonato Nacional</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diferente de sistemas de riscos tradicionais, o Mach Control divide riscos físicos entre <span className="text-rose-400 font-bold">Ameaças</span> (visando mitigação técnica) e <span className="text-emerald-400 font-bold">Oportunidades</span> (visando exploração estratégica).
            </p>
            <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> EXPEDIENTE EXECUTADO (2025):
              </div>
              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                "A qualificação surpresa para o campeonato Nacional ocorreu devido ao monitoramento de parcerias surpresas locais. Ao catalogar a probabilidade de contato comercial favorável como Oportunidade Grau 20, a capitania alocou mídias extras e fechou o patrocínio master com usinagem local de moldes sob demanda."
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 border-t border-slate-850 pt-4 mt-4 font-mono">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
              <div className="text-[10px] text-slate-500">AMEAÇAS CATALOGADAS</div>
              <div className="text-lg font-bold text-rose-400 mt-1">{risks.filter(r => r.type === 'ameaça' && r.status === 'ativo').length} Ativas</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
              <div className="text-[10px] text-slate-500">OPORTUNIDADES CONVERTIDAS</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">{risks.filter(r => r.type === 'oportunidade' && r.status === 'ocorrido').length} Concluídas</div>
            </div>
          </div>
        </div>
      </div>

      {/* RISKS VIEW FILTER TABS */}
      <div className="flex border-b border-slate-800 gap-2">
        <button 
          onClick={() => { setActiveTab('all'); setSelectedPI(null); }}
          className={`px-3 py-2 text-xs font-mono border-b-2 font-bold transition -mb-px ${activeTab === 'all' && !selectedPI ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          📂 Todos os Riscos ({risks.length})
        </button>
        <button 
          onClick={() => { setActiveTab('watchlist'); setSelectedPI(null); }}
          className={`px-3 py-2 text-xs font-mono border-b-2 font-bold transition -mb-px ${activeTab === 'watchlist' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          🚨 Lista de Alerta — Watch List ({risks.filter(r => r.watchList).length})
        </button>
        <button 
          onClick={() => { setActiveTab('threats'); setSelectedPI(null); }}
          className={`px-3 py-2 text-xs font-mono border-b-2 font-bold transition -mb-px ${activeTab === 'threats' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          ⛔ Ameaças ({risks.filter(r => r.type === 'ameaça').length})
        </button>
        <button 
          onClick={() => { setActiveTab('opportunities'); setSelectedPI(null); }}
          className={`px-3 py-2 text-xs font-mono border-b-2 font-bold transition -mb-px ${activeTab === 'opportunities' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          💎 Oportunidades ({risks.filter(r => r.type === 'oportunidade').length})
        </button>
      </div>

      {/* RISKS GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="risks-lists-grid">
        {filteredRisks.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-slate-900 border border-slate-800 border-dashed rounded-2xl text-slate-500 flex flex-col items-center justify-center">
            <Inbox className="w-8 h-8 text-slate-655 mb-2" />
            <p className="text-sm font-mono">Nenhum risco compatível com estes critérios de filtragem ativos.</p>
          </div>
        ) : (
          filteredRisks.map((risk) => {
            const score = risk.probability * risk.impact;
            const scoreColor = score >= 15 ? 'text-rose-400 border-rose-500/20' : score >= 9 ? 'text-amber-400 border-amber-500/20' : 'text-emerald-400 border-emerald-500/20';

            return (
              <div 
                key={risk.id} 
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          risk.type === 'ameaça' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {risk.type}
                        </span>
                        {risk.watchList && (
                          <span className="bg-orange-950 border border-orange-900 text-orange-400 font-mono text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1.5">
                            <Star className="w-2.5 h-2.5 text-orange-400 fill-orange-400" /> Watch List
                          </span>
                        )}
                        <span className="font-mono text-slate-500 text-[10px]">Dono: {risk.ownerName}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{risk.title}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs uppercase border ${scoreColor}`}>
                        Score {score}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">P:{risk.probability} × I:{risk.impact}</span>
                    </div>
                  </div>

                  {/* PLANS EXPLANATIONS */}
                  <div className="grid grid-cols-2 gap-3 mt-2 text-[11px] font-mono">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                      <span className="font-bold text-slate-400 uppercase">Ação Mitigadora</span>
                      <p className="text-slate-300 mt-1">{risk.mitigationPlan || 'Sem plano estabelecido'}</p>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                      <span className="font-bold text-rose-400 uppercase">Gatilho / Contingência</span>
                      <p className="text-slate-300 mt-1">{risk.contingencyPlan || 'Sem contingência'}</p>
                    </div>
                  </div>

                  {/* RESPONSE LOG AND POST ACTIVITY */}
                  {risk.actualResponse && (
                    <div className="p-2.5 bg-slate-950 border-l-2 border-indigo-500 rounded-r-lg mt-1 text-[11px]">
                      <div className="flex justify-between items-center text-slate-400 font-mono font-bold mb-1">
                        <span>📝 REGISTRO DE RESPOSTA REAL:</span>
                        <span className={`text-[9px] font-bold px-1 rounded uppercase ${
                          risk.mitigationEfficacy === 'Alta' ? 'bg-emerald-500/10 text-emerald-400' :
                          risk.mitigationEfficacy === 'Média' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          Efeito: {risk.mitigationEfficacy}
                        </span>
                      </div>
                      <p className="text-slate-200 italic">"{risk.actualResponse}"</p>
                    </div>
                  )}
                </div>

                {/* INTERACTIVE ROW SYSTEM CONTROLS */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-3 border-t border-slate-800 gap-3 text-xs">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-mono">MUDAR STATUS:</span>
                    {(['ativo', 'mitigado', 'ocorrido', 'evitado'] as Risk['status'][]).map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          const resp = st === 'ocorrido' && !risk.actualResponse ? prompt('Descreva resumidamente a resposta de contenção executada para este risco:') || '' : undefined;
                          const eff = st === 'mitigado' || st === 'evitado' ? 'Alta' : undefined;
                          updateRiskStatus(risk.id, st, resp, eff);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition uppercase ${
                          risk.status === st 
                            ? 'bg-indigo-600 border-indigo-500 text-white font-bold' 
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => toggleWatchList(risk.id)}
                      className={`p-1.5 rounded border transition ${
                        risk.watchList 
                          ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                          : 'bg-slate-950 border-slate-850 hover:bg-slate-800 text-slate-400'
                      }`}
                      title={risk.watchList ? 'Retirar da Watch List' : 'Marcar na Watch List'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeRisk(risk.id)}
                      className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-rose-950 hover:text-rose-400 rounded text-slate-500 transition"
                      title="Excluir Risco"
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

      {/* DIALOG FOR RISK COMPREHENSION */}
      {showAddRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldAlert className="text-emerald-400 w-4 h-4" />
                Registrar & Qualificar Risco
              </h3>
              <button 
                onClick={() => setShowAddRisk(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewRisk} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">NOME DA AMEAÇA OU OPORTUNIDADE</label>
                <input 
                  type="text" 
                  value={title} 
                  required
                  onChange={e => setTitle(e.target.value)}
                  placeholder="ex. Indisponibilidade de matéria-prima das buchas"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">TIPO DE RISCO</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as 'ameaça' | 'oportunidade')}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="ameaça">Ameaça (Minimizar)</option>
                    <option value="oportunidade">Oportunidade (Explorar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">DONO DO RISCO</label>
                  <select 
                    value={ownerName} 
                    onChange={e => setOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">PROBABILIDADE (1-5)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5"
                    value={prob} 
                    required
                    onChange={e => setProb(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">IMPACTO (1-5)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5"
                    value={imp} 
                    required
                    onChange={e => setImp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PLANO DE MITIGAÇÃO / EXPLORAÇÃO</label>
                <textarea 
                  value={mitigation} 
                  required
                  onChange={e => setMitigation(e.target.value)}
                  placeholder="Quais protocolos reduzem a probabilidade?"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PLANO DE CONTINGÊNCIA (GATILHO DE CONSERVAÇÃO)</label>
                <textarea 
                  value={contingency} 
                  required
                  onChange={e => setContingency(e.target.value)}
                  placeholder="Se o evento ocorrer, qual plano secundário de emergência será acionado?"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <input 
                  type="checkbox" 
                  id="form-watchlist"
                  checked={watchlist} 
                  onChange={e => setWatchlist(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-505"
                />
                <label htmlFor="form-watchlist" className="font-mono text-[10px] text-slate-300 cursor-pointer">Adicionar diretamente na Lista de Alerta (Watch list)</label>
              </div>

              <div className="flex justify-end gap-3.5 border-t border-slate-800 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddRisk(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold px-4 py-2 rounded-xl transition text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl transition text-xs"
                >
                  Confirmar Qualificação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
