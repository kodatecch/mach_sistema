/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: {
    [key: string]: number; // Skill values from 10 to 100
  };
}

export interface Task {
  id: string;
  name: string;
  wbsCode: string;
  progress: number; // 0 - 100
  status: 'Pendente' | 'Em execução' | 'Revisão' | 'Concluído';
  eisenhower: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // Q1: Urgent/Imp, Q2: Not Urgent/Imp, Q3: Urgent/Not Imp, Q4: Not Urgent/Not Imp
  pertOptimistic: number; // days
  pertLikely: number; // days
  pertPessimistic: number; // days
  duration: number; // (O + 4L + P) / 6
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dependency: string | null; // Task ID
  plannedCost: number; // Planned budget for this task
  assignedTo: string; // TeamMember ID
}

export interface Transaction {
  id: string;
  description: string;
  type: 'receita' | 'despesa';
  category: 'Materiais' | 'Usinagem' | 'Eletrônica' | 'Logística' | 'Inscrição' | 'Patrocínio' | 'Ferramental' | 'Outros';
  amount: number;
  date: string;
  status: 'Pendente' | 'Reconciliado';
  scenario: 'otimista' | 'realista' | 'pessimista';
}

export interface Risk {
  id: string;
  title: string;
  type: 'ameaça' | 'oportunidade';
  probability: number; // 1-5
  impact: number; // 1-5
  score: number; // prob * impact
  status: 'ativo' | 'mitigado' | 'ocorrido' | 'evitado';
  watchList: boolean;
  ownerName: string;
  mitigationPlan: string;
  contingencyPlan: string;
  actualResponse?: string;
  mitigationEfficacy?: 'Alta' | 'Média' | 'Baixa' | 'Não testada';
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  power: 'Alto' | 'Baixo';
  interest: 'Alto' | 'Baixo';
  profile: 'Sponsor' | 'Apoiador' | 'Neutro' | 'Resistente';
  email: string;
  channel: 'E-mail' | 'WhatsApp' | 'Reunião Presencial' | 'Apresentação';
  frequency: 'Mensal' | 'Quinzenal' | 'Semanal' | 'Ad-hoc';
}

export interface CommunicationLog {
  id: string;
  title: string;
  date: string;
  stakeholders: string[]; // Stakeholder names or IDs
  notes: string;
  summary: string;
}

export interface LessonLearned {
  id: string;
  topic: string;
  category: string;
  description: string;
  mitigationApplied: string;
  efficacy: 'Sucesso' | 'Parcial' | 'Falha';
  date: string;
}

export interface RACIRow {
  taskId: string;
  roles: {
    [memberId: string]: 'R' | 'A' | 'C' | 'I' | '';
  };
}

export interface PeerReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  date: string;
  technicalMetric: number; // 1-10
  commitmentMetric: number; // 1-10
  teamworkMetric: number; // 1-10
  comments: string;
}

