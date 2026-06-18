import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Map, 
  Plus, 
  MessageSquare, 
  ChevronRight, 
  Mail, 
  Trash2, 
  Network, 
  Brain, 
  Sparkles, 
  Filter,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Stakeholder, CommunicationLog } from '../types';

interface StakeholdersProps {
  stakeholders: Stakeholder[];
  setStakeholders: React.Dispatch<React.SetStateAction<Stakeholder[]>>;
  logs: CommunicationLog[];
  setLogs: React.Dispatch<React.SetStateAction<CommunicationLog[]>>;
}

export default function Stakeholders({ stakeholders, setStakeholders, logs, setLogs }: StakeholdersProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [showAddStakeholder, setShowAddStakeholder] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);

  // AI Generator temporary state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [rawTranscription, setRawTranscription] = useState('');
  const [logTitle, setLogTitle] = useState('');
  const [activeLogStakeholderName, setActiveLogStakeholderName] = useState('');

  // Stakeholder form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [power, setPower] = useState<'Alto' | 'Baixo'>('Alto');
  const [interest, setInterest] = useState<'Alto' | 'Baixo'>('Alto');
  const [profile, setProfile] = useState<Stakeholder['profile']>('Neutro');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<Stakeholder['channel']>('E-mail');
  const [frequency, setFrequency] = useState<Stakeholder['frequency']>('Mensal');

  // Map stakeholder to Mendelow Category
  const getMendelowCategory = (p: 'Alto' | 'Baixo', i: 'Alto' | 'Baixo') => {
    if (p === 'Alto' && i === 'Alto') return 'Gerenciar de Perto';
    if (p === 'Alto' && i === 'Baixo') return 'Manter Satisfeito';
    if (p === 'Baixo' && i === 'Alto') return 'Manter Informado';
    return 'Monitorar';
  };

  // Filter stakeholders
  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter(s => {
      // Quadrant filter (Mendelow Map)
      const category = getMendelowCategory(s.power, s.interest);
      if (selectedQuadrant && category !== selectedQuadrant) return false;

      // Profile filter
      if (profileFilter !== 'all' && s.profile !== profileFilter) return false;

      return true;
    });
  }, [stakeholders, selectedQuadrant, profileFilter]);

  // Quadrant counts helper
  const mendelowCounts = useMemo(() => {
    const counts: { [key: string]: number } = {
      'Gerenciar de Perto': 0,
      'Manter Satisfeito': 0,
      'Manter Informado': 0,
      'Monitorar': 0
    };
    stakeholders.forEach(s => {
      const q = getMendelowCategory(s.power, s.interest);
      counts[q]++;
    });
    return counts;
  }, [stakeholders]);

  // Add Stakeholder handleSubmit
  const handleAddStakeholderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newS: Stakeholder = {
      id: `s_${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Parceiro Externo',
      power,
      interest,
      profile,
      email: email.trim() || 'contato@time.com',
      channel,
      frequency
    };
    setStakeholders(prev => [...prev, newS]);
    setShowAddStakeholder(false);
    
    // Reset Form
    setName('');
    setRole('');
    setEmail('');
  };

  // AI summarizer
  const generateAiSummaryAndAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTranscription.trim()) return;

    setIsAiLoading(true);

    setTimeout(() => {
      const lowercaseRaw = rawTranscription.toLowerCase();
      
      let decisions: string[] = [];
      let steps: string[] = [];

      if (lowercaseRaw.includes('projeto') || lowercaseRaw.includes('chassis') || lowercaseRaw.includes('desenho')) {
        decisions.push('Aprovação técnica final do leiaute do chassis monocoque Mach 2.');
        steps.push('Pedro Costa enviará desenhos WBS atualizados ao comitê de avaliação.');
      }
      if (lowercaseRaw.includes('carbono') || lowercaseRaw.includes('laminação') || lowercaseRaw.includes('resina')) {
        decisions.push('Reserva do rolo de tecido de fibra de carbono sarja de 200g com o patrocinador local.');
        steps.push('Maria Santos organizará a escala bi-semanal do laboratório.');
      }
      if (lowercaseRaw.includes('verba') || lowercaseRaw.includes('patrocínio') || lowercaseRaw.includes('dinheiro')) {
        decisions.push('Confirmação do primeiro repasse financeiro atrelado à plotagem da carenagem.');
        steps.push('Ana Azevedo atualizará os mockups vetoriais do box duto S-Duct.');
      }

      if (decisions.length === 0) {
        decisions.push('Definição de marcos operacionais e controle estatístico de durações PERT do protótipo.');
        decisions.push('Revisão das contingências de riscos para simulação e bateria de testes de pista.');
        steps.push('Alocar nova rodada de checagem técnica no quadro Kanban do cronograma.');
      }

      const generatedSummary = `Decisões Estabelecidas:
${decisions.map(d => `• ${d}`).join('\n')}

Ações de Seguimento:
${steps.map(s => `• ${s}`).join('\n')}

Resumo Consolidado IA:
Alinhamento de maturidade com o comitê acadêmico focado em assegurar que as metas de engenharia e prazos do regulamento FSAE estejam perfeitamente alinhados à programação da competição.`;

      const newLog: CommunicationLog = {
        id: `c_${Date.now()}`,
        title: logTitle.trim() || 'Ata de Reunião Técnica',
        date: new Date().toISOString().split('T')[0],
        stakeholders: activeLogStakeholderName ? [activeLogStakeholderName] : ['Equipe Geral'],
        notes: rawTranscription.trim(),
        summary: generatedSummary
      };

      setLogs(prev => [newLog, ...prev]);
      setIsAiLoading(false);
      setShowAddLog(false);
      
      // Clean
      setRawTranscription('');
      setLogTitle('');
      setActiveLogStakeholderName('');
    }, 1300);
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const deleteStakeholder = (id: string) => {
    setStakeholders(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6" id="stakeholders-module-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-[#DC2626]" />
            Stakeholders & Comunicação
          </h1>
          <p className="text-xs text-stone-500 mt-1">Gestão unificada com universidade, patrocinadores e orientadores técnicos da Mach Racing</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setShowAddLog(false);
              setShowAddStakeholder(!showAddStakeholder);
            }}
            className="mach-button-secondary text-xs font-semibold py-1.5 px-3"
          >
            {showAddStakeholder ? 'Ver Stakeholders' : '+ Cadastrar Parceiro'}
          </button>
          <button 
            onClick={() => {
              setShowAddStakeholder(false);
              setShowAddLog(!showAddLog);
            }}
            className="mach-[#DC2626] mach-button-primary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5" />
            Sintetizar Ata por IA
          </button>
        </div>
      </div>

      {showAddStakeholder ? (
        /* REGISTER STAKEHOLDER FORM */
        <form onSubmit={handleAddStakeholderSubmit} className="mach-card max-w-lg mx-auto space-y-4">
          <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-stone-100">Cadastrar Novo Stakeholder / Parceiro</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mach-label">Nome Completo</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ex. Prof. Dr. Armando Lima"
                className="mach-input"
              />
            </div>
            <div>
              <label className="mach-label">Cargo / Vínculo</label>
              <input 
                type="text" 
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="ex. Reitor / Patrocinador Máster"
                className="mach-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mach-label">Nível de Poder</label>
              <select className="mach-input" value={power} onChange={e => setPower(e.target.value as any)}>
                <option value="Alto">Alto (Decisão Financeira/Regulatória)</option>
                <option value="Baixo">Baixo (Acompanhador Indireto)</option>
              </select>
            </div>
            <div>
              <label className="mach-label">Nível de Interesse</label>
              <select className="mach-input" value={interest} onChange={e => setInterest(e.target.value as any)}>
                <option value="Alto">Alto (Engajamento Periódico)</option>
                <option value="Baixo">Baixo (Informações Esporádicas)</option>
              </select>
            </div>
            <div>
              <label className="mach-label">Perfil de Apoio</label>
              <select className="mach-input" value={profile} onChange={e => setProfile(e.target.value as any)}>
                <option value="Apoiador">Apoiador Ativo</option>
                <option value="Neutro">Neutro</option>
                <option value="Resistente">Restritivo / Resistente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="mach-label">Canal Preferencial</label>
              <select className="mach-input" value={channel} onChange={e => setChannel(e.target.value as any)}>
                <option value="Reunião">Reunião Presencial</option>
                <option value="E-mail">Relatório / E-mail</option>
                <option value="WhatsApp">Sprints Rápidas / WhatsApp</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mach-label">Frequência Relatórios</label>
              <select className="mach-input" value={frequency} onChange={e => setFrequency(e.target.value as any)}>
                <option value="Semanal">Semanal</option>
                <option value="Quinzenal">Quinzenal</option>
                <option value="Mensal">Mensal</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mach-label">E-mail de Contato</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ex. reitoria@uf.br"
                className="mach-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-150 dark:border-stone-850">
            <button type="button" onClick={() => setShowAddStakeholder(false)} className="mach-button-secondary text-xs">
              Cancelar
            </button>
            <button type="submit" className="mach-button-primary text-xs font-bold">
              Salvar Stakeholder
            </button>
          </div>
        </form>
      ) : showAddLog ? (
        /* AI SUMMARY LOG REGISTER FORM */
        <form onSubmit={generateAiSummaryAndAddLog} className="mach-card max-w-xl mx-auto space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-stone-850">
            <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-stone-100 flex items-center gap-1.5 font-display select-none">
              <Sparkles className="w-4.5 h-4.5 text-[#DC2626]" />
              Sintetizador & Editor de Atas de Reunião por IA
            </h3>
          </div>

          <p className="text-stone-500 text-xs">
            Insira anotações breves, apontamentos de pauta ou transcrição livre da Reunião. A IA do sistema criará automaticamente as diretrizes de decisões e o plano de ação correspondente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mach-label">Título da Ata / Reunião</label>
              <input 
                type="text" 
                required
                value={logTitle}
                placeholder="ex. Reunião de Orçamento de Carenagem"
                onChange={e => setLogTitle(e.target.value)}
                className="mach-input"
              />
            </div>
            <div>
              <label className="mach-label">Stakeholder Principal Participante</label>
              <select className="mach-input" value={activeLogStakeholderName} onChange={e => setActiveLogStakeholderName(e.target.value)}>
                <option value="">Equipe Geral FSAE</option>
                {stakeholders.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mach-label">Anotações Gerais / Transcrição Bruta</label>
            <textarea 
              rows={5}
              required
              placeholder="Digite livremente as discussões ocorridas (ex. Discutimos que precisamos urgenciar a laminação de carbono das asas por receio de furos, Maria ficará responsável por agendar o laboratório antes do final do mês...)"
              value={rawTranscription}
              onChange={e => setRawTranscription(e.target.value)}
              className="mach-input text-xs font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-850">
            <button type="button" onClick={() => setShowAddLog(false)} className="mach-button-secondary text-xs">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isAiLoading}
              className="mach-button-primary text-xs font-bold flex items-center gap-1.5"
            >
              {isAiLoading ? 'Processando Resumo...' : 'Escrever Ata com IA'}
            </button>
          </div>
        </form>
      ) : (
        /* INTERACTIVE WORKSPACE GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* MENDELOW MATRIX GRAPHIC - LEFT SIDE PANEL */}
          <div className="lg:col-span-5 space-y-4 select-none">
            <span className="mach-label font-bold">Matriz Mendelow Interativa (Poder × Interesse)</span>
            
            <div className="grid grid-cols-2 gap-2 h-72 border border-stone-250 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-2.5 rounded-lg relative">
              {/* Vertical axis coordinate labels */}
              <div className="absolute left-[-15px] top-[40%] transform -rotate-90 text-[8px] font-mono font-bold tracking-wider text-stone-400">PODER</div>
              <div className="absolute bottom-[2px] right-[40%] text-[8px] font-mono font-bold tracking-wider text-stone-400">INTERESSE</div>

              {/* Quad 1: Manage Closely */}
              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'Gerenciar de Perto' ? null : 'Gerenciar de Perto')}
                className={`p-3 border rounded cursor-pointer transition flex flex-col justify-between ${
                  selectedQuadrant === 'Gerenciar de Perto'
                    ? 'bg-[#DC2626]/10 border-[#DC2626] dark:border-[#DC2626]'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                }`}
              >
                <div>
                  <h4 className="text-[11px] font-bold text-stone-900 dark:text-stone-300">Gerenciar de Perto</h4>
                  <p className="text-[9px] text-stone-400">Alto Poder, Alto Interesse</p>
                </div>
                <span className="text-lg font-mono font-bold text-[#DC2626] self-end">{mendelowCounts['Gerenciar de Perto']}</span>
              </div>

              {/* Quad 2: Keep Satisified */}
              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'Manter Satisfeito' ? null : 'Manter Satisfeito')}
                className={`p-3 border rounded cursor-pointer transition flex flex-col justify-between ${
                  selectedQuadrant === 'Manter Satisfeito'
                    ? 'bg-[#DC2626]/10 border-[#DC2626] dark:border-[#DC2626]'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                }`}
              >
                <div>
                  <h4 className="text-[11px] font-bold text-stone-900 dark:text-stone-300">Manter Satisfeito</h4>
                  <p className="text-[9px] text-stone-400">Alto Poder, Baixo Interesse</p>
                </div>
                <span className="text-lg font-mono font-bold text-[#DC2626] self-end">{mendelowCounts['Manter Satisfeito']}</span>
              </div>

              {/* Quad 3: Keep Informed */}
              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'Manter Informado' ? null : 'Manter Informado')}
                className={`p-3 border rounded cursor-pointer transition flex flex-col justify-between ${
                  selectedQuadrant === 'Manter Informado'
                    ? 'bg-[#DC2626]/10 border-[#DC2626] dark:border-[#DC2626]'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                }`}
              >
                <div>
                  <h4 className="text-[11px] font-bold text-stone-900 dark:text-stone-300">Manter Informado</h4>
                  <p className="text-[9px] text-stone-400">Baixo Poder, Alto Interesse</p>
                </div>
                <span className="text-lg font-mono font-bold text-[#DC2626] self-end">{mendelowCounts['Manter Informado']}</span>
              </div>

              {/* Quad 4: Monitor */}
              <div 
                onClick={() => setSelectedQuadrant(selectedQuadrant === 'Monitorar' ? null : 'Monitorar')}
                className={`p-3 border rounded cursor-pointer transition flex flex-col justify-between ${
                  selectedQuadrant === 'Monitorar'
                    ? 'bg-[#DC2626]/10 border-[#DC2626] dark:border-[#DC2626]'
                    : 'bg-white dark:bg-[#121212] border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                }`}
              >
                <div>
                  <h4 className="text-[11px] font-bold text-stone-900 dark:text-stone-300">Monitorar</h4>
                  <p className="text-[9px] text-stone-400">Baio Poder, Baixo Interesse</p>
                </div>
                <span className="text-lg font-mono font-bold text-[#DC2626] self-end">{mendelowCounts['Monitorar']}</span>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-200 dark:border-stone-850 rounded text-xs text-stone-500 leading-relaxed">
              💡 <strong>Filtro Mendelow:</strong> Clique sobre qualquer um dos 4 quadrantes da matriz para filtrar a listagem de contatos ao lado direito instantaneamente.
            </div>
          </div>

          {/* CONTACT LIST & HISTORIC MINUTES - RIGHT PANEL */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* STAKEHOLDERS SUBSECTION */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="mach-label font-bold">Listagem de Contatos e Alinhamento ({filteredStakeholders.length})</span>
                {selectedQuadrant && (
                  <button 
                    onClick={() => setSelectedQuadrant(null)}
                    className="text-[10px] text-[#DC2626] font-bold uppercase transition"
                  >
                    [ Limpar Filtro {selectedQuadrant} ]
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {filteredStakeholders.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center border border-dashed border-stone-200 dark:border-stone-850 rounded">
                    Nenhum parceiro encontrado nesta classificação.
                  </p>
                ) : (
                  filteredStakeholders.map(stk => {
                    const qIdx = getMendelowCategory(stk.power, stk.interest);
                    return (
                      <div key={stk.id} className="p-3 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-850 hover:border-stone-300 rounded flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-stone-850 dark:text-stone-200">{stk.name}</p>
                          <p className="text-[10.5px] text-stone-500 mt-0.5">{stk.role} • Canal: <span className="font-medium">{stk.channel} ({stk.frequency})</span></p>
                          <div className="flex gap-2 items-center mt-1 select-none">
                            <span className="text-[9px] bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-550 px-1.5 rounded font-mono">
                              Matriz: {qIdx}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 rounded ${
                              stk.profile === 'Apoiador' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700' 
                                : stk.profile === 'Neutro' 
                                  ? 'bg-stone-100 text-stone-600' 
                                  : 'bg-red-50 text-[#DC2626]'
                            }`}>
                              {stk.profile}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteStakeholder(stk.id)}
                          className="text-stone-400 hover:text-red-500 cursor-pointer p-1.5"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COMMUNICATIONS ATA LOGS */}
            <div className="space-y-2 border-t border-stone-150 dark:border-stone-850 pt-4">
              <span className="mach-label font-bold">Atas de Alinhamento e Atividades de Campo ({logs.length})</span>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">Nenhum log resumido por IA cadastrado.</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-4 bg-stone-50 dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded space-y-2 select-text">
                      <div className="flex justify-between items-start border-b border-stone-150 dark:border-stone-800/80 pb-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{log.title}</h4>
                          <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-[#DC2626]" /> {log.date} • Participante: {log.stakeholders.join(', ')}
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteLog(log.id)}
                          className="text-stone-450 hover:text-red-500 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-white dark:bg-stone-950 p-3 rounded text-xs select-text border border-stone-150 dark:border-stone-850 text-stone-700 dark:text-stone-300 font-mono whitespace-pre-line leading-relaxed">
                        {log.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
