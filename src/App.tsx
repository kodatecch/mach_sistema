import React, { useState, useEffect } from 'react';
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
  Database,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  Eye,
  CheckCircle,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { User, Project, ProjectMember, Organization, ProjectRole, ExecutionRegime } from './types';
import CronogramaDashboard from './components/CronogramaDashboard';
import Finance from './components/Finance';
import Stakeholders from './components/Stakeholders';
import RiskManagement from './components/RiskManagement';

// Pre-seeded local mock database
const INITIAL_ORGS: Organization[] = [
  { id: 'org_mach_one', name: 'Mach Racing (F1 in Schools)' },
  { id: 'org_aerodesign', name: 'Planalto AeroDesign (STEM)' }
];

const INITIAL_USERS: User[] = [
  { id: 'user_pedro', email: 'director@machone.test', name: 'Pedro Henrique' },
  { id: 'user_ana', email: 'leader@machone.test', name: 'Ana Clara' },
  { id: 'user_bruno', email: 'member@machone.test', name: 'Bruno Sousa' }
];

const INITIAL_PROJECTS: Project[] = [
  { 
    id: 'proj_fsae_2026', 
    organizationId: 'org_mach_one', 
    name: 'Mach Racing F1 in Schools 2026', 
    startDate: '2026-01-10', 
    endDate: '2026-11-20', 
    executionRegime: 'fast_tracking' 
  },
  { 
    id: 'proj_secret_ev', 
    organizationId: 'org_mach_one', 
    name: 'Mach Racing Aero & Usinagem CNC', 
    startDate: '2026-03-01', 
    endDate: '2026-12-15', 
    executionRegime: 'linear' 
  }
];

// Pedro belongs to both, Ana and Bruno belong ONLY to F1 in Schools
const INITIAL_MEMBERSHIPS: ProjectMember[] = [
  { id: 'mem_pedro_comb', projectId: 'proj_fsae_2026', userId: 'user_pedro', role: 'admin', userEmail: 'director@machone.test', userName: 'Pedro Henrique' },
  { id: 'mem_ana_comb', projectId: 'proj_fsae_2026', userId: 'user_ana', role: 'area_lead', userEmail: 'leader@machone.test', userName: 'Ana Clara' },
  { id: 'mem_bruno_comb', projectId: 'proj_fsae_2026', userId: 'user_bruno', role: 'member', userEmail: 'member@machone.test', userName: 'Bruno Sousa' },
  { id: 'mem_pedro_ev', projectId: 'proj_secret_ev', userId: 'user_pedro', role: 'admin', userEmail: 'director@machone.test', userName: 'Pedro Henrique' }
];

const INITIAL_REGULATION_RULES = [
  { id: 'rule_weight', projectId: 'proj_fsae_2026', parameterName: 'weight_limit_g', limitValue: 50.0, unit: 'g', description: 'Peso mínimo do carrinho sem cartucho de CO2' },
  { id: 'rule_length', projectId: 'proj_fsae_2026', parameterName: 'length_limit_mm', limitValue: 210.0, unit: 'mm', description: 'Comprimento total máximo permitido para o dragster' },
  { id: 'rule_width', projectId: 'proj_fsae_2026', parameterName: 'width_limit_mm', limitValue: 65.0, unit: 'mm', description: 'Largura máxima com as rodas traseiras montadas' },
  { id: 'rule_co2', projectId: 'proj_fsae_2026', parameterName: 'co2_canister_g', limitValue: 8.0, unit: 'g', description: 'Massa padrão do cartucho de gás carbônico descartável' }
];