// Initial robust seed data reflecting a Formula SAE team
export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'm1',
    name: 'João Silva',
    role: 'Capitão & Diretor de Suspensão',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    skills: { CAD: 90, FEA: 85, Usinagem: 70, Dinâmica: 95, Gestão: 85 }
  },
  {
    id: 'm2',
    name: 'Maria Santos',
    role: 'Sub-chefe de Aerodinâmica',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    skills: { CAD: 85, CFD: 95, Compósitos: 90, Solda: 30, Gestão: 80 }
  },
  {
    id: 'm3',
    name: 'Pedro Costa',
    role: 'Coordenador de Estrutura & Chassis',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    skills: { CAD: 95, FEA: 90, Usinagem: 80, Solda: 85, Gestão: 60 }
  },
  {
    id: 'm4',
    name: 'Ana Azevedo',
    role: 'Diretora Financeira & Marketing',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    skills: { CAD: 40, FEA: 20, Organização: 95, Marketing: 90, Gestão: 95 }
  },
  {
    id: 'm5',
    name: 'Lucas Pereira',
    role: 'Chefe de Eletrônica & Telemetria',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    skills: { Eletrônica: 95, Programação: 90, Telemetria: 95, CAD: 50, Gestão: 70 }
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    name: 'Estudo do regulamento FSAE & Metas do Projeto',
    wbsCode: '1.1',
    progress: 100,
    status: 'Concluído',
    eisenhower: 'Q1',
    pertOptimistic: 3,
    pertLikely: 5,
    pertPessimistic: 10,
    duration: 5.5,
    startDate: '2026-01-05',
    endDate: '2026-01-12',
    dependency: null,
    plannedCost: 1000,
    assignedTo: 'm1'
  },
  {
    id: 't2',
    name: 'Cálculo de pontos de fixação da suspensão kinematics',
    wbsCode: '2.1',
    progress: 90,
    status: 'Em execução',
    eisenhower: 'Q1',
    pertOptimistic: 7,
    pertLikely: 12,
    pertPessimistic: 20,
    duration: 12.5,
    startDate: '2026-01-15',
    endDate: '2026-01-30',
    dependency: 't1',
    plannedCost: 5000,
    assignedTo: 'm1'
  },
  {
    id: 't3',
    name: 'Modelagem 3D do monocoque em compósitos',
    wbsCode: '3.1',
    progress: 50,
    status: 'Em execução',
    eisenhower: 'Q2',
    pertOptimistic: 15,
    pertLikely: 25,
    pertPessimistic: 40,
    duration: 25.8,
    startDate: '2026-02-01',
    endDate: '2026-03-01',
    dependency: 't1',
    plannedCost: 8000,
    assignedTo: 'm3'
  },
  {
    id: 't4',
    name: 'Simulações CFD do pacote aerodinâmico',
    wbsCode: '4.1',
    progress: 75,
    status: 'Revisão',
    eisenhower: 'Q2',
    pertOptimistic: 10,
    pertLikely: 15,
    pertPessimistic: 30,
    duration: 16.6,
    startDate: '2026-02-05',
    endDate: '2026-02-25',
    dependency: 't1',
    plannedCost: 6000,
    assignedTo: 'm2'
  },
  {
    id: 't5',
    name: 'Placa de aquisição de dados e chicote elétrico',
    wbsCode: '5.1',
    progress: 20,
    status: 'Em execução',
    eisenhower: 'Q1',
    pertOptimistic: 5,
    pertLikely: 10,
    pertPessimistic: 15,
    duration: 10,
    startDate: '2026-03-01',
    endDate: '2026-03-15',
    dependency: 't1',
    plannedCost: 7500,
    assignedTo: 'm5'
  },
  {
    id: 't6',
    name: 'Pedido de patrocinadores e captação financeira',
    wbsCode: '6.1',
    progress: 100,
    status: 'Concluído',
    eisenhower: 'Q1',
    pertOptimistic: 10,
    pertLikely: 20,
    pertPessimistic: 35,
    duration: 20.8,
    startDate: '2026-01-10',
    endDate: '2026-02-10',
    dependency: null,
    plannedCost: 3000,
    assignedTo: 'm4'
  },
  {
    id: 't7',
    name: 'Manufatura das asas dianteira e traseira (carbono)',
    wbsCode: '4.2',
    progress: 0,
    status: 'Pendente',
    eisenhower: 'Q2',
    pertOptimistic: 8,
    pertLikely: 15,
    pertPessimistic: 25,
    duration: 15.5,
    startDate: '2026-03-20',
    endDate: '2026-04-10',
    dependency: 't4',
    plannedCost: 12000,
    assignedTo: 'm2'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tr1',
    description: 'Patrocínio Master Usinagem XYZ',
    type: 'receita',
    category: 'Patrocínio',
    amount: 25000,
    date: '2026-01-15',
    status: 'Reconciliado',
    scenario: 'realista'
  },
  {
    id: 'tr2',
    description: 'Aporte de Patrocinador Federal',
    type: 'receita',
    category: 'Patrocínio',
    amount: 15000,
    date: '2026-02-20',
    status: 'Reconciliado',
    scenario: 'realista'
  },
  {
    id: 'tr3',
    description: 'Resina Epóxi e Fibra de Carbono',
    type: 'despesa',
    category: 'Materiais',
    amount: 8500,
    date: '2026-02-10',
    status: 'Reconciliado',
    scenario: 'realista'
  },
  {
    id: 'tr4',
    description: 'Sensores de Suspensão Telemetria',
    type: 'despesa',
    category: 'Eletrônica',
    amount: 4200,
    date: '2026-02-25',
    status: 'Reconciliado',
    scenario: 'realista'
  },
  {
    id: 'tr5',
    description: 'Taxa de Inscrição Competição FSAE Brasil',
    type: 'despesa',
    category: 'Inscrição',
    amount: 3500,
    date: '2026-01-20',
    status: 'Reconciliado',
    scenario: 'realista'
  },
  {
    id: 'tr6',
    description: 'Usinagem de Cubos de Roda Especializada',
    type: 'despesa',
    category: 'Usinagem',
    amount: 5000,
    date: '2026-03-05',
    status: 'Pendente',
    scenario: 'realista'
  },
  {
    id: 'tr7',
    description: 'Suporte de Alumínio 7075 da Manga de Eixo',
    type: 'despesa',
    category: 'Ferramental',
    amount: 1800,
    date: '2026-03-12',
    status: 'Pendente',
    scenario: 'realista'
  }
];

