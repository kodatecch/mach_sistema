import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Award, 
  Table, 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Star, 
  Activity, 
  Wrench,
  ThumbsUp,
  Inbox,
  Sparkles,
  Zap,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { TeamMember, Task, RACIRow, PeerReview } from '../types';

interface TeamHealthCheck {
  id: string;
  date: string;
  communication: number; // 1-5
  alignment: number; // 1-5
  motivation: number; // 1-5
  workload: number; // 1-5
  cooperation: number; // 1-5
  observations: string;
}

interface TeamLessonsProps {
  members: TeamMember[];
  setMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  tasks: Task[];
  raciRow: RACIRow[];
  setRaciRow: React.Dispatch<React.SetStateAction<RACIRow[]>>;
}

export default function TeamLessons({ 
  members, 
  setMembers, 
  tasks, 
  raciRow, 
  setRaciRow
}: TeamLessonsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'raci' | 'peer' | 'health'>('skills');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');

  // Persistent Peer reviews with LocalStorage synchronization
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>(() => {
    const local = localStorage.getItem('mach_peer_reviews');
    return local ? JSON.parse(local) : [
      { id: 'p1', reviewerId: 'm1', revieweeId: 'm2', date: '2026-06-15', technicalMetric: 9, commitmentMetric: 10, teamworkMetric: 9, comments: 'Trabalho excelente de simulação CFD que reduziu arrasto em 13%. Muito cooperativa.' },
      { id: 'p2', reviewerId: 'm2', revieweeId: 'm3', date: '2026-06-16', technicalMetric: 8, commitmentMetric: 8, teamworkMetric: 10, comments: 'Pedro entregou os desenhos na data combinada do WBS e aceitou as revisões aerodinâmicas.' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mach_peer_reviews', JSON.stringify(peerReviews));
  }, [peerReviews]);

  // Persistent Team Health Checks bi-weekly
  const [healthChecks, setHealthChecks] = useState<TeamHealthCheck[]>(() => {
    const local = localStorage.getItem('mach_health_checks');
    return local ? JSON.parse(local) : [
      { id: 'h1', date: '25/05/2026', communication: 4, alignment: 4, motivation: 5, workload: 3, cooperation: 5, observations: 'Início da temporada com alta energia. Ajustes no laboratório de manufatura/CNC necessários.' },
      { id: 'h2', date: '08/06/2026', communication: 4, alignment: 5, motivation: 4, workload: 4, cooperation: 5, observations: 'Convergência das modelagens de bico aerodinâmico e entrega dos cronogramas WBS.' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mach_health_checks', JSON.stringify(healthChecks));
  }, [healthChecks]);

  // Peer review form states
  const [reviewer, setReviewer] = useState('m1');
  const [reviewee, setReviewee] = useState('m2');
  const [techGrade, setTechGrade] = useState(8);
  const [commGrade, setCommGrade] = useState(9);
  const [teamGrade, setTeamGrade] = useState(9);
  const [reviewComments, setReviewComments] = useState('');
  const [showAddReview, setShowAddReview] = useState(false);

  // Health check form states
  const [showAddHealth, setShowAddHealth] = useState(false);
  const [hcDate, setHcDate] = useState('2026-06-22');
  const [hcComm, setHcComm] = useState(4);
  const [hcAlin, setHcAlin] = useState(4);
  const [hcMot, setHcMot] = useState(4);
  const [hcWork, setHcWork] = useState(3);
  const [hcCoop, setHcCoop] = useState(5);
  const [hcObs, setHcObs] = useState('');

  const selectedMember = useMemo(() => {
    return members.find(m => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  // Handle RACI change
  const updateRaciCell = (taskId: string, memberId: string, value: 'R' | 'A' | 'C' | 'I' | '') => {
    setRaciRow(prev => {
      const exists = prev.find(row => row.taskId === taskId);
      if (exists) {
        return prev.map(row => row.taskId === taskId ? {
          ...row,
          roles: {
            ...row.roles,
            [memberId]: value
          }
        } : row);
      } else {
        return [...prev, {
          taskId,
          roles: {
            [memberId]: value
          }
        }];
      }
    });
  };

  // Submit peer review
  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewer === reviewee) {
      alert('Selecione um colega diferente de você para qualificar.');
      return;
    }
    const newRev: PeerReview = {
      id: `pr_${Date.now()}`,
      reviewerId: reviewer,
      revieweeId: reviewee,
      date: new Date().toISOString().split('T')[0],
      technicalMetric: techGrade,
      commitmentMetric: commGrade,
      teamworkMetric: teamGrade,
      comments: reviewComments.trim()
    };
    setPeerReviews(prev => [newRev, ...prev]);
    setShowAddReview(false);
    setReviewComments('');
  };

  // Submit health check
  const handleAddHealthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newHc: TeamHealthCheck = {
      id: `hc_${Date.now()}`,
      date: hcDate.split('-').reverse().join('/'),
      communication: Number(hcComm),
      alignment: Number(hcAlin),
      motivation: Number(hcMot),
      workload: Number(hcWork),
      cooperation: Number(hcCoop),
      observations: hcObs.trim() || 'Alinhamento geral estável.'
    };
    setHealthChecks(prev => [...prev, newHc]);
    setShowAddHealth(false);
    setHcObs('');
  };

  const handleDeleteReview = (id: string) => {
    setPeerReviews(prev => prev.filter(r => r.id !== id));
  };

  const handleDeleteHealth = (id: string) => {
    setHealthChecks(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="space-y-6" id="team-sections-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-[#DC2626]" />
            Equipe & Atribuições RACI
          </h1>
          <p className="text-xs text-stone-500 mt-1">Habilidades técnicas da equipe, matriz de responsabilidades, avaliações mútuas periódicas e histórico de saúde do time</p>
        </div>
        <div className="flex gap-2">
          {activeSubTab === 'peer' && (
            <button 
              onClick={() => setShowAddReview(true)}
              className="mach-button-primary text-xs font-bold"
            >
              + Avaliar Parceiro
            </button>
          )}
          {activeSubTab === 'health' && (
            <button 
              onClick={() => setShowAddHealth(true)}
              className="mach-button-primary text-xs font-bold"
            >
              + Registrar Clima Semanal
            </button>
          )}
        </div>
      </div>

      {/* SUBTABS */}
      <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-850 gap-1 select-none">
        <button 
          onClick={() => setActiveSubTab('skills')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'skills' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          👤 Mapa de Habilidades
        </button>
        <button 
          onClick={() => setActiveSubTab('raci')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'raci' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          📋 Matriz RACI
        </button>
        <button 
          onClick={() => setActiveSubTab('peer')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'peer' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          🔄 Peer Review (Feedback)
        </button>
        <button 
          onClick={() => setActiveSubTab('health')}
          className={`px-3 py-2 text-xs font-semibold uppercase border-b-2 transition -mb-px cursor-pointer ${activeSubTab === 'health' ? 'border-[#DC2626] text-[#DC2626] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
        >
          📊 Saúde da Equipe
        </button>
      </div>

      <div className="mach-card" id="team-workspace-box">
        {/* MAPA DE HABILIDADES */}
        {activeSubTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-2 select-none">
              <span className="mach-label font-bold">Integrantes Cadastrados</span>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full p-3 rounded border text-left flex items-center gap-3 transition cursor-pointer ${
                      selectedMemberId === m.id 
                      ? 'border-[#DC2626] bg-red-50/10 dark:bg-red-950/5' 
                      : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                    }`}
                  >
                    <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-800" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-stone-850 dark:text-stone-200">{m.name}</p>
                      <p className="text-[10px] text-stone-450 mt-0.5 truncate">{m.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 bg-stone-50/50 dark:bg-stone-950/40 p-5 rounded border border-stone-200 dark:border-stone-850">
              {selectedMember ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-200 dark:border-stone-850">
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-12 h-12 rounded-full border border-[#DC2626] object-cover" />
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{selectedMember.name}</h3>
                      <p className="text-xs text-[#DC2626] font-mono leading-tight">{selectedMember.role}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-stone-450 block mb-3">Inventário de Proficiências e Skills de Engenharia</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs select-text">
                      {Object.entries(selectedMember.skills).map(([skill, val]) => (
                        <div key={skill} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-850/60 p-3 rounded">
                          <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
                            <span className="font-bold text-stone-700 dark:text-stone-300">{skill}</span>
                            <span className="text-[#DC2626] font-extrabold">{val}%</span>
                          </div>
                          <div className="h-1.5 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden select-none">
                            <div className="h-full bg-[#DC2626] transition-all" style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic text-center py-12">Selecione um membro para verificar o perfil.</p>
              )}
            </div>
          </div>
        )}

        {/* MATRIZ RACI */}
        {activeSubTab === 'raci' && (
          <div className="space-y-4">
            <div className="bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-250 dark:border-stone-850 rounded-lg text-xs leading-relaxed text-stone-550 flex gap-2">
              <Table className="w-4.5 h-4.5 text-[#DC2626] shrink-0 mt-0.5" />
              <p>
                <strong>Matriz de Atribuição de Responsabilidades (RACI):</strong> Controle e distribua papéis organizacionais:
                <span className="font-bold text-stone-800 dark:text-stone-300 ml-1">R (Responsável)</span>, 
                <span className="font-bold text-stone-850 dark:text-stone-300 ml-1">A (Aprovador - Accountable)</span>, 
                <span className="font-bold text-stone-850 dark:text-stone-300 ml-1">C (Consultado)</span>, 
                e <span className="font-bold text-stone-850 dark:text-stone-300 ml-1">I (Informado)</span>.
              </p>
            </div>

            <div className="overflow-x-auto select-text font-mono text-[11px]">
              <div className="min-w-[800px] border border-stone-200 dark:border-stone-850 rounded bg-white dark:bg-[#121212]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-850 text-[10px] uppercase">
                      <th className="p-3">Código WBS & Atividade</th>
                      {members.map(m => (
                        <th key={m.id} className="p-3 text-center border-l border-stone-150 dark:border-stone-850/60 font-sans min-w-[110px]">
                          <p className="text-stone-800 dark:text-stone-200 font-bold">{m.name.split(' ')[0]}</p>
                          <p className="text-[9px] text-[#DC2626] font-mono mt-0.5">{m.role.split(' ')[0]}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150 dark:divide-stone-850">
                    {tasks.map(task => {
                      const matchedRaci = raciRow.find(row => row.taskId === task.id);
                      return (
                        <tr key={task.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/10">
                          <td className="p-3 font-sans">
                            <span className="font-mono text-[#DC2626] font-bold mr-1.5">{task.wbsCode}</span>
                            <span className="text-stone-800 dark:text-stone-300 font-medium">{task.name}</span>
                          </td>

                          {members.map(m => {
                            const currentRole = matchedRaci?.roles?.[m.id] || '';
                            return (
                              <td key={m.id} className="p-3 text-center border-l border-stone-100 dark:border-stone-850/40 select-none">
                                <select
                                  value={currentRole}
                                  onChange={e => updateRaciCell(task.id, m.id, e.target.value as any)}
                                  className={`p-1 text-[10px] font-bold rounded border font-mono focus:outline-none transition-colors ${
                                    currentRole === 'R' ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]' :
                                    currentRole === 'A' ? 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300' :
                                    currentRole === 'C' ? 'border-blue-400 bg-blue-500/10 text-blue-500' :
                                    currentRole === 'I' ? 'border-stone-300 bg-stone-100 dark:border-stone-700 dark:bg-stone-900 text-stone-500' :
                                    'border-stone-200 dark:border-stone-800 bg-transparent text-stone-300 dark:text-stone-600'
                                  }`}
                                >
                                  <option value="">-</option>
                                  <option value="R">R</option>
                                  <option value="A">A</option>
                                  <option value="C">C</option>
                                  <option value="I">I</option>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PEER REVIEW */}
        {activeSubTab === 'peer' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              🔄 Qualifique de forma ética o engajamento técnico mútuo nas entregas dos marcos do cronograma do projeto em Sprints bi-semanais.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {peerReviews.length === 0 ? (
                <p className="col-span-3 text-xs text-stone-400 italic text-center py-10">Nenhuma avaliação cadastrada ainda.</p>
              ) : (
                peerReviews.map(rev => {
                  const revName = members.find(m => m.id === rev.reviewerId)?.name || 'Colega';
                  const reeName = members.find(m => m.id === rev.revieweeId)?.name || 'Integrante';
                  const avg = ((rev.technicalMetric + rev.commitmentMetric + rev.teamworkMetric) / 3).toFixed(1);

                  return (
                    <div key={rev.id} className="p-4 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-850 rounded shadow-sm hover:shadow relative select-text">
                      <button 
                        onClick={() => handleDeleteReview(rev.id)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-[#DC2626] transition-colors cursor-pointer"
                        title="Deletar Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-stone-450 block uppercase">Log de Feedback Individual</span>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{reeName}</h4>
                        <span className="text-[10px] text-stone-400 font-medium">Revisor: {revName}</span>
                        <p className="text-stone-600 dark:text-stone-400 text-xs italic leading-relaxed pt-1 select-text">"{rev.comments}"</p>
                      </div>

                      {/* Score break lines */}
                      <div className="border-t border-stone-150 dark:border-stone-850 mt-3 pt-3 flex justify-between items-center text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <p className="text-stone-450">Técnico: <span className="text-stone-800 dark:text-stone-300 font-bold">{rev.technicalMetric}/10</span></p>
                          <p className="text-stone-450">Comprometimento: <span className="text-stone-800 dark:text-stone-300 font-bold">{rev.commitmentMetric}/10</span></p>
                          <p className="text-stone-450">Trabalho em Equipe: <span className="text-stone-800 dark:text-stone-300 font-bold">{rev.teamworkMetric}/10</span></p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 border border-emerald-250 dark:border-emerald-900 px-3 py-1.5 rounded text-center shrink-0">
                          <p className="text-[8px] leading-none mb-0.5">MÉDIA</p>
                          <p className="text-lg font-bold">{avg}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SAÚDE DA EQUIPE (TEAM HEALTH CHECK) */}
        {activeSubTab === 'health' && (
          <div className="space-y-4 font-sans select-text">
            <div className="bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-250 dark:border-stone-850 rounded-lg text-xs leading-relaxed text-stone-550 flex gap-2">
              <Activity className="w-4.5 h-4.5 text-[#DC2626] shrink-0 mt-0.5" />
              <p>
                <strong>Controle Semanal de Clima Operacional:</strong> Monitore as avaliações de sanidade do time técnico. O score expressa o equilíbrio entre carga de trabalho e dedicação coletiva para evitar o esgotamento (burnout) no projeto F1 in Schools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
              {/* Historical Timeline list */}
              <div className="space-y-3">
                <span className="mach-label font-bold">Ledger de Histórico Praticado</span>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {healthChecks.map(hc => {
                    const avgScore = ((hc.communication + hc.alignment + hc.motivation + hc.workload + hc.cooperation) / 5).toFixed(1);
                    return (
                      <div key={hc.id} className="p-4 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-850 rounded text-xs">
                        <div className="flex justify-between items-start border-b border-stone-150 dark:border-stone-800 pb-2 mb-2">
                          <div>
                            <span className="text-[10px] font-mono bg-stone-100 dark:bg-stone-950 p-1 rounded font-bold text-stone-600 dark:text-stone-350">CICLO: {hc.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-stone-400">Score Médio:</span>
                            <span className="text-sm font-extrabold text-[#DC2626]">{avgScore}/5.0</span>
                            <button 
                              onClick={() => handleDeleteHealth(hc.id)}
                              className="text-stone-400 hover:text-[#DC2626] cursor-pointer pl-2"
                              title="Remover Registro"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <p className="text-stone-600 dark:text-stone-400 text-xs leading-normal select-text mb-2 block">"{hc.observations}"</p>

                        <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[9px] select-none uppercase tracking-wide font-medium text-stone-500">
                          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-1 rounded">COM: {hc.communication}</div>
                          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-1 rounded font-bold text-[#DC2626]">ALN: {hc.alignment}</div>
                          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-1 rounded">MTV: {hc.motivation}</div>
                          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-1 rounded font-bold text-[#DC2626]">CRG: {hc.workload}</div>
                          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 p-1 rounded">COP: {hc.cooperation}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* General Health indices overview cards */}
              <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="mach-label font-bold block mb-3">Métricas Médias Consolidadas</span>
                  <div className="space-y-2.5">
                    {[
                      { key: 'Comunicação Interpessoal', val: (healthChecks.reduce((a, b) => a + b.communication, 0) / (healthChecks.length || 1)).toFixed(1) },
                      { key: 'Clareza de Alinhamento Técnico', val: (healthChecks.reduce((a, b) => a + b.alignment, 0) / (healthChecks.length || 1)).toFixed(1) },
                      { key: 'Motivação & Energia Operacional', val: (healthChecks.reduce((a, b) => a + b.motivation, 0) / (healthChecks.length || 1)).toFixed(1) },
                      { key: 'Nível de Sobrecarga (Workload)', val: (healthChecks.reduce((a, b) => a + b.workload, 0) / (healthChecks.length || 1)).toFixed(1) },
                      { key: 'Cooperação & Trabalho Coletivo', val: (healthChecks.reduce((a, b) => a + b.cooperation, 0) / (healthChecks.length || 1)).toFixed(1) }
                    ].map(idx => (
                      <div key={idx.key} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-stone-700 dark:text-stone-300">{idx.key}</span>
                        <span className="font-mono font-bold text-sm text-[#DC2626]">{idx.val} / 5.0</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-stone-400 font-mono italic leading-relaxed mt-4 border-t border-stone-200 dark:border-stone-850 pt-3 select-none">
                  * Escala bi-semanal de clima interno. Valores ideais encontram-se no limite entre 4.0 e 4.8. Score de sobrecarga baixo (CRG &lt; 2.5) exige balanceamento imediato do cronograma.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PEER REVIEW ADD */}
      {showAddReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-white dark:bg-[#121212] border border-stone-300 dark:border-stone-800 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-[#DC2626] uppercase font-mono">Qualificar Desempenho Bi-semanal</h3>
              <button onClick={() => setShowAddReview(false)} className="text-stone-400 hover:text-stone-800 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="p-4 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mach-label">Avaliador</label>
                  <select value={reviewer} onChange={e => setReviewer(e.target.value)} className="mach-input">
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mach-label font-bold text-[#DC2626]">Membro Avaliado</label>
                  <select value={reviewee} onChange={e => setReviewee(e.target.value)} className="mach-input">
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Rating Sliders */}
              <div className="space-y-3.5 border-t border-b border-stone-150 dark:border-stone-850 py-3 select-none">
                <div>
                  <div className="flex justify-between font-mono text-[10px] font-bold text-stone-500 mb-1">
                    <span>CAPACIDADE TÉCNICA (CAD/FEA)</span>
                    <span className="text-[#DC2626]">{techGrade}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={techGrade} onChange={e => setTechGrade(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[10px] font-bold text-stone-500 mb-1">
                    <span>COMPROMETIMENTO & ENTREGAS</span>
                    <span className="text-[#DC2626]">{commGrade}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={commGrade} onChange={e => setCommGrade(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[10px] font-bold text-stone-500 mb-1">
                    <span>TRABALHO EM EQUIPE</span>
                    <span className="text-[#DC2626]">{teamGrade}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={teamGrade} onChange={e => setTeamGrade(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
              </div>

              <div>
                <label className="mach-label">Comentário / Feedback Construtivo</label>
                <textarea 
                  rows={2} 
                  required
                  value={reviewComments}
                  onChange={e => setReviewComments(e.target.value)}
                  placeholder="ex. Desempenho excelente no dimensionamento de apoios..." 
                  className="mach-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-150 dark:border-stone-850">
                <button type="button" onClick={() => setShowAddReview(false)} className="mach-button-secondary text-xs">Cancelar</button>
                <button type="submit" className="mach-button-primary text-xs font-bold">Salvar Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TEAM HEALTH CHECK ADD */}
      {showAddHealth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-white dark:bg-[#121212] border border-stone-300 dark:border-stone-800 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-[#DC2626] uppercase font-mono">Novo Registro de Clima e Saúde</h3>
              <button onClick={() => setShowAddHealth(false)} className="text-stone-400 hover:text-stone-800 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddHealthSubmit} className="p-4 space-y-4 text-xs font-sans">
              <div>
                <label className="mach-label">Data de Registro</label>
                <input type="date" value={hcDate} onChange={e => setHcDate(e.target.value)} className="mach-input font-mono" />
              </div>

              <div className="space-y-3.5 border-t border-b border-stone-150 dark:border-stone-850 py-3 select-none">
                <div>
                  <div className="flex justify-between font-mono text-[9px] font-bold text-stone-500 mb-1">
                    <span>COMUNICAÇÃO INTERPESSOAL</span>
                    <span className="text-[#DC2626]">{hcComm}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={hcComm} onChange={e => setHcComm(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[9px] font-bold text-stone-500 mb-1">
                    <span>ALINHAMENTO COM OBJETIVOS (WBS)</span>
                    <span className="text-[#DC2626]">{hcAlin}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={hcAlin} onChange={e => setHcAlin(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[9px] font-bold text-stone-500 mb-1">
                    <span>MOTIVAÇÃO & ENERGIA GERAL</span>
                    <span className="text-[#DC2626]">{hcMot}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={hcMot} onChange={e => setHcMot(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[9px] font-bold text-stone-500 mb-1">
                    <span>SOBRECARGA DE TRABALHO GERAL</span>
                    <span className="text-[#DC2626]">{hcWork}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={hcWork} onChange={e => setHcWork(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[9px] font-bold text-stone-500 mb-1">
                    <span>COOPERAÇÃO & SINERGIA</span>
                    <span className="text-[#DC2626]">{hcCoop}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={hcCoop} onChange={e => setHcCoop(Number(e.target.value))} className="w-full h-1 bg-stone-150 dark:bg-stone-800 appearance-none rounded cursor-pointer accent-[#DC2626]" />
                </div>
              </div>

              <div>
                <label className="mach-label">Observações e Ações Preventivas</label>
                <textarea 
                  rows={2} 
                  required
                  value={hcObs}
                  onChange={e => setHcObs(e.target.value)}
                  placeholder="ex. Equipe motivada após teste bem-sucedido de CFD, mas necessita alívio na usinagem CNC..." 
                  className="mach-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-150 dark:border-stone-850">
                <button type="button" onClick={() => setShowAddHealth(false)} className="mach-button-secondary text-xs">Cancelar</button>
                <button type="submit" className="mach-button-primary text-xs font-bold">Gravar Clima</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
