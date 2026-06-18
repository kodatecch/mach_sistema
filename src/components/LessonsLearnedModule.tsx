import React, { useState } from 'react';
import { Award, Plus, Trash2, ShieldCheck, HelpCircle, FileText, TrendingUp } from 'lucide-react';
import { LessonLearned } from '../types';

interface LessonsProps {
  lessons: LessonLearned[];
  setLessons: React.Dispatch<React.SetStateAction<LessonLearned[]>>;
}

export default function LessonsLearnedModule({ lessons, setLessons }: LessonsProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Suspensão / Direção');
  const [description, setDescription] = useState('');
  const [mitigation, setMitigation] = useState('');
  const [efficacy, setEfficacy] = useState<'Sucesso' | 'Parcial' | 'Falha'>('Sucesso');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !description.trim() || !mitigation.trim()) return;

    const newLesson: LessonLearned = {
      id: `l_${Date.now()}`,
      topic,
      category,
      description,
      mitigationApplied: mitigation,
      efficacy,
      date: new Date().toISOString().split('T')[0]
    };

    setLessons(prev => [newLesson, ...prev]);
    setShowAddForm(false);
    
    // Reset definitions
    setTopic('');
    setDescription('');
    setMitigation('');
    setEfficacy('Sucesso');
  };

  const handleDelete = (id: string) => {
    setLessons(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6" id="lessons-learned-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Award className="w-5.5 h-5.5 text-[#DC2626]" />
            Lições Aprendidas Históricas
          </h1>
          <p className="text-xs text-stone-500 mt-1">Registros de correções corretivas e diagnósticos das temporadas passadas da Mach Racing</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="mach-button-primary text-xs font-bold"
        >
          {showAddForm ? 'Ver Todos Registros' : '+ Registrar Lição'}
        </button>
      </div>

      {showAddForm ? (
        /* REGISTER FORM */
        <form onSubmit={handleSubmit} className="mach-card max-w-xl mx-auto space-y-4">
          <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-stone-100">Registrar Diagnóstico / Aprendizado</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mach-label">Tópico / Falha Diagnosticada</label>
              <input 
                type="text"
                required
                placeholder="ex. Curvatura da asa traseira solta"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="mach-input"
              />
            </div>
            <div>
              <label className="mach-label">Categoria do Subsistema</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mach-input"
              >
                <option value="Suspensão / Chassis">Suspensão / Chassis</option>
                <option value="Aerodinâmica / Materiais">Aerodinâmica / Materiais</option>
                <option value="Eletrônica">Eletrônica</option>
                <option value="Gestão / Organização">Gestão / Organização</option>
                <option value="Marketing / Social">Marketing / Social</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mach-label">Descrição do Evento / Problema Encontrado</label>
            <textarea 
              rows={3}
              required
              placeholder="Descreva minuciosamente o desvio em pista ou falha física de manufatura..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mach-input"
            />
          </div>

          <div>
            <label className="mach-label">Mitigação / Protocolo Adotado na Solução</label>
            <textarea 
              rows={3}
              required
              placeholder="Que protocolo corretivo de engenharia ou gestão foi aplicado no projeto?"
              value={mitigation}
              onChange={e => setMitigation(e.target.value)}
              className="mach-input"
            />
          </div>

          <div>
            <label className="mach-label">Eficácia da Ação Corretiva</label>
            <select 
              value={efficacy}
              onChange={e => setEfficacy(e.target.value as any)}
              className="mach-input font-bold"
            >
              <option value="Sucesso">Sucesso Completo (Problema Sanado)</option>
              <option value="Parcial">Sucesso Parcial (Requer verificação secundária)</option>
              <option value="Falha">Falha (Ação ineficaz, requer novo protocolo)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-850">
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
              Salvar Lição Aprendida
            </button>
          </div>
        </form>
      ) : (
        /* GRID LIST OF CURRENT LESSONS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.length === 0 ? (
            <div className="col-span-2 mach-card text-center p-12 text-stone-400">
              Não há lições aprendidas registradas na base de dados.
            </div>
          ) : (
            lessons.map(lesson => (
              <div key={lesson.id} className="mach-card space-y-3 flex flex-col justify-between border-l-3 border-l-red-650">
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-[#DC2626] font-bold font-mono px-2 py-0.5 rounded">
                      {lesson.category}
                    </span>
                    <button 
                      onClick={() => handleDelete(lesson.id)}
                      className="text-stone-450 hover:text-red-500 transition cursor-pointer p-1"
                      title="Excluir do registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 leading-tight">{lesson.topic}</h4>
                  <p className="text-[10px] font-mono text-stone-400">{lesson.date}</p>
                </div>

                <div className="space-y-2 text-xs bg-stone-50 dark:bg-stone-900/40 p-3 rounded">
                  <div>
                    <span className="font-bold text-stone-500 dark:text-stone-400">Desvio:</span>
                    <p className="text-stone-700 dark:text-stone-300 mt-0.5 font-sans">{lesson.description}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#DC2626]">Ação Adotada:</span>
                    <p className="text-stone-700 dark:text-stone-300 mt-0.5 font-sans">{lesson.mitigationApplied}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono border-t border-stone-100 dark:border-stone-850 pt-2 shrink-0">
                  <span className="text-stone-400 font-semibold uppercase">Eficácia:</span>
                  <span className={`font-bold ${
                    lesson.efficacy === 'Sucesso' 
                      ? 'text-emerald-600' 
                      : lesson.efficacy === 'Parcial' 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                  }`}>
                    {lesson.efficacy === 'Sucesso' ? '🟢 SUCESSO' : lesson.efficacy === 'Parcial' ? '🟡 PARCIAL' : '🔴 FALHA'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
