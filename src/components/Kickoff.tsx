import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Users, CheckSquare, MessageSquare } from 'lucide-react';
import { KickoffMeeting, TeamMember } from '../types';

interface KickoffProps {
  meetings: KickoffMeeting[];
  setMeetings: React.Dispatch<React.SetStateAction<KickoffMeeting[]>>;
  members: TeamMember[];
}

export default function Kickoff({ meetings, setMeetings, members }: KickoffProps) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(meetings[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-06-17');
  const [facilitator, setFacilitator] = useState(members[0]?.name || '');
  const [summary, setSummary] = useState('');
  
  // Dynamic lists for new meeting
  const [decisions, setDecisions] = useState<string[]>([]);
  const [newDecision, setNewDecision] = useState('');
  
  const [actions, setActions] = useState<{ task: string; assignee: string; date: string }[]>([]);
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState(members[0]?.id || '');
  const [newActionDate, setNewActionDate] = useState('2026-06-17');

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId) || meetings[0];

  const addDecision = () => {
    if (!newDecision.trim()) return;
    setDecisions([...decisions, newDecision.trim()]);
    setNewDecision('');
  };

  const removeDecision = (idx: number) => {
    setDecisions(decisions.filter((_, i) => i !== idx));
  };

  const addAction = () => {
    if (!newActionTask.trim()) return;
    setActions([...actions, {
      task: newActionTask.trim(),
      assignee: newActionAssignee,
      date: newActionDate
    }]);
    setNewActionTask('');
  };

  const removeAction = (idx: number) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const newMeeting: KickoffMeeting = {
      id: `k_${Date.now()}`,
      title: title.trim(),
      date,
      facilitator,
      summary: summary.trim(),
      decisions,
      actions
    };

    setMeetings(prev => [newMeeting, ...prev]);
    setSelectedMeetingId(newMeeting.id);
    setShowAddForm(false);
    
    // Reset states
    setTitle('');
    setSummary('');
    setDecisions([]);
    setActions([]);
  };

  const handleDeleteMeeting = (id: string) => {
    if (meetings.length <= 1) {
      alert('É necessário manter pelo menos um registro de alinhamento kickoff histórico.');
      return;
    }
    const filtered = meetings.filter(m => m.id !== id);
    setMeetings(filtered);
    setSelectedMeetingId(filtered[0].id);
  };

  return (
    <div className="space-y-6" id="kickoff-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <MessageSquare className="w-5.5 h-5.5 text-[#DC2626]" />
            Alinhamento & Kickoffs
          </h1>
          <p className="text-xs text-stone-500 mt-1">Registro formal de resoluções de reuniões de início de fases e alinhamentos cruciais da equipe</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="mach-button-primary text-xs font-bold"
        >
          {showAddForm ? 'Ver Reuniões' : '+ Nova Reunião'}
        </button>
      </div>

      {showAddForm ? (
        /* CREATE MEETING FORM */
        <form onSubmit={handleCreateMeeting} className="mach-card space-y-4 max-w-2xl mx-auto">
          <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-stone-200">Registrar Reunião de Alinhamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mach-label">Título da Reunião</label>
              <input 
                type="text" 
                required
                placeholder="ex. Definição do Tipo de Turbocompressor"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mach-input"
              />
            </div>
            <div>
              <label className="mach-label">Facilitador / Líder</label>
              <select 
                value={facilitator}
                onChange={e => setFacilitator(e.target.value)}
                className="mach-input"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mach-label">Data de Realização</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mach-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="mach-label">Resumo e Objetivo da Reunião</label>
            <textarea 
              rows={3}
              required
              placeholder="Descreva as discussões principais conduzidas..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="mach-input"
            />
          </div>

          {/* DECISION MATRIX */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-4 space-y-3 bg-stone-50 dark:bg-stone-900/40">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">1. Principais Decisões Tomadas</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="ex. Congelamento do entre-eixos em 1530mm"
                value={newDecision}
                onChange={e => setNewDecision(e.target.value)}
                className="mach-input text-xs"
              />
              <button 
                type="button"
                onClick={addDecision}
                className="mach-button bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1 text-xs font-bold rounded"
              >
                Adicionar
              </button>
            </div>
            
            <ul className="space-y-1 mt-2">
              {decisions.map((dec, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white dark:bg-stone-950 p-2 rounded text-xs border border-stone-200 dark:border-stone-850">
                  <span className="text-stone-700 dark:text-stone-300">• {dec}</span>
                  <button 
                    type="button" 
                    onClick={() => removeDecision(idx)}
                    className="text-stone-400 hover:text-red-600 transition"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ACTION REGISTER */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-4 space-y-3 bg-stone-50 dark:bg-stone-900/40">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">2. Ações de Seguimento e Responsabilidades</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input 
                type="text" 
                placeholder="Ação WBS / Tarefa"
                value={newActionTask}
                onChange={e => setNewActionTask(e.target.value)}
                className="mach-input text-xs col-span-1 md:col-span-3"
              />
              <select 
                value={newActionAssignee}
                onChange={e => setNewActionAssignee(e.target.value)}
                className="mach-input text-xs"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
              <input 
                type="date"
                value={newActionDate}
                onChange={e => setNewActionDate(e.target.value)}
                className="mach-input text-xs font-mono"
              />
              <button 
                type="button"
                onClick={addAction}
                className="mach-button bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1 text-xs font-bold rounded"
              >
                + Ação
              </button>
            </div>

            <div className="space-y-1.5 mt-2">
              {actions.map((act, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white dark:bg-stone-950 p-2 rounded text-xs border border-stone-200 dark:border-stone-850">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-200">{act.task}</p>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">Executor: {act.assignee} • Prazo: {act.date}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeAction(idx)}
                    className="text-stone-400 hover:text-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-stone-100 dark:border-stone-850 pt-4">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="mach-button-secondary text-xs"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="mach-button-primary text-xs font-bold"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      ) : (
        /* MEETING SELECTOR AND DETAILS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MEETING LIST PANEL */}
          <div className="lg:col-span-4 space-y-2">
            <span className="mach-label select-none font-bold">Registros Históricos</span>
            {meetings.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Nenhuma reunião registrada.</p>
            ) : (
              meetings.map(m => (
                <div 
                  key={m.id}
                  onClick={() => setSelectedMeetingId(m.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                    selectedMeetingId === m.id || (!selectedMeetingId && meetings[0]?.id === m.id)
                      ? 'bg-stone-100 dark:bg-stone-900 border-stone-300 dark:border-stone-700'
                      : 'bg-white dark:bg-[#121212] border-stone-100 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`}
                >
                  <p className="text-xs font-medium font-mono text-stone-500">{m.date}</p>
                  <h4 className="text-sm font-bold text-stone-850 dark:text-stone-200 mt-1 lines-clamp-1 truncate">{m.title}</h4>
                  <p className="text-[11px] text-stone-400 mt-1 truncate">Facilitador: {m.facilitator}</p>
                </div>
              ))
            )}
          </div>

          {/* MEETING DETAILS DISPLAY */}
          <div className="lg:col-span-8">
            {selectedMeeting ? (
              <div className="mach-card space-y-5">
                <div className="flex justify-between items-start border-b border-stone-100 dark:border-stone-850 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">{selectedMeeting.title}</h2>
                    <span className="text-xs font-mono text-stone-500 mt-1 flex items-center gap-1.5 leading-none">
                      <Calendar className="w-3.5 h-3.5 text-[#DC2626]" /> 
                      {selectedMeeting.date} • Líder: {selectedMeeting.facilitator}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                    className="text-stone-400 hover:text-red-500 transition cursor-pointer p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-900"
                    title="Excluir do histórico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="mach-label">Resumo Executivo</span>
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">{selectedMeeting.summary}</p>
                </div>

                {/* RESOLVED MATRIX CRITERIA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-850 rounded-lg p-4 space-y-3">
                    <span className="mach-label font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 leading-none select-none">
                      <Users className="w-4 h-4 text-emerald-500" /> Decisões Estabelecidas
                    </span>
                    {selectedMeeting.decisions.length === 0 ? (
                      <p className="text-xs text-stone-400 font-sans italic">Não houve listagem formal de decisões.</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedMeeting.decisions.map((dec, idx) => (
                          <li key={idx} className="text-xs text-stone-700 dark:text-stone-300 font-sans flex items-start gap-1.5 select-text">
                            <span className="text-emerald-500 font-extrabold select-none">✓</span>
                            <span>{dec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-850 rounded-lg p-4 space-y-3">
                    <span className="mach-label font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 leading-none select-none">
                      <CheckSquare className="w-4 h-4 text-amber-500" /> Ações e Donos de Entrega
                    </span>
                    {selectedMeeting.actions.length === 0 ? (
                      <p className="text-xs text-stone-400 font-sans italic">Nhum plano de ação registrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedMeeting.actions.map((act, idx) => (
                          <div key={idx} className="text-xs border-b border-stone-100 dark:border-stone-800 pb-1.5 last:border-0 last:pb-0 font-sans">
                            <p className="font-semibold text-stone-800 dark:text-stone-200">{act.task}</p>
                            <p className="text-[10px] text-stone-500 font-semibold mt-0.5">Responsável: {act.assignee} • Prazo: {act.date}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/10 rounded-xl">
                <span>Clique em uma reunião ao lado para visualizar os detalhes.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
