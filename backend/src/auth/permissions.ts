export interface UserPermissions {
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

export function calculatePermissions(role: string, area?: string): UserPermissions {
  const normRole = role?.toLowerCase() || 'member';
  const normArea = area?.toLowerCase() || '';

  // 1. Admin gets total access
  if (normRole === 'admin') {
    return {
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
    };
  }

  // Helper variables for Area Lead matching
  const isFinanceLead = normArea === 'resources' || normArea === 'finance' || normArea === 'financeiro' || normArea === 'budget' || normArea === 'orçamento' || normArea === 'orcamento';
  const isCronogramaLead = normArea === 'cronograma' || normArea === 'schedule' || normArea === 'planning';
  const isRisksLead = normArea === 'riscos' || normArea === 'risks' || normArea === 'qualidade';
  const isStakeholdersLead = normArea === 'stakeholders' || normArea === 'comunicação' || normArea === 'comunicacao' || normArea === 'projeto' || normArea === 'social';

  // 2. Area Lead gets full access in their own area, reading in other areas
  if (normRole === 'area_lead') {
    return {
      canEditWbs: isCronogramaLead,
      canEditTasks: isCronogramaLead,
      canEditBudget: isFinanceLead,
      canEditRisks: isRisksLead,
      canEditStakeholders: isStakeholdersLead,
      canEditStatusReports: isFinanceLead || isCronogramaLead, // Leads that oversee overall status
      canEditScopeChanges: isFinanceLead || isCronogramaLead,
      canComment: true,
      canCommentOnly: false,
      isSponsor: false,
      isMentor: false,
      isAdmin: false,
    };
  }

  // 3. Mentor: general read-only + ability to comment
  if (normRole === 'mentor') {
    return {
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
    };
  }

  // 4. Sponsor: restricted reading, no write permissions
  if (normRole === 'sponsor') {
    return {
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
    };
  }

  // 5. Default/Member: reading, can edit their own tasks (will check assignment in service)
  return {
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
  };
}
