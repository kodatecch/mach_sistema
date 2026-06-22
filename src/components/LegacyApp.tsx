import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Layers, 
  Lock, 
  UserPlus, 
  Plus, 
  Search, 
  ShieldCheck, 
  LogOut, 
  Activity, 
  Folder, 
  Calendar, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  Compass, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  Eye,
  CheckCircle,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Settings,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { User, Project, ProjectMember, Organization, ProjectRole, ExecutionRegime, UserTabPermissions, OrgConfig, MemberProjectVisibility, Task } from '../types';
import CronogramaDashboard from './CronogramaDashboard';
import Finance from './Finance';
import Stakeholders from './Stakeholders';
import RiskManagement from './RiskManagement';

// Pre-seeded local mock database
const INITIAL_ORGS: Organization[] = [
  { id: 'org_mach_one', name: 'Mach Racing (F1 in Schools)' },
  { id: 'org_aerodesign', name: 'Planalto AeroDesign (STEM)' }
];

const INITIAL_USERS: User[] = [
  { id: 'user_pedro', email: 'gestor@machone.test', name: 'Pedro Henrique', passwordHash: '123' },
  { id: 'user_ana', email: 'tecnico@machone.test', name: 'Ana Clara', passwordHash: '123' },
  { id: 'user_bruno', email: 'membro@machone.test', name: 'Bruno Sousa', passwordHash: '123' }
];

const INITIAL_PROJECTS: Project[] = [
  { id: 'proj_geral', organizationId: 'org_mach_one', name: 'Visão Geral', startDate: '2026-01-10', endDate: '2026-11-20', executionRegime: 'linear' },
  { id: 'proj_engenharia', organizationId: 'org_mach_one', name: 'Engenharia', startDate: '2026-01-10', endDate: '2026-11-20', executionRegime: 'fast_tracking' },
  { id: 'proj_marketing', organizationId: 'org_mach_one', name: 'Marketing', startDate: '2026-01-10', endDate: '2026-11-20', executionRegime: 'linear' },
  { id: 'proj_gestao', organizationId: 'org_mach_one', name: 'Gestão do Projeto', startDate: '2026-01-10', endDate: '2026-11-20', executionRegime: 'linear' },
  { id: 'proj_social', organizationId: 'org_mach_one', name: 'Projeto Social', startDate: '2026-01-10', endDate: '2026-11-20', executionRegime: 'linear' },
  { id: 'proj_estande', organizationId: 'org_mach_one', name: 'Estande', startDate: '2026-01-10', endDate: '2026-11-20', executionRegime: 'linear' },
  { id: 'proj_verbal', organizationId: 'org_mach_one', name: 'Apresentação Verbal', startDate: '2026-01-10', endDate: '2026-11-20', executionRegime: 'linear' }
];

// Pedro (gestor) belongs to all, Ana and Bruno belong to a subset
const INITIAL_MEMBERSHIPS: ProjectMember[] = [
  { id: 'mem_pedro_geral', projectId: 'proj_geral', userId: 'user_pedro', role: 'admin', userEmail: 'gestor@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_pedro_eng', projectId: 'proj_engenharia', userId: 'user_pedro', role: 'admin', userEmail: 'gestor@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_pedro_mkt', projectId: 'proj_marketing', userId: 'user_pedro', role: 'admin', userEmail: 'gestor@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_pedro_ges', projectId: 'proj_gestao', userId: 'user_pedro', role: 'admin', userEmail: 'gestor@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_pedro_soc', projectId: 'proj_social', userId: 'user_pedro', role: 'admin', userEmail: 'gestor@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_pedro_est', projectId: 'proj_estande', userId: 'user_pedro', role: 'admin', userEmail: 'gestor@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_pedro_vrb', projectId: 'proj_verbal', userId: 'user_pedro', role: 'admin', userEmail: 'gestor@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_ana_eng', projectId: 'proj_engenharia', userId: 'user_ana', role: 'technical_lead', userEmail: 'tecnico@machone.test', userName: 'Ana Clara' },
  { id: 'mem_bruno_mkt', projectId: 'proj_marketing', userId: 'user_bruno', role: 'member', userEmail: 'membro@machone.test', userName: 'Bruno Sousa' }
];

const INITIAL_REGULATION_RULES = [
  { id: 'rule_weight', projectId: 'proj_engenharia', parameterName: 'weight_limit_g', limitValue: 50.0, unit: 'g', description: 'Peso mínimo do carrinho sem cartucho de CO2' },
  { id: 'rule_length', projectId: 'proj_engenharia', parameterName: 'length_limit_mm', limitValue: 210.0, unit: 'mm', description: 'Comprimento total máximo permitido para o dragster' },
  { id: 'rule_width', projectId: 'proj_engenharia', parameterName: 'width_limit_mm', limitValue: 65.0, unit: 'mm', description: 'Largura máxima com as rodas traseiras montadas' },
  { id: 'rule_co2', projectId: 'proj_engenharia', parameterName: 'co2_canister_g', limitValue: 8.0, unit: 'g', description: 'Massa padrão do cartucho de gás carbônico descartável' }
];

const INITIAL_MACH_WHEEL_SCORES = [
  { id: 'score_eng', projectId: 'proj_engenharia', category: 'Engineering Portfolio', scoreBefore: 5.5, scoreAfter: 8.5 },
  { id: 'score_ent', projectId: 'proj_marketing', category: 'Enterprise Portfolio', scoreBefore: 6.0, scoreAfter: 9.0 },
  { id: 'score_soc', projectId: 'proj_social', category: 'Social Development / Sustainability Portfolio', scoreBefore: 4.0, scoreAfter: 7.5 },
  { id: 'score_verb', projectId: 'proj_verbal', category: 'Verbal Presentation', scoreBefore: 5.0, scoreAfter: 8.0 },
  { id: 'score_pit', projectId: 'proj_estande', category: 'Pit Display', scoreBefore: 4.5, scoreAfter: 8.5 },
  { id: 'score_id', projectId: 'proj_gestao', category: 'Team Identity', scoreBefore: 6.5, scoreAfter: 9.5 }
];

