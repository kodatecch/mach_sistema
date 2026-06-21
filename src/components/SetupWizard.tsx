import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Building2,
  Palette,
  FolderKanban,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Organization,
  Project,
  ProjectMember,
  OrgConfig,
  ProjectRole,
  MemberProjectVisibility,
} from '../types';

/* ────────────────────────── constants ────────────────────────── */

const DEFAULT_PROJECTS = [
  'Engenharia',
  'Marketing',
  'Gestão do Projeto',
  'Projeto Social',
  'Estande',
  'Apresentação Verbal',
];

const STEPS = [
  { icon: UserIcon, label: 'Conta' },
  { icon: Palette, label: 'Aparência' },
  { icon: FolderKanban, label: 'Projetos' },
  { icon: Users, label: 'Membros' },
  { icon: Check, label: 'Revisão' },
];

const ACCENT_OPTIONS: { value: 'red' | 'cyan'; hex: string; label: string }[] = [
  { value: 'red', hex: '#DC2626', label: 'Vermelho' },
  { value: 'cyan', hex: '#06B6D4', label: 'Ciano' },
];

/* ────────────────────────── props ────────────────────────── */

interface SetupWizardProps {
  onComplete: (payload: {
    user: User;
    org: Organization;
    projects: Project[];
    memberships: ProjectMember[];
    config: OrgConfig;
    visibility: MemberProjectVisibility;
    extraUsers: User[];
  }) => void;
}