const INITIAL_MACH_WHEEL_SCORES = [
  { id: 'score_eng', projectId: 'proj_fsae_2026', category: 'Engineering Portfolio', scoreBefore: 5.5, scoreAfter: 8.5 },
  { id: 'score_ent', projectId: 'proj_fsae_2026', category: 'Enterprise Portfolio', scoreBefore: 6.0, scoreAfter: 9.0 },
  { id: 'score_soc', projectId: 'proj_fsae_2026', category: 'Social Development / Sustainability Portfolio', scoreBefore: 4.0, scoreAfter: 7.5 },
  { id: 'score_verb', projectId: 'proj_fsae_2026', category: 'Verbal Presentation', scoreBefore: 5.0, scoreAfter: 8.0 },
  { id: 'score_pit', projectId: 'proj_fsae_2026', category: 'Pit Display', scoreBefore: 4.5, scoreAfter: 8.5 },
  { id: 'score_id', projectId: 'proj_fsae_2026', category: 'Team Identity', scoreBefore: 6.5, scoreAfter: 9.5 }
];

export default function App() {
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
    return data ? JSON.parse(data) : INITIAL_PROJECTS;
  });

  const [memberships, setMemberships] = useState<ProjectMember[]>(() => {
    const data = localStorage.getItem('stem_memberships');
    return data ? JSON.parse(data) : INITIAL_MEMBERSHIPS;
  });

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
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  // Forms inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('Mach Racing (F1 in Schools)');

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

          if (mockRole === 'admin') {
            setPermissions({
              role: 'admin',
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
      email: cleanEmail
    };

    setUsers(prev => [...prev, newUser]);
    setActiveUser(newUser);

    // Auto-create a first project for them under this organization
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      organizationId: orgSelected.id,
      name: `Car Project ${regName.trim()}`,
      startDate: '2026-06-01',
      endDate: '2026-12-15',
      executionRegime: 'linear'
    };

    setProjects(prev => [...prev, newProj]);
    
    // Add membership as default admin
    const newMember: ProjectMember = {
      id: `mem_${Date.now()}`,
      projectId: newProj.id,
      userId: newUser.id,
      role: 'admin',
      userEmail: newUser.email,
      userName: newUser.name
    };

    setMemberships(prev => [...prev, newMember]);
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
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-display font-black tracking-widest text-[#FFF]">
                STEM RACING <span className="text-red-500 font-mono text-[11px] ml-1">Fase 0 - Fundação</span>
              </h1>
              <span className="bg-red-500/10 border border-red-500/30 text-red-505 text-[9px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase font-mono">
                NestJS • React • Prisma
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-0.5">Software Integrado de Equipes de Alto Desempenho</p>
          </div>
        </div>

        {activeUser && (
          <div className="flex items-center gap-4">
            {/* Context Widget */}
            <div className="hidden md:flex flex-col text-right font-mono text-[10px] text-stone-450 border-r border-stone-850 pr-4">
              <span className="text-stone-450 uppercase">Usuário Autenticado</span>
              <span className="font-bold text-[#FFF]">{activeUser.name}</span>
            </div>
            
            {/* Quick user selector to demonstrate Auth and 403 */}
            <div className="flex items-center gap-1.5 bg-stone-950/40 p-1 rounded-md border border-stone-800">
              <span className="text-[9.5px] font-mono font-bold text-stone-500 px-2 uppercase">Simular logins:</span>
              {INITIAL_USERS.map(u => (
                <button
                  key={u.id}
                  onClick={() => swapActiveProfile(u)}
                  className={`text-[9px] font-mono font-medium px-2 py-1 rounded transition-colors ${
                    activeUser.id === u.id 
                      ? 'bg-red-650 text-white font-extrabold shadow' 
                      : 'text-stone-400 hover:text-white bg-stone-900/50'
                  }`}
                  title={`Alternar instantaneamente para ${u.name}`}
                >
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>

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
                  {isRegistering ? 'Cadastrar Nova Equipe' : 'Portal de Engenharia'}
                </h2>
                <p className="text-xs text-stone-450 leading-relaxed font-sans px-2">
                  {isRegistering 
                    ? 'Inicie a estrutura de sua organização e projeto de monofactura de forma ágil.' 
                    : 'Acesse o Mach Control para consultar cronogramas, custos, riscos e stakeholders.'}
                </p>
              </div>

              {!isRegistering ? (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="mach-label text-stone-400">E-mail Corporativo / Simulado</label>
                    <input 
                      type="email" 
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="DIRETOR: director@machone.test" 
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

                  {/* Built-in Credential assist tool */}
                  <div className="bg-stone-950 p-2.5 rounded border border-stone-850/60 text-[10px] font-mono leading-normal text-stone-500">
                    <p className="font-bold text-red-505 uppercase mb-1">💡 Credenciais Rápidas de Teste:</p>
                    <ul className="space-y-1">
                      <li>• <span className="text-stone-300">director@machone.test</span> (Senha: 123) (ADMIN)</li>
                      <li>• <span className="text-stone-300">leader@machone.test</span> (Senha: 123) (LEAD)</li>
                      <li>• <span className="text-stone-300">member@machone.test</span> (Senha: 123) (MEMBER)</li>
                    </ul>
                  </div>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="mach-label text-stone-400">Nome Completo</label>
                    <input 
                      type="text" 
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="ex. Guilherme Oliveira" 
                      className="mach-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="mach-label text-stone-400">E-mail</label>
                    <input 
                      type="email" 
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="ex. guilherme@universidade.edu" 
                      className="mach-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="mach-label text-stone-400">Senha Segura</label>
                    <input 
                      type="password" 
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="mach-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="mach-label text-stone-400">Nome da Organização (Equipe)</label>
                    <input 
                      type="text" 
                      required
                      value={regOrgName}
                      onChange={e => setRegOrgName(e.target.value)}
                      placeholder="ex. Pegasus STEM Racing" 
                      className="mach-input"
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="mach-button-primary w-full text-xs font-bold font-mono tracking-widest uppercase"
                    >
                      Processar Cadastro Integrado
                    </button>
                  </div>
                </form>
              )}

              {/* SOCIAL GOOGLE LOGIN OPTION */}
              <div className="relative flex py-2 items-center text-xs font-semibold select-none text-stone-500">
                <div className="flex-grow border-t border-stone-800"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase tracking-wider font-mono">Ou use Login Social</span>
                <div className="flex-grow border-t border-stone-800"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  // Simulate Google Social OAuth2 Login action
                  setActiveUser({
                    id: 'google_user_demo',
                    email: 'parceria.f1@g.unicamp.br',
                    name: 'Guilherme Leonardo (Google Auth)'
                  });
                  // Preseeding a workspace for google user
                  const newProj: Project = {
                    id: 'proj_google_racing',
                    organizationId: 'org_mach_one',
                    name: 'Unicamp Pegasus STEM F1 Hub',
                    startDate: '2026-06-20',
                    endDate: '2026-12-01',
                    executionRegime: 'fast_tracking'
                  };
                  if (!projects.some(p => p.id === 'proj_google_racing')) {
                    setProjects(prev => [...prev, newProj]);
                    setMemberships(prev => [...prev, {
                      id: `mem_google_${Date.now()}`,
                      projectId: 'proj_google_racing',
                      userId: 'google_user_demo',
                      role: 'admin',
                      userEmail: 'parceria.f1@g.unicamp.br',
                      userName: 'Guilherme Leonardo (Google Auth)'
                    }]);
                  }
                  setActiveProject(newProj);
                  setForbiddenError(null);
                  setCurrentTab('dashboard');
                }}
                className="w-full py-2 px-3 border border-stone-800 bg-stone-950 hover:bg-stone-900 transition-colors text-xs font-mono font-medium rounded flex items-center justify-center gap-2 text-stone-200 select-none cursor-pointer"
              >
                {/* Simulated Google Icon */}
                <span className="w-4.5 h-4.5 bg-red-650 text-white rounded-full flex items-center justify-center font-bold text-[9px] font-sans">G</span>
                Entrar com Conta Google OAuth2
              </button>

              <div className="text-center font-mono text-[11px] select-none text-stone-450 pt-2">
                {isRegistering ? (
                  <p>
                    Já possui conta?{' '}
                    <button 
                      onClick={() => setIsRegistering(false)} 
                      className="text-red-500 hover:underline font-bold"
                    >
                      Inicie Sessão
                    </button>
                  </p>
                ) : (
                  <p>
                    Novo na Racing?{' '}
                    <button 
                      onClick={() => setIsRegistering(true)} 
                      className="text-red-500 hover:underline font-bold"
                    >
                      Cadastre sua Equipe
                    </button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* WORKSPACE PLATFORM INTERACTION ENGINE */
          <div className="flex-grow flex flex-col lg:flex-row" id="mach-workspace-rack">
            
            {/* PORT SIDEBAR NAV CONTROL */}
            <aside className="w-full lg:w-64 bg-stone-900 border-b lg:border-b-0 lg:border-r border-stone-800 p-5 flex flex-col justify-between select-none">
              <div className="space-y-6">
                
                {/* ORGANIZATIONS & PROJECT CONTEXT BOARD */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-stone-400 font-bold uppercase select-none mb-1">
                    <span>Organização</span>
                    <span className="text-red-500">Mach One</span>
                  </div>
                  
                  <div className="py-2 px-3 bg-stone-950 border border-stone-800/80 rounded flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-505 shrink-0" />
                    <span className="text-xs font-display font-medium truncate text-white">{currentOrg.name}</span>
                  </div>

                  {/* ACTIVE TIMELINE DATE */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-stone-900 text-[10px] font-mono text-stone-400 border border-stone-800/60 rounded">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Timeline STEM : Junho 2026</span>
                  </div>
                </div>

                {/* PROJECT SWITCHER WITH MIDDLEWARE DEMONSTRATION */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-wider text-stone-400 font-bold uppercase">Projetos do Usuário</span>
                    <button
                      onClick={() => setShowProjForm(true)}
                      className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Criar Projeto
                    </button>
                  </div>

                  {/* PROJECT LIST DROPDOWN COMPRESSED CONTAINER */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {/* General display of active projects */}
                    {projects.map(p => {
                      const isActive = activeProject && activeProject.id === p.id;
                      const isMember = memberships.some(m => m.projectId === p.id && m.userId === activeUser.id);
                      
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleProjectSelect(p)}
                          className={`w-full p-2.5 rounded text-left flex items-start gap-2 transition-all ${
                            isActive 
                              ? 'bg-red-600/10 border border-red-500/50 text-white font-bold' 
                              : 'bg-stone-950/60 border border-stone-850 hover:bg-stone-900 text-stone-300'
                          }`}
                        >
                          <Folder className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                          <div className="min-w-0">
                            <p className="text-xs truncate font-semibold leading-tight">{p.name}</p>
                            <span className="text-[9px] font-mono text-stone-505 block tracking-wider uppercase mt-0.5">
                              {p.executionRegime.toUpperCase()} • {isMember ? 'MEMBRO' : 'EXTERNO (403)'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CENTRAL AREA NAVIGATION BAR */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono tracking-wider text-stone-400 font-bold uppercase select-none block mb-1">Menus de Negócio</span>
                  
                  <button
                    onClick={() => { setCurrentTab('dashboard'); setForbiddenError(null); }}
                    className={`w-full px-3 py-2.5 rounded text-left flex items-center gap-3 transition ${
                      currentTab === 'dashboard' && !forbiddenError
                        ? 'bg-red-650 text-white font-bold' 
                        : 'text-stone-400 hover:bg-stone-850 hover:text-white'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-semibold">Dashboard Principal</span>
                  </button>

                  <button
                    onClick={() => { setCurrentTab('convidar'); setForbiddenError(null); }}
                    className={`w-full px-3 py-2.5 rounded text-left flex items-center gap-3 transition ${
                      currentTab === 'convidar' && !forbiddenError
                        ? 'bg-red-650 text-white font-bold' 
                        : 'text-stone-400 hover:bg-stone-850 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-xs font-semibold">Membros & RACI</span>
                  </button>

                  {/* SIDEBAR TABS SPECIFIED IN SCOPE TO REMAIN PLACEHOLDERS */}
                  {['cronograma', 'orcamento', 'stakeholders', 'riscos'].map(tb => {
                    const labelMap: Record<string, string> = {
                      cronograma: 'Cronograma WBS',
                      orcamento: 'Orçamento Financeiro',
                      stakeholders: 'Mapeamento Stakeholders',
                      riscos: 'Matriz de Riscos'
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
                        className={`w-full px-3 py-2.5 rounded text-left flex items-center gap-3 transition ${
                          currentTab === tb && !forbiddenError
                            ? 'bg-red-650 text-white font-bold' 
                            : 'text-stone-400 hover:bg-stone-850 hover:text-white'
                        }`}
                      >
                        {iconMap[tb]}
                        <span className="text-xs font-semibold">{labelMap[tb]}</span>
                        <span className="ml-auto text-[8px] bg-stone-950 font-mono px-1 py-0.5 rounded text-stone-500 font-bold uppercase tracking-wider">F1</span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* USER PROFILE CARD AND METADATA */}
              <div className="pt-4 border-t border-stone-800 space-y-2 mt-4">
                <div className="bg-stone-950 p-3 rounded border border-stone-900/60 font-mono text-[10px]">
                  <p className="text-stone-500 uppercase tracking-wide">Privilégios RBAC</p>
                  <p className="text-[#FFF] font-bold mt-1 text-xs">{currentUserRole ? currentUserRole.toUpperCase() : 'SEM ACESSO'}</p>
                  <p className="text-stone-400 mt-0.5 leading-normal truncate">{activeUser.email}</p>
                </div>
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

                      {/* DETAILED MONOREPO SUMMARY CARDS */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN: ACTIVE PROJECT ROLES */}
                        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded p-5 space-y-4">
                          <div className="flex justify-between items-center select-none">
                            <h3 className="text-xs font-bold uppercase text-white font-mono tracking-wider flex items-center gap-2">
                              <Users className="w-4.5 h-4.5 text-red-505" />
                              Quadro de Atribuições (RBAC) do Projeto
                            </h3>
                            <button
                              onClick={() => setCurrentTab('convidar')}
                              className="text-[10.5px] text-red-500 hover:underline cursor-pointer"
                            >
                              + Convidar Integrante
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
                                    {member.role === 'area_lead' ? 'AREA LEAD' : member.role.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: RECRUITMENT AND INTEGRATION TEST BENCH */}
                        <div className="lg:col-span-5 bg-stone-905 border border-stone-850 p-5 rounded space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <span className="flex items-center gap-1.5 text-red-550 font-mono text-[10px] uppercase font-bold tracking-widest select-none">
                              <ShieldCheck className="w-4 h-4" /> TEST BENCH DE ARQUITETURA
                            </span>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulador Integrador Prisma ORM</h3>
                            <p className="text-xs text-stone-300 leading-relaxed select-text">
                              As tabelas <code className="text-red-500 bg-stone-950 px-1 py-0.5 rounded">users</code>, <code className="text-red-500 bg-stone-950 px-1 py-0.5 rounded font-bold">organizations</code> e <code className="text-red-500 bg-stone-950 px-1 py-0.5 rounded">project_members</code> estão vinculadas de forma relacional.
                            </p>
                            
                            <div className="p-3 bg-stone-950 border border-stone-900 rounded space-y-1 text-[10.5px] font-mono whitespace-pre text-stone-400">
                              <span>// Query SQL Traced (Prisma):</span>
                              <p className="text-stone-500">
                                {`prisma.project.findUnique({
  where: { id: "${activeProject?.id}" },
  include: { members: true }
})`}
                              </p>
                              <span className="text-red-505 text-[9.5px] font-bold block mt-1 uppercase">✓ Conectado ao PostgreSQL</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-stone-800 text-xs font-mono space-y-2">
                            <h4 className="text-stone-400 uppercase text-[9px] font-bold tracking-widest">Acesso de Teste (Instalação e Suporte)</h4>
                            <p className="text-[10px] text-stone-500 leading-normal">
                              Use os botões de login rápido para experimentar os comportamentos de restrição e permissões (RBAC). Alternar perfis atualiza os direitos operacionais instantaneamente.
                            </p>
                          </div>
                        </div>

                      </div>

                    </motion.div>
                  )}

                  {/* INVITE AND RACI ASSIGNMENT TABS */}
                  {currentTab === 'convidar' && (
                    <motion.div 
                      key="convidar"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* HEADER */}
                      <div className="flex justify-between items-center pb-3 border-b border-stone-800 select-none">
                        <div>
                          <h2 className="text-lg font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-red-505" />
                            Gerenciamento de Integrantes da Equipe
                          </h2>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5 uppercase tracking-wide">Atribuição de Papéis para Monofactura STEM Racing</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* INVITE FORM */}
                        <div className="bg-stone-900 border border-stone-800 rounded p-5 space-y-4">
                          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Nova Credencial de Integração</h3>
                          
                          <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div className="space-y-1">
                              <label className="mach-label text-stone-400">E-mail do Novo Membro</label>
                              <input 
                                type="email" 
                                required
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="ex. participante@universidade.br" 
                                className="mach-input"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="mach-label text-stone-400">Papel na Equipe (Privilégio RBAC)</label>
                              <select 
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value as any)}
                                className="mach-input font-mono uppercase"
                              >
                                <option value="member">Membro Técnico (Member)</option>
                                <option value="area_lead">Líder de Área (Area Lead)</option>
                                <option value="mentor">Orientador / Mentor (Mentor)</option>
                                <option value="sponsor">Patrocinador / Sponsor</option>
                                <option value="admin">Administrador (Admin)</option>
                              </select>
                            </div>

                            <div className="pt-2">
                              <button 
                                type="submit" 
                                className="mach-button-primary w-full text-xs font-bold tracking-wider font-mono uppercase"
                              >
                                Emitir Convite e Cadastrar Membro
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* RECRUITER LIST INTEGRATORS */}
                        <div className="bg-stone-900 border border-stone-800 rounded p-5 space-y-4">
                          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Usuários Registrados na Equipe</h3>
                          
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {users.map(u => {
                              const associatedProjects = memberships
                                .filter(m => m.userId === u.id)
                                .map(m => {
                                  const pr = projects.find(p => p.id === m.projectId);
                                  return pr ? { name: pr.name, role: m.role } : null;
                                })
                                .filter(Boolean) as { name: string; role: string }[];

                              return (
                                <div 
                                  key={u.id}
                                  className="p-3 bg-stone-950 rounded border border-stone-850 space-y-2 text-xs select-text"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-extrabold text-white text-[12px]">{u.name}</p>
                                      <p className="text-[10px] text-stone-500 font-mono mt-0.5">{u.email}</p>
                                    </div>
                                    <span className="text-[9px] font-mono text-stone-450 bg-stone-900 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                                      ID: {u.id.substring(0, 8)}
                                    </span>
                                  </div>

                                  {associatedProjects.length > 0 && (
                                    <div className="pt-2 border-t border-stone-900/60 flex flex-wrap gap-1.5">
                                      {associatedProjects.map((p, i) => (
                                        <span 
                                          key={i}
                                          className="bg-stone-900 border border-stone-800 text-stone-400 font-mono text-[8.5px] px-2 py-0.5 rounded uppercase truncate max-w-[200px]"
                                          title={p.name}
                                        >
                                          {p.name.split(' ')[0]} : {p.role.toUpperCase()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
                      />
                    </motion.div>
                  )}

                </AnimatePresence>
              )}

            </main>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-stone-900 border-t border-stone-850 py-4 text-center select-none font-mono text-[9px] uppercase tracking-wider text-stone-500">
        Plataforma STEM Racing • F1 in Schools Hub de Alta Performance • Integração Fase 0 (Fundação) • UTFPR & Univs.
      </footer>

      {/* CREATE NEW PROJECT MODAL */}
      {showProjForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded overflow-hidden shadow-2xl">
            <div className="bg-stone-950 p-4 border-b border-stone-850 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-red-505 uppercase font-mono flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-red-505" />
                Criar Projeto Executivo
              </h3>
              <button onClick={() => setShowProjForm(false)} className="text-stone-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-4 space-y-4 text-xs font-sans">
              <div>
                <label className="mach-label text-stone-400">Nome do Carro / Projeto</label>
                <input 
                  type="text" 
                  value={newProjName} 
                  required
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="ex. Aerodinâmica & Fibra de Carbono"
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
                <label className="mach-label text-stone-400">Regime de Execução de Engenharia</label>
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
                <p className="text-[9px] text-[#A3A3A3] font-mono leading-none pt-0.5 select-none">Fast Tracking permite sobreposição de sprints de simulação.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-850">
                <button type="button" onClick={() => setShowProjForm(false)} className="mach-button-secondary text-xs">Cancelar</button>
                <button type="submit" className="mach-button-primary text-xs font-bold uppercase tracking-wider font-mono">Processar Criação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORE DATABASE INSPECTOR TERMINAL BUTTON (collapsible visual aid) */}
      <div className="fixed bottom-4 right-4 z-50 select-none">
        <details className="bg-stone-900 border border-stone-800 rounded shadow-2xl overflow-hidden max-w-[21rem]">
          <summary className="p-3 font-mono text-[10px] uppercase font-bold text-red-550 flex items-center gap-2 cursor-pointer border-b border-stone-850 bg-stone-950/90 list-none">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <Database className="w-3.5 h-3.5" /> Inspetor Postgres DB (Live)
          </summary>
          <div className="p-4 bg-stone-950 font-mono text-[9px] leading-relaxed text-stone-400 space-y-4 max-h-72 overflow-y-auto">
            
            {/* USERS TABLE */}
            <div className="space-y-1">
              <span className="text-[#FFF] font-extrabold flex items-center gap-1">■ users [SELECT *] :</span>
              {users.map(u => (
                <div key={u.id} className="ml-2 pl-2 border-l border-stone-800">
                  id: <span className="text-red-505">{u.id}</span> | email: {u.email} | name: {u.name}
                </div>
              ))}
            </div>

            {/* ORGANIZATIONS TABLE */}
            <div className="space-y-1">
              <span className="text-[#FFF] font-extrabold flex items-center gap-1">■ organizations :</span>
              {organizations.map(o => (
                <div key={o.id} className="ml-2 pl-2 border-l border-stone-800">
                  id: <span className="text-red-505">{o.id}</span> | name: {o.name}
                </div>
              ))}
            </div>

            {/* PROJECTS TABLE */}
            <div className="space-y-1">
              <span className="text-[#FFF] font-extrabold flex items-center gap-1">■ projects :</span>
              {projects.map(p => (
                <div key={p.id} className="ml-2 pl-2 border-l border-stone-800">
                  id: <span className="text-red-505">{p.id}</span> | regime: {p.executionRegime.toUpperCase()} | name: {p.name}
                </div>
              ))}
            </div>

            {/* PROJECT_MEMBERS TABLE */}
            <div className="space-y-1 text-[8.5px]">
              <span className="text-[#FFF] font-extrabold flex items-center gap-1">■ project_members :</span>
              {memberships.map(m => (
                <div key={m.id} className="ml-2 pl-2 border-l border-stone-800">
                  pid: <span className="text-[#FFF]">{m.projectId.substring(5,13)}</span> | rbac: {m.role.toUpperCase()} | uEmail: {m.userEmail}
                </div>
              ))}
            </div>

          </div>
        </details>
      </div>

    </div>
  );
}
