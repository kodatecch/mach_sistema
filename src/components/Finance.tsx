import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  CheckCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { Transaction } from '../types';

interface FinanceProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export default function Finance({ transactions, setTransactions }: FinanceProps) {
  const [activeScenario, setActiveScenario] = useState<Transaction['scenario']>('realista');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // Form state
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState<Transaction['category']>('Materiais');
  const [amount, setAmount] = useState(1000);
  const [date, setDate] = useState('2026-06-17');
  const [status, setStatus] = useState<Transaction['status']>('Pendente');
  const [scenario, setScenario] = useState<Transaction['scenario']>('realista');

  // Filtered transactions by selected scenario
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      if (activeScenario === 'otimista') return true; 
      if (activeScenario === 'realista') return tr.scenario !== 'otimista'; 
      return tr.scenario === 'pessimista'; 
    });
  }, [transactions, activeScenario]);

  // Cash flow calculations
  const financials = useMemo(() => {
    const receitas = filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0);

    const despesas = filteredTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);

    const autoContingency = despesas * 0.1;
    const totalExpensesWithContingency = despesas + autoContingency;
    const netBalance = receitas - totalExpensesWithContingency;

    const reconciled = filteredTransactions
      .filter(t => t.status === 'Reconciliado')
      .reduce((sum, t) => sum + (t.type === 'receita' ? t.amount : -t.amount), 0);
    
    const pending = filteredTransactions
      .filter(t => t.status === 'Pendente')
      .reduce((sum, t) => sum + (t.type === 'receita' ? t.amount : -t.amount), 0);

    const categoriesDetails: { [key in Transaction['category']]?: number } = {};
    filteredTransactions
      .filter(t => t.type === 'despesa')
      .forEach(t => {
        categoriesDetails[t.category] = (categoriesDetails[t.category] || 0) + t.amount;
      });

    return {
      receitas,
      despesas,
      autoContingency,
      totalExpensesWithContingency,
      netBalance,
      reconciled,
      pending,
      categoriesDetails
    };
  }, [filteredTransactions]);

  // Handle transaction submission
  const handleAddTransactionMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || amount <= 0) return;

    const newTr: Transaction = {
      id: `tr_${Date.now()}`,
      description: desc.trim(),
      type,
      category,
      amount: Number(amount),
      date,
      status,
      scenario
    };
    setTransactions(prev => [newTr, ...prev]);
    setShowAddTransaction(false);
    
    // Reset
    setDesc('');
    setAmount(1000);
  };

  const toggleReconciliation = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'Reconciliado' ? 'Pendente' : 'Reconciliado'
        };
      }
      return t;
    }));
  };

  const handleRemove = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6" id="finance-module-container">
      {/* HEADER WITH SCENARIO PICKER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-850">
        <div>
          <h1 className="text-xl font-display font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <DollarSign className="w-5.5 h-5.5 text-[#DC2626]" />
            Planejamento Financeiro & Caixa
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Gestão do orçamento do protótipo FSAE, simulações de cenários econômicos e fundo de contingência compulsório
          </p>
        </div>
        
        {/* Scenario Controls */}
        <div className="bg-stone-50 dark:bg-stone-950 px-2 py-1 rounded border border-stone-200 dark:border-stone-800 flex items-center shrink-0 text-xs select-none">
          <span className="text-[10px] font-mono text-stone-450 px-2 font-bold uppercase">Cenário:</span>
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveScenario('otimista')}
              className={`px-2.5 py-1 rounded font-mono font-bold transition cursor-pointer text-[11px] ${activeScenario === 'otimista' ? 'bg-[#DC2626] text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-150'}`}
            >
              Otimista
            </button>
            <button 
              onClick={() => setActiveScenario('realista')}
              className={`px-2.5 py-1 rounded font-mono font-bold transition cursor-pointer text-[11px] ${activeScenario === 'realista' ? 'bg-[#DC2626] text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-150'}`}
            >
              Realista
            </button>
            <button 
              onClick={() => setActiveScenario('pessimista')}
              className={`px-2.5 py-1 rounded font-mono font-bold transition cursor-pointer text-[11px] ${activeScenario === 'pessimista' ? 'bg-[#DC2626] text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-150'}`}
            >
              Pessimista
            </button>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="finance-stats-panel">
        <div className="mach-card py-4 flex flex-col justify-between">
          <div className="flex justify-between items-start text-xs text-stone-500 font-medium">
            <span>Entradas (Patrocínios)</span>
            <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <p className="text-lg font-mono font-bold text-stone-900 dark:text-stone-100">
              {financials.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-[10px] text-emerald-600 font-mono mt-0.5">Disponível em conta</p>
          </div>
        </div>

        <div className="mach-card py-4 flex flex-col justify-between">
          <div className="flex justify-between items-start text-xs text-stone-500 font-medium">
            <span>Despesas (Materiais/Usinagem)</span>
            <ArrowDownCircle className="w-4 h-4 text-stone-500" />
          </div>
          <div className="mt-3">
            <p className="text-lg font-mono font-bold text-stone-900 dark:text-stone-100">
              {financials.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-[10px] text-stone-400 font-mono mt-0.5">Ações físicas do EAP</p>
          </div>
        </div>

        <div className="mach-card py-4 flex flex-col justify-between border-l-stone-400 dark:border-l-stone-700">
          <div className="flex justify-between items-start text-xs text-stone-500 font-medium">
            <span>Reserva de Contingência (10%)</span>
            <ShieldCheck className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="mt-3">
            <p className="text-lg font-mono font-bold text-[#DC2626]">
              {financials.autoContingency.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-[10px] text-stone-400 font-mono mt-0.5">Segurança para imprevistos</p>
          </div>
        </div>

        <div className={`mach-card py-4 flex flex-col justify-between border-l-2 ${financials.netBalance >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <div className="flex justify-between items-start text-xs text-stone-500 font-medium">
            <span>Saldo Líquido Previsto</span>
            <TrendingUp className="w-4 h-4 text-stone-500" />
          </div>
          <div className="mt-3">
            <p className={`text-lg font-mono font-bold ${financials.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {financials.netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-[10px] text-stone-400 font-mono mt-0.5">Deduções incidentes inclusas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="finance-grid-lower">
        {/* RECONCILIATION SIDE CARD */}
        <div className="lg:col-span-4 bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 p-5 rounded-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase text-stone-800 dark:text-stone-300">Conciliação de Tesouraria</h3>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                Acompanhe o extrato consolidado de caixa versus previsões pendentes de estornos ou pagamentos em aberto.
              </p>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 bg-white dark:bg-[#121212] border border-stone-150 dark:border-stone-850 rounded">
                <span className="text-stone-500">Conciliado (Realizado):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {financials.reconciled.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white dark:bg-[#121212] border border-stone-150 dark:border-stone-850 rounded">
                <span className="text-stone-500">Comprometido (Pendente):</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {financials.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 rounded mt-4 flex items-start gap-2 text-[10px] text-stone-500 leading-relaxed select-none">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <span>As despesas de materiais e consumíveis alimentam diretamente a modelagem EVM (Earned Value Management) no Dashboard do projeto.</span>
          </div>
        </div>

        {/* EXPENSES BAR CHRTS */}
        <div className="lg:col-span-8 mach-card p-5">
          <h3 className="text-xs font-bold uppercase text-stone-800 dark:text-stone-300 mb-4 pb-2 border-b border-stone-100 dark:border-stone-850">
            Distribuição de Custos por Categoria
          </h3>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {Object.keys(financials.categoriesDetails).length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">Nenhuma despesa registrada neste cenário.</p>
            ) : (
              Object.entries(financials.categoriesDetails).map(([cat, amt]) => {
                const val = Number(amt) || 0;
                const totalDespesas = financials.despesas || 1;
                const percentage = Math.round((val / totalDespesas) * 100);

                return (
                  <div key={cat} className="space-y-1 bg-stone-50 dark:bg-[#151515] p-3 rounded border border-stone-200 dark:border-stone-850">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-stone-700 dark:text-stone-300 font-bold">{cat}</span>
                      <span className="text-stone-500">
                        {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-[10px] font-bold text-[#DC2626]">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden select-none">
                      <div 
                        className="h-full bg-[#DC2626] rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="mach-card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 select-none pb-2 border-b border-stone-100 dark:border-stone-850">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-805 dark:text-stone-250">Livro de Caixa Operacional</h2>
            <p className="text-xs text-stone-500 mt-1">Cenário sob análise: <span className="text-[#DC2626] font-mono font-bold uppercase">{activeScenario}</span></p>
          </div>
          <button 
            onClick={() => setShowAddTransaction(true)}
            className="mach-button-primary text-xs font-bold"
          >
            + Registrar Lançamento
          </button>
        </div>

        <div className="overflow-x-auto select-text font-sans">
          <table className="w-full text-left border-collapse text-xs select-text">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-850 text-stone-500 font-mono text-[10px] uppercase font-bold">
                <th className="p-3">Data</th>
                <th className="p-3">Designação</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-center">Cenário</th>
                <th className="p-3 text-center">Reconciliação Extrato</th>
                <th className="p-3 text-right">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 dark:divide-stone-850 bg-white dark:bg-stone-950/40">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400 italic">Pesquisa vazia. Lançamentos podem ser criados inline.</td>
                </tr>
              ) : (
                filteredTransactions.map(tr => (
                  <tr key={tr.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/10">
                    <td className="p-3 font-mono text-stone-500">{tr.date.split('-').reverse().join('/')}</td>
                    <td className="p-3 font-bold text-stone-850 dark:text-stone-200">{tr.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-605">
                        {tr.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      {tr.type === 'receita' ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[9px] bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-950/40">Receita</span>
                      ) : (
                        <span className="text-[#DC2626] font-bold uppercase text-[9px] bg-red-50 dark:bg-red-950/10 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-950/40">Despesa</span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${tr.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-800 dark:text-stone-300'}`}>
                      {tr.type === 'receita' ? '+' : '-'}{tr.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-3 text-center uppercase font-mono text-[9px] text-stone-450">
                      {tr.scenario}
                    </td>
                    <td className="p-3 text-center select-none">
                      <button 
                        onClick={() => toggleReconciliation(tr.id)}
                        className={`px-2 py-1 rounded font-mono text-[9px] font-bold border transition-colors cursor-pointer ${
                          tr.status === 'Reconciliado' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-450' 
                            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-450'
                        }`}
                      >
                        {tr.status === 'Reconciliado' ? 'Reconciliado ✓' : 'Pendente ⚡'}
                      </button>
                    </td>
                    <td className="p-3 text-right select-none">
                      <button 
                        onClick={() => handleRemove(tr.id)}
                        className="text-stone-400 hover:text-[#DC2626] p-1 cursor-pointer"
                        title="Deletar Lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTION MODAL ADD */}
      {showAddTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-white dark:bg-[#121212] border border-stone-300 dark:border-stone-800 w-full max-w-md rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-stone-50 dark:bg-stone-900/60 p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-[#DC2626] uppercase font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#DC2626]" />
                Registrar Movimento Financeiro
              </h3>
              <button 
                onClick={() => setShowAddTransaction(false)}
                className="text-stone-400 hover:text-stone-800 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransactionMethod} className="p-4 space-y-4 text-xs font-sans">
              <div>
                <label className="mach-label">Descrição do Lançamento</label>
                <input 
                  type="text" 
                  value={desc} 
                  required
                  onChange={e => setDesc(e.target.value)}
                  placeholder="ex. Adesão de filamentos PETG de alta temperatura"
                  className="mach-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mach-label">Tipo de Lançamento</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="mach-input font-medium"
                  >
                    <option value="despesa">Despesa (Saída de Caixa)</option>
                    <option value="receita">Receita (Patrocínio / Entrada)</option>
                  </select>
                </div>

                <div>
                  <label className="mach-label">Categoria de Insumos</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value as any)}
                    className="mach-input font-medium"
                  >
                    <option value="Materiais">Materiais</option>
                    <option value="Usinagem">Usinagem</option>
                    <option value="Eletrônica">Eletrônica</option>
                    <option value="Logística">Logística</option>
                    <option value="Inscrição">FSAE Inscrição</option>
                    <option value="Patrocínio">Patrocínio</option>
                    <option value="Ferramental">Ferramental</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="mach-label">Valor Bruto do Movimento (R$)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    min="1"
                    required
                    onChange={e => setAmount(Number(e.target.value))}
                    className="mach-input font-bold font-mono text-right"
                  />
                </div>

                <div>
                  <label className="mach-label">Data de Lançamento</label>
                  <input 
                    type="date" 
                    value={date} 
                    required
                    onChange={e => setDate(e.target.value)}
                    className="mach-input font-mono"
                  />
                </div>

                <div>
                  <label className="mach-label">Cenário do Movimento</label>
                  <select 
                    value={scenario} 
                    onChange={e => setScenario(e.target.value as any)}
                    className="mach-input"
                  >
                    <option value="realista">Realista (Padrão)</option>
                    <option value="otimista">Otimista (Previsão)</option>
                    <option value="pessimista">Pessimista (Crítico)</option>
                  </select>
                </div>

                <div>
                  <label className="mach-label font-bold text-[#DC2626]">Status Conciliação</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as any)}
                    className="mach-input font-medium"
                  >
                    <option value="Pendente">Comprometido (Pendente)</option>
                    <option value="Reconciliado">Equiparado (Conciliado)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-150 dark:border-stone-850">
                <button 
                  type="button" 
                  onClick={() => setShowAddTransaction(false)}
                  className="mach-button-secondary text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="mach-button-primary text-xs font-bold"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
