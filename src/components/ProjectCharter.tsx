import React, { useState } from 'react';
import { FileText, Save, CheckCircle, Plus, Trash2, Calendar } from 'lucide-react';
import { ProjectCharter } from '../types';

interface ProjectCharterProps {
  charter: ProjectCharter;
  setCharter: React.Dispatch<React.SetStateAction<ProjectCharter>>;
}

export default function ProjectCharterModule({ charter, setCharter }: ProjectCharterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ProjectCharter>({ ...charter });

  // Milestones local form states
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('2026-06-17');

  const handleSave = () => {
    setCharter(formState);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormState({ ...charter });
    setIsEditing(false);
  };

  const addMilestone = () => {
    if (!newMilestoneDesc.trim()) return;
    setFormState(prev => ({
      ...prev,
      milestones: [...prev.milestones, { description: newMilestoneDesc, date: newMilestoneDate }]
    }));
    setNewMilestoneDesc('');
  };

  const removeMilestone = (idx: number) => {
    setFormState(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="space-y-6" id="charter-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 select-text flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-[#DC2626]" />
            TAP — Termo de Abertura do Projeto
          </h1>
          <p className="text-xs text-stone-500 mt-1">Definição formal do escopo, principais entregas, premissas e marcos do protótipo Mach 2026</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                className="mach-button-secondary text-xs font-semibold py-1.5 px-3"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="mach-button-primary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar TAP
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                setFormState({ ...charter });
                setIsEditing(true);
              }}
              className="mach-button bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white hover:bg-stone-850 text-xs font-bold py-1.5 px-3"
            >
              Editar Termo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DOCUMENT METRICS AND FIELDS */}
        <div className="lg:col-span-2 space-y-4">
          {/* TITLE SECTION */}
          <div className="mach-card space-y-3">
            <div>
              <span className="mach-label">Título da Temporada</span>
              {isEditing ? (
                <input 
                  type="text"
                  value={formState.title}
                  onChange={e => setFormState({ ...formState, title: e.target.value })}
                  className="mach-input font-bold"
                />
              ) : (
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{charter.title}</h3>
              )}
            </div>
          </div>

          {/* OBJECTIVES & JUSTIFICATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mach-card space-y-2">
              <span className="mach-label text-[#DC2626]">Objetivos Estratégicos</span>
              {isEditing ? (
                <textarea 
                  rows={4}
                  value={formState.objectives}
                  onChange={e => setFormState({ ...formState, objectives: e.target.value })}
                  className="mach-input"
                />
              ) : (
                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{charter.objectives}</p>
              )}
            </div>

            <div className="mach-card space-y-2">
              <span className="mach-label">Justificativa da Organização</span>
              {isEditing ? (
                <textarea 
                  rows={4}
                  value={formState.justification}
                  onChange={e => setFormState({ ...formState, justification: e.target.value })}
                  className="mach-input"
                />
              ) : (
                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{charter.justification}</p>
              )}
            </div>
          </div>

          {/* SCOPE IN / OUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mach-card space-y-2 border-l-2 border-l-emerald-500">
              <span className="mach-label text-emerald-600 dark:text-emerald-400 font-bold">O que está Incluído (Escopo Aceito)</span>
              {isEditing ? (
                <textarea 
                  rows={4}
                  value={formState.scopeIn}
                  onChange={e => setFormState({ ...formState, scopeIn: e.target.value })}
                  className="mach-input"
                />
              ) : (
                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{charter.scopeIn}</p>
              )}
            </div>

            <div className="mach-card space-y-2 border-l-2 border-l-stone-400">
              <span className="mach-label text-stone-600 dark:text-stone-400 font-bold">O que NÃO está Incluído (Exclusões)</span>
              {isEditing ? (
                <textarea 
                  rows={4}
                  value={formState.scopeOut}
                  onChange={e => setFormState({ ...formState, scopeOut: e.target.value })}
                  className="mach-input"
                />
              ) : (
                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{charter.scopeOut}</p>
              )}
            </div>
          </div>

          {/* ASSUMPTIONS */}
          <div className="mach-card space-y-2">
            <span className="mach-label">Premissas e Restrições Críticas</span>
            {isEditing ? (
              <textarea 
                rows={3}
                value={formState.assumptions}
                onChange={e => setFormState({ ...formState, assumptions: e.target.value })}
                className="mach-input"
              />
            ) : (
              <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{charter.assumptions}</p>
            )}
          </div>
        </div>

        {/* MILESTONES COLUMN */}
        <div className="space-y-4">
          <div className="mach-card space-y-3">
            <span className="mach-label font-bold text-stone-850 dark:text-stone-100 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#DC2626]" /> 
              Marcos de Entrega (Milestones)
            </span>

            {/* List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(isEditing ? formState : charter).milestones.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center">Nenhum marco cadastrado.</p>
              ) : (
                (isEditing ? formState : charter).milestones.map((ms, idx) => (
                  <div key={idx} className="p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-stone-800 dark:text-stone-200">{ms.description}</p>
                      <p className="text-[10px] text-stone-500 font-mono mt-0.5">{ms.date}</p>
                    </div>
                    {isEditing && (
                      <button 
                        onClick={() => removeMilestone(idx)}
                        className="text-stone-400 hover:text-red-500 transition cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Milestone Inline */}
            {isEditing && (
              <div className="border-t border-stone-200 dark:border-stone-850 pt-3 space-y-2">
                <span className="text-[10px] font-bold text-stone-400 block uppercase">Adicionar Marco</span>
                <input 
                  type="text"
                  placeholder="ex. Congelar projeto de suspensão"
                  value={newMilestoneDesc}
                  onChange={e => setNewMilestoneDesc(e.target.value)}
                  className="mach-input text-xs"
                />
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={newMilestoneDate}
                    onChange={e => setNewMilestoneDate(e.target.value)}
                    className="mach-input text-xs font-mono"
                  />
                  <button 
                    onClick={addMilestone}
                    className="mach-button bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 py-1 px-3 text-xs font-bold rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border border-stone-200 dark:border-stone-850 rounded-lg text-xs space-y-1.5 text-stone-500">
            <span className="font-bold text-stone-800 dark:text-stone-300">ℹ️ Alinhamento de Metas de Engenharia</span>
            <p>O TAP assegura que as metas operacionais de engenharia — como o peso ideal do protótipo e os índices aerodinâmicos — estejam perfeitamente alinhadas com as expectativas do orientador e patrocinadores acadêmicos antes de iniciar as atividades no cronograma.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