export const INITIAL_RISKS: Risk[] = [
  {
    id: 'r1',
    title: 'Atraso na liberação da autoclave/laminação de asas',
    type: 'ameaça',
    probability: 4,
    impact: 5,
    score: 20,
    status: 'ativo',
    watchList: true,
    ownerName: 'Maria Santos',
    mitigationPlan: 'Agendar uso da autoclave com 6 semanas de antecedência; negociar com laboratório secundário.',
    contingencyPlan: 'Cura a vácuo em estufa simplificada de bancada (perda acústica e resistência de 15%).'
  },
  {
    id: 'r2',
    title: 'Estouro de custo em usinagem CNC de precisão',
    type: 'ameaça',
    probability: 3,
    impact: 4,
    score: 12,
    status: 'mitigado',
    watchList: false,
    ownerName: 'Pedro Costa',
    mitigationPlan: 'Otimizar projeto de cubos de roda para usinagem 3 eixos ao invés de 5 eixos.',
    contingencyPlan: 'Buscar copatrocínio de empresa local de moldes.',
    actualResponse: 'Desenhos técnicos simplificados reduzindo setup CNC por peça.',
    mitigationEfficacy: 'Alta'
  },
  {
    id: 'r3',
    title: 'Parcerias locais de patrocínio direto surpresa',
    type: 'oportunidade',
    probability: 5,
    impact: 4,
    score: 20,
    status: 'ocorrido',
    watchList: false,
    ownerName: 'Ana Azevedo',
    mitigationPlan: 'Criar material comercial focado na visibilidade da logo nas redes e vestuário da equipe.',
    contingencyPlan: 'Implementar pacote Mach VIP de patrocinadores extras.',
    actualResponse: 'Nacionalização de contatos garantiu a classificação surpresa para o campeonato Nacional!',
    mitigationEfficacy: 'Alta'
  },
  {
    id: 'r4',
    title: 'Quebra de sensores de telemetria em pista molhada',
    type: 'ameaça',
    probability: 3,
    impact: 3,
    score: 9,
    status: 'ativo',
    watchList: true,
    ownerName: 'Lucas Pereira',
    mitigationPlan: 'Projeto de cases de proteção impressos em 3D TPU resistente à água com vedação em silicone.',
    contingencyPlan: 'Telemetria passiva via cartão SD blindado e posterior análise de logs.'
  }
];

export const INITIAL_STAKEHOLDERS: Stakeholder[] = [
  {
    id: 's1',
    name: 'Prof. Dr. Roberto Ramos',
    role: 'Professor Orientador FSAE',
    power: 'Alto',
    interest: 'Alto',
    profile: 'Sponsor',
    email: 'roberto.ramos@universidade.edu',
    channel: 'Reunião Presencial',
    frequency: 'Quinzenal'
  },
  {
    id: 's2',
    name: 'Dr. Arthur Albuquerque',
    role: 'Pró-Reitor de Extensão',
    power: 'Alto',
    interest: 'Baixo',
    profile: 'Neutro',
    email: 'arthur.reitoria@universidade.edu',
    channel: 'Apresentação',
    frequency: 'Mensal'
  },
  {
    id: 's3',
    name: 'Eng. Ricardo Dias (Usinagem XYZ)',
    role: 'Patrocinador Master Tecnológico',
    power: 'Alto',
    interest: 'Alto',
    profile: 'Apoiador',
    email: 'ricardo.dias@usinagemxyz.com.br',
    channel: 'E-mail',
    frequency: 'Mensal'
  },
  {
    id: 's4',
    name: 'Comissão Técnica FSAE Brasil',
    role: 'Organização do Campeonato',
    power: 'Alto',
    interest: 'Baixo',
    profile: 'Neutro',
    email: 'contato@saebrasil.org',
    channel: 'E-mail',
    frequency: 'Ad-hoc'
  },
  {
    id: 's5',
    name: 'Familiares e Alumni (Pais / Ex-Membros)',
    role: 'Comunidade de Apoio',
    power: 'Baixo',
    interest: 'Alto',
    profile: 'Apoiador',
    email: 'alumni.mach@gmail.com',
    channel: 'WhatsApp',
    frequency: 'Semanal'
  }
];

