/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Award, 
  Table, 
  FileText, 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  CheckSquare, 
  ChevronRight, 
  Star, 
  Activity, 
  Wrench,
  ThumbsUp,
  Inbox,
  Sparkles
} from 'lucide-react';
import { TeamMember, Task, RACIRow, LessonLearned, PeerReview } from '../types';

interface TeamLessonsProps {
  members: TeamMember[];
  setMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  tasks: Task[];
  raciRow: RACIRow[];
  setRaciRow: React.Dispatch<React.SetStateAction<RACIRow[]>>;
  lessons: LessonLearned[];
  setLessons: React.Dispatch<React.SetStateAction<LessonLearned[]>>;
}

export default function TeamLessons({ 
  members, 
  setMembers, 
  tasks, 
  raciRow, 
  setRaciRow, 
  lessons, 
  setLessons 
}: TeamLessonsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'raci' | 'peer' | 'lessons'>('skills');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');

  // Peer review lists
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([
    { id: 'p1', reviewerId: 'm1', revieweeId: 'm2', date: '2026-06-15', technicalMetric: 9, commitmentMetric: 10, teamworkMetric: 9, comments: 'Trabalho excelente de simulação CFD que reduziu arrasto em 13%. Muito cooperativa.' },
    { id: 'p2', reviewerId: 'm2', revieweeId: 'm3', date: '2026-06-16', technicalMetric: 8, commitmentMetric: 8, teamworkMetric: 10, comments: 'Pedro entregou os desenhos dentro do prazo e aceitou todas as retificações aerodinâmicas.' }
  ]);

  // Peer review form states
  const [reviewer, setReviewer] = useState('m1');
  const [reviewee, setReviewee] = useState('m2');
  const [techGrade, setTechGrade] = useState(8);
  const [commGrade, setCommGrade] = useState(9);
  const [teamGrade, setTeamGrade] = useState(9);
  const [reviewComments, setReviewComments] = useState('');
  const [showAddReview, setShowAddReview] = useState(false);

  // Lesson learned form states
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonCategory, setLessonCategory] = useState('Manufatura / Compósitos');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonMitigation, setLessonMitigation] = useState('');
  const [lessonEfficacy, setLessonEfficacy] = useState<'Sucesso' | 'Parcial' | 'Falha'>('Sucesso');
  const [showAddLesson, setShowAddLesson] = useState(false);

  // Skill definitions to scan
  const allSkillKeys = ['CAD', 'FEA', 'CFD', 'Usinagem', 'Solda', 'Compósitos', 'Eletrônica', 'Programação', 'Telemetria', 'Dinâmica', 'Gestão', 'Organização', 'Marketing'];

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
      alert('Selecione um colega diferente de você para avaliar.');
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
      comments: reviewComments
    };
    setPeerReviews(prev => [newRev, ...prev]);
    setShowAddReview(false);
    setReviewComments('');
  };

  // Submit lesson learned
  const handleAddLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newL: LessonLearned = {
      id: `l_${Date.now()}`,
      topic: lessonTopic,
      category: lessonCategory,
      description: lessonDescription,
      mitigationApplied: lessonMitigation,
      efficacy: lessonEfficacy,
      date: new Date().toISOString().split('T')[0]
    };
    setLessons(prev => [newL, ...prev]);
    setShowAddLesson(false);
    // Reset
    setLessonTopic('');
    setLessonDescription('');
    setLessonMitigation('');
  };

  // Delete Lesson
  const handleDeleteLesson = (id: string) => {
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  // Delete Review
  const handleDeleteReview = (id: string) => {
    setPeerReviews(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
        <div>
          <h1 className="text-2xl font-bold font-sans text-white">Módulo 6 — Equipe, RACI & Lições Aprendidas</h1>
          <p className="text-xs text-slate-400 mt-1">
            Mapeamento de habilidades técnicas da engenharia automotiva, matriz de atribuição de responsabilidades (RACI), feedback loops periódicos e base de lições aprendidas.
          </p>
        </div>
        <div className="flex gap-2">
          {activeSubTab === 'peer' && (
            <button 
              onClick={() => setShowAddReview(true)}
              className="bg-gradient-to-tr from-pink-500 to-indigo-600 hover:opacity-90 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-pink-500/10"
            >
              <Plus className="w-4 h-4" /> Nova Avaliação Peer
            </button>
          )}
          {activeSubTab === 'lessons' && (
            <button 
              onClick={() => setShowAddLesson(true)}
              className="bg-gradient-to-tr from-pink-500 to-indigo-600 hover:opacity-90 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-pink-500/10"
            >
              <Plus className="w-4 h-4" /> Registrar Lição Aprendida
            </button>
          )}
        </div>
      </div>

      {/* CORE NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 gap-2">
        <button 
          onClick={() => setActiveSubTab('skills')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'skills' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          👤 Radar de Habilidades (Skills map)
        </button>
        <button 
          onClick={() => setActiveSubTab('raci')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'raci' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          📋 Matriz RACI do Projeto
        </button>
        <button 
          onClick={() => setActiveSubTab('peer')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'peer' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          🔄 Avaliação Self / Peer
        </button>
        <button 
          onClick={() => setActiveSubTab('lessons')}
          className={`px-4 py-2.5 font-sans text-xs font-semibold tracking-wide uppercase border-b-2 transition -mb-px ${activeSubTab === 'lessons' ? 'border-pink-500 text-pink-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          💡 Histórico de Lições Aprendidas
        </button>
      </div>

      {/* RENDER ACTIVE TABS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[380px]">
        
        {/* SUBTAB SKILLS RADAR MAP */}
        {activeSubTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* List left side */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Membros da Oficina e Telemetria</span>
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition ${
                    selectedMemberId === m.id 
                    ? 'ring-2 ring-pink-500 border-pink-500 bg-slate-950' 
                    : 'bg-slate-950/60 border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full border border-slate-805 object-cover" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white leading-none">{m.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{m.role}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Radar metrics visualization right side */}
            <div className="lg:col-span-8 bg-slate-950 p-6 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              {selectedMember ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-14 h-14 rounded-full border-2 border-emerald-400 object-cover" />
                    <div>
                      <h2 className="text-base font-bold text-white font-sans">{selectedMember.name}</h2>
                      <p className="text-xs text-emerald-400 font-mono">{selectedMember.role}</p>
                    </div>
                  </div>

                  {/* Skills bar details */}
                  <div>
                    <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <Award className="w-4 h-4 text-emerald-400" /> Mapa de Qualificação Técnica de Engenharia
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedMember.skills).map(([skill, val]) => (
                        <div key={skill} className="bg-slate-900 border border-slate-850 p-3 rounded-lg space-y-1.5 hover:border-slate-750 transition">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-300 font-semibold">{skill}</span>
                            <span className="text-emerald-400 font-bold">{val}%</span>
                          </div>
                          {/* Progress bar visual */}
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-350"
                              style={{ width: `${val}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-600 font-mono text-xs">Selecione um membro da equipe para auditar.</div>
              )}

              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-[10px] text-slate-400 font-mono mt-6">
                💡 O mapa de competências alinha eficientemente a atribuição ao preencher o cronograma de fabricação físico na oficina mecânica.
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB RACI MATRIX */}
        {activeSubTab === 'raci' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-xs text-slate-400">
              <span className="font-bold text-white uppercase font-mono">Matriz de Atribuição de Responsabilidades (RACI):</span>
              <p className="mt-1">
                Selecione qual papel cada membro desempenha para as principais tarefas do projeto:
                <code className="text-emerald-400 font-bold ml-1.5">R (Responsável)</code>,
                <code className="text-indigo-400 font-bold ml-1">A (Aprovador - Accountable)</code>,
                <code className="text-amber-400 font-bold ml-1">C (Consultado)</code>,
                <code className="text-slate-405 font-bold ml-1">I (Informado)</code>.
              </p>
            </div>

            {/* Interactive tabular RACI matrix */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Código WBS & Atividade</th>
                    {members.map(m => (
                      <th key={m.id} className="p-3 text-center border-l border-slate-800/60 font-sans min-w-[120px]">
                        <div className="text-white font-bold leading-none">{m.name.split(' ')[0]}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1">{m.role.split(' ')[0]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tasks.map(task => {
                    const matchedRaci = raciRow.find(row => row.taskId === task.id);

                    return (
                      <tr key={task.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3">
                          <span className="text-emerald-400 font-bold font-mono mr-1">{task.wbsCode}</span>
                          <span className="text-slate-300 font-sans font-semibold">{task.name}</span>
                        </td>

                        {members.map(member => {
                          const currentRole = matchedRaci?.roles?.[member.id] || '';

                          return (
                            <td key={member.id} className="p-3 text-center border-l border-slate-800/60">
                              <select
                                value={currentRole}
                                onChange={(e) => updateRaciCell(task.id, member.id, e.target.value as 'R' | 'A' | 'C' | 'I' | '')}
                                className={`p-1 text-[10px] font-bold rounded border focus:outline-none transition font-mono ${
                                  currentRole === 'R' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' :
                                  currentRole === 'A' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' :
                                  currentRole === 'C' ? 'border-amber-500 bg-amber-500/10 text-amber-400' :
                                  currentRole === 'I' ? 'border-slate-700 bg-slate-900 text-slate-400' :
                                  'border-slate-800 bg-slate-950 text-slate-600'
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
        )}

        {/* SUBTAB BIWEEKLY PEER REVIEW */}
        {activeSubTab === 'peer' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-2">
              🔄 Registre avaliações de desempenho bi-semanal auto-gerenciadas. Compare notas médias de engajamento técnico, comprometimento e companheirismo coletivo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {peerReviews.length === 0 ? (
                <div className="col-span-3 text-center py-10 text-slate-650 font-mono border rounded-xl">Não há avaliações cadastradas.</div>
              ) : (
                peerReviews.map((rev) => {
                  const reviewerName = members.find(m => m.id === rev.reviewerId)?.name || 'Colega';
                  const revieweeName = members.find(m => m.id === rev.revieweeId)?.name || 'Membro';
                  const avg = ((rev.technicalMetric + rev.commitmentMetric + rev.teamworkMetric) / 3).toFixed(1);

                  return (
                    <div key={rev.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition space-y-4 shadow-md relative">
                      <button 
                        onClick={() => handleDeleteReview(rev.id)}
                        className="absolute top-4 right-4 text-slate-600 hover:text-rose-455 transition"
                        title="Deletar Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1.5">
                        <span className="font-mono text-[9px] text-slate-500 block uppercase">Avaliação Bi-semanal de Rendimento</span>
                        <h4 className="text-white font-bold font-sans text-xs flex items-center gap-1.5">
                          {revieweeName}
                          <span className="text-[10px] text-slate-400 font-normal">por {reviewerName}</span>
                        </h4>
                        <div className="text-[11px] text-slate-350 italic leading-relaxed pt-1.5">
                          "{rev.comments}"
                        </div>
                      </div>

                      {/* Grades breakdown list */}
                      <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <div className="text-slate-500">Técnico: <span className="text-slate-300 font-bold">{rev.technicalMetric}/10</span></div>
                          <div className="text-slate-500">Entrega: <span className="text-slate-300 font-bold">{rev.commitmentMetric}/10</span></div>
                          <div className="text-slate-500">Sinergia: <span className="text-slate-300 font-bold">{rev.teamworkMetric}/10</span></div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-center shrink-0">
                          <div className="text-[9px] text-emerald-500 uppercase leading-none select-none">MÉDIA</div>
                          <div className="text-lg font-bold text-emerald-400 mt-1">{avg}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SUBTAB LESSONS LEARNED DATABASE */}
        {activeSubTab === 'lessons' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-2">
              💡 Registre lições técnicas decorrentes do protótipo FSAE anterior (como aerodinâmica, laminação, problemas de ECU) a fim de perpetuar a engenharia da equipe.
            </p>

            <div className="space-y-3.5">
              {lessons.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 text-slate-600 font-mono">
                  Base de conhecimento vazia.
                </div>
              ) : (
                lessons.map((les) => (
                  <div key={les.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between items-start gap-4 hover:border-slate-700 transition">
                    <div className="space-y-2 flex-grow">
                      <div className="flex gap-2 items-center">
                        <span className="font-mono text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-indigo-400 uppercase font-bold">{les.category}</span>
                        <span className="text-[9px] font-mono text-slate-500">{les.date}</span>
                      </div>
                      <h4 className="font-sans font-bold text-white text-xs leading-normal">{les.topic}</h4>
                      
                      <div className="grid grid-cols-2 gap-3 mt-1.5 text-xs">
                        <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850/80">
                          <span className="font-mono font-bold text-slate-500 text-[10px] uppercase block">Problema detectado / Contexto</span>
                          <p className="text-slate-350 mt-1 italic">"{les.description}"</p>
                        </div>
                        <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850/80">
                          <span className="font-mono font-bold text-emerald-400 text-[10px] uppercase block">Instrução preventiva aplicada</span>
                          <p className="text-slate-300 mt-1">"{les.mitigationApplied}"</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 ml-1.5">
                      <span className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] border tracking-wider select-none ${
                        les.efficacy === 'Sucesso' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        les.efficacy === 'Parcial' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-rose-500/10 border-rose-550/20 text-rose-400'
                      }`}>
                        EFICÀCIA: {les.efficacy.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDeleteLesson(les.id)}
                        className="text-slate-500 hover:text-rose-440 p-1.5 mt-2 transition"
                        title="Deletar lição"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK PEER DIALOG */}
      {showAddReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center font-mono text-xs">
              <h3 className="text-white font-bold flex items-center gap-1.5">
                <ClipboardCheck className="text-emerald-400 w-4 h-4" /> Qualificar Desempenho Bi-semanal
              </h3>
              <button onClick={() => setShowAddReview(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">AVALIADOR</label>
                  <select 
                    value={reviewer} 
                    onChange={e => setReviewer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">MEMBRO AVALIADO</label>
                  <select 
                    value={reviewee} 
                    onChange={e => setReviewee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slider inputs for metrics */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>CAPACIDADE TÉCNICA (CAD/FEA/CFD)</span>
                    <span className="text-emerald-400 font-bold">{techGrade}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={techGrade} onChange={e => setTechGrade(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>COMPROMETIMENTO & ENTREGAS DOS PRAZOS</span>
                    <span className="text-emerald-400 font-bold">{commGrade}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={commGrade} onChange={e => setCommGrade(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>COMPANHEIRISMO & TRABALHO EM EQUIPE</span>
                    <span className="text-emerald-400 font-bold">{teamGrade}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={teamGrade} onChange={e => setTeamGrade(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">COMENTÁRIOS E FEEDBACK DETALHADO</label>
                <textarea 
                  value={reviewComments} 
                  required
                  onChange={e => setReviewComments(e.target.value)}
                  placeholder="Descreva pontos positivos e oportunidades técnicas de crescimento..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none h-16 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3.5 border-t border-slate-800 pt-4">
                <button type="button" onClick={() => setShowAddReview(false)} className="bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="bg-emerald-500 font-extrabold text-slate-950 px-4 py-2 rounded-xl text-xs">Salvar Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LESSON LEARNED DIALOG */}
      {showAddLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center font-mono text-xs">
              <h3 className="text-white font-bold flex items-center gap-1.5">
                <ThumbsUp className="text-emerald-400 w-4 h-4" /> Qualificar Lição de Aprendizado
              </h3>
              <button onClick={() => setShowAddLesson(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleAddLessonSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">FUNÇÃO / TÓPICO DO EVENTO</label>
                <input 
                  type="text" 
                  value={lessonTopic} 
                  required
                  onChange={e => setLessonTopic(e.target.value)}
                  placeholder="ex. Quebra frequente nos prisioneiros de roda CNC"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">CATEGORIA TÉCNICA</label>
                  <select 
                    value={lessonCategory} 
                    onChange={e => setLessonCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:outline-none"
                  >
                    <option value="Manufatura / Compósitos">Aerodinâmica / Compósitos</option>
                    <option value="Frenagem / Suspensão">Frenagem / Suspensão</option>
                    <option value="Eletrônica / Computadores">Eletrônica & Computação</option>
                    <option value="Chassis / FEA">Chassis & FEA</option>
                    <option value="Administração / Projetos">Administração & Patrocínios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">EFICÀCIA GERAL DA RESPOSTA</label>
                  <select 
                    value={lessonEfficacy} 
                    onChange={e => setLessonEfficacy(e.target.value as 'Sucesso' | 'Parcial' | 'Falha')}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs"
                  >
                    <option value="Sucesso">Sucesso Completo (Problema resolvido)</option>
                    <option value="Parcial">Mitigação Parcial (Risco residual sob investigação)</option>
                    <option value="Falha">Tentativa de Mitigação ineficaz</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">DESCRITIVO DO PROBLEMA DO AUTOMÓVEL</label>
                <textarea 
                  value={lessonDescription} 
                  required
                  onChange={e => setLessonDescription(e.target.value)}
                  placeholder="O que falhou de forma severa e por quê?"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none h-16 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">MITIGAÇÃO / INSTRUÇÃO TÉCNICA INCORPORADA</label>
                <textarea 
                  value={lessonMitigation} 
                  required
                  onChange={e => setLessonMitigation(e.target.value)}
                  placeholder="Como alteramos o projeto ou a produção para assegurar que isso não ocorra no próximo carro?"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none h-16 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3.5 border-t border-slate-800 pt-4">
                <button type="button" onClick={() => setShowAddLesson(false)} className="bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="bg-emerald-500 font-extrabold text-slate-950 px-4 py-2 rounded-xl text-xs">Anexar à Base de Conhecimento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
