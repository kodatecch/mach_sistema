/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  // In our model, "realista" shows realistic & pessimista; "otimista" shows all; "pessimista" excludes optimistic ones
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      if (activeScenario === 'otimista') return true; // Optimistic sees everything
      if (activeScenario === 'realista') return tr.scenario !== 'otimista'; // Realistic excludes optimistic guesses
      return tr.scenario === 'pessimista'; // Pessimistic only sees pessimistic scenarios
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

    // Automatic 10% contingency reserve
    const autoContingency = despesas * 0.1;
    const totalExpensesWithContingency = despesas + autoContingency;

    const netBalance = receitas - totalExpensesWithContingency;

    // Bank Reconciliation status
    const reconciled = filteredTransactions
      .filter(t => t.status === 'Reconciliado')
      .reduce((sum, t) => sum + (t.type === 'receita' ? t.amount : -t.amount), 0);
    
    const pending = filteredTransactions
      .filter(t => t.status === 'Pendente')
      .reduce((sum, t) => sum + (t.type === 'receita' ? t.amount : -t.amount), 0);

    // Categories expenses breakdown
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
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const newTr: Transaction = {
      id: `tr_${Date.now()}`,
      description: desc,
      type,
      category,
      amount: Number(amount),
      date,
      status,
      scenario
    };
    setTransactions(prev => [newTr, ...prev]);
    setShowAddTransaction(false);
    // Reset form
    setDesc('');
    setAmount(1000);
  };

  // Toggle transaction status (Bank reconciliation action)
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

  // Remove transaction
  const handleRemove = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH SCENARIO PICKER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
        <div>
          <h1 className="text-2xl font-bold font-sans text-white">Módulo 3 — Planejamento Financeiro & Fluxo de Caixa</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão do orçamento do protótipo FSAE, simulações de cenários econômicos, reconciliação em tempo real e reserva compulsória contra contingências de pista.
          </p>
        </div>
        
        {/* Scenario Controls */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shrink-0">
          <span className="text-[10px] font-mono text-slate-500 px-2 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-400" /> CENÁRIO:
          </span>
          <div className="flex gap-1 text-xs">
            <button 
              onClick={() => setActiveScenario('otimista')}
              className={`px-3 py-1.5 rounded-lg font-mono transition ${activeScenario === 'otimista' ? 'bg-indigo-600 font-extrabold text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              Otimista
            </button>
            <button 
              onClick={() => setActiveScenario('realista')}
              className={`px-3 py-1.5 rounded-lg font-mono transition ${activeScenario === 'realista' ? 'bg-gradient-to-r from-pink-500 to-indigo-600 font-bold text-white shadow-md shadow-pink-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              Realista
            </button>
            <button 
              onClick={() => setActiveScenario('pessimista')}
              className={`px-3 py-1.5 rounded-lg font-mono transition ${activeScenario === 'pessimista' ? 'bg-pink-600 font-extrabold text-white shadow-md shadow-pink-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              Pessimista
            </button>
          </div>
        </div>
      </div>

      {/* STATS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="finance-stats-panel">
        {/* REVENUE CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-xs">Entradas (Patrocínios)</span>
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <ArrowUpCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-mono font-bold text-white">
              {financials.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-emerald-400 font-mono mt-1">Estimativa de repasses ativos</p>
          </div>
        </div>

        {/* EXPENSE CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-xs">Despesas (Saídas Diretas)</span>
            <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
              <ArrowDownCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-mono font-bold text-white">
              {financials.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Materiais, usinagem e eletrônica</p>
          </div>
        </div>

        {/* CONTINGENCY RESERVE CARD */}
        <div className="bg-slate-900 border border-rose-500/10 rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1.5 bg-rose-500/5 text-rose-500 text-[9px] font-mono font-bold uppercase border-l border-b border-rose-500/10 select-none">
            RESERVA 10%
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-xs">Fundo de Contingência</span>
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-mono font-bold text-amber-400 animate-pulse">
              {financials.autoContingency.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">Dedução preventiva aplicada</p>
          </div>
        </div>

        {/* NET CASH BALANCE CARDS */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between shadow-md ${financials.netBalance >= 0 ? 'bg-slate-900 border-emerald-500/20' : 'bg-slate-900 border-rose-550/20'}`}>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-mono text-xs">Saldo Líquido Previsto</span>
            <span className={`p-1 rounded-md ${financials.netBalance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className={`text-xl font-mono font-bold ${financials.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
              {financials.netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Incluindo contingência</p>
          </div>
        </div>
      </div>

      {/* RECONCILIATION BAR AND CHART EXPENSES BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="finance-grid-lower">
        {/* RECONCILIATION SUMMARY BOX */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-inner">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-sans font-bold text-white flex items-center gap-2">
                <CheckCircle className="text-emerald-400 w-4 h-4" />
                Conciliação de Tesouraria
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Acompanhe a diferença entre valores comprometidos (pendentes) vs extrato real consolidado na conta de extensão da equipe.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">🟢 Reconciliado (Extrato):</span>
                <span className="font-bold text-emerald-400">
                  {financials.reconciled.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">🟡 Pendente (Aprovado):</span>
                <span className="font-bold text-amber-400">
                  {financials.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/50 mt-4 flex items-center gap-2 text-[10px] text-slate-500">
            <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Transações de despesa alimentam em tempo real o Custo Real (AC) do EVM no Dashboard.</span>
          </div>
        </div>

        {/* EXPENSES BREAKDOWN GRAPHICAL BARS */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <h3 className="text-sm font-sans font-bold text-white mb-4">
            Distribuição de Custos por Categoria
          </h3>

          <div className="space-y-3.5 max-h-[170px] overflow-y-auto pr-1">
            {Object.keys(financials.categoriesDetails).length === 0 ? (
              <div className="text-center py-10 text-slate-600 font-mono text-xs">Nenhuma despesa registrada neste cenário.</div>
            ) : (
              Object.entries(financials.categoriesDetails).map(([cat, amt]) => {
                const val = Number(amt) || 0;
                const totalDespesas = financials.despesas || 1;
                const percentage = Math.round((val / totalDespesas) * 100);

                return (
                  <div key={cat} className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold">{cat}</span>
                      <span className="text-slate-400">
                        {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-slate-500">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-indigo-505 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-sans font-bold text-white">Livro Diário de Lançamentos</h2>
            <p className="text-xs text-slate-400">Lançamentos sob o cenário ativo: <span className="text-pink-400 font-mono uppercase font-bold">{activeScenario}</span></p>
          </div>
          <button 
            onClick={() => setShowAddTransaction(true)}
            className="bg-gradient-to-tr from-pink-500 to-indigo-600 hover:opacity-90 text-white text-xs font-mono font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-pink-500/10"
          >
            <Plus className="w-4 h-4" /> Registrar Transação
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[10px]">
                <th className="p-3">Data</th>
                <th className="p-3">Descrição do Lançamento</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 text-right">Valor bruto</th>
                <th className="p-3 text-center">Cenário</th>
                <th className="p-3 text-center">Status Conciliado</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-600 font-mono">Nenhuma transação cadastrada nesta simulação.</td>
                </tr>
              ) : (
                filteredTransactions.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3 font-mono text-slate-400">{tr.date}</td>
                    <td className="p-3 font-semibold text-white">{tr.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {tr.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      {tr.type === 'receita' ? (
                        <span className="text-emerald-400 font-bold uppercase text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">Entrada</span>
                      ) : (
                        <span className="text-rose-400 font-bold uppercase text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10">Saída</span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${tr.type === 'receita' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {tr.type === 'receita' ? '+' : '-'}{tr.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-3 text-center uppercase font-mono text-[9px] text-slate-500">
                      {tr.scenario}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => toggleReconciliation(tr.id)}
                        className={`px-2 py-1 rounded font-mono text-[9px] font-bold border transition ${
                          tr.status === 'Reconciliado' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/15 border-amber-500/20 text-amber-300 hover:bg-emerald-500/10'
                        }`}
                      >
                        {tr.status === 'Reconciliado' ? 'Reconciliado ✓' : 'Aguardando Reconciliação ⚡'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleRemove(tr.id)}
                        className="text-slate-500 hover:text-rose-450 p-1"
                        title="Excluir Lançamento"
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

      {/* TRANSACTION DIALOG */}
      {showAddTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <FileText className="text-emerald-400 w-4 h-4" />
                Registrar Movimento Financeiro
              </h3>
              <button 
                onClick={() => setShowAddTransaction(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">MUNICÌPIO / DESCRIÇÃO DO LANÇAMENTO</label>
                <input 
                  type="text" 
                  value={desc} 
                  required
                  onChange={e => setDesc(e.target.value)}
                  placeholder="ex. Bobinas eletromagnéticas do chicote"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">TIPO</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as 'receita' | 'despesa')}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="despesa">Despesa (Saída)</option>
                    <option value="receita">Receita (Patrocínio / Entrada)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">CATEGORIA</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value as Transaction['category'])}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Materiais">Materiais</option>
                    <option value="Usinagem">Usinagem</option>
                    <option value="Eletrônica">Eletrônica</option>
                    <option value="Logística">Logística</option>
                    <option value="Inscrição">Inscrição</option>
                    <option value="Patrocínio">Patrocínio</option>
                    <option value="Ferramental">Ferramental</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">QUANTIDADE FINANCEIRA (R$)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    min="1"
                    required
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">DATA DO LANÇAMENTO</label>
                  <input 
                    type="date" 
                    value={date} 
                    required
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">CENÁRIO FINANCEIRO</label>
                  <select 
                    value={scenario} 
                    onChange={e => setScenario(e.target.value as Transaction['scenario'])}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="realista">Realista (Padrão)</option>
                    <option value="otimista">Otimista (Meta complementar)</option>
                    <option value="pessimista">Pessimista (Sobrevivência)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">STATUS</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as Transaction['status'])}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Pendente">Comprometido (Pendente)</option>
                    <option value="Reconciliado">Equiparado (Reconciliado)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3.5 border-t border-slate-800 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddTransaction(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold px-4 py-2 rounded-xl transition text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl transition text-xs"
                >
                  Registrar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
