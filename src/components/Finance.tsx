import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  Briefcase, 
  Award, 
  Calendar, 
  ChevronRight, 
  ShoppingBag,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Percent,
  Search,
  User,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Project, User as UserType, OrgConfig } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';
import EvmDashboard from './EvmDashboard';

interface FinanceProps {
  activeProject: Project;
  activeUser: UserType | null;
  memberships: any[];
  users: UserType[];
  permissions?: any;
  config?: OrgConfig;
  isFullscreen?: boolean;
  setIsFullscreen?: (val: boolean) => void;
}

// ---------------------------------------------------------
// SCHEMA INTERFACES
// ---------------------------------------------------------
interface ResourcePlanItem {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  idealDate: string;
  owner: string;
  origin: 'sponsorship' | 'institutional' | 'own_resources';
  category: string;
}

interface Quotation {
  id: string;
  resourceId: string;
  supplier: string;
  unitPrice: number;
  deliveryDays: number;
  qualityRemarks: string;
  isSelected?: boolean;
}

interface BudgetLine {
  id: string;
  projectId: string;
  name: string;
  category: string;
  quantity: number;
  unitValue: number; // Realistic baseline unit value
}

interface CashFlowEntry {
  id: string;
  projectId: string;
  description: string;
  type: 'revenue' | 'expense';
  amount: number;
  category: string;
  date: string;
  isReconciled: boolean;
  isContingencyFunded?: boolean;
}

// ---------------------------------------------------------
// PRE-SEEDED DETAILED DATA FOR F1 IN SCHOOLS 2026
// ---------------------------------------------------------
const SEED_RESOURCES = (projId: string): ResourcePlanItem[] => [
  {
    id: 'res-tubos-4130',
    projectId: projId,
    name: 'Cartuchos descartáveis de CO2 de 8g',
    quantity: 20,
    idealDate: '2026-06-25',
    owner: 'Ana Clara',
    origin: 'sponsorship',
    category: 'Materiais'
  },
  {
    id: 'res-manga-eixo',
    projectId: projId,
    name: 'Bloco de Usinagem ABS (Carrinho Modelo)',
    quantity: 5,
    idealDate: '2026-07-10',
    owner: 'Pedro Henrique',
    origin: 'institutional',
    category: 'Usinagem'
  },
  {
    id: 'res-telemetria',
    projectId: projId,
    name: 'Sensores de Pista & Kit de Rodas e Eixos Oficiais',
    quantity: 1,
    idealDate: '2026-08-02',
    owner: 'Bruno Sousa',
    origin: 'own_resources',
    category: 'Eletrônica'
  }
];

const SEED_QUOTATIONS: Quotation[] = [
  {
    id: 'q-tub-1',
    resourceId: 'res-tubos-4130',
    supplier: 'STEM Shop Brasil',
    unitPrice: 25,
    deliveryDays: 5,
    qualityRemarks: 'Cartuchos CO2 oficiais de 8g testados e aprovados para competição.',
    isSelected: true
  },
  {
    id: 'q-tub-2',
    resourceId: 'res-tubos-4130',
    supplier: 'Distribuidora de Gás CO2 Sul',
    unitPrice: 28,
    deliveryDays: 3,
    qualityRemarks: 'Cartuchos de alta pureza; ótimo acabamento externo sem rebarbas.'
  },
  {
    id: 'q-tub-3',
    resourceId: 'res-tubos-4130',
    supplier: 'Importadora Rápida Dragsters',
    unitPrice: 22,
    deliveryDays: 15,
    qualityRemarks: 'Menor preço unitário, porém entrega lenta sujeita a atrasos alfandegários.'
  },
  {
    id: 'q-manga-1',
    resourceId: 'res-manga-eixo',
    supplier: 'Protótipos CNC e Impressão 3D',
    unitPrice: 320,
    deliveryDays: 12,
    qualityRemarks: 'Corte a 5 eixos em poliuretano de alta densidade. Acabamento impecável.'
  },
  {
    id: 'q-manga-2',
    resourceId: 'res-manga-eixo',
    supplier: 'Oficina CNC Integrada',
    unitPrice: 290,
    deliveryDays: 7,
    qualityRemarks: 'Prazo veloz. Peça com tolerância micrométrica regulamentar.',
    isSelected: true
  },
  {
    id: 'q-tel-1',
    resourceId: 'res-telemetria',
    supplier: 'F1 in Schools Portal Oficial',
    unitPrice: 850,
    deliveryDays: 4,
    qualityRemarks: 'Sensores de pista integrados com fotocélulas eletrônicas e telemetria de 20 metros.'
  }
];

const SEED_BUDGET_LINES = (projId: string): BudgetLine[] => [
  {
    id: 'bl-1',
    projectId: projId,
    name: 'Cartuchos descartáveis de CO2 de 8g',
    category: 'Materiais',
    quantity: 20,
    unitValue: 25
  },
  {
    id: 'bl-2',
    projectId: projId,
    name: 'Bloco de Usinagem ABS (Carrinho Modelo)',
    category: 'Usinagem',
    quantity: 5,
    unitValue: 290
  },
  {
    id: 'bl-3',
    projectId: projId,
    name: 'Filamentos Polímeros Estande 3D',
    category: 'Materiais',
    quantity: 5,
    unitValue: 120
  },
  {
    id: 'bl-4',
    projectId: projId,
    name: 'Inscrições Oficiais STEM Racing e Logística Estacional',
    category: 'Logística',
    quantity: 1,
    unitValue: 1200
  }
];

const SEED_CASH_FLOW = (projId: string): CashFlowEntry[] => [
  {
    id: 'cf-1',
    projectId: projId,
    description: 'Patrocínio Master - Patrocinador de Tecnologia',
    type: 'revenue',
    amount: 5000,
    category: 'Patrocínio',
    date: '2026-06-01',
    isReconciled: true
  },
  {
    id: 'cf-2',
    projectId: projId,
    description: 'Subvenção Anual do Diretório Acadêmico STEM',
    type: 'revenue',
    amount: 2000,
    category: 'Institucional',
    date: '2026-06-05',
    isReconciled: true
  },
  {
    id: 'cf-3',
    projectId: projId,
    description: 'Compra de Cartuchos de CO2 (Nota Fiscal nº 1092)',
    type: 'expense',
    amount: 500, // 20 * 25
    category: 'Materiais',
    date: '2026-06-15',
    isReconciled: true
  },
  {
    id: 'cf-4',
    projectId: projId,
    description: 'Eixos de Titânio e Buchas de Rolamento',
    type: 'expense',
    amount: 220,
    category: 'Materiais',
    date: '2026-06-18',
    isReconciled: false
  },
  {
    id: 'cf-5',
    projectId: projId,
    description: 'Usinagem CNC Bloco de Poliuretano (Pendente há mais de 14 dias!)',
    type: 'expense',
    amount: 870,
    category: 'Usinagem',
    date: '2026-05-25',
    isReconciled: false
  },
  {
    id: 'cf-6',
    projectId: projId,
    description: 'Filamentos Polímeros Estande 3D',
    type: 'expense',
    amount: 450,
    category: 'Materiais',
    date: '2026-06-02',
    isReconciled: false
  },
  {
    id: 'cf-7',
    projectId: projId,
    description: 'Reserva Emergencial - Trilho de Testes CO2 Extra',
    type: 'expense',
    amount: 600,
    category: 'Ferramental',
    date: '2026-06-14',
    isReconciled: true,
    isContingencyFunded: true
  },
  {
    id: 'cf-8',
    projectId: projId,
    description: 'Doação Individual por Torcedores Acadêmicos (Apoie o Mach Racing!)',
    type: 'revenue',
    amount: 1500,
    category: 'Patrocínio',
    date: '2026-05-18',
    isReconciled: true
  }
];