export default function LegacyApp() {
  // Seeding Regulation Rules and Mach Wheel Scores in LocalStorage
  useEffect(() => {
    if (!localStorage.getItem('stem_regulation_rules')) {
      localStorage.setItem('stem_regulation_rules', JSON.stringify(INITIAL_REGULATION_RULES));
    }
    if (!localStorage.getItem('stem_mach_wheel_scores')) {
      localStorage.setItem('stem_mach_wheel_scores', JSON.stringify(INITIAL_MACH_WHEEL_SCORES));
    }
  }, []);

  // Database States (sync with localStorage)
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const data = localStorage.getItem('stem_orgs');
    return data ? JSON.parse(data) : INITIAL_ORGS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const data = localStorage.getItem('stem_users');
    return data ? JSON.parse(data) : INITIAL_USERS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const data = localStorage.getItem('stem_projects');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.some((p: any) => p.name.includes('Aero & Usinagem') || p.name.includes('F1 in Schools 2026'))) {
        return INITIAL_PROJECTS;
      }
      return parsed;
    }
    return INITIAL_PROJECTS;
  });

  const [memberships, setMemberships] = useState<ProjectMember[]>(() => {
    const data = localStorage.getItem('stem_memberships');
    const pData = localStorage.getItem('stem_projects');
    let hasOld = false;
    if (pData) {
      try {
        const parsedProjects = JSON.parse(pData);
        hasOld = parsedProjects.some((p: any) => p.name.includes('Aero & Usinagem') || p.name.includes('F1 in Schools 2026'));
      } catch (e) {}
    }
    if (data && !hasOld) {
      return JSON.parse(data);
    }
    return INITIAL_MEMBERSHIPS;
  });

  const [machConfig, setMachConfig] = useState<OrgConfig | null>(() => {
    const data = localStorage.getItem('mach_config');
    return data ? JSON.parse(data) : {
      orgName: 'Mach Racing',
      primaryColor: 'red',
      theme: 'dark',
      setupComplete: true,
      competitionLevel: 'regional'
    };
  });

  const [showSettings, setShowSettings] = useState(false);
  
  // Database status sync check for Legacy Settings Modal
  const [dbStatus, setDbStatus] = useState<string>('Verificando Banco...');
  const [isDbActive, setIsDbActive] = useState<boolean>(false);

  useEffect(() => {
    if (!showSettings) return;
    setDbStatus('Verificando Conexão...');
    fetch('http://localhost:3001/stakeholders', {
      headers: { 'Authorization': 'Bearer dev-token' }
    })
      .then(res => {
        if (res.ok) {
          setDbStatus('Banco Cloud PostgreSQL Conectado');
          setIsDbActive(true);
        } else {
          setDbStatus('Banco Local Ativo (Offline Sync)');
          setIsDbActive(false);
        }
      })
      .catch(() => {
        setDbStatus('Banco Local Ativo (Offline Sync)');
        setIsDbActive(false);
      });
  }, [showSettings]);


  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('member');

  const [visibility, setVisibility] = useState<MemberProjectVisibility>(() => {
    const data = localStorage.getItem('stem_visibility');
    if (data) return JSON.parse(data);
    return {
      'user_ana': ['proj_engenharia'],
      'user_bruno': ['proj_marketing']
    };
  });

  useEffect(() => {
    localStorage.setItem('stem_visibility', JSON.stringify(visibility));
  }, [visibility]);

  // Navigation and Interactive State
  const [activeUser, setActiveUser] = useState<User | null>(() => {
    const data = localStorage.getItem('stem_active_user');
    return data ? JSON.parse(data) : INITIAL_USERS[0]; // pedro default login
  });

  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    const data = localStorage.getItem('stem_active_project');
    return data ? JSON.parse(data) : INITIAL_PROJECTS[0];
  });

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'cronograma' | 'orcamento' | 'stakeholders' | 'riscos' | 'convidar'>('dashboard');

  const isGestorGlobal = activeUser ? memberships.some(
    m => m.userId === activeUser.id && m.role === 'admin'
  ) : false;

  // Normalize milestones for Legacy Dashboard tab roadmap widget
  const dashboardMilestones = useMemo(() => {
    if (!activeProject) return [];
    const localTasks = localStorage.getItem(`tasks_${activeProject.id}`);
    let parsed: Task[] = [];
    if (localTasks) {
      try { parsed = JSON.parse(localTasks); } catch (e) {}
    }
    const list = parsed.filter(t => t.isMilestone);
    if (list.length > 0) {
      return list.slice(0, 5).map(t => ({
        id: t.id,
        name: t.name,
        endDate: t.endDate || t.whenDate || '2026-12-31',
        status: t.status,
        progress: t.progress || (t.status === 'done' || t.status === 'completed' ? 100 : 0)
      }));
    }
    return [
      { id: 'm1', name: 'R1: Briefing de Engenharia & CFD', endDate: '2026-06-30', status: 'done', progress: 100 },
      { id: 'm2', name: 'R2: Usinagem do Bloco Modelo', endDate: '2026-07-15', status: 'in_progress', progress: 60 },
      { id: 'm3', name: 'R3: Pintura e Montagem do Eixo', endDate: '2026-08-10', status: 'pending', progress: 0 },
      { id: 'm4', name: 'R4: Homologação no Trilho CO2', endDate: '2026-09-05', status: 'pending', progress: 0 },
      { id: 'm5', name: 'R5: Estande Físico e Pit Display', endDate: '2026-10-15', status: 'pending', progress: 0 }
    ];
  }, [activeProject]);

  useEffect(() => {
    if (machConfig) {
      document.documentElement.setAttribute('data-theme', machConfig.theme);
      document.documentElement.setAttribute('data-color', machConfig.primaryColor);
      if (machConfig.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [machConfig]);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Forms inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('Mach Racing (F1 in Schools)');
  const [regRole, setRegRole] = useState<ProjectRole>('admin');

  // Tab permissions visibility map
  const [tabPermissionsMap, setTabPermissionsMap] = useState<Record<string, UserTabPermissions>>(() => {
    const data = localStorage.getItem('stem_tab_permissions');
    if (data) return JSON.parse(data);
    
    // Default initial seeds — all projects for gestor
    const defaults: Record<string, UserTabPermissions> = {};
    INITIAL_PROJECTS.forEach(p => {
      defaults[`${p.id}_user_pedro`] = { dashboard: true, cronograma: true, orcamento: true, stakeholders: true, riscos: true, convidar: true };
    });
    defaults['proj_engenharia_user_ana'] = { dashboard: true, cronograma: true, orcamento: true, stakeholders: true, riscos: true, convidar: true };
    defaults['proj_marketing_user_bruno'] = { dashboard: true, cronograma: true, orcamento: false, stakeholders: false, riscos: true, convidar: false };
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('stem_tab_permissions', JSON.stringify(tabPermissionsMap));
  }, [tabPermissionsMap]);

  // Project Creation states
  const [showProjForm, setShowProjForm] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjStartDate, setNewProjStartDate] = useState('2026-06-01');
  const [newProjEndDate, setNewProjEndDate] = useState('2026-12-31');
  const [newProjRegime, setNewProjRegime] = useState<ExecutionRegime>('linear');
  const [newProjOrgId, setNewProjOrgId] = useState('org_mach_one');

  // Invites states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('member');

  // Active user role in selected project
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole | null>('admin');

  // Permission settings map loaded from backend
  const [permissions, setPermissions] = useState<any>({
    role: 'admin',
    area: null,
    canEditWbs: true,
    canEditTasks: true,
    canEditBudget: true,
    canEditRisks: true,
    canEditStakeholders: true,
    canEditStatusReports: true,
    canEditScopeChanges: true,
    canComment: true,
    canCommentOnly: false,
    isSponsor: false,
    isMentor: false,
    isAdmin: true,
  });

  // Syncing States to LocalStorage
  useEffect(() => {
    localStorage.setItem('stem_orgs', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('stem_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('stem_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('stem_memberships', JSON.stringify(memberships));
  }, [memberships]);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('stem_active_user', JSON.stringify(activeUser));
    } else {
      localStorage.removeItem('stem_active_user');
    }
  }, [activeUser]);

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('stem_active_project', JSON.stringify(activeProject));
    } else {
      localStorage.removeItem('stem_active_project');
    }
  }, [activeProject]);

  // Handle active role derivation and permissions query
  useEffect(() => {
    if (!activeUser || !activeProject) {
      setCurrentUserRole(null);
      setPermissions({
        role: null,
        area: null,
        canEditWbs: false,
        canEditTasks: false,
        canEditBudget: false,
        canEditRisks: false,
        canEditStakeholders: false,
        canEditStatusReports: false,
        canEditScopeChanges: false,
        canComment: false,
        canCommentOnly: false,
        isSponsor: false,
        isMentor: false,
        isAdmin: false,
      });
      return;
    }
    const mem = memberships.find(m => m.projectId === activeProject.id && m.userId === activeUser.id);
    setCurrentUserRole(mem ? mem.role : null);

    // Fetch live permissions map from NestJS
    fetch(`http://localhost:3001/me/permissions?project_id=${activeProject.id}`, {
      headers: {
        'Authorization': 'Bearer dev-token',
        'x-project-id': activeProject.id,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error && data.canEditWbs !== undefined) {
          setPermissions(data);
        } else {
          // Robust client-side fallback matching spec
          const mockRole = mem ? mem.role : 'member';
          const mockArea = mem ? (mem as any).area || '' : '';
          const isCronogramaLead = mockArea === 'cronograma' || mockArea === 'schedule';
          const isFinanceLead = mockArea === 'resources' || mockArea === 'finance' || mockArea === 'budget';
          const isRisksLead = mockArea === 'risks' || mockArea === 'riscos';
          const isStakeholdersLead = mockArea === 'stakeholders' || mockArea === 'comunicação';

          if (mockRole === 'admin' || mockRole === 'technical_lead') {
            setPermissions({
              role: mockRole,
              area: mockArea,
              canEditWbs: true,
              canEditTasks: true,
              canEditBudget: true,
              canEditRisks: true,
              canEditStakeholders: true,
              canEditStatusReports: true,
              canEditScopeChanges: true,
              canComment: true,
              canCommentOnly: false,
              isSponsor: false,
              isMentor: false,
              isAdmin: true,
            });
          } else if (mockRole === 'area_lead') {
            setPermissions({
              role: 'area_lead',
              area: mockArea,
              canEditWbs: isCronogramaLead,
              canEditTasks: isCronogramaLead,
              canEditBudget: isFinanceLead,
              canEditRisks: isRisksLead,
              canEditStakeholders: isStakeholdersLead,
              canEditStatusReports: isFinanceLead || isCronogramaLead,
              canEditScopeChanges: isFinanceLead || isCronogramaLead,
              canComment: true,
              canCommentOnly: false,
              isSponsor: false,
              isMentor: false,
              isAdmin: false,
            });
          } else if (mockRole === 'mentor') {
            setPermissions({
              role: 'mentor',
              area: mockArea,
              canEditWbs: false,
              canEditTasks: false,
              canEditBudget: false,
              canEditRisks: false,
              canEditStakeholders: false,
              canEditStatusReports: false,
              canEditScopeChanges: false,
              canComment: true,
              canCommentOnly: true,
              isSponsor: false,
              isMentor: true,
              isAdmin: false,
            });
          } else if (mockRole === 'sponsor') {
            setPermissions({
              role: 'sponsor',
              area: mockArea,
              canEditWbs: false,
              canEditTasks: false,
              canEditBudget: false,
              canEditRisks: false,
              canEditStakeholders: false,
              canEditStatusReports: false,
              canEditScopeChanges: false,
              canComment: false,
              canCommentOnly: false,
              isSponsor: true,
              isMentor: false,
              isAdmin: false,
            });
          } else {
            setPermissions({
              role: 'member',
              area: mockArea,
              canEditWbs: false,
              canEditTasks: false,
              canEditBudget: false,
              canEditRisks: false,
              canEditStakeholders: false,
              canEditStatusReports: false,
              canEditScopeChanges: false,
              canComment: false,
              canCommentOnly: false,
              isSponsor: false,
              isMentor: false,
              isAdmin: false,
            });
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching permissions:', err);
      });
  }, [activeUser, activeProject, memberships]);

  const hasTabPermission = (tab: string): boolean => {
    if (!activeUser || !activeProject) return false;
    const mem = memberships.find(m => m.projectId === activeProject.id && m.userId === activeUser.id);
    if (!mem) return false;
    if (mem.role === 'admin' || mem.role === 'technical_lead') return true;
    
    const permKey = `${activeProject.id}_${activeUser.id}`;
    const userPerms = tabPermissionsMap[permKey];
    if (!userPerms) {
      if (tab === 'dashboard' || tab === 'cronograma' || tab === 'riscos') return true;
      return false;
    }
    return (userPerms as any)[tab] ?? false;
  };

  useEffect(() => {
    if (activeUser && activeProject) {
      if (!hasTabPermission(currentTab)) {
        const tabsOrder = ['dashboard', 'cronograma', 'orcamento', 'stakeholders', 'riscos', 'convidar'];
        const firstAllowed = tabsOrder.find(t => hasTabPermission(t));
        if (firstAllowed) {
          setCurrentTab(firstAllowed as any);
        }
      }
    }
  }, [activeUser, activeProject, currentTab, tabPermissionsMap, memberships]);

  // Socket.IO Real-time Synchronization
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!activeProject?.id) return;

    console.log(`[Socket] Connecting for project: ${activeProject.id}`);
    const socket = io('http://localhost:3001', {
      query: { projectId: activeProject.id },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to NestJS Socket.IO: ${socket.id}`);
      socket.emit('join_project', { projectId: activeProject.id });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('task.updated', (updatedTask: any) => {
      console.log('[Socket] Received task.updated:', updatedTask);
      const projectId = updatedTask.projectId;
      const storageKey = `tasks_${projectId}`;
      try {
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          let tasks = JSON.parse(localData);
          tasks = tasks.map((t: any) => t.id === updatedTask.id ? { ...t, ...updatedTask } : t);
          localStorage.setItem(storageKey, JSON.stringify(tasks));
        } else {
          localStorage.setItem(storageKey, JSON.stringify([updatedTask]));
        }
      } catch (err) {
        console.error('Error handling task.updated in localStorage', err);
      }
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    });

    socket.on('task.dependency.changed', (newDependency: any) => {
      console.log('[Socket] Received task.dependency.changed:', newDependency);
      const projectId = newDependency.projectId || activeProject.id;
      const storageKey = `task_dependencies_${projectId}`;
      try {
        const localData = localStorage.getItem(storageKey);
        let deps = [];
        if (localData) {
          deps = JSON.parse(localData);
        }
        if (!deps.some((d: any) => d.id === newDependency.id || (d.taskId === newDependency.taskId && d.dependsOnTaskId === newDependency.dependsOnTaskId))) {
          deps.push(newDependency);
          localStorage.setItem(storageKey, JSON.stringify(deps));
        }
      } catch (err) {
        console.error('Error handling task.dependency.changed', err);
      }
      queryClient.invalidateQueries({ queryKey: ['taskDependencies', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    });

    socket.on('cashflow.entry.created', (newEntry: any) => {
      console.log('[Socket] Received cashflow.entry.created:', newEntry);
      const projectId = newEntry.projectId;
      const storageKey = `stem_cash_flow_${projectId}`;
      try {
        const localData = localStorage.getItem(storageKey);
        let items = [];
        if (localData) {
          items = JSON.parse(localData);
        }
        if (!items.some((i: any) => i.id === newEntry.id)) {
          items = [newEntry, ...items];
          localStorage.setItem(storageKey, JSON.stringify(items));
        }
      } catch (err) {
        console.error('Error updating cash flow entry in localStorage', err);
      }
      window.dispatchEvent(new CustomEvent('rt:cashflow.entry.created', { detail: newEntry }));
    });

    socket.on('risk.status.changed', (updatedRisk: any) => {
      console.log('[Socket] Received risk.status.changed:', updatedRisk);
      const projectId = updatedRisk.projectId;
      const storageKey = `stem_risks_${projectId}`;
      try {
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          let items = JSON.parse(localData);
          items = items.map((i: any) => i.id === updatedRisk.id ? { ...i, ...updatedRisk } : i);
          localStorage.setItem(storageKey, JSON.stringify(items));
        }
      } catch (err) {
        console.error('Error updating risk in localStorage', err);
      }
      window.dispatchEvent(new CustomEvent('rt:risk.status.changed', { detail: updatedRisk }));
    });

    socket.on('communication.logged', (newLog: any) => {
      console.log('[Socket] Received communication.logged:', newLog);
      const projectId = newLog.projectId;
      const storageKey = `comm_logs_${projectId}`;
      try {
        const localData = localStorage.getItem(storageKey);
        let items = [];
        if (localData) {
          items = JSON.parse(localData);
        }
        if (!items.some((i: any) => i.id === newLog.id)) {
          items = [newLog, ...items];
          localStorage.setItem(storageKey, JSON.stringify(items));
        }
      } catch (err) {
        console.error('Error updating comm log in localStorage', err);
      }
      window.dispatchEvent(new CustomEvent('rt:communication.logged', { detail: newLog }));
    });

    return () => {
      console.log(`[Socket] Cleaning up socket for project: ${activeProject.id}`);
      socket.disconnect();
    };
  }, [activeProject?.id, queryClient]);

  // Auth Operations
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const userMatched = users.find(u => u.email.toLowerCase() === cleanEmail);
    
    if (userMatched) {
      if (userMatched.passwordHash && userMatched.passwordHash !== loginPassword) {
        alert('Senha incorreta!');
        return;
      }
      setActiveUser(userMatched);
      setForbiddenError(null);
      // Auto assign first project they are member of, or any default
      const userProjects = memberships
        .filter(m => m.userId === userMatched.id)
        .map(m => projects.find(p => p.id === m.projectId))
        .filter(Boolean) as Project[];
      
      if (userProjects.length > 0) {
        setActiveProject(userProjects[0]);
      } else {
        setActiveProject(null);
      }
      setCurrentTab('dashboard');
    } else {
      alert('Usuário não encontrado. Use um dos e-mails sugeridos ou cadastre-se!');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      alert('Preencha todos os campos!');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      alert('E-mail já cadastrado!');
      return;
    }

    // Solve or find organization
    let orgSelected = organizations.find(o => o.name.toLowerCase() === regOrgName.toLowerCase());
    if (!orgSelected) {
      orgSelected = { id: `org_${Date.now()}`, name: regOrgName.trim() };
      setOrganizations(prev => [...prev, orgSelected!]);
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: regName.trim(),
      email: cleanEmail,
      passwordHash: regPassword
    };

    setUsers(prev => [...prev, newUser]);
    setActiveUser(newUser);

    // Auto-create a first project for them under this organization
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      organizationId: orgSelected.id,
      name: `Projeto CO2 Dragster - ${regOrgName.trim()}`,
      startDate: '2026-06-01',
      endDate: '2026-12-15',
      executionRegime: 'linear'
    };

    setProjects(prev => [...prev, newProj]);
    
    // Add membership as default role
    const newMember: ProjectMember = {
      id: `mem_${Date.now()}`,
      projectId: newProj.id,
      userId: newUser.id,
      role: regRole,
      userEmail: newUser.email,
      userName: newUser.name
    };

    setMemberships(prev => [...prev, newMember]);
    
    setTabPermissionsMap(prev => ({
      ...prev,
      [`${newProj.id}_${newUser.id}`]: {
        dashboard: true,
        cronograma: true,
        orcamento: true,
        stakeholders: true,
        riscos: true,
        convidar: true
      }
    }));

    setActiveProject(newProj);
    setForbiddenError(null);
    setCurrentTab('dashboard');
    setIsRegistering(false);

    // Reset fields
    setRegName('');
    setRegEmail('');
    setRegPassword('');
  };

  const handleLogout = () => {
    setActiveUser(null);
    setActiveProject(null);
    setForbiddenError(null);
    setCurrentTab('dashboard');
  };

  // Switch project with simulated ProjectContextMiddleware authentication check
  const handleProjectSelect = (proj: Project) => {
    if (!activeUser) return;
    
    // Check if user is member of this project
    const isMember = memberships.some(m => m.projectId === proj.id && m.userId === activeUser.id);
    
    if (isMember) {
      setActiveProject(proj);
      setForbiddenError(null);
    } else {
      // Trigger the Forbidden 403 state representing ProjectContextMiddleware action
      setForbiddenError(
        `Erro 403: Acesso Negado pelo ProjectContextMiddleware. O usuário ${activeUser.name} (${activeUser.email}) não é membro registrado do projeto "${proj.name}" (ID do Projeto: ${proj.id}).`
      );
    }
  };

  // Create Project under active organzation
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    if (!activeUser) return;

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      organizationId: newProjOrgId,
      name: newProjName.trim(),
      startDate: newProjStartDate,
      endDate: newProjEndDate,
      executionRegime: newProjRegime
    };

    setProjects(prev => [...prev, newProj]);
    
    // Creator automatically becomes admin of the created project
    const newMem: ProjectMember = {
      id: `mem_${Date.now()}`,
      projectId: newProj.id,
      userId: activeUser.id,
      role: 'admin',
      userEmail: activeUser.email,
      userName: activeUser.name
    };

    setMemberships(prev => [...prev, newMem]);
    setActiveProject(newProj);
    setForbiddenError(null);
    setShowProjForm(false);
    
    setNewProjName('');
  };

  // Invite Member to active project
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeProject) return;

    const cleanEmail = inviteEmail.trim().toLowerCase();
    
    // Check if already member
    const alreadyMember = memberships.some(m => m.projectId === activeProject.id && m.userEmail.toLowerCase() === cleanEmail);
    if (alreadyMember) {
      alert('Este usuário já faz parte deste projeto!');
      return;
    }

    // Try finding existing users, else simulate register of new profile
    let targetUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!targetUser) {
      targetUser = {
        id: `user_${Date.now()}`,
        name: cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail
      };
      setUsers(prev => [...prev, targetUser!]);
    }

    // Insert into project membership
    const newMem: ProjectMember = {
      id: `mem_invited_${Date.now()}`,
      projectId: activeProject.id,
      userId: targetUser.id,
      role: inviteRole,
      userEmail: targetUser.email,
      userName: targetUser.name
    };

    setMemberships(prev => [...prev, newMem]);
    
    // Seed default tab permissions for the invited member
    const isOwnerRole = inviteRole === 'admin' || inviteRole === 'technical_lead';
    setTabPermissionsMap(prev => ({
      ...prev,
      [`${activeProject.id}_${targetUser.id}`]: {
        dashboard: true,
        cronograma: true,
        orcamento: isOwnerRole,
        stakeholders: true,
        riscos: true,
        convidar: isOwnerRole
      }
    }));

    setInviteEmail('');
    alert(`Usuário convidado com sucesso como ${inviteRole.toUpperCase()}!`);
  };

  // Quick helper to swap between pre-seeded simulation profiles
  const swapActiveProfile = (u: User) => {
    setActiveUser(u);
    setForbiddenError(null);
    const userMems = memberships.filter(m => m.userId === u.id);
    if (userMems.length > 0) {
      const matchProj = projects.find(p => p.id === userMems[0].projectId);
      if (matchProj) setActiveProject(matchProj);
    } else {
      setActiveProject(null);
    }
  };

  const currentOrg = organizations.find(o => activeProject && o.id === activeProject.organizationId) || organizations[0];
  const projectMembersList = memberships.filter(m => activeProject && m.projectId === activeProject.id);
  const compLevel = machConfig?.competitionLevel || 'regional';
  const activeOrgName = machConfig?.orgName || currentOrg.name;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-red-600 selection:text-white antialiased">
      
      {/* PROFESSIONAL RACING HUD HEADER */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-xl select-none">
        <div className="flex items-center gap-3">
          {/* Active Red Engine Flare Icon */}
          <div className="w-10 h-10 bg-red-600 hover:bg-red-700 transition-colors duration-150 rounded flex items-center justify-center font-black text-lg italic text-white tracking-widest cursor-pointer shadow-red-900/30 shadow-lg">
            SR
          </div>
          <div>
            <h1 className="text-sm font-display font-black tracking-widest text-[#FFF]">
              STEM RACING <span className="text-red-500 font-mono text-[11px] ml-1 capitalize">{compLevel}</span>
            </h1>
          </div>
        </div>

        {activeUser && (
          <div className="flex items-center gap-4">
            {/* Context Widget */}
            <div className="hidden md:flex flex-col text-right font-mono text-[10px] text-stone-400 border-r border-stone-800 pr-4">
              <span className="text-stone-400 uppercase">Gestor</span>
              <span className="font-bold text-[#FFF]">{activeUser.name}</span>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white transition-colors rounded-md bg-stone-900 select-none cursor-pointer"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 border border-stone-800 hover:border-red-600/50 text-stone-400 hover:text-red-500 transition-colors rounded-md bg-stone-900 select-none cursor-pointer"
              title="Efetuar Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* RENDER LOGIN PORTAL OUTSIDE THE ENGINE IF NOT AUTHENTICATED */}
      <AnimatePresence mode="wait">
        {!activeUser ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-grow flex items-center justify-center p-4 lg:p-8"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 50% 50%, #1c0303 0%, #0d0c0c 100%)' 
            }}
          >
            <div className="w-full max-w-sm rounded bg-stone-900/95 border border-stone-800 shadow-2xl p-6 lg:p-8 space-y-6">
              
              <div className="text-center space-y-2 select-none">
                <div className="inline-flex w-12 h-12 bg-red-600/10 border border-red-505 rounded-full items-center justify-center mb-1 text-red-500">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-display font-black text-white uppercase tracking-wider">
                  Portal de Engenharia
                </h2>
                <p className="text-xs text-stone-450 leading-relaxed font-sans px-2">
                  Acesse o Mach Control para consultar cronogramas, custos, riscos e stakeholders.
                </p>
              </div>

              {/* LOGIN FORM */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="mach-label text-stone-400">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="ex. gestor@machone.test" 
                    className="mach-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="mach-label text-stone-400">Senha</label>
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="mach-input"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="mach-button-primary w-full text-xs font-bold font-mono tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    Acessar Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          /* WORKSPACE PLATFORM INTERACTION ENGINE */
          <div className="flex-grow flex flex-col">
            {/* ── Settings Panel ── */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/98 backdrop-blur-md flex flex-col p-6 md:p-10 text-stone-850 dark:text-stone-100"
                >
                  <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col space-y-6">
                    <div className="flex justify-between items-center pb-6 border-b border-stone-250 dark:border-stone-800">
                      <div>
                        <h2 className="text-xl font-display font-black uppercase text-stone-900 dark:text-stone-100 tracking-wider">
                          Configurações do Sistema
                        </h2>
                        <p className="text-xs text-stone-450 font-mono mt-1">
                          Mach Control Legacy • Painel de Gestão e Customização
                        </p>
                      </div>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="p-2 px-4 rounded-lg border border-stone-250 dark:border-stone-800 text-stone-750 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-50 dark:bg-stone-900 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono text-xs uppercase shadow"
                      >
                        <X className="w-4 h-4" /> Fechar
                      </button>
                    </div>

                    {/* Seção 1: Configurações Gerais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Org Name */}
                      <div className="space-y-1.5">
                        <label className="mach-label text-stone-450 text-[10px] uppercase font-mono">Nome da Org</label>
                        <input
                          type="text"
                          value={machConfig?.orgName || ''}
                          onChange={e => {
                            const updated = { ...machConfig!, orgName: e.target.value };
                            setMachConfig(updated);
                            localStorage.setItem('mach_config', JSON.stringify(updated));
                          }}
                          className="mach-input w-full"
                        />
                      </div>

                      {/* Color */}
                      <div className="space-y-1.5">
                        <label className="mach-label text-stone-450 text-[10px] uppercase font-mono">Cor</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const updated = { ...machConfig!, primaryColor: 'red' as const };
                              setMachConfig(updated);
                              localStorage.setItem('mach_config', JSON.stringify(updated));
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                              machConfig?.primaryColor === 'red' ? 'border-red-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: '#DC2626' }}
                          />
                          <button
                            onClick={() => {
                              const updated = { ...machConfig!, primaryColor: 'cyan' as const };
                              setMachConfig(updated);
                              localStorage.setItem('mach_config', JSON.stringify(updated));
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                              machConfig?.primaryColor === 'cyan' ? 'border-cyan-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: '#06B6D4' }}
                          />
                        </div>
                      </div>

                      {/* Theme */}
                      <div className="space-y-1.5">
                        <label className="mach-label text-stone-450 text-[10px] uppercase font-mono">Tema</label>
                        <button
                          onClick={() => {
                            const updated = { ...machConfig!, theme: machConfig?.theme === 'dark' ? ('light' as const) : ('dark' as const) };
                            setMachConfig(updated);
                            localStorage.setItem('mach_config', JSON.stringify(updated));
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-250 dark:border-stone-800 text-stone-750 dark:text-stone-300 text-xs font-bold transition-all cursor-pointer bg-stone-50 dark:bg-stone-900 w-full justify-center"
                        >
                          {machConfig?.theme === 'dark' ? 'Escuro' : 'Claro'}
                        </button>
                      </div>

                      {/* Nível de Competição */}
                      <div className="space-y-1.5">
                        <label className="mach-label text-stone-450 text-[10px] uppercase font-mono">Nível de Competição</label>
                        <select
                          value={machConfig?.competitionLevel || 'regional'}
                          onChange={e => {
                            const updated = { ...machConfig!, competitionLevel: e.target.value as any };
                            setMachConfig(updated);
                            localStorage.setItem('mach_config', JSON.stringify(updated));
                          }}
                          className="mach-input py-1.5 text-xs font-bold capitalize cursor-pointer w-full"
                        >
                          <option value="regional">Regional</option>
                          <option value="nacional">Nacional</option>
                          <option value="mundial">Mundial</option>
                        </select>
                      </div>
                    </div>

                    {/* Seção 2: Métodos e Sub-módulos Ativos por Área */}
                    <div className="pt-6 border-t border-stone-250 dark:border-stone-800 space-y-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Métodos e Sub-módulos Ativos por Área
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cronograma */}
                        <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Cronograma</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                            {[
                              { key: 'enableWbs', label: 'WBS / EAP' },
                              { key: 'enable5w2h', label: 'Planilha 5W2H' },
                              { key: 'enableKanban', label: 'Quadro Kanban' },
                              { key: 'enableEisenhower', label: 'Matriz Eisenhower' },
                              { key: 'enableGantt', label: 'Gráfico de Gantt' },
                              { key: 'enableFlowchart', label: 'CANVAS / ReactFlow' }
                            ].map(method => {
                              const isEnabled = machConfig?.[method.key as keyof OrgConfig] !== false;
                              return (
                                <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={e => {
                                      const updated = { ...machConfig!, [method.key]: e.target.checked };
                                      setMachConfig(updated);
                                      localStorage.setItem('mach_config', JSON.stringify(updated));
                                    }}
                                    className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                                  />
                                  <span>{method.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Orçamento / Finanças */}
                        <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Orçamento & Finanças</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                            {[
                              { key: 'enableFinancePlanning', label: 'Planilha de Recursos' },
                              { key: 'enableFinanceQuotations', label: 'Cotações & Comparações' },
                              { key: 'enableFinanceBudget', label: 'Linhas de Baseline' },
                              { key: 'enableFinanceCashflow', label: 'Fluxo de Caixa / Ledger' },
                              { key: 'enableFinanceContingency', label: 'Reserva de Contingência' },
                              { key: 'enableFinanceReconciliation', label: 'Reconciliação Bancária' }
                            ].map(method => {
                              const isEnabled = machConfig?.[method.key as keyof OrgConfig] !== false;
                              return (
                                <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={e => {
                                      const updated = { ...machConfig!, [method.key]: e.target.checked };
                                      setMachConfig(updated);
                                      localStorage.setItem('mach_config', JSON.stringify(updated));
                                    }}
                                    className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                                  />
                                  <span>{method.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Stakeholders */}
                        <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Stakeholders</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                            {[
                              { key: 'enableStakeholdersMap', label: 'Mapeamento Mendelow' },
                              { key: 'enableStakeholdersMatrix', label: 'Matriz de Engajamento' },
                              { key: 'enableStakeholdersLog', label: 'Registro de Comunicações' }
                            ].map(method => {
                              const isEnabled = machConfig?.[method.key as keyof OrgConfig] !== false;
                              return (
                                <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={e => {
                                      const updated = { ...machConfig!, [method.key]: e.target.checked };
                                      setMachConfig(updated);
                                      localStorage.setItem('mach_config', JSON.stringify(updated));
                                    }}
                                    className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                                  />
                                  <span>{method.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Riscos */}
                        <div className="space-y-2 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">Riscos e Escopo</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
                            {[
                              { key: 'enableRisksList', label: 'Identificação de Riscos' },
                              { key: 'enableRisksReports', label: 'Relatórios de Status' },
                              { key: 'enableRisksScope', label: 'Controle de Escopo' },
                              { key: 'enableRisksEvm', label: 'Análise EVM / Valor Agregado' }
                            ].map(method => {
                              const isEnabled = machConfig?.[method.key as keyof OrgConfig] !== false;
                              return (
                                <label key={method.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={e => {
                                      const updated = { ...machConfig!, [method.key]: e.target.checked };
                                      setMachConfig(updated);
                                      localStorage.setItem('mach_config', JSON.stringify(updated));
                                    }}
                                    className="w-3.5 h-3.5 rounded text-[#DC2626] border-stone-250 dark:border-stone-850 bg-white dark:bg-stone-950 focus:ring-[#DC2626]"
                                  />
                                  <span>{method.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção Nova: Status de Integração e Banco de Dados */}
                    <div className="pt-6 border-t border-stone-250 dark:border-stone-800 space-y-3">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Infraestrutura & Banco de Dados
                      </h3>
                      <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-stone-800 dark:text-stone-200">Integração Relacional Híbrida</p>
                          <p className="text-stone-500 dark:text-stone-400 font-mono text-[10.5px]">Sincronização bidirecional entre LocalStorage offline e servidor cloud NestJS PostgreSQL.</p>
                        </div>
                        <div className="flex items-center gap-2.5 font-mono text-[10px]">
                          <span className={`px-2.5 py-1 rounded font-bold border flex items-center gap-1.5 ${isDbActive ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-500' : 'bg-stone-100 dark:bg-stone-950/50 border-stone-255 dark:border-stone-800 text-stone-600 dark:text-stone-400'}`}>
                            <Database className="w-3.5 h-3.5" />
                            {dbStatus}
                          </span>
                          <span className="bg-stone-100 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 px-2.5 py-1 rounded font-bold uppercase">
                            Sincronização Ativa
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Gerenciar Membros (Apenas Gestor) */}
                    {isGestorGlobal && (
                      <div className="pt-6 border-t border-stone-250 dark:border-stone-800 space-y-4">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Gerenciar Membros da Equipe
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Members List */}
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                            {users.map(u => {
                              const userMemberships = memberships.filter(m => m.userId === u.id);
                              const role = userMemberships[0]?.role || 'member';
                              const isUserAdmin = role === 'admin';
                              const memberVisibleProjects = visibility[u.id] || [];
                              const allUserProjects = projects.filter(p => p.name !== 'Visão Geral');

                              return (
                                <div
                                  key={u.id}
                                  className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-xl p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{u.name}</p>
                                      <p className="text-xs font-mono text-stone-500">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                        isUserAdmin ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-250 dark:border-stone-750'
                                      }`}>
                                        {role === 'technical_lead' ? 'Técnico' : role === 'admin' ? 'Gestor' : role}
                                      </span>
                                      {u.id !== activeUser?.id && (
                                        <button
                                          onClick={() => {
                                            setUsers(prev => prev.filter(usr => usr.id !== u.id));
                                            setMemberships(prev => prev.filter(m => m.userId !== u.id));
                                            setVisibility(prev => {
                                              const copy = { ...prev };
                                              delete copy[u.id];
                                              return copy;
                                            });
                                          }}
                                          className="text-stone-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                          title="Remover Membro da Organização"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Project visibility checkboxes */}
                                  {u.id !== activeUser?.id && (
                                    <div className="pt-2 border-t border-stone-800/40">
                                      <p className="text-[9px] font-mono uppercase tracking-wider mb-2 text-stone-500">
                                        Projetos visíveis:
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {allUserProjects.map(proj => {
                                          const isVisible = memberVisibleProjects.includes(proj.id);
                                          return (
                                            <button
                                              key={proj.id}
                                              onClick={() => {
                                                setVisibility(prev => {
                                                  const current = prev[u.id] || [];
                                                  const updated = isVisible
                                                    ? current.filter(id => id !== proj.id)
                                                    : [...current, proj.id];
                                                  return { ...prev, [u.id]: updated };
                                                });

                                                if (isVisible) {
                                                  setMemberships(prev =>
                                                    prev.filter(m => !(m.projectId === proj.id && m.userId === u.id))
                                                  );
                                                } else {
                                                  const exists = memberships.some(
                                                    m => m.projectId === proj.id && m.userId === u.id
                                                  );
                                                  if (!exists) {
                                                    setMemberships(prev => [
                                                      ...prev,
                                                      {
                                                        id: `mem_${Date.now()}_${u.id}_${proj.id}`,
                                                        projectId: proj.id,
                                                        userId: u.id,
                                                        role: role,
                                                        userEmail: u.email,
                                                        userName: u.name,
                                                      },
                                                    ]);
                                                  }
                                                }
                                              }}
                                              className={`text-[10px] font-mono px-2 py-1 rounded border transition-all cursor-pointer ${
                                                isVisible
                                                  ? 'bg-red-655 border-red-500 text-white shadow font-bold bg-[#DC2626]'
                                                  : 'bg-stone-100 dark:bg-stone-950 border-stone-250 dark:border-stone-850 text-stone-500 hover:border-stone-400 dark:hover:border-stone-750'
                                              }`}
                                            >
                                              {proj.name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Tab visibility checkboxes */}
                                  {u.id !== activeUser?.id && (
                                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800/40">
                                      <p className="text-[9px] font-mono uppercase tracking-wider mb-2 text-stone-500">
                                        Abas visíveis no projeto atual:
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {(['dashboard', 'cronograma', 'orcamento', 'stakeholders', 'riscos'] as const).map(tabKey => {
                                          const permKey = `${activeProject?.id}_${u.id}`;
                                          const userPerms = tabPermissionsMap[permKey] || {
                                            dashboard: true,
                                            cronograma: true,
                                            orcamento: tabKey === 'dashboard' || tabKey === 'cronograma',
                                            stakeholders: tabKey === 'dashboard' || tabKey === 'cronograma',
                                            riscos: tabKey === 'dashboard' || tabKey === 'cronograma',
                                            convidar: false
                                          };
                                          const isTabVisible = !!userPerms[tabKey];

                                          return (
                                            <button
                                              key={tabKey}
                                              onClick={() => {
                                                setTabPermissionsMap(prev => {
                                                  const current = prev[permKey] || {
                                                    dashboard: true,
                                                    cronograma: true,
                                                    orcamento: false,
                                                    stakeholders: false,
                                                    riscos: false,
                                                    convidar: false
                                                  };
                                                  const updated = {
                                                    ...current,
                                                    [tabKey]: !isTabVisible
                                                  };
                                                  return { ...prev, [permKey]: updated };
                                                });
                                              }}
                                              className={`text-[9px] font-mono px-2 py-1 rounded border transition-all cursor-pointer capitalize ${
                                                isTabVisible
                                                  ? 'bg-red-655 border-red-500 text-white shadow font-bold bg-[#DC2626]'
                                                  : 'bg-stone-100 dark:bg-stone-950 border-stone-250 dark:border-stone-850 text-stone-500 hover:border-stone-400 dark:hover:border-stone-750'
                                              }`}
                                            >
                                              {tabKey}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Add Member Form */}
                          <div className="p-4 rounded-xl border border-stone-250 dark:border-stone-800 bg-stone-55 dark:bg-stone-900 space-y-3">
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850 dark:text-stone-100">
                              Adicionar Novo Membro
                            </h4>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={newMemberName}
                                onChange={e => setNewMemberName(e.target.value)}
                                placeholder="Nome"
                                className="mach-input w-full"
                              />
                              <input
                                type="email"
                                value={newMemberEmail}
                                onChange={e => setNewMemberEmail(e.target.value)}
                                placeholder="email@equipe.com"
                                className="mach-input w-full"
                              />
                              <input
                                type="password"
                                value={newMemberPassword}
                                onChange={e => setNewMemberPassword(e.target.value)}
                                placeholder="Senha temporária"
                                className="mach-input w-full"
                              />
                              <select
                                value={newMemberRole}
                                onChange={e => setNewMemberRole(e.target.value as ProjectRole)}
                                className="mach-input w-full cursor-pointer text-xs"
                              >
                                <option value="member">Membro</option>
                                <option value="technical_lead">Técnico</option>
                                <option value="admin">Gestor</option>
                                <option value="mentor">Mentor</option>
                              </select>
                              <button
                                onClick={() => {
                                  if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()) return;
                                  
                                  const newUserId = `user_member_${Date.now()}`;
                                  const newUser: User = {
                                    id: newUserId,
                                    name: newMemberName.trim(),
                                    email: newMemberEmail.trim().toLowerCase(),
                                    passwordHash: newMemberPassword.trim(),
                                  };

                                  setUsers(prev => [...prev, newUser]);
                                  setVisibility(prev => ({
                                    ...prev,
                                    [newUserId]: []
                                  }));

                                  setMemberships(prev => [
                                    ...prev,
                                    {
                                      id: `mem_${Date.now()}_${newUserId}_${activeProject?.id}`,
                                      projectId: activeProject?.id || '',
                                      userId: newUserId,
                                      role: newMemberRole,
                                      userEmail: newUser.email,
                                      userName: newUser.name,
                                    }
                                  ]);
                                  
                                  setVisibility(prev => ({
                                    ...prev,
                                    [newUserId]: [activeProject?.id || '']
                                  }));

                                  setNewMemberName('');
                                  setNewMemberEmail('');
                                  setNewMemberPassword('');
                                  setNewMemberRole('member');
                                }}
                                disabled={!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()}
                                className="mach-button-primary w-full flex items-center justify-center gap-2 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar Membro
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-grow flex flex-col lg:flex-row" id="mach-workspace-rack">
              
              {/* SIDEBAR NAV - COLLAPSIBLE */}
              <aside className={`${sidebarCollapsed ? 'w-14' : 'w-full lg:w-64'} bg-stone-900 border-b lg:border-b-0 lg:border-r border-stone-800 p-3 flex flex-col justify-between select-none transition-all duration-200`}>
                <div className="space-y-4">
                  
                  {/* Collapse toggle */}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="w-full flex items-center justify-center p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                    title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
                  >
                    {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                  </button>

                  {!sidebarCollapsed && (
                    <>
                      {/* ORGANIZATION CONTEXT */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-stone-400 font-bold uppercase select-none mb-1">
                          <span>Organização</span>
                        </div>
                        
                        <div className="py-2 px-3 bg-stone-950 border border-stone-800/80 rounded flex items-center gap-2">
                          <Layers className="w-4 h-4 text-red-505 shrink-0" />
                          <span className="text-xs font-display font-medium truncate text-white">{activeOrgName}</span>
                        </div>

                        {/* TIMELINE DATE */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-stone-900 text-[10px] font-mono text-stone-400 border border-stone-800/60 rounded">
                          <Clock className="w-3.5 h-3.5 text-stone-500" />
                          <span>Timeline STEM : Junho 2026</span>
                        </div>
                      </div>

                      {/* PROJECT SWITCHER */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono tracking-wider text-stone-400 font-bold uppercase">Projetos</span>
                          <button
                            onClick={() => setShowProjForm(true)}
                            className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Criar
                          </button>
                        </div>

                        <div className="space-y-1.5 pr-1">
                          {projects.filter(p => {
                            if (p.name === 'Visão Geral') {
                              return isGestorGlobal;
                            }
                            return true;
                          }).map(p => {
                            const isActive = activeProject && activeProject.id === p.id;
                            
                            return (
                              <button
                                key={p.id}
                                onClick={() => handleProjectSelect(p)}
                                className={`w-full p-2.5 rounded text-left flex items-start gap-2 transition-all cursor-pointer ${
                                  isActive 
                                    ? 'bg-red-650/10 border border-red-500/50 text-white font-bold' 
                                    : 'bg-stone-950/60 border border-stone-850 hover:bg-stone-900 text-stone-300'
                                }`}
                              >
                                <Folder className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                <div className="min-w-0">
                                  <p className="text-xs truncate font-semibold leading-tight">{p.name}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    {/* NAVIGATION */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono tracking-wider text-stone-400 font-bold uppercase select-none block mb-1">Módulos</span>
                      
                      {hasTabPermission('dashboard') && (
                        <button
                          onClick={() => { setCurrentTab('dashboard'); setForbiddenError(null); }}
                          className={`w-full px-3 py-2.5 rounded text-left flex items-center gap-3 transition cursor-pointer ${
                            currentTab === 'dashboard' && !forbiddenError
                              ? 'bg-red-650 text-white font-bold' 
                              : 'text-stone-400 hover:bg-stone-850 hover:text-white'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                          <span className="text-xs font-semibold">Dashboard</span>
                        </button>
                      )}

                      {['cronograma', 'orcamento', 'stakeholders', 'riscos'].map(tb => {
                        if (!hasTabPermission(tb)) return null;
                        const labelMap: Record<string, string> = {
                          cronograma: 'Cronograma',
                          orcamento: 'Orçamento',
                          stakeholders: 'Stakeholders',
                          riscos: 'Riscos'
                        };
                        const iconMap: Record<string, React.ReactNode> = {
                          cronograma: <Calendar className="w-4 h-4" />,
                          orcamento: <DollarSign className="w-4 h-4" />,
                          stakeholders: <Compass className="w-4 h-4" />,
                          riscos: <ShieldAlert className="w-4 h-4" />
                        };

                        return (
                          <button
                            key={tb}
                            onClick={() => { setCurrentTab(tb as any); setForbiddenError(null); }}
                            className={`w-full px-3 py-2.5 rounded text-left flex items-center gap-3 transition cursor-pointer ${
                              currentTab === tb && !forbiddenError
                                ? 'bg-red-650 text-white font-bold' 
                                : 'text-stone-400 hover:bg-stone-850 hover:text-white'
                            }`}
                          >
                            {iconMap[tb]}
                            <span className="text-xs font-semibold">{labelMap[tb]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Collapsed mode — icon-only nav */}
                {sidebarCollapsed && (
                  <div className="flex flex-col items-center gap-1">
                    {[
                      { key: 'dashboard', icon: <Activity className="w-4 h-4" />, label: 'Dashboard' },
                      { key: 'cronograma', icon: <Calendar className="w-4 h-4" />, label: 'Cronograma' },
                      { key: 'orcamento', icon: <DollarSign className="w-4 h-4" />, label: 'Orçamento' },
                      { key: 'stakeholders', icon: <Compass className="w-4 h-4" />, label: 'Stakeholders' },
                      { key: 'riscos', icon: <ShieldAlert className="w-4 h-4" />, label: 'Riscos' },
                    ].map(item => hasTabPermission(item.key) ? (
                      <button
                        key={item.key}
                        onClick={() => { setCurrentTab(item.key as any); setForbiddenError(null); }}
                        className={`p-2 rounded transition cursor-pointer ${
                          currentTab === item.key && !forbiddenError
                            ? 'bg-red-650 text-white' 
                            : 'text-stone-500 hover:text-white hover:bg-stone-800'
                        }`}
                        title={item.label}
                      >
                        {item.icon}
                      </button>
                    ) : null)}
                  </div>
                )}

              </div>
            </aside>

            {/* BROAD VIEWPORT CENTRAL CONTAINER */}
            <main className="flex-grow p-4 lg:p-6 bg-stone-950 text-stone-100 flex flex-col max-w-full overflow-x-hidden">
              
              {/* DISPLAY ERROR PAGE FOR PROJECT CONTEXT ACCESS BLOCKS (403 INTERACTIVE DEMO) */}
              {forbiddenError ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-grow flex items-center justify-center p-4 lg:p-12 select-text"
                >
                  <div className="w-full max-w-xl bg-[#1a0707] border border-red-900/60 rounded p-6 shadow-2xl space-y-5 text-center">
                    <div className="inline-flex w-14 h-14 bg-red-600/10 border border-red-500/30 rounded-full items-center justify-center text-red-505">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-display font-black tracking-widest text-red-550 uppercase">
                        PROIBIDO • RESTRIÇÃO DE MEMBROS (403)
                      </h3>
                      <p className="text-xs text-stone-300 font-mono leading-relaxed bg-stone-950/70 p-4 border border-red-950/50 rounded break-words">
                        {forbiddenError}
                      </p>
                    </div>

                    <div className="p-4 bg-stone-950 rounded border border-stone-850 space-y-2 text-left text-[11px] font-mono leading-relaxed">
                      <div className="flex items-center gap-1.5 text-red-505 font-bold uppercase text-[10px]">
                        <Database className="w-3.5 h-3.5" /> LOG DE INTERCEPÇÃO DE MIDDLEWARE:
                      </div>
                      <p className="text-stone-400">
                        ProjectContextMiddleware.use()
                      </p>
                      <p className="text-stone-550 italic">
                        "Header 'x-project-id' recebido. Validando ID '{activeProject?.id}' contra registros da tabela project_members..."
                      </p>
                      <p className="text-red-505 font-bold">
                        → Erro: Cadastro excluído ou inexistente. Query retornou nulidade. Abortando com status 403.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          // Restore default F1 in Schools project selection
                          setActiveProject(INITIAL_PROJECTS[0]);
                          setForbiddenError(null);
                        }}
                        className="mach-button-primary bg-red-750 hover:bg-red-750 text-xs font-bold uppercase tracking-wider"
                      >
                        ◄ Retornar ao Projeto F1 in Schools Principal
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  
                  {/* MAIN DASHBOARD BLOCK */}
                  {currentTab === 'dashboard' && (
                    <motion.div 
                      key="dashboard"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* DASHBOARD HERO BANNER */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-stone-900 border border-stone-800 rounded gap-4 select-none">
                        <div>
                          <span className="text-[10px] bg-red-600/10 border border-red-505/30 text-red-505 font-mono px-2 py-0.5 rounded font-bold uppercase">
                            Ativo: {activeProject ? activeProject.name : 'Nenhum Projeto Selecionado'}
                          </span>
                          <h2 className="text-lg font-display font-black text-white uppercase mt-1 tracking-wider">
                            Estrutura Integrada de Monofactura
                          </h2>
                          <p className="text-[10.5px] text-stone-400 font-mono mt-0.5 uppercase tracking-wide">
                            Regime de Organização: <span className="font-bold text-white">{activeProject ? activeProject.executionRegime.replace('_', ' ').toUpperCase() : 'N/A'}</span>
                          </p>
                        </div>
                        
                        <div className="flex flex-col text-right font-mono text-[10.5px]">
                          <span className="text-stone-500 uppercase">Período de Planejamento</span>
                          <span className="font-bold text-stone-200 mt-0.5">{activeProject ? `${activeProject.startDate} até ${activeProject.endDate}` : 'N/A'}</span>
                        </div>
                      </div>

                      {/* PHASE 0 HIGH FIDELITY STATUS OVERVIEW */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stats-grid">
                        <div className="bg-stone-905 border border-stone-850 p-4 rounded text-center space-y-1 select-none">
                          <p className="text-[10px] text-stone-450 uppercase tracking-widest font-mono">Tamanho da Organização</p>
                          <p className="text-3xl font-display font-black text-white">{users.length}</p>
                          <p className="text-[9px] text-[#A3A3A3] font-mono leading-none">Usuários Cadastrados no Hub</p>
                        </div>

                        <div className="bg-stone-905 border border-stone-850 p-4 rounded text-center space-y-1 select-none">
                          <p className="text-[10px] text-stone-450 uppercase tracking-widest font-mono">Projetos Executivos</p>
                          <p className="text-3xl font-display font-black text-red-505">{projects.length}</p>
                          <p className="text-[9px] text-[#A3A3A3] font-mono leading-none">Projetos Ativos Cadastrados</p>
                        </div>

                        <div className="bg-stone-905 border border-stone-850 p-4 rounded text-center space-y-1 select-none">
                          <p className="text-[10px] text-stone-450 uppercase tracking-widest font-mono">Integrantes Deste Projeto</p>
                          <p className="text-3xl font-display font-black text-white">{projectMembersList.length}</p>
                          <p className="text-[9px] text-[#A3A3A3] font-mono leading-none">Membros Atribuídos via RBAC</p>
                        </div>
                      </div>

                      {/* ROADMAP DE MARCOS CRÍTICOS - NEW ADDITION */}
                      <div className="bg-stone-900 border border-stone-800 p-5 rounded space-y-4" id="legacy-roadmap-card">
                        <div className="flex justify-between items-center select-none">
                          <h3 className="text-xs font-bold uppercase text-white font-mono tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4 text-red-505" />
                            Roadmap e Progresso de Marcos Críticos (F1 in Schools)
                          </h3>
                          <span className="text-[10px] font-mono text-stone-400">
                            Frentes de Engenharia e Gestão
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                          {dashboardMilestones.map((m: any, idx: number) => {
                            const isCompleted = m.status === 'done' || m.progress === 100 || m.status === 'completed';
                            const isInProgress = m.status === 'in_progress' || (m.progress > 0 && m.progress < 100);
                            return (
                              <div 
                                key={m.id} 
                                className={`p-3 rounded border transition-all ${
                                  isCompleted 
                                    ? 'bg-emerald-950/10 border-emerald-800/30 text-emerald-300' 
                                    : isInProgress 
                                      ? 'bg-red-955 border-red-900/40 shadow-sm' 
                                      : 'bg-stone-950/60 border-stone-850'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[9px] font-mono font-bold text-stone-500">Etapa {idx + 1}</span>
                                  <span className={`w-2.5 h-2.5 rounded-full ${
                                    isCompleted 
                                      ? 'bg-emerald-500' 
                                      : isInProgress 
                                        ? 'bg-red-650 animate-pulse' 
                                        : 'bg-stone-700'
                                  }`} />
                                </div>
                                <h4 className="text-xs font-bold text-stone-200 line-clamp-2 h-8 leading-tight">
                                  {m.name}
                                </h4>
                                <div className="mt-3 space-y-1">
                                  <div className="flex justify-between text-[10px] font-mono text-stone-500">
                                    <span>Progresso</span>
                                    <span className={isInProgress ? 'text-red-400 font-bold' : isCompleted ? 'text-emerald-500 font-bold' : ''}>
                                      {m.progress || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-stone-850 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-red-600'}`} 
                                      style={{ width: `${m.progress || 0}%` }}
                                    />
                                  </div>
                                  <p className="text-[9px] font-mono text-stone-500 mt-1.5">
                                    Prazo: {new Date(m.endDate || '2026-12-31').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* DETAILED MONOREPO SUMMARY CARDS */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN: PROJECT MEMBERS */}
                        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded p-5 space-y-4">
                          <div className="flex justify-between items-center select-none">
                            <h3 className="text-xs font-bold uppercase text-white font-mono tracking-wider flex items-center gap-2">
                              <Users className="w-4 h-4 text-red-505" />
                              Membros do Projeto
                            </h3>
                            <button
                              onClick={() => setCurrentTab('convidar')}
                              className="text-[10.5px] text-red-500 hover:underline cursor-pointer font-bold font-mono uppercase"
                            >
                              + Convidar Membro
                            </button>
                          </div>

                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {projectMembersList.map(member => (
                              <div 
                                key={member.id}
                                className="p-3 bg-stone-950 rounded border border-stone-850 flex justify-between items-center text-xs font-mono select-text"
                              >
                                <div className="space-y-1">
                                  <p className="font-bold text-white text-[12px]">{member.userName}</p>
                                  <p className="text-[10px] text-stone-500 mt-0.5 truncate">{member.userEmail}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-extrabold border uppercase ${
                                    member.role === 'admin' 
                                      ? 'bg-red-500/10 border-red-500/30 text-red-505' 
                                      : 'bg-stone-900 border-stone-800 text-stone-300'
                                  }`}>
                                    {member.role === 'technical_lead' ? 'TÉCNICO' : member.role === 'admin' ? 'GESTOR' : member.role.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: PROJECT SUMMARY INFO */}
                        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 p-5 rounded space-y-5 flex flex-col justify-between">
                          <div className="space-y-3">
                            <span className="flex items-center gap-1.5 text-red-505 font-mono text-[10px] uppercase font-bold tracking-widest select-none">
                              <Layers className="w-4 h-4 text-red-505" /> RESUMO OPERACIONAL
                            </span>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                              Configurações do Projeto
                            </h3>
                            
                            <div className="space-y-3 pt-2">
                              <div className="flex justify-between items-center text-xs font-mono border-b border-stone-850 pb-2">
                                <span className="text-stone-400">Nível da Equipe:</span>
                                <span className="text-white font-bold capitalize">{compLevel}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-mono border-b border-stone-850 pb-2">
                                <span className="text-stone-400">Regime de Execução:</span>
                                <span className="text-white font-bold uppercase">{activeProject ? activeProject.executionRegime.replace('_', ' ') : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-mono border-b border-stone-850 pb-2">
                                <span className="text-stone-400">Início Estimado:</span>
                                <span className="text-white font-bold">{activeProject?.startDate || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-mono pb-1">
                                <span className="text-stone-400">Término Estimado:</span>
                                <span className="text-white font-bold">{activeProject?.endDate || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-stone-800 text-[10px] text-stone-500 font-mono leading-relaxed select-none">
                            <p>
                              Este painel consolida os parâmetros básicos da sua equipe. Use o menu de projetos para navegar nas áreas específicas de engenharia, marketing, orçamentos, riscos e stakeholders.
                            </p>
                          </div>
                        </div>

             
                      </div>

                    </motion.div>
                  )}

                  {/* CRONOGRAMA DASHBOARD INTEGRATION */}
                  {currentTab === 'cronograma' && activeProject && activeUser && (
                    <motion.div
                      key="cronograma"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <CronogramaDashboard
                        activeProject={activeProject}
                        activeUser={activeUser}
                        memberships={memberships}
                        users={users}
                        permissions={permissions}
                        config={machConfig || undefined}
                      />
                    </motion.div>
                  )}

                  {/* REAL BUDGET/FINANCE DETAILED COCKPIT */}
                  {currentTab === 'orcamento' && activeProject && (
                    <motion.div
                      key="orcamento"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-grow p-4 lg:p-12"
                    >
                      <Finance
                        activeProject={activeProject}
                        activeUser={activeUser}
                        memberships={memberships}
                        users={users}
                        permissions={permissions}
                        config={machConfig || undefined}
                      />
                    </motion.div>
                  )}

                  {/* INTERACTIVE STAKEHOLDERS & COMMUNICATIONS COCKPIT */}
                  {currentTab === 'stakeholders' && activeProject && activeUser && (
                    <motion.div 
                      key="stakeholders"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-grow p-4 lg:p-12"
                    >
                      <Stakeholders 
                        activeProject={activeProject}
                        activeUser={activeUser}
                        permissions={permissions}
                        config={machConfig || undefined}
                      />
                    </motion.div>
                  )}

                  {/* INTERACTIVE RISKS & CONTRAMEASURES COCKPIT */}
                  {currentTab === 'riscos' && activeProject && activeUser && (
                    <motion.div 
                      key="riscos"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-grow p-4 lg:p-12"
                    >
                      <RiskManagement 
                        activeProject={activeProject}
                        activeUser={activeUser}
                        permissions={permissions}
                        config={machConfig || undefined}
                      />
                    </motion.div>
                  )}

                </AnimatePresence>
              )}

            </main>
          </div>
        </div>
      )}
    </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-stone-900 border-t border-stone-850 py-3 text-center select-none font-mono text-[9px] uppercase tracking-wider text-stone-500">
        STEM Racing • F1 in Schools • Mach Control
      </footer>

      {/* CREATE NEW PROJECT MODAL */}
      {showProjForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded overflow-hidden shadow-2xl">
            <div className="bg-stone-950 p-4 border-b border-stone-850 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-red-505 uppercase font-mono flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-red-505" />
                Criar Projeto
              </h3>
              <button onClick={() => setShowProjForm(false)} className="text-stone-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-4 space-y-4 text-xs font-sans">
              <div>
                <label className="mach-label text-stone-400">Nome do Projeto</label>
                <input 
                  type="text" 
                  value={newProjName} 
                  required
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="ex. Engenharia Aerodinâmica"
                  className="mach-input"
                />
              </div>

              <div>
                <label className="mach-label text-stone-400">Organização</label>
                <select 
                  value={newProjOrgId} 
                  onChange={e => setNewProjOrgId(e.target.value)} 
                  className="mach-input font-medium cursor-pointer"
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mach-label text-stone-400">Início Estimado</label>
                  <input 
                    type="date" 
                    value={newProjStartDate} 
                    required 
                    onChange={e => setNewProjStartDate(e.target.value)} 
                    className="mach-input font-mono text-center" 
                  />
                </div>

                <div>
                  <label className="mach-label text-stone-400">Término Estimado</label>
                  <input 
                    type="date" 
                    value={newProjEndDate} 
                    required 
                    onChange={e => setNewProjEndDate(e.target.value)} 
                    className="mach-input font-mono text-center" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="mach-label text-stone-400">Regime de Execução</label>
                <div className="grid grid-cols-2 gap-2 text-center font-bold font-mono text-[9px] uppercase select-none">
                  <button 
                    type="button"
                    onClick={() => setNewProjRegime('linear')}
                    className={`p-2.5 border rounded cursor-pointer transition-colors ${
                      newProjRegime === 'linear' 
                        ? 'border-red-500 bg-red-600/10 text-white font-extrabold' 
                        : 'border-stone-800 text-stone-400 hover:text-white bg-stone-950/50'
                    }`}
                  >
                    Linear (Padrão)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewProjRegime('fast_tracking')}
                    className={`p-2.5 border rounded cursor-pointer transition-colors ${
                      newProjRegime === 'fast_tracking' 
                        ? 'border-red-500 bg-red-600/10 text-white font-extrabold' 
                        : 'border-stone-800 text-stone-400 hover:text-white bg-stone-950/50'
                    }`}
                  >
                    Fast Tracking
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-850">
                <button type="button" onClick={() => setShowProjForm(false)} className="mach-button-secondary text-xs">Cancelar</button>
                <button type="submit" className="mach-button-primary text-xs font-bold uppercase tracking-wider font-mono">Criar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
