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
  ExternalLink
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
import { Project, User as UserType } from '../types';

interface FinanceProps {
  activeProject: Project;
  activeUser: UserType | null;
  memberships: any[];
  users: UserType[];
  permissions?: any;
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
// PRE-SEEDED DETAILED DATA FOR FORMULA SAE 2026
// ---------------------------------------------------------
const SEED_RESOURCES = (projId: string): ResourcePlanItem[] => [
  {
    id: 'res-tubos-4130',
    projectId: projId,
    name: 'Tubos de Aço Molibdênio 4130 chassi',
    quantity: 14,
    idealDate: '2026-06-25',
    owner: 'Ana Clara',
    origin: 'sponsorship',
    category: 'Materiais'
  },
  {
    id: 'res-manga-eixo',
    projectId: projId,
    name: 'Manga de Eixo Dianteira CNC',
    quantity: 4,
    idealDate: '2026-07-10',
    owner: 'Pedro Henrique',
    origin: 'institutional',
    category: 'Usinagem'
  },
  {
    id: 'res-telemetria',
    projectId: projId,
    name: 'Módulo de Aquisição de Dados & Telemetria',
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
    supplier: 'Metalúrgica TuboAço Curitiba',
    unitPrice: 280,
    deliveryDays: 5,
    qualityRemarks: 'Tolerância dimensional rigida, acompanha laudo do fabricante.',
    isSelected: true
  },
  {
    id: 'q-tub-2',
    resourceId: 'res-tubos-4130',
    supplier: 'Siderúrgica Paulista LTDA',
    unitPrice: 310,
    deliveryDays: 3,
    qualityRemarks: 'Aço certificado SAE; ótimo acabamento externo sem costura.'
  },
  {
    id: 'q-tub-3',
    resourceId: 'res-tubos-4130',
    supplier: 'Nacional Metais Importados',
    unitPrice: 260,
    deliveryDays: 15,
    qualityRemarks: 'Preço promocional, mas o frete atrasa no desembaraço.'
  },
  {
    id: 'q-manga-1',
    resourceId: 'res-manga-eixo',
    supplier: 'Usinagem Precision CNC',
    unitPrice: 850,
    deliveryDays: 12,
    qualityRemarks: 'Corte a 5 eixos. Acabamento polido tipo aviação aeronáutica.'
  },
  {
    id: 'q-manga-2',
    resourceId: 'res-manga-eixo',
    supplier: 'Oficina Rápida Industrial',
    unitPrice: 790,
    deliveryDays: 7,
    qualityRemarks: 'Prazo veloz. Peça com pequenas marcas de torno não estruturais.',
    isSelected: true
  },
  {
    id: 'q-tel-1',
    resourceId: 'res-telemetria',
    supplier: 'FSAE Electronics Store',
    unitPrice: 1450,
    deliveryDays: 4,
    qualityRemarks: 'Wifi integrado de longo alcance. Totalmente compatível com ECU.'
  }
];

const SEED_BUDGET_LINES = (projId: string): BudgetLine[] => [
  {
    id: 'bl-1',
    projectId: projId,
    name: 'Matéria Prima Chassi Tubular (Aço 4130)',
    category: 'Materiais',
    quantity: 14,
    unitValue: 280
  },
  {
    id: 'bl-2',
    projectId: projId,
    name: 'Usinagem de Mangas de Eixo Traseiras',
    category: 'Usinagem',
    quantity: 4,
    unitValue: 790
  },
  {
    id: 'bl-3',
    projectId: projId,
    name: 'Filamentos Carbono Caremagem 3D',
    category: 'Materiais',
    quantity: 5,
    unitValue: 180
  },
  {
    id: 'bl-4',
    projectId: projId,
    name: 'Passagens Aéreas e Inscrições Formula SAE Brasil',
    category: 'Logística',
    quantity: 12,
    unitValue: 450
  }
];

const SEED_CASH_FLOW = (projId: string): CashFlowEntry[] => [
  {
    id: 'cf-1',
    projectId: projId,
    description: 'Patrocínio Diamante - Concessionária Autódromo',
    type: 'revenue',
    amount: 15000,
    category: 'Patrocínio',
    date: '2026-06-01',
    isReconciled: true
  },
  {
    id: 'cf-2',
    projectId: projId,
    description: 'Subvenção Anual do Diretório Acadêmico STEM',
    type: 'revenue',
    amount: 8000,
    category: 'Institucional',
    date: '2026-06-05',
    isReconciled: true
  },
  {
    id: 'cf-3',
    projectId: projId,
    description: 'Compra de Tubos de Aço (Nota Fiscal nº 1092)',
    type: 'expense',
    amount: 3920, // 14 metros * 280 reais
    category: 'Materiais',
    date: '2026-06-15',
    isReconciled: true
  },
  {
    id: 'cf-4',
    projectId: projId,
    description: 'Borrachas de Vedação e Coxins do Motor',
    type: 'expense',
    amount: 650,
    category: 'Materiais',
    date: '2026-06-18',
    isReconciled: false // Overdue if today is e.g. June 20? No, this is fine, but let's have an older one to show the 14 days warning!
  },
  {
    id: 'cf-5',
    projectId: projId,
    description: 'Usinagem Flanges de Escape CNC (Pendente há mais de 14 dias!)',
    type: 'expense',
    amount: 1200,
    category: 'Usinagem',
    date: '2026-05-25', // More than 14 days ago relative to June 20, 2026!
    isReconciled: false
  },
  {
    id: 'cf-6',
    projectId: projId,
    description: 'Alimentação Treino Prático Campo de Provas',
    type: 'expense',
    amount: 450,
    category: 'Logística',
    date: '2026-06-02', // Overdue relative to June 20!
    isReconciled: false
  },
  {
    id: 'cf-7',
    projectId: projId,
    description: 'Reserva Emergencial - Extintor de Incêndio Adicional',
    type: 'expense',
    amount: 1100,
    category: 'Ferramental',
    date: '2026-06-14',
    isReconciled: true,
    isContingencyFunded: true // Paid via Contingency Contingency Reserve
  },
  {
    id: 'cf-8',
    projectId: projId,
    description: 'Doação Individual por Torcedores Acadêmicos (Apoie o Mach One!)',
    type: 'revenue',
    amount: 2500,
    category: 'Patrocínio',
    date: '2026-05-18',
    isReconciled: true
  }
];

export default function Finance({ activeProject, activeUser, memberships, users, permissions }: FinanceProps) {
  // ---------------------------------------------------------
  // SUB-TAB NAVIGATION
  // ---------------------------------------------------------
  type SubTab = 'planning' | 'quotations' | 'budget' | 'cashflow' | 'contingency' | 'reconciliation';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('planning');

  // Selected resource item inside the quotations sub-tab to view comparisons
  const [selectedQuoteResource, setSelectedQuoteResource] = useState<string>('res-tubos-4130');

  // Scenario toggle inside budget: 'otimista' | 'realista' | 'pessimista'
  const [activeScenario, setActiveScenario] = useState<'otimista' | 'realista' | 'pessimista'>('realista');

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

  return (
    <div className="space-y-6 select-text" id="finance-detailed cockpit-container">
      
      {/* HEADER SECTION WITH INTEGRATED CRUMBS */}
      <div className="bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] bg-[#DC2626] text-white px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Finanças FSAE
            </span>
            <span className="text-stone-500 font-mono text-[10px]">
              ID: {activeProject.id}
            </span>
          </div>
          <h1 className="text-2xl font-display font-black uppercase text-white tracking-wide">
            Orçamento & Controle Monetário
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Painel dinâmico da equipe <span className="text-white font-semibold">Mach One Racing</span>. Planeje a aquisição de recursos físicos, selecione cotações vencedoras, teste cenários de custos pessimistas e controle o livro de fluxo de caixa operacional.
          </p>
        </div>

        {/* Global Floating Counters */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-stone-950 p-3 border border-stone-800 rounded text-right min-w-[140px]">
            <span className="text-[9px] font-mono text-stone-500 block uppercase font-bold">Saldo Livre Estimado</span>
            <span className={`text-sm font-mono font-bold ${globalSummaryTotals.finalBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {globalSummaryTotals.finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="bg-stone-950 p-3 border border-stone-850 rounded text-right min-w-[140px]">
            <span className="text-[9px] font-mono text-stone-500 block uppercase font-bold">Fundo de Reserva</span>
            <span className="text-sm font-mono font-bold text-[#DC2626] flex items-center justify-end gap-1">
              <ShieldCheck className="w-4.5 h-4.5 text-[#DC2626]" />
              {contingencyBalanceAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TAB NAV BAR (Swiss Clean Tabs) */}
      <div className="border-b border-stone-800 overflow-x-auto shrink-0 select-none">
        <div className="flex space-x-1 whitespace-nowrap">
          {[
            { id: 'planning', label: '1. Planejamento (Resources)', icon: <Briefcase className="w-3.5 h-3.5" /> },
            { id: 'quotations', label: '2. Comparativo de Cotações', icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'budget', label: `3. Orçamento (${activeScenario.toUpperCase()})`, icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'cashflow', label: '4. Fluxo de Caixa / Ledger', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
            { id: 'contingency', label: '5. Reserva de Contingência', icon: <Percent className="w-3.5 h-3.5" /> },
            { id: 'reconciliation', label: `6. Conciliação Bancária (${unreconciledItems.length})`, icon: <CheckCircle className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as SubTab);
              }}
              className={`px-4 py-3 border-b-2 font-mono text-[11px] font-bold tracking-tight transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'border-[#DC2626] text-[#DC2626] bg-stone-900/45'
                  : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-900/20'
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
              <div className="bg-stone-900 p-5 rounded-lg border border-stone-850">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1 px-1.5 rounded bg-stone-800 text-stone-300 text-[10px] font-mono font-bold">ADD</span>
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider">Novo Recurso Recomendado</h3>
                </div>

                <form onSubmit={handleAddResource} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">RECURSO / MATERIAL *</label>
                    <input 
                      type="text"
                      required
                      placeholder="ex. Bobina de Ignição MSD Blaster"
                      value={resForm.name}
                      onChange={e => setResForm({...resForm, name: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">QUANTIDADE *</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        value={resForm.quantity}
                        onChange={e => setResForm({...resForm, quantity: Number(e.target.value)})}
                        className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">DATA ADQUISIÇÃO</label>
                      <input 
                        type="date"
                        required
                        value={resForm.idealDate}
                        onChange={e => setResForm({...resForm, idealDate: e.target.value})}
                        className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">MEMBRO RESPONSÁVEL</label>
                    <select
                      value={resForm.owner}
                      onChange={e => setResForm({...resForm, owner: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
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
                      <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">ORIGEM DA VERBA</label>
                      <select
                        value={resForm.origin}
                        onChange={e => setResForm({...resForm, origin: e.target.value as any})}
                        className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                      >
                        <option value="sponsorship">Patrocínio Direto</option>
                        <option value="institutional">Verba Univ.</option>
                        <option value="own_resources">Recurso Próprio</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">CATEGORIA EAP</label>
                      <select
                        value={resForm.category}
                        onChange={e => setResForm({...resForm, category: e.target.value})}
                        className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
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
              <div className="lg:col-span-2 bg-stone-900 border border-stone-850 p-5 rounded-lg">
                <div className="flex justify-between items-center mb-4 select-none">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-white tracking-wider">Talonário de Recursos Planejados</h3>
                    <p className="text-[10px] text-stone-500 font-mono">Totalizadores vinculados ao cronograma de hardware</p>
                  </div>
                  <span className="text-[10px] bg-stone-950 border border-stone-800 text-stone-400 px-3 py-1 font-mono rounded">
                    {resources.length} Itens Mapeados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-stone-950 text-stone-500 font-mono text-[10px] uppercase font-bold border-b border-stone-800">
                        <th className="p-3">Recurso</th>
                        <th className="p-3 text-center">Qtde</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Data Ideal</th>
                        <th className="p-3">Dono</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 bg-stone-950/20">
                      {resources.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-stone-500 italic">Nenhum recurso incluído no plano físico.</td>
                        </tr>
                      ) : (
                        resources.map(res => {
                          const quoteCount = quotations.filter(q => q.resourceId === res.id).length;
                          const hasWinner = quotations.some(q => q.resourceId === res.id && q.isSelected);
                          
                          return (
                            <tr key={res.id} className="hover:bg-stone-900/40 transition">
                              <td className="p-3">
                                <div>
                                  <p className="font-bold text-stone-100">{res.name}</p>
                                  <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
                                    {translateOrigin(res.origin)}
                                  </p>
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-stone-300">{res.quantity}</td>
                              <td className="p-3">
                                <span className="bg-stone-800 border border-stone-750 px-2 py-0.5 rounded text-[10px] text-stone-400 font-mono">
                                  {res.category}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-stone-400 text-stone-450">{res.idealDate.split('-').reverse().join('/')}</td>
                              <td className="p-3 font-medium text-stone-300">{res.owner}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedQuoteResource(res.id);
                                    setActiveSubTab('quotations');
                                  }}
                                  className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 ml-auto cursor-pointer transition ${
                                    hasWinner
                                      ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900'
                                      : 'bg-[#DC2626] hover:bg-[#DC2626]/85 text-white'
                                  }`}
                                >
                                  <span>Gerar cotações</span>
                                  <span className="bg-stone-950/50 rounded-full px-1 py-0.1 select-none font-sans font-bold text-[9px] text-white">
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

                <div className="bg-stone-950 border border-stone-850 p-4 rounded mt-4 flex items-start gap-2.5 text-[11px] text-stone-400 leading-relaxed">
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
            <div className="bg-stone-900 border border-stone-850 p-5 rounded-lg select-none">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-450 block mb-3">
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
                          ? 'bg-stone-850 border-[#DC2626] text-white' 
                          : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs truncate max-w-[220px]">{res.name}</p>
                        <p className="text-[9px] font-mono mt-1 text-stone-500">
                          {res.quantity} {res.quantity === 1 ? 'unidade' : 'unidades'} • {res.category}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-stone-900 w-full text-[9px] font-mono">
                        <span>Cotações: {quotations.filter(q => q.resourceId === res.id).length}</span>
                        {hasWinner ? (
                          <span className="text-emerald-500 font-bold">✓ Vencedora</span>
                        ) : (
                          <span className="text-amber-500 font-bold">⚡ Padrão</span>
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
                    <div className="lg:col-span-4 bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-stone-850">
                          <ShoppingBag className="w-4.5 h-4.5 text-[#DC2626]" />
                          <h3 className="text-xs font-bold uppercase text-white tracking-wider">Inserir Proposta Fornecedor</h3>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-relaxed mb-4">
                          Insira valores e especificações para: <strong className="text-stone-200">{activeRes?.name}</strong>
                        </p>

                        <form onSubmit={handleAddQuotation} className="space-y-4">
                          <div>
                            <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">NOME FORNECEDOR *</label>
                            <input 
                              type="text"
                              required
                              placeholder="ex. Metalúrgica Tubos SRM"
                              value={quoteForm.supplier}
                              onChange={e => setQuoteForm({...quoteForm, supplier: e.target.value})}
                              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#DC2626]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">PREÇO UNITÁRIO (R$) *</label>
                              <input 
                                type="number"
                                min="0.1"
                                step="any"
                                required
                                value={quoteForm.unitPrice}
                                onChange={e => setQuoteForm({...quoteForm, unitPrice: Number(e.target.value)})}
                                className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">PRAZO DO FRETE (DIAS) *</label>
                              <input 
                                type="number"
                                min="1"
                                required
                                value={quoteForm.deliveryDays}
                                onChange={e => setQuoteForm({...quoteForm, deliveryDays: Number(e.target.value)})}
                                className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold font-bold">ACOMPANHAMENTOS DE QUALIDADE / NOTAS</label>
                            <textarea 
                              placeholder="Fretagem, ISO 9001, tolerâncias de solda..."
                              rows={3}
                              value={quoteForm.qualityRemarks}
                              onChange={e => setQuoteForm({...quoteForm, qualityRemarks: e.target.value})}
                              className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-[#DC2626] hover:bg-[#DC2626]/85 text-white text-xs font-mono font-bold py-2.5 px-4 rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            + Confirmar Cotação
                          </button>
                        </form>
                      </div>

                      <div className="bg-stone-950 p-3 border border-stone-850 rounded mt-5 text-[10px] text-stone-500 leading-relaxed font-mono">
                        ⚠️ Ao selecionar uma proposta como vencecedora, os preços unitários nos desdobramentos de contabilidade e no plano de ação física do chassi serão automaticamente atualizados.
                      </div>
                    </div>

                    {/* SIDE BY SIDE COMPARATIVE CARDS (N comparative columns side-by-side) */}
                    <div className="lg:col-span-8 bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-5 pb-2 border-b border-stone-850">
                          <div>
                            <h3 className="text-xs font-bold uppercase text-white tracking-wider">Comparativo de Propostas Comerciais</h3>
                            <p className="text-[10px] text-stone-400 mt-0.5">Visão multifator de cotações para: <span className="text-red-500 font-bold">{activeRes?.name}</span></p>
                          </div>
                          <span className="text-[10px] font-mono bg-stone-950 text-[#DC2626] border border-stone-800 px-3 py-1 rounded">
                            {matchingQuotes.length} Cadastradas
                          </span>
                        </div>

                        {matchingQuotes.length === 0 ? (
                          <div className="text-center py-16 border border-dashed border-stone-800 rounded flex flex-col items-center justify-center space-y-3">
                            <AlertTriangle className="w-8 h-8 text-stone-600" />
                            <p className="text-xs text-stone-400 italic">Nenhuma cotação de fornecedor para este material ainda.</p>
                            <p className="text-[10px] text-stone-500">Utilize o formulário lateral para preencher a primeira proposta.</p>
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
                                      ? 'bg-stone-950 border-[#DC2626] shadow-lg shadow-[#DC2626]/5'
                                      : 'bg-stone-950/45 border-stone-850 hover:border-stone-700'
                                  }`}
                                >
                                  {quote.isSelected && (
                                    <div className="absolute top-2 right-2 bg-emerald-555/10 border border-emerald-500/35 text-emerald-400 text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                      Vencedora ★
                                    </div>
                                  )}

                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-[10px] font-mono text-stone-500 uppercase font-bold tracking-tight">FORNECEDOR</p>
                                      <h4 className="text-xs font-bold text-stone-100 mt-0.5 leading-snug">{quote.supplier}</h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 bg-stone-900/60 p-2 rounded">
                                      <div>
                                        <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">PREÇO UNIT.</p>
                                        <p className="text-xs font-mono font-bold text-stone-200 mt-0.5">
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
                                      <p className="text-xs font-medium text-stone-300 mt-0.5">{quote.deliveryDays} dias úteis</p>
                                    </div>

                                    <div>
                                      <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">GARANTIA E OBSERVAÇÕES</p>
                                      <p className="text-[10px] text-stone-400 mt-1 italic leading-relaxed bg-stone-900 border border-stone-850 p-2 rounded max-h-[80px] overflow-y-auto">
                                        "{quote.qualityRemarks}"
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-5 pt-3 border-t border-stone-850/80">
                                    {quote.isSelected ? (
                                      <div className="w-full text-center bg-stone-900/60 text-emerald-450 border border-emerald-900/40 text-[10px] font-mono font-bold py-1.5 rounded flex items-center justify-center gap-1">
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
                        <div className="bg-[#DC2626]/10 border border-[#DC2626]/40 p-4 rounded mt-6 flex justify-between items-center select-none">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-white font-mono uppercase tracking-tight">Etapa Concluída: Cotação Selecionada! 🚀</p>
                            <p className="text-[10px] text-stone-400">Pronto para criar uma linha orçamentária sugerindo automaticamente este valor vencedor.</p>
                          </div>
                          <button
                            onClick={() => {
                              // Automatically auto-fill or suggest creating on the next tab
                              setActiveSubTab('budget');
                            }}
                            className="bg-[#DC2626] hover:bg-[#DC2626]/85 text-white font-mono text-[9px] font-bold py-1.5 px-3 rounded flex items-center gap-1 transition cursor-pointer"
                          >
                            Avançar para Previsão <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })()
            ) : (
              <div className="text-center py-10 bg-stone-900 rounded border border-stone-850 text-stone-500">
                Selecione ou adicione um material acima para ver seu comparativo.
              </div>
            )}

          </div>
        )}

        {/* TAB 3: ORÇAMENTO (BUDGETED COST) */}
        {activeSubTab === 'budget' && (
          <div className="space-y-6">
            
            {/* Scenario toggle explanatory banner */}
            <div className="bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#DC2626]" />
                  Simulador Ativo de Margens de Hardware
                </h3>
                <p className="text-xs text-stone-400">
                  Tabela EAP consolidada. Escolha o cenário financeiro para ajustar os custos calculados em toda a cadeia de prototipagem.
                </p>
              </div>

              {/* Toggle controls resembling the UI requested */}
              <div className="bg-stone-950 p-1.5 border border-stone-800 rounded flex items-center font-mono text-xs">
                <span className="text-[9px] font-bold text-stone-500 px-3 uppercase text-stone-450">CENÁRIO:</span>
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
                            : `text-stone-400 ${scenario.color}`
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
              <div className="lg:col-span-4 bg-stone-900 border border-stone-850 p-5 rounded-lg">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-850 select-none">
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider">Nova Linha de Custo Orçada</h3>
                  <span className="text-[9px] font-mono bg-stone-950 text-stone-500 px-2 py-0.5 rounded">EAP PLAN</span>
                </div>

                {/* Suggested from winner quotes trigger */}
                {suggestedWinnerQuotes.length > 0 && (
                  <div className="mb-4 bg-stone-950 border border-stone-850 p-3 rounded text-xs">
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
                            className="w-full text-left bg-stone-900 hover:bg-stone-850 border border-stone-850 p-2 rounded text-[10px] text-stone-300 transition cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-bold truncate max-w-[150px]">{item.resource.name}</span>
                            <span className="text-emerald-500 font-bold font-mono">
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
                    <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">DESIGNAÇÃO ORÇAMENTÁRIA *</label>
                    <input 
                      type="text"
                      required
                      placeholder="ex. Adesão de filamentos PETG de alto impacto"
                      value={budgetForm.name}
                      onChange={e => setBudgetForm({...budgetForm, name: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">CATEGORIA EAP *</label>
                    <select
                      value={budgetForm.category}
                      onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none"
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
                      <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">QUANTIDADE *</label>
                      <input 
                        type="number"
                        min="1"
                        required
                        value={budgetForm.quantity}
                        onChange={e => setBudgetForm({...budgetForm, quantity: Number(e.target.value)})}
                        className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">VALOR UNITÁRIO REALISTA (R$) *</label>
                      <input 
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={budgetForm.unitValue}
                        onChange={e => setBudgetForm({...budgetForm, unitValue: Number(e.target.value)})}
                        className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white font-bold focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>
                  </div>

                  <div className="bg-stone-950 p-3 border border-stone-850 rounded text-center">
                    <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">VALOR TOTAL ESTIMADO (SEM AJUSTE)</p>
                    <p className="text-md font-mono font-bold text-white mt-1">
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
              <div className="lg:col-span-8 bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 select-none">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-white tracking-wider">Planilha Analítica por Categorias</h3>
                      <p className="text-[10px] text-stone-500 mt-1 leading-snug">Visualizando multiplicador de cenário: <span className="text-[#DC2626] font-bold font-mono">{(scenarioMultiplier * 100)}%</span></p>
                    </div>
                    
                    <div className="text-right bg-stone-950 border border-stone-800 px-3 py-1.5 rounded text-xs select-none">
                      <span className="text-[9px] font-mono text-stone-450 block uppercase font-bold">Custo Total Consolidado</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {renderedBudgetLines.reduce((acc, line) => acc + line.totalCost, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-stone-950 text-stone-500 font-mono text-[10px] uppercase font-bold border-b border-b-stone-800">
                          <th className="p-3">Gasto Planejado (Designação)</th>
                          <th className="p-3">Categoria</th>
                          <th className="p-3 text-center">Qtde</th>
                          <th className="p-3 text-right">Unitário Base</th>
                          <th className="p-3 text-right text-[#DC2626]">Unitário Cenário</th>
                          <th className="p-3 text-right font-bold text-white">Custo Total</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-850 bg-stone-950/20">
                        {renderedBudgetLines.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-stone-500 italic">Nenhum custo orçado no protótipo.</td>
                          </tr>
                        ) : (
                          renderedBudgetLines.map(line => (
                            <tr key={line.id} className="hover:bg-stone-900/40 transition">
                              <td className="p-3">
                                <div>
                                  <p className="font-bold text-stone-200">{line.name}</p>
                                  <p className="text-[9px] text-[#DC2626] hover:underline cursor-pointer flex items-center gap-1 mt-0.5 select-none" onClick={() => autoLogExpense(line)}>
                                    ⚡ Lançar despesa correspondente em Caixa
                                  </p>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="bg-stone-800 border border-stone-750 px-2 py-0.5 rounded text-[9px] text-stone-400 font-mono">
                                  {line.category}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-stone-300">{line.quantity}</td>
                              <td className="p-3 text-right font-mono text-stone-400">
                                {line.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="p-3 text-right font-mono text-stone-300 font-bold bg-[#DC2626]/5 text-[#DC2626] border-x border-[#DC2626]/10">
                                {line.calculatedUnitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-white bg-stone-950/30">
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

                <div className="bg-stone-950/80 p-3 border border-stone-850 rounded text-[11px] text-stone-500 text-stone-400 leading-relaxed font-sans mt-5">
                  💡 <strong>Impacto integrado:</strong> As linhas planejadas servem como o baseline orçamentário. Quando você clica em "Lançar despesa", o sistema facilita as entradas de caixa, comparando orçado x realizado instantaneamente.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: CASH FLOW LEDGER & GRAPH */}
        {activeSubTab === 'cashflow' && (
          permissions?.isSponsor ? (
            <div className="bg-stone-900 border border-stone-850 rounded p-12 text-center flex flex-col items-center justify-center space-y-4 font-mono">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 animate-pulse">
                ⚠️
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Acesso Restrito: Nível Sponsor</h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                Sponsors possuem nível de acesso restrito ao resumo financeiro macro e planejamento orçamentário. O fluxo de caixa detalhado por lançamento individual é confidencial nesta área do bólido.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
            
            {/* Ledger highlights indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="cashflow-totals-grid">
              
              <div className="mach-card bg-stone-900 border border-stone-855 py-4 flex flex-col justify-between">
                <div className="flex justify-between items-start text-xs text-stone-400 font-medium font-mono">
                  <span>FUNDAÇÃO / SALDO INICIAL</span>
                  <Sliders className="w-4 h-4 text-stone-500" />
                </div>
                <div className="mt-3">
                  <input 
                    type="number"
                    value={initialBalance}
                    onChange={e => setInitialBalance(Number(e.target.value))}
                    className="bg-stone-950 border border-stone-800 text-base font-mono font-bold text-stone-100 max-w-[150px] p-1 rounded focus:outline-none"
                    placeholder="Saldo inicial"
                  />
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">Editável para calibração</p>
                </div>
              </div>

              <div className="mach-card bg-stone-900 border border-stone-855 py-4 flex flex-col justify-between">
                <div className="flex justify-between items-start text-xs text-stone-400 font-medium font-mono">
                  <span>CAPTAÇÕES (RECEITAS)</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="mt-3">
                  <p className="text-lg font-mono font-extrabold text-emerald-450">
                    {globalSummaryTotals.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">Parcerias e cotas institucionais</p>
                </div>
              </div>

              <div className="mach-card bg-stone-900 border border-stone-855 py-4 flex flex-col justify-between">
                <div className="flex justify-between items-start text-xs text-stone-400 font-medium font-mono">
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

              <div className={`mach-card bg-stone-900 py-4 flex flex-col justify-between border-l-2 ${globalSummaryTotals.finalBalance >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                <div className="flex justify-between items-start text-xs text-stone-400 font-medium font-mono">
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
            <div className="bg-stone-900 border border-stone-850 p-5 rounded-lg">
              <div className="flex justify-between items-center mb-4 select-none pb-2 border-b border-stone-850">
                <div>
                  <h3 className="text-xs font-bold uppercase text-stone-200 tracking-wider">
                    Análise Mensal de Receita vs Despesa (Formula SAE Plan)
                  </h3>
                  <p className="text-[10px] text-stone-500 font-sans mt-0.5">Distribuição do livro-caixa sobre a Linha do Tempo de engenharia</p>
                </div>
                <span className="text-[9px] font-mono bg-stone-950 text-indigo-400 border border-stone-800 px-2 py-0.5 rounded">
                  Recharts Render Engine
                </span>
              </div>

              <div className="w-full h-64 font-mono select-none" id="finance-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="monthName" stroke="#737373" fontSize={11} />
                    <YAxis stroke="#737373" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#fff', fontSize: '11px' }}
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
              <div className="lg:col-span-4 bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-stone-850 select-none">
                    <span className="w-2 h-2 rounded-full bg-red-650" />
                    <h3 className="text-xs font-bold uppercase text-white tracking-widest">Lançar Movimentação</h3>
                  </div>

                  <form onSubmit={handleAddCashFlowEntry} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">DESIGNAÇÃO DO PAGAMENTO *</label>
                      <input 
                        type="text"
                        required
                        placeholder="ex. Pagamento parcial alumínio carenagem"
                        value={cashFlowForm.description}
                        onChange={e => setCashFlowForm({...cashFlowForm, description: e.target.value})}
                        className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">TIPO *</label>
                        <select
                          value={cashFlowForm.type}
                          onChange={e => setCashFlowForm({...cashFlowForm, type: e.target.value as any})}
                          className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                        >
                          <option value="expense">Despesa (Saída)</option>
                          <option value="revenue">Receita (Entrada)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">CATEGORIA</label>
                        <select
                          value={cashFlowForm.category}
                          onChange={e => setCashFlowForm({...cashFlowForm, category: e.target.value})}
                          className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none"
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
                        <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold font-bold">MONTANTE (R$) *</label>
                        <input 
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          value={cashFlowForm.amount}
                          onChange={e => setCashFlowForm({...cashFlowForm, amount: Number(e.target.value)})}
                          className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-stone-400 block mb-1 font-bold">DATA DO FLUXO *</label>
                        <input 
                          type="date"
                          required
                          value={cashFlowForm.date}
                          onChange={e => setCashFlowForm({...cashFlowForm, date: e.target.value})}
                          className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    {cashFlowForm.type === 'expense' && (
                      <div className="p-2.5 bg-stone-950 border border-stone-850 rounded flex items-center gap-2 select-none">
                        <input 
                          type="checkbox"
                          id="contingencyPay"
                          checked={cashFlowForm.isContingencyFunded}
                          onChange={e => setCashFlowForm({...cashFlowForm, isContingencyFunded: e.target.checked})}
                          className="w-4 h-4 rounded text-[#DC2626] border-stone-800 focus:ring-[#DC2626]"
                        />
                        <label htmlFor="contingencyPay" className="text-[10px] text-stone-400 font-mono cursor-pointer">
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

                <div className="bg-[#DC2626]/10 p-3 rounded border border-[#DC2626]/30 text-[10px] text-stone-400 font-sans leading-relaxed mt-4">
                  <strong>Reconciliação Automática:</strong> Novos lançamentos entram com estado "Pendente". Utilize a aba "Conciliação Bancária" para validar os extratos quinzenais.
                </div>
              </div>

              {/* Ledger Operational Table with filters */}
              <div className="lg:col-span-8 bg-stone-900 border border-stone-850 p-5 rounded-lg">
                
                {/* Tables filters bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 select-none pb-2 border-b border-stone-850">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-white tracking-widest">Extrato Geral / Ledger de Operações</h3>
                    <p className="text-[10px] text-stone-500 font-mono">Modulagem e controle de fluxo real para o M1-2026</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs select-none">
                    
                    {/* Month Filter */}
                    <div className="flex items-center bg-stone-950 px-2 py-1 rounded border border-stone-800 text-[10px] font-mono">
                      <Filter className="w-3.5 h-3.5 text-stone-500 mr-1.5" />
                      <span className="text-stone-450 uppercase font-bold mr-1">Mês:</span>
                      <select
                        value={cfMonthFilter}
                        onChange={e => setCfMonthFilter(e.target.value)}
                        className="bg-transparent border-none text-white focus:outline-none"
                      >
                        <option value="todos">Todos</option>
                        {uniqueMonths.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center bg-stone-950 px-2 py-1 rounded border border-stone-800 text-[10px] font-mono">
                      <span className="text-stone-450 uppercase font-bold mr-1">Cat:</span>
                      <select
                        value={cfCategoryFilter}
                        onChange={e => setCfCategoryFilter(e.target.value)}
                        className="bg-transparent border-none text-white focus:outline-none"
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
                      <tr className="bg-stone-950 text-stone-500 font-mono text-[9px] uppercase font-bold border-b border-stone-850">
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição lançamento</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3 text-center">Tipo</th>
                        <th className="p-3 text-right">Montante (BRL)</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 bg-stone-950/20">
                      {filteredCashFlow.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-stone-500 italic">Nenhuma movimentação para os filtros ativos.</td>
                        </tr>
                      ) : (
                        filteredCashFlow.map(cf => (
                          <tr key={cf.id} className="hover:bg-stone-900/40 transition">
                            <td className="p-3 font-mono text-stone-500 text-[11px]">{cf.date.split('-').reverse().join('/')}</td>
                            <td className="p-3">
                              <div>
                                <p className="font-bold text-stone-200">{cf.description}</p>
                                {cf.isContingencyFunded && (
                                  <span className="inline-flex items-center gap-1 text-[8px] bg-red-950/30 text-amber-400 border border-red-900/40 px-1 py-0.1 font-mono rounded font-bold uppercase mt-1">
                                    🛡️ Fundo Contingência
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="bg-stone-850 border border-stone-800 text-[10px] text-stone-400 px-1.5 py-0.5 rounded font-mono">
                                {cf.category}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {cf.type === 'revenue' ? (
                                <span className="bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">Entrada</span>
                              ) : (
                                <span className="bg-red-950/40 border border-red-900/40 text-[#DC2626] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase font-bold">Saída</span>
                              )}
                            </td>
                            <td className={`p-3 text-right font-mono font-bold ${cf.type === 'revenue' ? 'text-emerald-500' : 'text-stone-300'}`}>
                              {cf.type === 'revenue' ? '+' : '-'}{cf.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-3 text-center select-none">
                              <button
                                onClick={() => toggleReconciliation(cf.id)}
                                className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded border transition-all cursor-pointer ${
                                  cf.isReconciled
                                    ? 'bg-emerald-950/20 text-emerald-450 border-emerald-900/40'
                                    : 'bg-amber-950/20 text-amber-450 border-amber-900/40'
                                }`}
                              >
                                {cf.isReconciled ? 'Reconciliado' : 'Pendente'}
                              </button>
                            </td>
                            <td className="p-3 text-center select-none">
                              <button
                                onClick={() => deleteCashFlowEntry(cf.id)}
                                className="text-stone-600 hover:text-red-500 p-1 cursor-pointer"
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
              <div className="bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-stone-850 select-none">
                    <Percent className="w-4.5 h-4.5 text-[#DC2626]" />
                    <h3 className="text-xs font-bold uppercase text-white tracking-widest">Alíquota de Proteção</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-mono text-stone-400 block mb-1.5 font-bold uppercase">PERCENTUAL DA RESERVA (%)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min="5"
                          max="30"
                          step="1"
                          value={contingencyPercentage}
                          onChange={e => saveContingencyPercent(Number(e.target.value))}
                          className="w-full accent-[#DC2626] bg-stone-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-mono text-lg font-bold text-white shrink-0 bg-stone-950 border border-stone-800 px-2 py-0.5 rounded">
                          {contingencyPercentage}%
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-sans leading-relaxed mt-2.5">
                        Margem preventiva para imprevistos do protótipo mecânico exigida pelo regulamento de conformidade.
                      </p>
                    </div>

                    <div className="bg-stone-950 p-3.5 border border-stone-850 rounded text-xs space-y-2 select-text">
                      <p className="text-[9px] font-mono text-stone-500 font-bold uppercase">Premissas de Cálculo</p>
                      <p className="text-stone-300 leading-relaxed font-sans text-[11px]">
                        O montante preventivo é calculado aplicando a alíquota de <strong className="text-[#DC2626]">{contingencyPercentage}%</strong> sobre o <strong>Valor Total de Patrocínios Capatados</strong> da equipe.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-950 text-stone-500 border border-stone-850 p-2.5 rounded text-[9px] font-mono leading-relaxed mt-5">
                  🛡️ Recomenda-se estipular entre 10% e 15% para suportar correções de usinagem e re-cortes em aços especiais.
                </div>
              </div>

              {/* Quantitative balance sheet card */}
              <div className="md:col-span-2 bg-stone-900 border border-stone-850 p-6 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-stone-850 select-none">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-white tracking-widest">Resumo de Contingência & Disponibilidade</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Visão do Fundo de Segurança para Imprevistos Mecânicos</p>
                    </div>
                    <span className="text-[9px] font-mono bg-stone-950 border border-stone-800 text-stone-400 px-3 py-1 rounded">
                      REGULAMENTO FSAE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="contingency-summary-blocks">
                    
                    <div className="bg-stone-950 p-4 border border-stone-850 rounded">
                      <span className="text-[9px] font-mono text-stone-505 block font-bold uppercase">PATROCÍNIOS RECEBIDOS</span>
                      <span className="font-mono font-extrabold text-[#DC2626] text-md mt-1 block">
                        {totalSponsoredAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[9px] text-stone-600 font-sans block mt-1">Soma de receitas marcadas Patrocínio</span>
                    </div>

                    <div className="bg-stone-950 p-4 border border-stone-840 rounded border-l-2 border-l-[#DC2626]">
                      <span className="text-[9px] font-mono text-stone-505 block font-bold uppercase">VALOR RESERVA CALCULADO</span>
                      <span className="font-mono font-extrabold text-white text-md mt-1 block">
                        {calculatedReserveAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[9px] text-stone-500 font-sans block mt-1">{contingencyPercentage}% do montante captado</span>
                    </div>

                    <div className="bg-stone-950 p-4 border border-stone-850 rounded">
                      <span className="text-[9px] font-mono text-stone-505 block font-bold uppercase">MONTANTE JÁ UTILIZADO</span>
                      <span className="font-mono font-extrabold text-amber-500 text-md mt-1 block">
                        {contingencyAmountUsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[9px] text-stone-600 font-sans block mt-1">Débitos usando fundo de reserva</span>
                    </div>

                  </div>

                  {/* Available final balance card */}
                  <div className="mt-6 bg-stone-950 p-5 border border-stone-850 rounded flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider font-mono text-stone-405">Saldo de Fundo Disponível para Estornos</p>
                      <p className="text-[11px] text-stone-500">Saldo residual que pode ser canalizado sob validação do docente orientador.</p>
                    </div>

                    <div className="text-right">
                      <p className={`text-xl font-mono font-black ${contingencyBalanceAvailable >= 0 ? 'text-emerald-500 animate-pulse' : 'text-red-500'}`}>
                        {contingencyBalanceAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-[9px] font-mono text-stone-600 mt-1 uppercase font-bold text-stone-500">Restante Preventivo</p>
                    </div>
                  </div>

                </div>

                <div className="bg-stone-950/50 p-3 rounded text-[11px] text-stone-400 leading-relaxed font-sans mt-6 border border-stone-900">
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
              <div className="lg:col-span-4 bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-stone-850 select-none col-span-full">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase text-white tracking-widest">Resumo de Divergências</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Lançamentos que comprometem o livro físico porém ainda não possuem equivalência comprovada com o extrato bancário.
                    </p>

                    <div className="bg-stone-950 p-4 border border-stone-850 rounded space-y-3.5 text-xs">
                      <div>
                        <span className="text-[9px] font-mono text-stone-500 block uppercase font-bold">Lançamentos Pendentes</span>
                        <span className="text-lg font-mono font-bold text-amber-500 block mt-0.5">
                          {unreconciledItems.length} movimentos
                        </span>
                      </div>

                      <div className="border-t border-stone-900 pt-3">
                        <span className="text-[9px] font-mono text-amber-505 block uppercase font-bold text-amber-500">⚠️ Críticos (&gt; 14 dias em aberto)</span>
                        <span className="text-lg font-mono font-black text-red-500 block mt-0.5">
                          {overdueUnreconciledList.length} em atraso
                        </span>
                        <p className="text-[10px] text-stone-500 font-sans mt-1">Exigem justificativa urgente e envio de recibo.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded text-[10px] text-amber-400 leading-relaxed mt-5">
                  📌 <strong>Nota Auditoria:</strong> Itens com mais de 2 semanas sem conciliação causam desencontro no cálculo do EVM do cronograma. Resolva os comprovantes pendentes.
                </div>
              </div>

              {/* Pending checklist spreadsheet */}
              <div className="lg:col-span-8 bg-stone-900 border border-stone-850 p-5 rounded-lg">
                <div className="flex justify-between items-center mb-4 select-none">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-white tracking-wider">Checklist de Auditoria Quinzenal</h3>
                    <p className="text-[10px] text-stone-450 mt-0.5">Lista de lançamentos pendentes de validação contábil</p>
                  </div>
                  <span className="text-[10px] bg-stone-950 border border-stone-800 text-[#DC2626] px-3 py-1 font-mono rounded">
                    CONCILIAÇÃO DISCENTE
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                  {unreconciledItems.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-stone-800 rounded flex flex-col items-center justify-center space-y-3">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                      <p className="text-xs text-stone-400 italic">Espetacular! Tudo conciliado no caixa da equipe.</p>
                      <p className="text-[10px] text-stone-500">Nenhum lançamento pendente encontrado para reconciliar.</p>
                    </div>
                  ) : (
                    unreconciledItems.map(item => {
                      const isOverdue = checkIsOverdue(item.date);
                      
                      return (
                        <div 
                          key={item.id}
                          className={`p-3.5 rounded border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                            isOverdue
                              ? 'bg-red-950/10 border-red-900/60 shadow-md shadow-red-950/5'
                              : 'bg-stone-950 border-stone-850 hover:border-stone-800'
                          }`}
                        >
                          <div className="space-y-1.5 max-w-md">
                            <div className="flex flex-wrap items-center gap-2">
                              {isOverdue && (
                                <span className="text-[8px] bg-red-950/45 border border-red-900/70 text-red-500 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                                  ⚠️ Crítico &gt; 14 Dias
                                </span>
                              )}
                              <span className="text-[10px] bg-stone-900 border border-stone-800 text-stone-400 px-2 py-0.2 rounded font-mono">
                                {item.category}
                              </span>
                              <span className="text-stone-500 font-mono text-[10px]">
                                {item.date.split('-').reverse().join('/')}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-stone-150 leading-snug">{item.description}</p>
                            
                            <p className="text-[10px] text-stone-500 font-mono">
                              Valor: <span className="font-bold text-stone-300">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => toggleReconciliation(item.id)}
                            className="bg-emerald-950 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/60 px-3/5 py-1.5 rounded font-mono text-[10px] font-bold uppercase cursor-pointer transition shrink-0 inline-flex items-center gap-1.5 self-end sm:self-center"
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

      </div>

    </div>
  );
}