export default function Finance({ activeProject, activeUser, memberships, users, permissions, config, isFullscreen, setIsFullscreen }: FinanceProps) {
  const isDark = config?.theme === 'dark';

  // ---------------------------------------------------------
  // SUB-TAB NAVIGATION
  // ---------------------------------------------------------
  type SubTab = 'planning' | 'quotations' | 'budget' | 'cashflow' | 'contingency' | 'reconciliation' | 'evm';

  const enabledTabs = useMemo(() => {
    const tabs: SubTab[] = [];
    if (config?.enableFinancePlanning !== false) tabs.push('planning');
    if (config?.enableFinanceQuotations !== false) tabs.push('quotations');
    if (config?.enableFinanceBudget !== false) tabs.push('budget');
    if (config?.enableFinanceCashflow !== false) tabs.push('cashflow');
    if (config?.enableFinanceContingency !== false) tabs.push('contingency');
    if (config?.enableFinanceReconciliation !== false) tabs.push('reconciliation');
    if (config?.enableRisksEvm !== false) tabs.push('evm');
    return tabs;
  }, [config]);

  const [activeSubTab, setActiveSubTab] = useState<SubTab>(() => {
    return enabledTabs[0] || 'planning';
  });

  useEffect(() => {
    if (enabledTabs.length > 0 && !enabledTabs.includes(activeSubTab)) {
      setActiveSubTab(enabledTabs[0]);
    }
  }, [enabledTabs, activeSubTab]);

  // Selected resource item inside the quotations sub-tab to view comparisons
  const [selectedQuoteResource, setSelectedQuoteResource] = useState<string>('res-tubos-4130');

  // Scenario toggle inside budget: 'otimista' | 'realista' | 'pessimista'
  const [activeScenario, setActiveScenario] = useState<'otimista' | 'realista' | 'pessimista'>('realista');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // ---------------------------------------------------------
  // PERSISTENCE & RESOURCE STATES
  // ---------------------------------------------------------
  const [resources, setResources] = useState<ResourcePlanItem[]>(() => {
    const key = `stem_resources_${activeProject.id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : SEED_RESOURCES(activeProject.id);
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const key = `stem_quotations_${activeProject.id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : SEED_QUOTATIONS;
  });

  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>(() => {
    const key = `stem_budget_lines_${activeProject.id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : SEED_BUDGET_LINES(activeProject.id);
  });

  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>(() => {
    const key = `stem_cash_flow_${activeProject.id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : SEED_CASH_FLOW(activeProject.id);
  });

  const [contingencyPercentage, setContencyPercentage] = useState<number>(() => {
    const key = `stem_contingency_percent_${activeProject.id}`;
    const data = localStorage.getItem(key);
    return data ? Number(data) : 10; // Default 10%
  });

  // Helper function to persist everything
  const saveState = (type: string, payload: any) => {
    const key = `stem_${type}_${activeProject.id}`;
    localStorage.setItem(key, JSON.stringify(payload));
  };

  useEffect(() => {
    const handleCashFlowEntryCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newEntry = customEvent.detail;
      if (newEntry && newEntry.projectId === activeProject.id) {
        setCashFlow(prev => {
          if (prev.some(item => item.id === newEntry.id)) return prev;
          return [newEntry, ...prev];
        });
      }
    };

    window.addEventListener('rt:cashflow.entry.created', handleCashFlowEntryCreated);
    return () => {
      window.removeEventListener('rt:cashflow.entry.created', handleCashFlowEntryCreated);
    };
  }, [activeProject.id]);

  // ---------------------------------------------------------
  // 1. RESOURCE PLANNING FORM & MUTATORS
  // ---------------------------------------------------------
  const [resForm, setResForm] = useState({
    name: '',
    quantity: 1,
    idealDate: '2026-07-15',
    owner: activeUser?.name || 'Ana Clara',
    origin: 'sponsorship' as ResourcePlanItem['origin'],
    category: 'Materiais'
  });

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.name.trim() || resForm.quantity <= 0) return;

    const newItem: ResourcePlanItem = {
      id: `res-${Date.now()}`,
      projectId: activeProject.id,
      name: resForm.name,
      quantity: resForm.quantity,
      idealDate: resForm.idealDate,
      owner: resForm.owner,
      origin: resForm.origin,
      category: resForm.category
    };

    const updated = [...resources, newItem];
    setResources(updated);
    saveState('resources', updated);

    // Auto-select this item for the quote adding action and clear form
    setSelectedQuoteResource(newItem.id);
    setResForm({
      name: '',
      quantity: 1,
      idealDate: '2026-07-20',
      owner: activeUser?.name || 'Ana Clara',
      origin: 'sponsorship',
      category: 'Materiais'
    });
  };

  // ---------------------------------------------------------
  // 2. QUOTATION FORM & MUTATORS
  // ---------------------------------------------------------
  const [quoteForm, setQuoteForm] = useState({
    supplier: '',
    unitPrice: 100,
    deliveryDays: 5,
    qualityRemarks: ''
  });

  const handleAddQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.supplier.trim() || quoteForm.unitPrice <= 0) return;

    // See if the resource has any selected quote. If not, make this the default winner!
    const resourceHasWinner = quotations.some(q => q.resourceId === selectedQuoteResource && q.isSelected);

    const newQuote: Quotation = {
      id: `q-${Date.now()}`,
      resourceId: selectedQuoteResource,
      supplier: quoteForm.supplier,
      unitPrice: quoteForm.unitPrice,
      deliveryDays: quoteForm.deliveryDays,
      qualityRemarks: quoteForm.qualityRemarks || 'Ótima relação custo-benefício e documentada.',
      isSelected: !resourceHasWinner // Automatically select winner if it is the first quote
    };

    const updated = [...quotations, newQuote];
    setQuotations(updated);
    saveState('quotations', updated);

    // Reset and clear form
    setQuoteForm({
      supplier: '',
      unitPrice: 100,
      deliveryDays: 5,
      qualityRemarks: ''
    });
  };

  const selectAsWinner = (qId: string) => {
    const parentResource = quotations.find(q => q.id === qId)?.resourceId;
    if (!parentResource) return;

    const updated = quotations.map(q => {
      if (q.resourceId === parentResource) {
        return { ...q, isSelected: q.id === qId };
      }
      return q;
    });

    setQuotations(updated);
    saveState('quotations', updated);
  };

  // ---------------------------------------------------------
  // 3. BUDGET (BUDGETED COST) FORM & MUTATORS WITH SCENARIO
  // ---------------------------------------------------------
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    category: 'Materiais',
    quantity: 1,
    unitValue: 150
  });

  const handleAddBudgetLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.name.trim() || budgetForm.quantity <= 0 || budgetForm.unitValue <= 0) return;

    const newLine: BudgetLine = {
      id: `bl-${Date.now()}`,
      projectId: activeProject.id,
      name: budgetForm.name,
      category: budgetForm.category,
      quantity: budgetForm.quantity,
      unitValue: budgetForm.unitValue
    };

    const updated = [...budgetLines, newLine];
    setBudgetLines(updated);
    saveState('budget_lines', updated);

    // Reset form
    setBudgetForm({
      name: '',
      category: 'Materiais',
      quantity: 1,
      unitValue: 150
    });
  };

  // Interactive autofill helper: checking active winner quotes for suggest
  const suggestedWinnerQuotes = useMemo(() => {
    return resources.map(res => {
      const winner = quotations.find(q => q.resourceId === res.id && q.isSelected);
      return winner ? { resource: res, winner } : null;
    }).filter(Boolean);
  }, [resources, quotations]);

  const applySuggestedQuote = (resItem: ResourcePlanItem, quoteItem: Quotation) => {
    setBudgetForm({
      name: `Aquisição: ${resItem.name}`,
      category: resItem.category,
      quantity: resItem.quantity,
      unitValue: quoteItem.unitPrice
    });
  };

  // Multipliers for pessimistic / optimistic scenarios to apply to budget values
  const scenarioMultiplier = useMemo(() => {
    if (activeScenario === 'otimista') return 0.85; // 15% discount
    if (activeScenario === 'pessimista') return 1.20; // 20% cost overrun
    return 1.0;
  }, [activeScenario]);

  // Compute calculated budget costs
  const renderedBudgetLines = useMemo(() => {
    return budgetLines.map(line => {
      const calculatedUnitCost = Math.round(line.unitValue * scenarioMultiplier * 100) / 100;
      return {
        ...line,
        calculatedUnitCost,
        totalCost: line.quantity * calculatedUnitCost
      };
    });
  }, [budgetLines, scenarioMultiplier]);

  const deleteBudgetLine = (id: string) => {
    const updated = budgetLines.filter(line => line.id !== id);
    setBudgetLines(updated);
    saveState('budget_lines', updated);
  };

  // ---------------------------------------------------------
  // 4. CASH FLOW LEDGER, FILTERS & RECHARTS GRAPH
  // ---------------------------------------------------------
  const [cashFlowForm, setCashFlowForm] = useState({
    description: '',
    type: 'expense' as 'revenue' | 'expense',
    amount: 500,
    category: 'Materiais',
    date: '2026-06-20',
    isContingencyFunded: false
  });

  const [cfMonthFilter, setCfMonthFilter] = useState<string>('todos');
  const [cfCategoryFilter, setCfCategoryFilter] = useState<string>('todos');

  // Dynamic initial balance (customizable)
  const [initialBalance, setInitialBalance] = useState<number>(20000);

  const handleAddCashFlowEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashFlowForm.description.trim() || cashFlowForm.amount <= 0) return;

    const newCf: CashFlowEntry = {
      id: `cf-${Date.now()}`,
      projectId: activeProject.id,
      description: cashFlowForm.description,
      type: cashFlowForm.type,
      amount: cashFlowForm.amount,
      category: cashFlowForm.category,
      date: cashFlowForm.date,
      isReconciled: false, // Starts unreconciled by default
      isContingencyFunded: cashFlowForm.type === 'expense' && cashFlowForm.isContingencyFunded
    };

    const updated = [newCf, ...cashFlow];
    setCashFlow(updated);
    saveState('cash_flow', updated);

    // Reset Form
    setCashFlowForm({
      description: '',
      type: 'expense',
      amount: 500,
      category: 'Materiais',
      date: '2026-06-20',
      isContingencyFunded: false
    });
  };

  // Helper autofill from Budget lines
  const autoLogExpense = (bLine: any) => {
    setCashFlowForm({
      description: `Pagamento: ${bLine.name}`,
      type: 'expense',
      amount: Math.round(bLine.totalCost),
      category: bLine.category,
      date: new Date().toISOString().split('T')[0],
      isContingencyFunded: false
    });
  };

  // Unique list of months found in the cash flow list (YYYY-MM format) for dropdown
  const uniqueMonths = useMemo(() => {
    const list = cashFlow.map(entry => entry.date.substring(0, 7)).filter(Boolean);
    return Array.from(new Set(list)).sort().reverse();
  }, [cashFlow]);

  // Unique list of categories in cash flow for filters
  const uniqueCategories = useMemo(() => {
    const list = cashFlow.map(entry => entry.category).filter(Boolean);
    return Array.from(new Set(list));
  }, [cashFlow]);

  // Filtered Cash Flow list
  const filteredCashFlow = useMemo(() => {
    return cashFlow.filter(entry => {
      const matchMonth = cfMonthFilter === 'todos' || entry.date.substring(0, 7) === cfMonthFilter;
      const matchCategory = cfCategoryFilter === 'todos' || entry.category === cfCategoryFilter;
      return matchMonth && matchCategory;
    });
  }, [cashFlow, cfMonthFilter, cfCategoryFilter]);

  // Totalized counters (unfiltered to keep summary exact)
  const globalSummaryTotals = useMemo(() => {
    const totalRevenue = cashFlow
      .filter(cf => cf.type === 'revenue')
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpense = cashFlow
      .filter(cf => cf.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    const finalBalance = initialBalance + totalRevenue - totalExpense;

    return {
      totalRevenue,
      totalExpense,
      finalBalance
    };
  }, [cashFlow, initialBalance]);

  // Monthly aggregated chart data for Recharts (e.g. comparing Revenues vs Expenses by month)
  const barChartData = useMemo(() => {
    const monthsMap: Record<string, { monthName: string; receita: number; despesa: number }> = {};
    
    // Sort all dates to build consistent buckets
    const sortedFlow = [...cashFlow].sort((a,b) => a.date.localeCompare(b.date));

    // Display localized portuguese months
    const getMonthName = (dateStr: string) => {
      const [_, mm] = dateStr.split('-');
      const map: Record<string, string> = {
        '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
        '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
      };
      return map[mm] || 'Mês';
    };

    sortedFlow.forEach(entry => {
      const mBucket = entry.date.substring(0, 7); // e.g. "2026-06"
      if (!monthsMap[mBucket]) {
        monthsMap[mBucket] = {
          monthName: `${getMonthName(entry.date)}/${entry.date.substring(2,4)}`,
          receita: 0,
          despesa: 0
        };
      }

      if (entry.type === 'revenue') {
        monthsMap[mBucket].receita += entry.amount;
      } else {
        monthsMap[mBucket].despesa += entry.amount;
      }
    });

    return Object.values(monthsMap);
  }, [cashFlow]);

  const deleteCashFlowEntry = (id: string) => {
    const updated = cashFlow.filter(cf => cf.id !== id);
    setCashFlow(updated);
    saveState('cash_flow', updated);
  };

  const toggleReconciliation = (id: string) => {
    const updated = cashFlow.map(cf => {
      if (cf.id === id) {
        return { ...cf, isReconciled: !cf.isReconciled };
      }
      return cf;
    });
    setCashFlow(updated);
    saveState('cash_flow', updated);
  };

  // ---------------------------------------------------------
  // 5. RESERVE FUND (CONTINGENCY RESERVE) CALCULATIONS
  // ---------------------------------------------------------
  const totalSponsoredAmount = useMemo(() => {
    // Total of 'revenue' type transactions marked as 'Patrocínio' (or default general revenues for flexibility)
    return cashFlow
      .filter(cf => cf.type === 'revenue' && cf.category === 'Patrocínio')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [cashFlow]);

  const calculatedReserveAmount = useMemo(() => {
    return Math.round(totalSponsoredAmount * (contingencyPercentage / 100) * 100) / 100;
  }, [totalSponsoredAmount, contingencyPercentage]);

  // Amount already used (expenses flagged with isContingencyFunded)
  const contingencyAmountUsed = useMemo(() => {
    return cashFlow
      .filter(cf => cf.type === 'expense' && cf.isContingencyFunded)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [cashFlow]);

  const contingencyBalanceAvailable = useMemo(() => {
    return calculatedReserveAmount - contingencyAmountUsed;
  }, [calculatedReserveAmount, contingencyAmountUsed]);

  // Save the configurable % changes
  const saveContingencyPercent = (newVal: number) => {
    setContencyPercentage(newVal);
    localStorage.setItem(`stem_contingency_percent_${activeProject.id}`, String(newVal));
  };

  // ---------------------------------------------------------
  // 6. BANK RECONCILIATION DISCREPANCY SUMMARY & RULES
  // ---------------------------------------------------------
  // Bi-weekly unreconciled checklist items
  const unreconciledItems = useMemo(() => {
    return cashFlow.filter(cf => !cf.isReconciled);
  }, [cashFlow]);

  // Highlight of unreconciled items with >14 days (overdue alert)
  // Let's treat current evaluation date as 2026-06-20 (local mock date)
  const activeEvaluDate = new Date('2026-06-20');

  const checkIsOverdue = (dateStr: string) => {
    const entryD = new Date(dateStr);
    const timeDiff = activeEvaluDate.getTime() - entryD.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 14;
  };

  const overdueUnreconciledList = useMemo(() => {
    return unreconciledItems.filter(item => checkIsOverdue(item.date));
  }, [unreconciledItems]);

  // Render origin label helper
  const translateOrigin = (orig: ResourcePlanItem['origin']) => {
    const map = {
      sponsorship: 'Patrocínio Direto',
      institutional: 'Verba Universitária',
      own_resources: 'Recursos Próprios'
    };
    return map[orig] || orig;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 select-none">
        <div className="h-28 mach-skeleton w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 mach-skeleton" />
          <div className="h-24 mach-skeleton" />
          <div className="h-24 mach-skeleton" />
        </div>
        <div className="h-96 mach-skeleton w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-text" id="finance-detailed cockpit-container">
      
      {/* HEADER SECTION WITH INTEGRATED CRUMBS */}
      <div className={`p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border ${
        isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-display font-black uppercase tracking-wide ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Orçamento & Controle Monetário
          </h1>
        </div>

        {/* Global Floating Counters */}
        <div className="flex flex-wrap gap-4">
          <div className={`p-3 border rounded text-right min-w-[140px] ${
            isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-200 shadow-sm'
          }`}>
            <span className={`text-[9px] font-mono block uppercase font-bold ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Saldo Livre Estimado</span>
            <span className={`text-sm font-mono font-bold ${globalSummaryTotals.finalBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {globalSummaryTotals.finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className={`p-3 border rounded text-right min-w-[140px] ${
            isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200 shadow-sm'
          }`}>
            <span className={`text-[9px] font-mono block uppercase font-bold ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Fundo de Reserva</span>
            <span className="text-sm font-mono font-bold text-[#DC2626] flex items-center justify-end gap-1">
              <ShieldCheck className="w-4.5 h-4.5 text-[#DC2626]" />
              {contingencyBalanceAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TAB NAV BAR (Swiss Clean Tabs) */}
      <div className={`border-b overflow-x-auto shrink-0 select-none ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="flex space-x-1 whitespace-nowrap">
          {[
            { id: 'planning', label: '1. Planejamento (Resources)', icon: <Briefcase className="w-3.5 h-3.5" /> },
            { id: 'quotations', label: '2. Comparativo de Cotações', icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'budget', label: `3. Orçamento (${activeScenario.toUpperCase()})`, icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'cashflow', label: '4. Fluxo de Caixa / Ledger', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
            { id: 'contingency', label: '5. Reserva de Contingência', icon: <Percent className="w-3.5 h-3.5" /> },
            { id: 'reconciliation', label: `6. Conciliação Bancária (${unreconciledItems.length})`, icon: <CheckCircle className="w-3.5 h-3.5" /> },
            { id: 'evm', label: '7. Análise EVM / Valor Agregado', icon: <TrendingUp className="w-3.5 h-3.5" /> }
          ].filter(tab => enabledTabs.includes(tab.id as SubTab)).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as SubTab);
              }}
              className={`px-4 py-3 border-b-2 font-mono text-[11px] font-bold tracking-tight transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === tab.id
                  ? `border-[#DC2626] text-[#DC2626] ${isDark ? 'bg-stone-900/45' : 'bg-stone-50'}`
                  : `border-transparent ${
                      isDark 
                        ? 'text-stone-400 hover:text-white hover:bg-stone-900/20' 
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'reconciliation' && overdueUnreconciledList.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB CONTENT RENDERING */}
      <div className="transition-all duration-300">
        
        {/* TAB 1: RESOURCE PLANNING */}
        {activeSubTab === 'planning' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form to Register Resource */}
              <div className={`p-5 rounded-lg border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`p-1 px-1.5 rounded text-[10px] font-mono font-bold ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>ADD</span>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Novo Recurso Recomendado</h3>
                </div>

                <form onSubmit={handleAddResource} className="space-y-4">
                  <div>
                    <label htmlFor="res-name-input" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">RECURSO / MATERIAL *</label>
                    <input 
                      id="res-name-input"
                      type="text"
                      required
                      placeholder="ex. Bobina de Ignição MSD Blaster"
                      value={resForm.name}
                      onChange={e => setResForm({...resForm, name: e.target.value})}
                      className="mach-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="res-qty-input" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">QUANTIDADE *</label>
                      <input 
                        id="res-qty-input"
                        type="number"
                        required
                        min="1"
                        value={resForm.quantity}
                        onChange={e => setResForm({...resForm, quantity: Number(e.target.value)})}
                        className="mach-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="res-date-input" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">DATA ADQUISIÇÃO</label>
                      <input 
                        id="res-date-input"
                        type="date"
                        required
                        value={resForm.idealDate}
                        onChange={e => setResForm({...resForm, idealDate: e.target.value})}
                        className="mach-input font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="res-owner-select" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">MEMBRO RESPONSÁVEL</label>
                    <select
                      id="res-owner-select"
                      value={resForm.owner}
                      onChange={e => setResForm({...resForm, owner: e.target.value})}
                      className="mach-input"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                      <option value="Suporte Técnico">Suporte Técnico</option>
                      <option value="Docente Orientador">Docente Orientador</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="res-origin-select" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">ORIGEM DA VERBA</label>
                      <select
                        id="res-origin-select"
                        value={resForm.origin}
                        onChange={e => setResForm({...resForm, origin: e.target.value as any})}
                        className="mach-input"
                      >
                        <option value="sponsorship">Patrocínio Direto</option>
                        <option value="institutional">Verba Univ.</option>
                        <option value="own_resources">Recurso Próprio</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="res-category-select" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">CATEGORIA EAP</label>
                      <select
                        id="res-category-select"
                        value={resForm.category}
                        onChange={e => setResForm({...resForm, category: e.target.value})}
                        className="mach-input"
                      >
                        <option value="Materiais">Materiais</option>
                        <option value="Usinagem">Usinagem</option>
                        <option value="Eletrônica">Eletrônica</option>
                        <option value="Logística">Logística</option>
                        <option value="Ferramental">Ferramental</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#DC2626] hover:bg-[#DC2626]/85 text-white text-xs font-mono font-bold py-2.5 px-4 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar no EAP Recursos
                  </button>
                </form>
              </div>

              {/* Resources Table */}
              <div className={`lg:col-span-2 p-5 rounded-lg border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-4 select-none">
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Talonário de Recursos Planejados</h3>
                    <p className="text-[10px] text-stone-500 font-mono">Totalizadores vinculados ao cronograma de hardware</p>
                  </div>
                  <span className={`text-[10px] px-3 py-1 font-mono rounded border ${isDark ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-stone-100 border-stone-200 text-stone-600'}`}>
                    {resources.length} Itens Mapeados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className={`font-mono text-[10px] uppercase font-bold border-b ${isDark ? 'bg-stone-950 text-stone-500 border-stone-800' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                        <th className="p-3">Recurso</th>
                        <th className="p-3 text-center">Qtde</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Data Ideal</th>
                        <th className="p-3">Dono</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-stone-850 bg-stone-950/20' : 'divide-stone-200 bg-stone-50/10'}`}>
                      {resources.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8">
                            <div className={`text-center py-8 px-4 border border-dashed rounded flex flex-col items-center justify-center space-y-2 animate-fade-in ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                              <Briefcase className="w-8 h-8 text-stone-700/60" />
                              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>Nenhum recurso cadastrado</p>
                              <p className="text-[10px] text-stone-500 max-w-xs">Insira novos insumos na barra lateral para iniciar o planejamento financeiro do hardware.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        resources.map(res => {
                          const quoteCount = quotations.filter(q => q.resourceId === res.id).length;
                          const hasWinner = quotations.some(q => q.resourceId === res.id && q.isSelected);
                          
                          return (
                            <tr key={res.id} className={`transition ${isDark ? 'hover:bg-stone-900/40 border-stone-850' : 'hover:bg-stone-105 border-stone-150'}`}>
                              <td className="p-3">
                                <div>
                                  <p className={`font-bold ${isDark ? 'text-stone-100' : 'text-stone-850'}`}>{res.name}</p>
                                  <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                                    {translateOrigin(res.origin)}
                                  </p>
                                </div>
                              </td>
                              <td className={`p-3 text-center font-mono font-bold ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>{res.quantity}</td>
                              <td className="p-3">
                                <span className={`border px-2 py-0.5 rounded text-[10px] font-mono ${
                                  isDark 
                                    ? 'bg-stone-800 border-stone-750 text-stone-400' 
                                    : 'bg-stone-100 border-stone-200 text-stone-700 font-semibold'
                                }`}>
                                  {res.category}
                                </span>
                              </td>
                              <td className={`p-3 font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{res.idealDate.split('-').reverse().join('/')}</td>
                              <td className={`p-3 font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{res.owner}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedQuoteResource(res.id);
                                    setActiveSubTab('quotations');
                                  }}
                                  className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 ml-auto cursor-pointer transition border ${
                                    hasWinner
                                      ? isDark
                                        ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-450 border-emerald-900'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250 font-semibold'
                                      : 'bg-[#DC2626] hover:bg-[#DC2626]/85 text-white border-transparent'
                                  }`}
                                >
                                  <span>Gerar cotações</span>
                                  <span className={`rounded-full px-1 py-0.1 select-none font-sans font-bold text-[9px] ${
                                    hasWinner
                                      ? isDark ? 'bg-stone-950/50 text-white' : 'bg-emerald-200 text-emerald-800'
                                      : 'bg-stone-950/50 text-white'
                                  }`}>
                                    {quoteCount}
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={`p-4 rounded mt-4 flex items-start gap-2.5 text-[11px] leading-relaxed border ${
                  isDark 
                    ? 'bg-stone-950 border-stone-850 text-stone-400' 
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}>
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>Instrução da Equipe:</strong> Cadastre novos insumos estruturais ou eletrônicos. Depois, clique em <strong>Gerar cotações</strong> para inserir possíveis fornecedores e definir a proposta vencedora que guiará a estimativa oficial.
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: COTAÇÕES COMPARATIVAS */}
        {activeSubTab === 'quotations' && (
          <div className="space-y-6">
            
            {/* Selected resource selector cards */}
            <div className={`p-5 rounded-lg select-none border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
              <label className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-3 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Selecione o Insumo do EAP para Adicionar Cotações e Comparar:
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {resources.map(res => {
                  const hasWinner = quotations.some(q => q.resourceId === res.id && q.isSelected);
                  const isSelected = selectedQuoteResource === res.id;
                  
                  return (
                    <button
                      key={res.id}
                      onClick={() => setSelectedQuoteResource(res.id)}
                      className={`p-3 rounded text-left border cursor-pointer transition flex flex-col justify-between ${
                        isSelected 
                          ? isDark 
                            ? 'bg-stone-850 border-[#DC2626] text-stone-100' 
                            : 'bg-stone-100 border-[#DC2626] text-stone-900 font-semibold'
                          : isDark
                            ? 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      <div>
                        <p className={`font-bold text-xs truncate max-w-[220px] ${
                          isSelected 
                            ? isDark ? 'text-white' : 'text-stone-900' 
                            : isDark ? 'text-stone-300' : 'text-stone-700'
                        }`}>{res.name}</p>
                        <p className="text-[9px] font-mono mt-1 text-stone-500">
                          {res.quantity} {res.quantity === 1 ? 'unidade' : 'unidades'} • {res.category}
                        </p>
                      </div>
                      <div className={`flex justify-between items-center mt-3 pt-2 border-t w-full text-[9px] font-mono ${
                        isDark ? 'border-stone-900 text-stone-400' : 'border-stone-200 text-stone-600'
                      }`}>
                        <span>Cotações: {quotations.filter(q => q.resourceId === res.id).length}</span>
                        {hasWinner ? (
                          <span className="text-emerald-600 font-bold">✓ Vencedora</span>
                        ) : (
                          <span className="text-amber-600 font-bold">⚡ Padrão</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Side-by-side comparative table & Add new quotation form */}
            {selectedQuoteResource ? (
              (() => {
                const activeRes = resources.find(r => r.id === selectedQuoteResource);
                const matchingQuotes = quotations.filter(q => q.resourceId === selectedQuoteResource);
                
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Form to insert details */}
                    <div className={`lg:col-span-4 p-5 rounded-lg flex flex-col justify-between border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
                      <div>
                        <div className={`flex items-center gap-1.5 mb-3 pb-2 border-b ${isDark ? 'border-stone-850' : 'border-stone-200'}`}>
                          <ShoppingBag className="w-4.5 h-4.5 text-[#DC2626]" />
                          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Inserir Proposta Fornecedor</h3>
                        </div>
                        <p className={`text-[11px] leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                          Insira valores e especificações para: <strong className={isDark ? 'text-stone-200' : 'text-stone-800'}>{activeRes?.name}</strong>
                        </p>

                        <form onSubmit={handleAddQuotation} className="space-y-4">
                          <div>
                            <label htmlFor="quote-supplier" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">NOME FORNECEDOR *</label>
                            <input 
                              id="quote-supplier"
                              type="text"
                              required
                              placeholder="ex. Metalúrgica Tubos SRM"
                              value={quoteForm.supplier}
                              onChange={e => setQuoteForm({...quoteForm, supplier: e.target.value})}
                              className="mach-input"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="quote-price" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">PREÇO UNITÁRIO (R$) *</label>
                              <input 
                                id="quote-price"
                                type="number"
                                min="0.1"
                                step="any"
                                required
                                value={quoteForm.unitPrice}
                                onChange={e => setQuoteForm({...quoteForm, unitPrice: Number(e.target.value)})}
                                className="mach-input"
                              />
                            </div>
                            <div>
                              <label htmlFor="quote-freight" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">PRAZO DO FRETE (DIAS) *</label>
                              <input 
                                id="quote-freight"
                                type="number"
                                min="1"
                                required
                                value={quoteForm.deliveryDays}
                                onChange={e => setQuoteForm({...quoteForm, deliveryDays: Number(e.target.value)})}
                                className="mach-input"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="quote-remarks" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">ACOMPANHAMENTOS DE QUALIDADE / NOTAS</label>
                            <textarea 
                              id="quote-remarks"
                              placeholder="Fretagem, ISO 9001, tolerâncias de solda..."
                              rows={3}
                              value={quoteForm.qualityRemarks}
                              onChange={e => setQuoteForm({...quoteForm, qualityRemarks: e.target.value})}
                              className="mach-input"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-[#DC2626] hover:bg-[#DC2626]/85 text-white text-xs font-mono font-bold py-2.5 px-4 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            + Confirmar Cotação
                          </button>
                        </form>
                      <div className={`p-3 rounded mt-5 text-[10px] leading-relaxed font-mono border ${isDark ? 'bg-stone-950 border-stone-850 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                        ⚠️ Ao selecionar uma proposta como vencecedora, os preços unitários nos desdobramentos de contabilidade e no plano de ação física do chassi serão automaticamente atualizados.
                      </div>
                    </div>
                  </div>

                    {/* SIDE BY SIDE COMPARATIVE CARDS (N comparative columns side-by-side) */}
                    <div className={`lg:col-span-8 p-5 rounded-lg flex flex-col justify-between border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
                      <div>
                        <div className={`flex justify-between items-center mb-5 pb-2 border-b ${isDark ? 'border-stone-850' : 'border-stone-200'}`}>
                          <div>
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Comparativo de Propostas Comerciais</h3>
                            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Visão multifator de cotações para: <span className="text-red-500 font-bold">{activeRes?.name}</span></p>
                          </div>
                          <span className={`text-[10px] font-mono rounded px-3 py-1 border ${isDark ? 'bg-stone-950 border-stone-800 text-[#DC2626]' : 'bg-red-50 border-red-200 text-[#DC2626]'}`}>
                            {matchingQuotes.length} Cadastradas
                          </span>
                        </div>
                      </div>

                      {matchingQuotes.length === 0 ? (
                        <div className={`text-center py-16 border border-dashed rounded-lg flex flex-col items-center justify-center space-y-3 animate-fade-in w-full ${isDark ? 'bg-stone-950/20 border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                          <AlertTriangle className="w-8 h-8 text-amber-500/60" />
                          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>Sem Cotações para este Recurso</p>
                          <p className="text-[10px] text-stone-500 max-w-xs">Use o painel lateral para registrar propostas de fornecedores e comparar custos de aquisição.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {matchingQuotes.map(quote => {
                            const calculatedTotal = (activeRes?.quantity || 1) * quote.unitPrice;
                            
                            return (
                              <div 
                                key={quote.id}
                                className={`relative rounded border p-4 flex flex-col justify-between transition min-h-[280px] ${
                                  quote.isSelected
                                    ? isDark
                                      ? 'bg-stone-955 border-[#DC2626] shadow-lg shadow-[#DC2626]/5'
                                      : 'bg-red-50 border-[#DC2626] shadow-md shadow-red-200/40'
                                    : isDark
                                      ? 'bg-stone-950/45 border-stone-850 hover:border-stone-700'
                                      : 'bg-white border-stone-200 hover:border-stone-400'
                                }`}
                              >
                                {quote.isSelected && (
                                  <div className={`absolute top-2 right-2 border text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    isDark 
                                      ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400' 
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  }`}>
                                    Vencedora ★
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] font-mono text-stone-500 uppercase font-bold tracking-tight">FORNECEDOR</p>
                                    <h4 className={`text-xs font-bold mt-0.5 leading-snug ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{quote.supplier}</h4>
                                  </div>

                                  <div className={`grid grid-cols-2 gap-2 p-2 rounded ${isDark ? 'bg-stone-900/60' : 'bg-stone-100/80'}`}>
                                    <div>
                                      <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">PREÇO UNIT.</p>
                                      <p className={`text-xs font-mono font-bold mt-0.5 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                                        {quote.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">TOTAL ({activeRes?.quantity || 1}x)</p>
                                      <p className="text-xs font-mono font-bold text-[#DC2626] mt-0.5">
                                        {calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-[9px] font-mono text-stone-500 font-bold uppercase flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-stone-500" /> PRAZO DE FRETE
                                    </p>
                                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>{quote.deliveryDays} dias úteis</p>
                                  </div>

                                  <div>
                                    <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">GARANTIA E OBSERVAÇÕES</p>
                                    <p className={`text-[10px] mt-1 italic leading-relaxed border p-2 rounded max-h-[80px] overflow-y-auto ${
                                      isDark ? 'bg-stone-900 border-stone-850 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                                    }`}>
                                      "{quote.qualityRemarks}"
                                    </p>
                                  </div>
                                </div>

                                <div className={`mt-5 pt-3 border-t ${isDark ? 'border-stone-850/80' : 'border-stone-200'}`}>
                                  {quote.isSelected ? (
                                    <div className={`w-full text-center text-[10px] font-mono font-bold py-1.5 rounded flex items-center justify-center gap-1 border ${
                                      isDark 
                                        ? 'bg-stone-900/60 text-emerald-450 border-emerald-900/40' 
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                    }`}>
                                      <Check className="w-3.5 h-3.5" /> Proposta Sugerida no Orçamento
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => selectAsWinner(quote.id)}
                                      className="w-full bg-[#DC2626] hover:bg-[#DC2626]/85 text-white font-mono text-[10px] font-bold py-1.5 rounded transition cursor-pointer text-center"
                                    >
                                      Selecionar como vencedora
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        )}
                      </div>

                      {/* Completed Workflow Checkpoint suggestion */}
                      {matchingQuotes.some(q => q.isSelected) && (
                        <div className={`lg:col-span-12 p-4 rounded mt-6 flex flex-col sm:flex-row gap-3 justify-between sm:items-center select-none border ${
                          isDark 
                            ? 'bg-[#DC2626]/10 border-[#DC2626]/40' 
                            : 'bg-red-50/50 border-red-200/80 shadow-sm'
                        }`}>
                          <div className="space-y-1">
                            <p className={`text-xs font-bold font-mono uppercase tracking-tight ${
                              isDark ? 'text-white' : 'text-red-750 font-black'
                            }`}>Etapa Concluída: Cotação Selecionada! 🚀</p>
                            <p className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-605'}`}>Pronto para criar uma linha orçamentária sugerindo automaticamente este valor vencedor.</p>
                          </div>
                          <button
                            onClick={() => {
                              // Automatically auto-fill or suggest creating on the next tab
                              setActiveSubTab('budget');
                            }}
                            className="bg-[#DC2626] hover:bg-[#DC2626]/85 text-white font-mono text-[9px] font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap w-full sm:w-auto"
                          >
                            Avançar para Previsão <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>
                );
              })()
            ) : (
              <div className={`text-center py-10 rounded border ${
                isDark ? 'bg-stone-900 border-stone-850 text-stone-500' : 'bg-stone-50 border-stone-200 text-stone-400 shadow-sm'
              }`}>
                Selecione ou adicione um material acima para ver seu comparativo.
              </div>
            )}

          </div>
        )}

        {/* TAB 3: ORÇAMENTO (BUDGETED COST) */}
        {activeSubTab === 'budget' && (
          <div className="space-y-6">
            
            {/* Scenario toggle explanatory banner */}
            <div className={`p-5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
              <div className="space-y-1">
                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  <Sliders className="w-4 h-4 text-[#DC2626]" />
                  Simulador Ativo de Margens de Hardware
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Tabela EAP consolidada. Escolha o cenário financeiro para ajustar os custos calculados em toda a cadeia de prototipagem.
                </p>
              </div>

              {/* Toggle controls resembling the UI requested */}
              <div className={`p-1.5 rounded flex items-center font-mono text-xs border ${isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-100 border-stone-200'}`}>
                <span className={`text-[9px] font-bold px-3 uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>CENÁRIO:</span>
                <div className="flex gap-1">
                  {[
                    { id: 'otimista', label: 'Otimista (-15%)', color: 'hover:text-emerald-400' },
                    { id: 'realista', label: 'Realista (100%)', color: 'hover:text-blue-400' },
                    { id: 'pessimista', label: 'Pessimista (+20%)', color: 'hover:text-red-400' }
                  ].map(scenario => {
                    const isSelected = activeScenario === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => setActiveScenario(scenario.id as any)}
                        className={`px-3 py-1 font-bold rounded text-[10px] uppercase transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#DC2626] text-white font-extrabold shadow-md'
                            : `${isDark ? 'text-stone-400' : 'text-stone-600'} ${scenario.color}`
                        }`}
                      >
                        {scenario.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add New Line Block */}
              <div className={`lg:col-span-4 p-5 rounded-lg border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
                <div className={`flex justify-between items-center mb-4 pb-2 border-b select-none ${isDark ? 'border-stone-850' : 'border-stone-200'}`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Nova Linha de Custo Orçada</h3>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-stone-950 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-200 text-stone-600'}`}>EAP PLAN</span>
                </div>

                {/* Suggested from winner quotes trigger */}
                {suggestedWinnerQuotes.length > 0 && (
                  <div className={`mb-4 p-3 rounded text-xs border ${isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
                    <p className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wide mb-1.5">
                      💡 Cotação Vencedora Encontrada!
                    </p>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {suggestedWinnerQuotes.map((item, idx) => {
                        if (!item) return null;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applySuggestedQuote(item.resource, item.winner)}
                            className={`w-full text-left border p-2 rounded text-[10px] transition cursor-pointer flex justify-between items-center ${isDark ? 'bg-stone-900 hover:bg-stone-850 border-stone-850 text-stone-300' : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'}`}
                          >
                            <span className="font-bold truncate max-w-[150px]">{item.resource.name}</span>
                            <span className="text-emerald-600 font-bold font-mono">
                              {item.winner.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddBudgetLine} className="space-y-4">
                  <div>
                    <label htmlFor="budget-name" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">DESIGNAÇÃO ORÇAMENTÁRIA *</label>
                    <input 
                      id="budget-name"
                      type="text"
                      required
                      placeholder="ex. Adesão de filamentos PETG de alto impacto"
                      value={budgetForm.name}
                      onChange={e => setBudgetForm({...budgetForm, name: e.target.value})}
                      className="mach-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="budget-category" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">CATEGORIA EAP *</label>
                    <select
                      id="budget-category"
                      value={budgetForm.category}
                      onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                      className="mach-input"
                    >
                      <option value="Materiais">Materiais</option>
                      <option value="Usinagem">Usinagem</option>
                      <option value="Eletrônica">Eletrônica</option>
                      <option value="Logística">Logística</option>
                      <option value="Ferramental">Ferramental</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="budget-qty" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">QUANTIDADE *</label>
                      <input 
                        id="budget-qty"
                        type="number"
                        min="1"
                        required
                        value={budgetForm.quantity}
                        onChange={e => setBudgetForm({...budgetForm, quantity: Number(e.target.value)})}
                        className="mach-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="budget-unitvalue" className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">VALOR UNITÁRIO REALISTA (R$) *</label>
                      <input 
                        id="budget-unitvalue"
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={budgetForm.unitValue}
                        onChange={e => setBudgetForm({...budgetForm, unitValue: Number(e.target.value)})}
                        className="mach-input font-bold"
                      />
                    </div>
                  </div>

                  <div className={`p-3 border rounded text-center ${isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200'}`}>
                    <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">VALOR TOTAL ESTIMADO (SEM AJUSTE)</p>
                    <p className={`text-md font-mono font-bold mt-1 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      {(budgetForm.quantity * budgetForm.unitValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#DC2626] hover:bg-[#DC2626]/85 text-white text-xs font-mono font-bold py-2.5 px-4 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    + Adicionar Linha Planejada
                  </button>
                </form>
              </div>

              {/* Detailed Budgeted Cost Table */}
              <div id="budget-table-export-container" className={`lg:col-span-8 p-5 rounded-lg flex flex-col justify-between border ${isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
                <div>
                  <div className="flex justify-between items-center mb-4 select-none gap-4">
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Planilha Analítica por Categorias</h3>
                      <p className={`text-[10px] mt-1 leading-snug ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>Visualizando multiplicador de cenário: <span className="text-[#DC2626] font-bold font-mono">{(scenarioMultiplier * 100)}%</span></p>
                    </div>

                    <button
                      type="button"
                      onClick={() => exportToPDF('budget-table-export-container', `Orcamento_${activeProject.name.replace(/\s+/g, '_')}.pdf`)}
                      className="bg-red-650 hover:bg-red-700 text-white font-extrabold uppercase py-1.5 px-3 rounded flex items-center gap-1.5 transition text-[10px] cursor-pointer ml-auto"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Exportar PDF
                    </button>
                    
                    <div className={`text-right px-3 py-1.5 rounded text-xs select-none border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-250'}`}>
                      <span className={`text-[9px] font-mono block uppercase font-bold ${isDark ? 'text-stone-450' : 'text-stone-500'}`}>Custo Total Consolidado</span>
                      <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        {renderedBudgetLines.reduce((acc, line) => acc + line.totalCost, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className={`font-mono text-[10px] uppercase font-bold border-b ${isDark ? 'bg-stone-950 text-stone-500 border-stone-800' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                          <th className="p-3">Gasto Planejado (Designação)</th>
                          <th className="p-3">Categoria</th>
                          <th className="p-3 text-center">Qtde</th>
                          <th className="p-3 text-right">Unitário Base</th>
                          <th className="p-3 text-right text-[#DC2626]">Unitário Cenário</th>
                          <th className="p-3 text-right font-bold">Custo Total</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-stone-850 bg-stone-950/20' : 'divide-stone-200 bg-stone-50/10'}`}>
                        {renderedBudgetLines.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8">
                              <div className={`text-center py-8 px-4 border border-dashed rounded flex flex-col items-center justify-center space-y-2 animate-fade-in ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                                <Sliders className="w-8 h-8 text-stone-700/60" />
                                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>Nenhum Custo Orçado</p>
                                <p className="text-[10px] text-stone-500 max-w-xs">Adicione linhas planejadas no formulário lateral ou clique em "Gerar cotações" para importar valores de fornecedores.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          renderedBudgetLines.map(line => (
                            <tr key={line.id} className={`transition ${isDark ? 'hover:bg-stone-900/40 border-stone-850' : 'hover:bg-stone-100 border-stone-150'}`}>
                              <td className="p-3">
                                <div>
                                  <p className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-850'}`}>{line.name}</p>
                                  <p className="text-[9px] text-[#DC2626] hover:underline cursor-pointer flex items-center gap-1 mt-0.5 select-none" onClick={() => autoLogExpense(line)}>
                                    ⚡ Lançar despesa correspondente em Caixa
                                  </p>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                                  isDark 
                                    ? 'bg-stone-800 border-stone-750 text-stone-400' 
                                    : 'bg-stone-100 border-stone-200 text-stone-600'
                                }`}>
                                  {line.category}
                                </span>
                              </td>
                              <td className={`p-3 text-center font-mono font-bold ${isDark ? 'text-stone-300' : 'text-stone-850'}`}>{line.quantity}</td>
                              <td className={`p-3 text-right font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>{line.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                              <td className={`p-3 text-right font-mono font-bold bg-[#DC2626]/5 text-[#DC2626] border-x ${isDark ? 'border-stone-850' : 'border-stone-150'}`}>
                                {line.calculatedUnitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className={`p-3 text-right font-mono font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                {line.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="p-3 text-center select-none">
                                <button
                                  onClick={() => deleteBudgetLine(line.id)}
                                  className="text-stone-500 hover:text-red-500 p-1 cursor-pointer transition-colors"
                                  title="Remover linha"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`p-3 border rounded text-[11px] leading-relaxed font-sans mt-5 ${
                  isDark 
                    ? 'bg-stone-950/80 border-stone-850 text-stone-400' 
                    : 'bg-amber-50/50 border-amber-200/80 text-stone-705 shadow-sm'
                }`}>
                  💡 <strong>Impacto integrado:</strong> As linhas planejadas servem como o baseline orçamentário. Quando você clica em "Lançar despesa", o sistema facilita as entradas de caixa, comparando orçado x realizado instantaneamente.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: CASH FLOW LEDGER & GRAPH */}
        {activeSubTab === 'cashflow' && (
          permissions?.isSponsor ? (
            <div className={`border rounded p-12 text-center flex flex-col items-center justify-center space-y-4 font-mono ${
              isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 animate-pulse">
                ⚠️
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Acesso Restrito: Nível Sponsor</h3>
              <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-605'}`}>
                Sponsors possuem nível de acesso restrito ao resumo financeiro macro e planejamento orçamentário. O fluxo de caixa detalhado por lançamento individual é confidencial nesta área do bólido.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
            
            {/* Ledger highlights indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="cashflow-totals-grid">
              
              <div className={`mach-card py-4 flex flex-col justify-between border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div className={`flex justify-between items-start text-xs font-medium font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <span>FUNDAÇÃO / SALDO INICIAL</span>
                  <Sliders className="w-4 h-4 text-stone-500" />
                </div>
                <div className="mt-3">
                  <input 
                    type="number"
                    value={initialBalance}
                    onChange={e => setInitialBalance(Number(e.target.value))}
                    className="mach-input text-base font-mono font-bold max-w-[150px] !py-1 !px-2"
                    placeholder="Saldo inicial"
                  />
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">Editável para calibração</p>
                </div>
              </div>

              <div className={`mach-card py-4 flex flex-col justify-between border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div className={`flex justify-between items-start text-xs font-medium font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <span>CAPTAÇÕES (RECEITAS)</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="mt-3">
                  <p className={`text-lg font-mono font-extrabold ${isDark ? 'text-emerald-450' : 'text-emerald-600'}`}>
                    {globalSummaryTotals.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">Parcerias e cotas institucionais</p>
                </div>
              </div>

              <div className={`mach-card py-4 flex flex-col justify-between border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div className={`flex justify-between items-start text-xs font-medium font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <span>DESEMBOLSOS (DESPESAS)</span>
                  <ArrowDownLeft className="w-4 h-4 text-[#DC2626]" />
                </div>
                <div className="mt-3">
                  <p className="text-lg font-mono font-extrabold text-[#DC2626]">
                    {globalSummaryTotals.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">Gastos efetivados no canteiro</p>
                </div>
              </div>

              <div className={`mach-card py-4 flex flex-col justify-between border-l-2 ${
                isDark ? 'bg-stone-900 border-y-stone-850 border-r-stone-850' : 'bg-white border-y-stone-200 border-r-stone-200 shadow-sm'
              } ${globalSummaryTotals.finalBalance >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                <div className={`flex justify-between items-start text-xs font-medium font-mono ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <span>SALDO FINANCEIRO REAL</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-3">
                  <p className={`text-lg font-mono font-extrabold ${globalSummaryTotals.finalBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {globalSummaryTotals.finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">Initial + Receitas - Despesas</p>
                </div>
              </div>

            </div>

            {/* Recharts Bar Chart Breakdown */}
            <div className={`p-5 rounded-lg border ${
              isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className={`flex justify-between items-center mb-4 select-none pb-2 border-b ${
                isDark ? 'border-stone-850' : 'border-stone-200'
              }`}>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-200' : 'text-stone-850'}`}>
                    Análise Mensal de Receita vs Despesa (F1 in Schools Plan)
                  </h3>
                  <p className={`text-[10px] font-sans mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Distribuição do livro-caixa sobre a Linha do Tempo de engenharia</p>
                </div>
                <span className={`text-[9px] font-mono border px-2 py-0.5 rounded ${
                  isDark ? 'bg-stone-950 border-stone-800 text-indigo-400' : 'bg-stone-50 border-stone-200 text-indigo-600'
                }`}>
                  Recharts Render Engine
                </span>
              </div>

              <div className="w-full h-64 font-mono select-none" id="finance-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#262626" : "#e5e5e5"} />
                    <XAxis dataKey="monthName" stroke={isDark ? "#737373" : "#525252"} fontSize={11} />
                    <YAxis stroke={isDark ? "#737373" : "#525252"} fontSize={11} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#171717' : '#ffffff', 
                        borderColor: isDark ? '#404040' : '#d4d4d8', 
                        color: isDark ? '#fff' : '#000', 
                        fontSize: '11px' 
                      }}
                      formatter={(v) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="receita" name="Reclame/Receita (Entrada)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesa Efetivada (Saída)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ledger entry creation & Ledger Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add transaction form */}
              <div className={`p-5 rounded-lg flex flex-col justify-between border lg:col-span-4 ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div>
                  <div className={`flex items-center gap-1.5 mb-4 pb-2 border-b select-none ${
                    isDark ? 'border-stone-850' : 'border-stone-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-red-650" />
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-stone-900'}`}>Lançar Movimentação</h3>
                  </div>

                  <form onSubmit={handleAddCashFlowEntry} className="space-y-4">
                    <div>
                      <label htmlFor="cf-desc" className={`text-[10px] font-mono block mb-1 font-bold ${
                        isDark ? 'text-stone-400' : 'text-stone-605'
                      }`}>DESIGNAÇÃO DO PAGAMENTO *</label>
                      <input 
                        id="cf-desc"
                        type="text"
                        required
                        placeholder="ex. Pagamento parcial alumínio carenagem"
                        value={cashFlowForm.description}
                        onChange={e => setCashFlowForm({...cashFlowForm, description: e.target.value})}
                        className="mach-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="cf-type" className={`text-[10px] font-mono block mb-1 font-bold ${
                          isDark ? 'text-stone-400' : 'text-stone-605'
                        }`}>TIPO *</label>
                        <select
                          id="cf-type"
                          value={cashFlowForm.type}
                          onChange={e => setCashFlowForm({...cashFlowForm, type: e.target.value as any})}
                          className="mach-input"
                        >
                          <option value="expense">Despesa (Saída)</option>
                          <option value="revenue">Receita (Entrada)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="cf-category" className={`text-[10px] font-mono block mb-1 font-bold ${
                          isDark ? 'text-stone-400' : 'text-stone-605'
                        }`}>CATEGORIA</label>
                        <select
                          id="cf-category"
                          value={cashFlowForm.category}
                          onChange={e => setCashFlowForm({...cashFlowForm, category: e.target.value})}
                          className="mach-input"
                        >
                          {/* Matches seeded categories */}
                          <option value="Materials">Materiais</option>
                          <option value="Usinagem">Usinagem</option>
                          <option value="Eletrônica">Eletrônica</option>
                          <option value="Logística">Logística</option>
                          <option value="Ferramental">Ferramental</option>
                          <option value="Patrocínio">Patrocínio</option>
                          <option value="Institucional">Institucional</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="cf-amount" className={`text-[10px] font-mono block mb-1 font-bold ${
                          isDark ? 'text-stone-400' : 'text-stone-605'
                        }`}>MONTANTE (R$) *</label>
                        <input 
                          id="cf-amount"
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          value={cashFlowForm.amount}
                          onChange={e => setCashFlowForm({...cashFlowForm, amount: Number(e.target.value)})}
                          className="mach-input font-bold"
                        />
                      </div>

                      <div>
                        <label htmlFor="cf-date" className={`text-[10px] font-mono block mb-1 font-bold ${
                          isDark ? 'text-stone-400' : 'text-stone-605'
                        }`}>DATA DO FLUXO *</label>
                        <input 
                          id="cf-date"
                          type="date"
                          required
                          value={cashFlowForm.date}
                          onChange={e => setCashFlowForm({...cashFlowForm, date: e.target.value})}
                          className="mach-input font-mono"
                        />
                      </div>
                    </div>

                    {cashFlowForm.type === 'expense' && (
                      <div className={`p-2.5 border rounded flex items-center gap-2 select-none ${
                        isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200'
                      }`}>
                        <input 
                          type="checkbox"
                          id="contingencyPay"
                          checked={cashFlowForm.isContingencyFunded}
                          onChange={e => setCashFlowForm({...cashFlowForm, isContingencyFunded: e.target.checked})}
                          className={`w-4 h-4 rounded text-[#DC2626] focus:ring-[#DC2626] ${
                            isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-300 bg-white'
                          }`}
                        />
                        <label htmlFor="contingencyPay" className={`text-[10px] font-mono cursor-pointer ${
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        }`}>
                          Debitar do Fundo de Reserva
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#DC2626] hover:bg-[#DC2626]/85 text-white text-xs font-mono font-bold py-2.5 px-4 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      + Lançar Transação
                    </button>
                  </form>
                </div>

                <div className={`p-3 rounded border text-[10px] font-sans leading-relaxed mt-4 ${
                  isDark
                    ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-stone-400'
                    : 'bg-red-50/60 border-red-200 text-stone-705'
                }`}>
                  <strong>Reconciliação Automática:</strong> Novos lançamentos entram com estado "Pendente". Utilize a aba "Conciliação Bancária" para validar os extratos quinzenais.
                </div>
              </div>

              {/* Ledger Operational Table with filters */}
              <div className={`lg:col-span-8 p-5 rounded-lg border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                
                {/* Tables filters bar */}
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 select-none pb-2 border-b ${
                  isDark ? 'border-stone-850' : 'border-stone-200'
                }`}>
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-stone-900'}`}>Extrato Geral / Ledger de Operações</h3>
                    <p className={`text-[10px] font-mono ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Modulagem e controle de fluxo real para o M1-2026</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs select-none">
                    
                    <button
                      type="button"
                      onClick={() => {
                        const excelData = cashFlow.map(cf => ({
                          Data: cf.date,
                          Descrição: cf.description,
                          Categoria: cf.category,
                          Tipo: cf.type === 'revenue' ? 'Entrada' : 'Saída',
                          Valor: cf.amount,
                          Reconciliado: cf.isReconciled ? 'Sim' : 'Não',
                          'Fundo Reserva': cf.isContingencyFunded ? 'Sim' : 'Não'
                        }));
                        exportToExcel(excelData, `Fluxo_De_Caixa_${activeProject.name.replace(/\s+/g, '_')}.xlsx`, 'Fluxo de Caixa');
                      }}
                      className={`font-extrabold uppercase py-1.5 px-3 rounded flex items-center gap-1.5 transition text-[10px] cursor-pointer border ${
                        isDark 
                          ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-450 border-[#10B981]/30' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Exportar Excel
                    </button>

                    {/* Month Filter */}
                    <div className={`flex items-center px-2 py-1 rounded border text-[10px] font-mono ${
                      isDark ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-stone-55 border-stone-200 text-stone-600'
                    }`}>
                      <Filter className="w-3.5 h-3.5 text-stone-500 mr-1.5" />
                      <span className="uppercase font-bold mr-1">Mês:</span>
                      <select
                        value={cfMonthFilter}
                        onChange={e => setCfMonthFilter(e.target.value)}
                        className={`bg-transparent border-none focus:outline-none font-bold ${
                          isDark ? 'text-white bg-stone-950' : 'text-stone-800 bg-stone-55'
                        }`}
                      >
                        <option value="todos">Todos</option>
                        {uniqueMonths.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className={`flex items-center px-2 py-1 rounded border text-[10px] font-mono ${
                      isDark ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-stone-55 border-stone-200 text-stone-600'
                    }`}>
                      <span className="uppercase font-bold mr-1">Cat:</span>
                      <select
                        value={cfCategoryFilter}
                        onChange={e => setCfCategoryFilter(e.target.value)}
                        className={`bg-transparent border-none focus:outline-none font-bold ${
                          isDark ? 'text-white bg-stone-950' : 'text-stone-800 bg-stone-55'
                        }`}
                      >
                        <option value="todos">Todas</option>
                        {uniqueCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className={`font-mono text-[9px] uppercase font-bold border-b ${
                        isDark ? 'bg-stone-955 text-stone-500 border-stone-850' : 'bg-stone-50 text-stone-600 border-stone-200'
                      }`}>
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição lançamento</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3 text-center">Tipo</th>
                        <th className="p-3 text-right">Montante (BRL)</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-stone-850 bg-stone-950/20' : 'divide-stone-200 bg-stone-50/10'}`}>
                      {filteredCashFlow.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8">
                            <div className={`text-center py-8 px-4 border border-dashed rounded flex flex-col items-center justify-center space-y-2 animate-fade-in ${
                              isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-stone-50 border-stone-200'
                            }`}>
                              <ArrowUpRight className="w-8 h-8 text-stone-700/60" />
                              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>Nenhuma Transação no Livro-Caixa</p>
                              <p className="text-[10px] text-stone-500 max-w-xs">Cadastre receitas e despesas no formulário lateral para monitorar o fluxo de caixa do M1-2026.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredCashFlow.map(cf => (
                          <tr key={cf.id} className={`transition ${isDark ? 'hover:bg-stone-900/40 border-stone-850' : 'hover:bg-stone-105 border-stone-150'}`}>
                            <td className={`p-3 font-mono text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>{cf.date.split('-').reverse().join('/')}</td>
                            <td className="p-3">
                              <div>
                                <p className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-850'}`}>{cf.description}</p>
                                {cf.isContingencyFunded && (
                                  <span className={`inline-flex items-center gap-1 text-[8px] border px-1 py-0.1 font-mono rounded font-bold uppercase mt-1 ${
                                    isDark ? 'bg-red-955/30 text-amber-400 border-red-900/45' : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    🛡️ Fundo Contingência
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`border text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isDark ? 'bg-stone-850 border-stone-800 text-stone-400' : 'bg-stone-100 border-stone-200 text-stone-700 font-semibold'
                              }`}>
                                {cf.category}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {cf.type === 'revenue' ? (
                                <span className={`border text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                  isDark ? 'bg-emerald-955/40 border-emerald-900/45 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>Entrada</span>
                              ) : (
                                <span className={`border text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                  isDark ? 'bg-red-955/45 border-red-900/45 text-[#DC2626]' : 'bg-red-50 border-red-200 text-[#DC2626] font-bold'
                                }`}>Saída</span>
                              )}
                            </td>
                            <td className={`p-3 text-right font-mono font-bold ${cf.type === 'revenue' ? 'text-emerald-500' : isDark ? 'text-stone-300' : 'text-stone-705'}`}>
                              {cf.type === 'revenue' ? '+' : '-'}{cf.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-3 text-center select-none">
                              <button
                                onClick={() => toggleReconciliation(cf.id)}
                                className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded border transition-all cursor-pointer ${
                                  cf.isReconciled
                                    ? isDark ? 'bg-emerald-955/20 text-emerald-450 border-emerald-900/45' : 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                    : isDark ? 'bg-amber-955/20 text-amber-450 border-amber-900/45' : 'bg-amber-50 text-amber-700 border-amber-250'
                                }`}
                              >
                                {cf.isReconciled ? 'Reconciliado' : 'Pendente'}
                              </button>
                            </td>
                            <td className="p-3 text-center select-none">
                              <button
                                onClick={() => deleteCashFlowEntry(cf.id)}
                                className={`p-1 cursor-pointer transition ${
                                  isDark ? 'text-stone-600 hover:text-red-500' : 'text-stone-400 hover:text-red-600'
                                }`}
                                title="Deletar lançamento"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
          )
        )}
        {/* TAB 5: CONTINGENCY RESERVE */}
        {activeSubTab === 'contingency' && (
          <div className="space-y-6">
            
            {/* Contingencial visual explanation card resembling the portfolio's metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Configuration Range Panel */}
              <div className={`p-5 rounded-lg flex flex-col justify-between border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div>
                  <div className={`flex items-center gap-1.5 mb-4 pb-2 border-b select-none ${
                    isDark ? 'border-stone-850' : 'border-stone-200'
                  }`}>
                    <Percent className="w-4.5 h-4.5 text-[#DC2626]" />
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-stone-900'}`}>Alíquota de Proteção</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className={`text-[10px] font-mono block mb-1.5 font-bold uppercase ${
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      }`}>PERCENTUAL DA RESERVA (%)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min="5"
                          max="30"
                          step="1"
                          value={contingencyPercentage}
                          onChange={e => saveContingencyPercent(Number(e.target.value))}
                          className={`w-full accent-[#DC2626] h-1.5 rounded-lg appearance-none cursor-pointer ${
                            isDark ? 'bg-stone-950' : 'bg-stone-200'
                          }`}
                        />
                        <span className={`font-mono text-lg font-bold shrink-0 border px-2 py-0.5 rounded ${
                          isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900 font-bold'
                        }`}>
                          {contingencyPercentage}%
                        </span>
                      </div>
                      <p className={`text-[10px] leading-relaxed mt-2.5 ${isDark ? 'text-stone-550' : 'text-stone-500'}`}>
                        Margem preventiva para imprevistos do protótipo mecânico exigida pelo regulamento de conformidade.
                      </p>
                    </div>

                    <div className={`p-3.5 border rounded text-xs space-y-2 select-text ${
                      isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200 shadow-inner'
                    }`}>
                      <p className={`text-[9px] font-mono font-bold uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Premissas de Cálculo</p>
                      <p className={`leading-relaxed font-sans text-[11px] ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        O montante preventivo é calculado aplicando a alíquota de <strong className="text-[#DC2626]">{contingencyPercentage}%</strong> sobre o <strong>Valor Total de Patrocínios Captados</strong> da equipe.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-2.5 rounded text-[9px] font-mono leading-relaxed mt-5 border ${
                  isDark ? 'bg-stone-950 text-stone-500 border-stone-850' : 'bg-stone-105/60 text-stone-600 border-stone-200'
                }`}>
                  🛡️ Recomenda-se estipular entre 10% e 15% para suportar correções de usinagem e re-impressão em blocos de ABS.
                </div>
              </div>

              {/* Quantitative balance sheet card */}
              <div className={`md:col-span-2 p-6 rounded-lg flex flex-col justify-between border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div>
                  <div className={`flex justify-between items-center mb-6 pb-2 border-b select-none ${
                    isDark ? 'border-stone-850' : 'border-stone-200'
                  }`}>
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-stone-900'}`}>Resumo de Contingência & Disponibilidade</h3>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Visão do Fundo de Segurança para Imprevistos Mecânicos</p>
                    </div>
                    <span className={`text-[9px] font-mono border px-3 py-1 rounded ${
                      isDark ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600 font-bold'
                    }`}>
                      REGULAMENTO F1
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="contingency-summary-blocks">
                    
                    <div className={`p-4 border rounded ${
                      isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200 shadow-sm'
                    }`}>
                      <span className={`text-[9px] font-mono block font-bold uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>PATROCÍNIOS RECEBIDOS</span>
                      <span className="font-mono font-extrabold text-[#DC2626] text-md mt-1 block">
                        {totalSponsoredAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className={`text-[9px] font-sans block mt-1 ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>Soma de receitas marcadas Patrocínio</span>
                    </div>

                    <div className={`p-4 border rounded border-l-2 border-l-[#DC2626] ${
                      isDark ? 'bg-stone-955 border-y-stone-850 border-r-stone-850' : 'bg-stone-50 border-y-stone-200 border-r-stone-200 shadow-sm'
                    }`}>
                      <span className={`text-[9px] font-mono block font-bold uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>VALOR RESERVA CALCULADO</span>
                      <span className={`font-mono font-extrabold text-md mt-1 block ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        {calculatedReserveAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className={`text-[9px] font-sans block mt-1 ${isDark ? 'text-stone-550' : 'text-stone-500'}`}>{contingencyPercentage}% do montante captado</span>
                    </div>

                    <div className={`p-4 border rounded ${
                      isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200 shadow-sm'
                    }`}>
                      <span className={`text-[9px] font-mono block font-bold uppercase ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>MONTANTE JÁ UTILIZADO</span>
                      <span className="font-mono font-extrabold text-amber-500 text-md mt-1 block">
                        {contingencyAmountUsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className={`text-[9px] font-sans block mt-1 ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>Débitos usando fundo de reserva</span>
                    </div>

                  </div>

                  {/* Available final balance card */}
                  <div className={`mt-6 p-5 border rounded flex flex-col sm:flex-row justify-between items-center gap-4 ${
                    isDark ? 'bg-stone-955 border-stone-850' : 'bg-stone-50 border-stone-200 shadow-inner'
                  }`}>
                    <div className="space-y-1">
                      <p className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>Saldo de Fundo Disponível para Estornos</p>
                      <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-550'}`}>Saldo residual que pode ser canalizado sob validação do docente orientador.</p>
                    </div>

                    <div className="text-right">
                      <p className={`text-xl font-mono font-black ${contingencyBalanceAvailable >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {contingencyBalanceAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className={`text-[9px] font-mono mt-1 uppercase font-bold ${isDark ? 'text-stone-650' : 'text-stone-500'}`}>Restante Preventivo</p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded text-[11px] leading-relaxed font-sans mt-6 border ${
                  isDark ? 'bg-stone-950/50 border-stone-900 text-stone-400' : 'bg-[#DC2626]/5 border-red-200 text-stone-700 font-semibold'
                }`}>
                  ⚠️ <strong>Aviso Efetivo:</strong> Lançamentos debitados deste fundo diminuem o saldo preventivo total do projeto. Certifique-se de que cada movimento tenha anexo de aprovação do orientador.
                </div>
              </div>

            </div>

          </div>
        )}
        {/* TAB 6: BANK RECONCILIATION */}
        {activeSubTab === 'reconciliation' && (
          <div className="space-y-6">
            
            {/* Split layout: Warnings summary vs pending checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Overdue Discrepancies Summary Panel */}
              <div className={`lg:col-span-4 p-5 rounded-lg flex flex-col justify-between border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div>
                  <div className={`flex items-center gap-1.5 mb-4 pb-2 border-b select-none col-span-full ${
                    isDark ? 'border-stone-850' : 'border-stone-200'
                  }`}>
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-stone-900'}`}>Resumo de Divergências</h3>
                  </div>

                  <div className="space-y-4">
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      Lançamentos que comprometem o livro físico porém ainda não possuem equivalência comprovada com o extrato bancário.
                    </p>

                    <div className={`p-4 border rounded space-y-3.5 text-xs ${
                      isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-50 border-stone-200'
                    }`}>
                      <div>
                        <span className={`text-[9px] font-mono block uppercase font-bold ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>Lançamentos Pendentes</span>
                        <span className="text-lg font-mono font-bold text-amber-500 block mt-0.5">
                          {unreconciledItems.length} movimentos
                        </span>
                      </div>

                      <div className={`border-t pt-3 ${isDark ? 'border-stone-900' : 'border-stone-200'}`}>
                        <span className="text-[9px] font-mono block uppercase font-bold text-amber-500">⚠️ Críticos (&gt; 14 dias em aberto)</span>
                        <span className="text-lg font-mono font-black text-red-500 block mt-0.5">
                          {overdueUnreconciledList.length} em atraso
                        </span>
                        <p className={`text-[10px] font-sans mt-1 ${isDark ? 'text-stone-500' : 'text-stone-550'}`}>Exigem justificativa urgente e envio de recibo.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded text-[10px] leading-relaxed mt-5 border ${
                  isDark ? 'bg-amber-950/20 border-amber-900/30 text-amber-400' : 'bg-amber-50 border-amber-250 text-amber-850'
                }`}>
                  📌 <strong>Nota Auditoria:</strong> Itens com mais de 2 semanas sem conciliação causam desencontro no cálculo do EVM do cronograma. Resolva os comprovantes pendentes.
                </div>
              </div>

              {/* Pending checklist spreadsheet */}
              <div className={`lg:col-span-8 p-5 rounded-lg border ${
                isDark ? 'bg-stone-900 border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}>
                <div className={`flex justify-between items-center mb-4 select-none pb-2 border-b ${
                  isDark ? 'border-stone-850' : 'border-stone-200'
                }`}>
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-stone-900'}`}>Checklist de Auditoria Quinzenal</h3>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-stone-450' : 'text-stone-500'}`}>Lista de lançamentos pendentes de validação contábil</p>
                  </div>
                  <span className={`text-[10px] border px-3 py-1 font-mono rounded ${
                    isDark ? 'bg-stone-950 border-stone-800 text-[#DC2626]' : 'bg-stone-50 border-stone-200 text-[#DC2626] font-bold'
                  }`}>
                    CONCILIAÇÃO DISCENTE
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                  {unreconciledItems.length === 0 ? (
                    <div className={`text-center py-16 border border-dashed rounded-lg flex flex-col items-center justify-center space-y-3 w-full animate-fade-in ${
                      isDark ? 'bg-stone-950/20 border-stone-800' : 'bg-stone-50 border-stone-200'
                    }`}>
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                      <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>Espetacular! Tudo conciliado</p>
                      <p className="text-[10px] text-stone-500">Nenhum lançamento pendente encontrado para reconciliar no caixa.</p>
                    </div>
                  ) : (
                    unreconciledItems.map(item => {
                      const isOverdue = checkIsOverdue(item.date);
                      
                      return (
                        <div 
                          key={item.id}
                          className={`p-3.5 rounded border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                            isOverdue
                              ? isDark 
                                ? 'bg-red-955/10 border-red-900/60 shadow-md shadow-red-955/5' 
                                : 'bg-red-50 border-red-200 shadow-sm'
                              : isDark 
                                ? 'bg-stone-950 border-stone-850 hover:border-stone-800' 
                                : 'bg-stone-50/50 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          <div className="space-y-1.5 max-w-md">
                            <div className="flex flex-wrap items-center gap-2">
                              {isOverdue && (
                                <span className={`text-[8px] border font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1 ${
                                  isDark ? 'bg-red-955/45 border-red-900/70 text-red-500' : 'bg-red-100 border-red-200 text-red-700'
                                }`}>
                                  ⚠️ Crítico &gt; 14 Dias
                                </span>
                              )}
                              <span className={`text-[10px] border px-2 py-0.2 rounded font-mono ${
                                isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-200/60 border-stone-300/80 text-stone-700 font-semibold'
                              }`}>
                                {item.category}
                              </span>
                              <span className={`font-mono text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-550'}`}>
                                {item.date.split('-').reverse().join('/')}
                              </span>
                            </div>

                            <p className={`text-xs font-bold leading-snug ${isDark ? 'text-stone-150' : 'text-stone-850'}`}>{item.description}</p>
                            
                            <p className={`text-[10px] font-mono ${isDark ? 'text-stone-500' : 'text-stone-605'}`}>
                              Valor: <span className={`font-bold ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => toggleReconciliation(item.id)}
                            className={`px-3.5 py-1.5 rounded font-mono text-[10px] font-bold uppercase cursor-pointer transition shrink-0 inline-flex items-center gap-1.5 self-end sm:self-center border ${
                              isDark 
                                ? 'bg-emerald-950 text-emerald-450 hover:bg-emerald-900/40 border-emerald-900/60' 
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-105 border-emerald-250'
                            }`}
                          >
                            <CheckSquare className="w-3.5 h-3.5" /> Marcar como conferido
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 7: EVM ANALYSIS */}
        {activeSubTab === 'evm' && (
          <div className="animate-fade-in">
            <EvmDashboard activeProject={activeProject} isDark={isDark} />
          </div>
        )}

      </div>

    </div>
  );
}