/* ────────────────────────── component ────────────────────────── */

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  /* Step 1 — Account */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [orgName, setOrgName] = useState('');

  /* Step 2 — Appearance */
  const [accentColor, setAccentColor] = useState<'red' | 'cyan'>('red');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [competitionLevel, setCompetitionLevel] = useState<'regional' | 'nacional' | 'mundial'>('regional');

  /* Step 3 — Projects */
  const [projectNames, setProjectNames] = useState<string[]>([...DEFAULT_PROJECTS]);

  /* Step 4 — Members */
  const [members, setMembers] = useState<
    { name: string; email: string; role: ProjectRole; password: string; visibleProjects: boolean[] }[]
  >([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('member');

  /* ── helpers ── */

  const addProject = () => {
    setProjectNames(prev => [...prev, '']);
    // update existing members with new project visibility
    setMembers(prev =>
      prev.map(m => ({ ...m, visibleProjects: [...m.visibleProjects, false] }))
    );
  };

  const removeProject = (idx: number) => {
    setProjectNames(prev => prev.filter((_, i) => i !== idx));
    setMembers(prev =>
      prev.map(m => ({
        ...m,
        visibleProjects: m.visibleProjects.filter((_, i) => i !== idx),
      }))
    );
  };

  const addMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()) return;
    setMembers(prev => [
      ...prev,
      {
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole,
        password: newMemberPassword.trim(),
        visibleProjects: projectNames.map(() => false),
      },
    ]);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('');
    setNewMemberRole('member');
  };

  const removeMember = (idx: number) => {
    setMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleMemberProject = (memberIdx: number, projIdx: number) => {
    setMembers(prev =>
      prev.map((m, i) =>
        i === memberIdx
          ? {
              ...m,
              visibleProjects: m.visibleProjects.map((v, j) =>
                j === projIdx ? !v : v
              ),
            }
          : m
      )
    );
  };

  /* Apply theme in real-time */
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-color', accentColor);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, accentColor]);

  /* ── step validation ── */
  const canAdvance = () => {
    if (step === 0) return name.trim() && email.trim() && password.trim() && orgName.trim();
    if (step === 2) return projectNames.filter(p => p.trim()).length >= 1;
    return true;
  };

  /* ── finalize ── */
  const handleFinish = () => {
    const orgId = `org_${Date.now()}`;
    const userId = `user_${Date.now()}`;
    const validProjects = projectNames.filter(p => p.trim());

    const org: Organization = { id: orgId, name: orgName };

    // Create "Geral" overview project for the admin + individual projects
    const geralProject: Project = {
      id: `proj_geral_${Date.now()}`,
      organizationId: orgId,
      name: 'Visão Geral',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      executionRegime: 'linear',
    };

    const projects: Project[] = [
      geralProject,
      ...validProjects.map((pName, i) => ({
        id: `proj_${Date.now()}_${i}`,
        organizationId: orgId,
        name: pName,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        executionRegime: 'linear' as const,
      })),
    ];

    const adminUser: User = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash: password,
    };

    // Admin membership in all projects
    const adminMemberships: ProjectMember[] = projects.map(p => ({
      id: `mem_${Date.now()}_${p.id}`,
      projectId: p.id,
      userId,
      role: 'admin' as ProjectRole,
      userEmail: adminUser.email,
      userName: adminUser.name,
    }));

    // Extra users and their memberships
    const extraUsers: User[] = [];
    const memberMemberships: ProjectMember[] = [];
    const visibility: MemberProjectVisibility = {};

    members.forEach((m, mi) => {
      const mUserId = `user_member_${Date.now()}_${mi}`;
      extraUsers.push({
        id: mUserId,
        email: m.email,
        name: m.name,
        passwordHash: m.password,
      });

      // Only the projects marked as visible
      const visibleProjectIds: string[] = [];
      m.visibleProjects.forEach((visible, pi) => {
        if (visible && validProjects[pi]) {
          const proj = projects.find(p => p.name === validProjects[pi]);
          if (proj) {
            visibleProjectIds.push(proj.id);
            memberMemberships.push({
              id: `mem_${Date.now()}_${mUserId}_${proj.id}`,
              projectId: proj.id,
              userId: mUserId,
              role: m.role,
              userEmail: m.email,
              userName: m.name,
            });
          }
        }
      });
      visibility[mUserId] = visibleProjectIds;
    });

    const config: OrgConfig = {
      orgName,
      primaryColor: accentColor,
      theme,
      setupComplete: true,
      competitionLevel,
    };

    onComplete({
      user: adminUser,
      org,
      projects,
      memberships: [...adminMemberships, ...memberMemberships],
      config,
      visibility,
      extraUsers,
    });

    navigate('/app');
  };

  /* ────────────────────────── render ────────────────────────── */
  const bg =
    theme === 'dark'
      ? 'bg-stone-950 text-stone-100'
      : 'bg-stone-50 text-stone-900';

  const cardBg =
    theme === 'dark'
      ? 'bg-stone-900/80 border-stone-800'
      : 'bg-white border-stone-200';

  const inputBg =
    theme === 'dark'
      ? 'bg-stone-950 border-stone-800 text-stone-100 placeholder-stone-600'
      : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400';

  const subtleBg =
    theme === 'dark'
      ? 'bg-stone-950/60 border-stone-800'
      : 'bg-stone-100 border-stone-200';

  return (
    <div className={`min-h-screen ${bg} font-sans antialiased flex flex-col`}>
      {/* ── Progress bar ── */}
      <div className={`sticky top-0 z-50 border-b ${cardBg} backdrop-blur-xl`}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={`flex items-center gap-2 transition-all ${
                      isActive
                        ? 'accent-text font-bold'
                        : isDone
                        ? 'text-stone-400 cursor-pointer hover:accent-text'
                        : 'text-stone-600 cursor-default'
                    }`}
                    disabled={i > step}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'accent-bg text-white shadow-lg'
                          : isDone
                          ? 'bg-stone-700 text-white'
                          : theme === 'dark'
                          ? 'bg-stone-800 text-stone-500'
                          : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="hidden sm:inline text-xs font-mono uppercase tracking-wider">
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-3 ${
                        i < step ? 'accent-bg opacity-60' : theme === 'dark' ? 'bg-stone-800' : 'bg-stone-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* ── STEP 0: Account ── */}
              {step === 0 && (
                <div className={`border rounded-2xl p-8 space-y-6 ${cardBg}`}>
                  <div>
                    <h2 className="text-xl font-display font-black tracking-tight">Crie sua conta</h2>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                      Informações do gestor e da organização.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="mach-label">Seu nome</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Pedro Henrique"
                        className={`mach-input ${inputBg}`}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="mach-label">E-mail</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="gestor@equipe.com"
                        className={`mach-input ${inputBg}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="mach-label">Senha</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`mach-input pr-10 ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className={`border-t pt-5 ${theme === 'dark' ? 'border-stone-800' : 'border-stone-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 accent-text" />
                      <span className="text-sm font-bold">Organização / Equipe</span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="mach-label">Nome da organização</label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        placeholder="Mach Racing"
                        className={`mach-input ${inputBg}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: Appearance ── */}
              {step === 1 && (
                <div className={`border rounded-2xl p-8 space-y-8 ${cardBg}`}>
                  <div>
                    <h2 className="text-xl font-display font-black tracking-tight">Aparência</h2>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                      Personalize as cores e o tema do sistema.
                    </p>
                  </div>

                  {/* Color */}
                  <div className="space-y-3">
                    <label className="mach-label">Cor principal</label>
                    <div className="flex gap-3">
                      {ACCENT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAccentColor(opt.value)}
                          className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            accentColor === opt.value
                              ? 'border-current shadow-lg scale-[1.02]'
                              : theme === 'dark'
                              ? 'border-stone-800 hover:border-stone-700'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                          style={accentColor === opt.value ? { borderColor: opt.hex } : {}}
                        >
                          <div
                            className="w-8 h-8 rounded-full shadow-inner"
                            style={{ backgroundColor: opt.hex }}
                          />
                          <div className="text-left">
                            <p className="text-sm font-bold">{opt.label}</p>
                            <p className={`text-[10px] font-mono ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                              {opt.hex}
                            </p>
                          </div>
                          {accentColor === opt.value && (
                            <Check className="w-4 h-4 ml-auto" style={{ color: opt.hex }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="space-y-3">
                    <label className="mach-label">Tema</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'accent-border shadow-lg'
                            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <Moon className="w-5 h-5" />
                        <span className="font-bold text-sm">Escuro</span>
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'accent-border shadow-lg'
                            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <Sun className="w-5 h-5" />
                        <span className="font-bold text-sm">Claro</span>
                      </button>
                    </div>
                  </div>

                  {/* Competition Level */}
                  <div className="space-y-3">
                    <label className="mach-label">Nível de Competição</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['regional', 'nacional', 'mundial'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setCompetitionLevel(level)}
                          className={`flex items-center justify-center py-3.5 rounded-xl border-2 transition-all cursor-pointer capitalize font-bold text-sm ${
                            competitionLevel === level
                              ? 'accent-border shadow-lg'
                              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Projects ── */}
              {step === 2 && (
                <div className={`border rounded-2xl p-8 space-y-6 ${cardBg}`}>
                  <div>
                    <h2 className="text-xl font-display font-black tracking-tight">Projetos</h2>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                      Configure os projetos da sua equipe. Um projeto "Visão Geral" será criado automaticamente para você.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {projectNames.map((pName, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono w-6 text-center ${theme === 'dark' ? 'text-stone-600' : 'text-stone-400'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <input
                          type="text"
                          value={pName}
                          onChange={e => {
                            const copy = [...projectNames];
                            copy[i] = e.target.value;
                            setProjectNames(copy);
                          }}
                          className={`mach-input flex-1 ${inputBg}`}
                          placeholder="Nome do projeto"
                        />
                        <button
                          onClick={() => removeProject(i)}
                          className="text-stone-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="Remover projeto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addProject}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer ${subtleBg} hover:accent-text`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Projeto
                  </button>
                </div>
              )}

              {/* ── STEP 3: Members ── */}
              {step === 3 && (
                <div className={`border rounded-2xl p-8 space-y-6 ${cardBg}`}>
                  <div>
                    <h2 className="text-xl font-display font-black tracking-tight">Membros da Equipe</h2>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                      Adicione membros e escolha quais projetos cada um pode ver.
                    </p>
                  </div>

                  {/* Add member form */}
                  <div className={`border rounded-xl p-4 space-y-3 ${subtleBg}`}>
                    <p className="text-xs font-bold font-mono uppercase tracking-wider accent-text">
                      Adicionar membro
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        placeholder="Nome"
                        className={`mach-input ${inputBg}`}
                      />
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={e => setNewMemberEmail(e.target.value)}
                        placeholder="email@equipe.com"
                        className={`mach-input ${inputBg}`}
                      />
                      <input
                        type="password"
                        value={newMemberPassword}
                        onChange={e => setNewMemberPassword(e.target.value)}
                        placeholder="Senha do membro"
                        className={`mach-input ${inputBg}`}
                      />
                      <select
                        value={newMemberRole}
                        onChange={e => setNewMemberRole(e.target.value as ProjectRole)}
                        className={`mach-input cursor-pointer ${inputBg}`}
                      >
                        <option value="member">Membro</option>
                        <option value="technical_lead">Técnico</option>
                        <option value="admin">Gestor</option>
                        <option value="mentor">Mentor</option>
                      </select>
                      <button
                        onClick={addMember}
                        disabled={!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()}
                        className="mach-button-primary px-3 disabled:opacity-30"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Members list */}
                  {members.length === 0 ? (
                    <div className={`text-center py-8 rounded-xl border ${subtleBg}`}>
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className={`text-sm ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                        Nenhum membro adicionado ainda.
                      </p>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-stone-600' : 'text-stone-400'}`}>
                        Você pode adicionar membros depois também.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((m, mi) => (
                        <div key={mi} className={`border rounded-xl p-4 space-y-3 ${subtleBg}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">{m.name}</p>
                              <p className={`text-xs font-mono ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                                {m.email} • {m.role.toUpperCase()}
                              </p>
                            </div>
                            <button
                              onClick={() => removeMember(mi)}
                              className="text-stone-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Project visibility toggles */}
                          <div>
                            <p className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                              Projetos visíveis:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {projectNames.map((pName, pi) =>
                                pName.trim() ? (
                                  <button
                                    key={pi}
                                    onClick={() => toggleMemberProject(mi, pi)}
                                    className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                      m.visibleProjects[pi]
                                        ? 'accent-bg text-white accent-border shadow'
                                        : theme === 'dark'
                                        ? 'bg-stone-900 border-stone-700 text-stone-400 hover:border-stone-600'
                                        : 'bg-white border-stone-300 text-stone-500 hover:border-stone-400'
                                    }`}
                                  >
                                    {m.visibleProjects[pi] ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
                                    {pName}
                                  </button>
                                ) : null
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: Review ── */}
              {step === 4 && (
                <div className={`border rounded-2xl p-8 space-y-6 ${cardBg}`}>
                  <div className="text-center">
                    <div className="inline-flex w-14 h-14 accent-bg rounded-2xl items-center justify-center mb-4 shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-display font-black tracking-tight">Tudo pronto!</h2>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                      Confira o resumo da configuração.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Account */}
                    <div className={`border rounded-xl p-4 ${subtleBg}`}>
                      <p className="text-[10px] font-mono uppercase tracking-wider accent-text font-bold mb-2">Conta</p>
                      <p className="text-sm font-bold">{name}</p>
                      <p className={`text-xs font-mono ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>{email}</p>
                    </div>

                    {/* Org */}
                    <div className={`border rounded-xl p-4 ${subtleBg}`}>
                      <p className="text-[10px] font-mono uppercase tracking-wider accent-text font-bold mb-2">Organização</p>
                      <p className="text-sm font-bold">{orgName}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                        Tema: {theme === 'dark' ? 'Escuro' : 'Claro'} • Cor: {ACCENT_OPTIONS.find(a => a.value === accentColor)?.label} • Competição: <span className="capitalize">{competitionLevel}</span>
                      </p>
                    </div>

                    {/* Projects */}
                    <div className={`border rounded-xl p-4 ${subtleBg}`}>
                      <p className="text-[10px] font-mono uppercase tracking-wider accent-text font-bold mb-2">
                        Projetos ({projectNames.filter(p => p.trim()).length + 1})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg accent-soft-bg accent-text font-bold">
                          Visão Geral
                        </span>
                        {projectNames.filter(p => p.trim()).map((p, i) => (
                          <span
                            key={i}
                            className={`text-[11px] font-mono px-2.5 py-1 rounded-lg ${
                              theme === 'dark' ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Members */}
                    <div className={`border rounded-xl p-4 ${subtleBg}`}>
                      <p className="text-[10px] font-mono uppercase tracking-wider accent-text font-bold mb-2">
                        Membros ({members.length + 1})
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="font-bold">{name}</span>{' '}
                          <span className={theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}>— Gestor (todos os projetos)</span>
                        </p>
                        {members.map((m, i) => (
                          <p key={i} className="text-xs">
                            <span className="font-bold">{m.name}</span>{' '}
                            <span className={theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}>
                              — {m.role} ({m.visibleProjects.filter(Boolean).length} projetos)
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation buttons ── */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'text-stone-400 hover:text-white'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="mach-button-primary px-6 py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="mach-button-primary px-8 py-2.5 text-sm font-bold"
              >
                <Sparkles className="w-4 h-4" />
                Finalizar Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
