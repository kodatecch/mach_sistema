export type ProjectRole = 'admin' | 'technical_lead' | 'area_lead' | 'member' | 'mentor' | 'sponsor';
export type ExecutionRegime = 'linear' | 'fast_tracking';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  executionRegime: ExecutionRegime;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  userEmail: string; // for easier view joins
  userName: string;
}

export interface WbsItem {
  id: string;
  projectId: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  projectId: string;
  wbsItemId: string | null;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  
  // 5W2H Matrix
  what: string | null;
  why: string | null;
  where: string | null;
  whenDate: string | null;
  whoOwnerId: string | null;
  how: string | null;
  howMuch: number | null;

  // PERT Estimates
  durationOptimistic: number | null;
  durationLikely: number | null;
  durationPessimistic: number | null;
  durationExpected: number | null;

  isUrgent?: boolean;
  isImportant?: boolean;
  isMilestone?: boolean;

  isCritical?: boolean;
  totalFloat?: number;
  comment?: string | null;

  // EVM & Progress fields for dashboard
  progress?: number;
  plannedCost?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface TaskDependency {
  id: string;
  projectId?: string;
  taskId: string;
  dependsOnTaskId: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskBoardColumn {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stakeholder {
  id: string;
  projectId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string; // sponsor, mentor, judge, school, collaborator, follower
  organization?: string | null;
  powerLevel: number; // 1 to 5
  interestLevel: number; // 1 to 5
  engagementLevel: string; // unaware, resistant, neutral, supportive, leading
  createdAt?: string;
  updatedAt?: string;
  quadrant?: 'key_players' | 'keep_satisfied' | 'keep_informed' | 'monitor'; // service calculated field
}

export interface CommunicationMatrix {
  id: string;
  projectId: string;
  stakeholderId: string;
  reportWhat: string;
  channel: string;
  frequency: string;
  responsible: string;
  createdAt?: string;
  updatedAt?: string;
  stakeholder?: Stakeholder;
}

export interface CommunicationLog {
  id: string;
  projectId: string;
  stakeholderId: string;
  date: string; // ISO date string
  channel: string;
  summary: string | null;
  audioAttachmentUrl: string | null;
  keyPoints?: any; // JSON string array or parsed contents
  createdAt?: string;
  updatedAt?: string;
  stakeholder?: Stakeholder;
}

export interface Risk {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  category: 'threat' | 'opportunity';
  area: string; // e.g. "Tecnica", "Financeiro", etc
  probability: number; // 1 to 5
  impact: number; // 1 to 5
  riskScore: number;
  status: 'active' | 'watch_list' | 'mitigated' | 'triggered';
  mitigationPlan: string | null;
  contingencyPlan: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScopeChangeLog {
  id: string;
  projectId: string;
  taskId: string | null;
  wbsItemId: string | null;
  title: string;
  description: string | null;
  impactOnTime: number; // in days
  impactOnBudget: number; // cost value
  decision: 'pending' | 'approved' | 'rejected';
  justification: string | null;
  requestedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusReport {
  id: string;
  projectId: string;
  reportDate: string;
  projectStatus: 'good' | 'at_risk' | 'critical';
  accomplishments: string;
  ongoingTasks: string;
  blockers: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPermissions {
  role: ProjectRole | null;
  area: string | null;
  canEditWbs: boolean;
  canEditTasks: boolean;
  canEditBudget: boolean;
  canEditRisks: boolean;
  canEditStakeholders: boolean;
  canEditStatusReports: boolean;
  canEditScopeChanges: boolean;
  canComment: boolean;
  canCommentOnly: boolean;
  isSponsor: boolean;
  isMentor: boolean;
  isAdmin: boolean;
}

export interface UserTabPermissions {
  dashboard: boolean;
  cronograma: boolean;
  orcamento: boolean;
  stakeholders: boolean;
  riscos: boolean;
  convidar: boolean;
}

export interface RegulationRule {
  id: string;
  projectId: string;
  parameterName: string;
  limitValue: number;
  unit: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface JudgingCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MachWheelScore {
  id: string;
  projectId: string;
  category: string;
  scoreBefore: number; // 1-10
  scoreAfter: number;  // 1-10
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  projectId: string;
  description: string;
  type: 'revenue' | 'expense' | 'despesa' | 'receita';
  amount: number;
  date: string;
  isReconciled: boolean;
}

export interface OrgConfig {
  orgName: string;
  primaryColor: 'red' | 'cyan';
  theme: 'dark' | 'light';
  setupComplete: boolean;
  competitionLevel?: 'regional' | 'nacional' | 'mundial';
  enableWbs?: boolean;
  enable5w2h?: boolean;
  enableKanban?: boolean;
  enableEisenhower?: boolean;
  enableGantt?: boolean;
  enableFlowchart?: boolean;
}

// Maps memberId → array of projectIds they can see
export type MemberProjectVisibility = Record<string, string[]>;