export const INITIAL_COMMUNICATION_LOGS: CommunicationLog[] = [
  {
    id: 'c1',
    title: 'Reunião Geral Alinhamento Suspensão vs Chassis',
    date: '2026-06-10',
    stakeholders: ['João Silva', 'Pedro Costa', 'Prof. Dr. Roberto Ramos'],
    notes: 'Discutiu-se as folgas de montagem dos triângulos dianteiros na fixação do monocoque. O professor orientador instou a equipe a submeter o FEA de fadiga antes do início da soldagem das buchas.',
    summary: 'Aprovados os pontos cinemáticos da suspensão dianteira. Ficou acordado elaborar o relatório FEA de segurança de chassis e suspensão até o final da semana.'
  },
  {
    id: 'c2',
    title: 'Apresentação Comercial com Patrocinador Master',
    date: '2026-06-15',
    stakeholders: ['Ana Azevedo', 'Ricardo Dias (Usinagem XYZ)', 'João Silva'],
    notes: 'Reunião de apresentação do cronograma de fabricação. Discutimos a entrega dos tarugos de alumínio 7075-T6 e o tempo de máquina CNC disponível para fabricação das mangas de eixo e cubos.',
    summary: 'Patrocinador confirmou o fornecimento da matéria-prima e liberou 20 horas extras de usinagem CNC a partir do dia 25/06.'
  }
];

export const INITIAL_RACI: RACIRow[] = [
  {
    taskId: 't1',
    roles: { m1: 'A', m2: 'C', m3: 'R', m4: 'I', m5: 'I' }
  },
  {
    taskId: 't2',
    roles: { m1: 'R', m2: 'C', m3: 'C', m4: 'I', m5: 'I' }
  },
  {
    taskId: 't3',
    roles: { m1: 'A', m2: 'I', m3: 'R', m4: 'C', m5: 'C' }
  },
  {
    taskId: 't4',
    roles: { m1: 'C', m2: 'R', m3: 'I', m4: 'I', m5: 'A' }
  },
  {
    taskId: 't5',
    roles: { m1: 'C', m2: 'I', m3: 'I', m4: 'A', m5: 'R' }
  },
  {
    taskId: 't6',
    roles: { m1: 'A', m2: 'I', m3: 'I', m4: 'R', m5: 'I' }
  },
  {
    taskId: 't7',
    roles: { m1: 'A', m2: 'R', m3: 'R', m4: 'C', m5: 'I' }
  }
];

export const INITIAL_LESSONS_LEARNED: LessonLearned[] = [
  {
    id: 'l1',
    topic: 'Esfoliação e Bolhas na Cura Manual de Fibra',
    category: 'Aerodinâmica / Materiais',
    description: 'As asas do protótipo anterior apresentaram bolhas superficiais em virtude da distribuição de resina irregular e compactação ineficiente a vácuo.',
    mitigationApplied: 'Melhoria no protocolo de laminação com uso de respelador metálico e maior controle do tempo de vácuo mínimo (24 horas contínuas).',
    efficacy: 'Sucesso',
    date: '2025-11-20'
  },
  {
    id: 'l2',
    topic: 'Superaquecimento do ECU no cockpit',
    category: 'Eletrônica',
    description: 'Durante testes prolongados do protótipo Mach One, a central ECU desligava devido ao superaquecimento pelo fluxo de ar confinado atrás do radiador.',
    mitigationApplied: 'Reposicionamento e desenvolvimento de um duto de resfriamento próprio impresso em 3D PLA.',
    efficacy: 'Sucesso',
    date: '2025-12-15'
  },
  {
    id: 'l3',
    topic: 'Cálculo de Inércia Subestimado no FEA',
    category: 'Suspensão / Chassis',
    description: 'Rachadura nas soldas do triângulo inferior de suspensão devido à vibração não modelada em condições dinâmicas severas de pista.',
    mitigationApplied: 'Ajuste do fator de sobrecarga dinâmica para 3.5G nas simulações estruturais e adoção de junta reforçada de cromomolibdênio.',
    efficacy: 'Parcial',
    date: '2026-03-02'
  }
];
