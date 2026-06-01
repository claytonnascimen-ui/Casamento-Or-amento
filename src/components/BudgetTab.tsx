import React, { useState } from 'react';
import { Orcamento, Casamento } from '../types';
import { db, generateUUID } from '../lib/supabase';
import { 
  PiggyBank, Plus, Trash2, Edit2, TrendingUp, DollarSign, AlertCircle, 
  HelpCircle, CheckCircle, Scale, Coins
} from 'lucide-react';

interface BudgetTabProps {
  casamento: Casamento | null;
  orcamentos: Orcamento[];
  onBudgetChanged: () => void;
}

const DEFAULT_CATEGORIES = [
  'Salão & Buffet',
  'Fotografia & Vídeo',
  'Música & Banda',
  'Decoração',
  'Vestido & Trajes',
  'Lembrancinhas & Convites',
  'Alianças & Joias',
  'Lua de Mel',
  'Serviços de Assessoria',
  'Eventos Extras & RSVP',
  'Outros'
];

export default function BudgetTab({ casamento, orcamentos, onBudgetChanged }: BudgetTabProps) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [categoria, setCategoria] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategoria, setCustomCategoria] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [valorPrevisto, setValorPrevisto] = useState('');
  const [valorGasto, setValorGasto] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setCategoria(DEFAULT_CATEGORIES[0]);
    setCustomCategoria('');
    setIsCustomCategory(false);
    setValorPrevisto('');
    setValorGasto('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casamento) {
      setError('Por favor, configure o casamento antes de lançar orçamentos.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategoria.trim() : categoria;
    if (!finalCategory) {
      setError('A categoria do orçamento é obrigatória.');
      return;
    }

    const previsto = parseFloat(valorPrevisto) || 0;
    const gasto = parseFloat(valorGasto) || 0;

    if (previsto < 0 || gasto < 0) {
      setError('Os valores monetários não podem ser negativos.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await db.updateOrcamento({
          id: editingId,
          casamento_id: casamento.id,
          categoria: finalCategory,
          valor_previsto: previsto,
          valor_gasto: gasto
        });
      } else {
        await db.addOrcamento({
          id: generateUUID(),
          casamento_id: casamento.id,
          categoria: finalCategory,
          valor_previsto: previsto,
          valor_gasto: gasto
        });
      }
      resetForm();
      onBudgetChanged();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (orc: Orcamento) => {
    setEditingId(orc.id);
    const isDefault = DEFAULT_CATEGORIES.includes(orc.categoria);
    if (isDefault) {
      setCategoria(orc.categoria);
      setIsCustomCategory(false);
    } else {
      setIsCustomCategory(true);
      setCustomCategoria(orc.categoria);
    }
    setValorPrevisto(orc.valor_previsto.toString());
    setValorGasto(orc.valor_gasto.toString());
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja apagar essa categoria de orçamento?')) return;
    setLoading(true);
    try {
      await db.deleteOrcamento(id);
      onBudgetChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Aggregations
  const totalPlanned = orcamentos.reduce((acc, curr) => acc + Number(curr.valor_previsto), 0);
  const totalSpent = orcamentos.reduce((acc, curr) => acc + Number(curr.valor_gasto), 0);
  const totalBalance = totalPlanned - totalSpent;
  const healthStatus = totalBalance >= 0 ? 'Dentro do Limite' : 'Orçamento Estourado';

  return (
    <div id="budget" className="space-y-6">
      
      {/* Financial health summarizing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Planned */}
        <div className="bg-white rounded-3xl border border-stone-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold uppercase font-mono">Teto Estimado</span>
            <PiggyBank className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold font-serif text-stone-800 block">{formatCurrency(totalPlanned)}</span>
            <span className="text-[10px] text-stone-400 mt-1 block">Limite teórico do casamento</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-3xl border border-stone-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold uppercase font-mono">Total Liquidado</span>
            <Coins className="w-5 h-5 text-[#5A5A40]" />
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold font-serif text-stone-800 block">{formatCurrency(totalSpent)}</span>
            <span className="text-[10px] text-stone-400 mt-1 block">Valores marcados como pagos à vista/prazo</span>
          </div>
        </div>

        {/* Balance remaining */}
        <div className={`rounded-3xl border p-5 shadow-sm transition ${totalBalance >= 0 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase font-mono">Saldo Disponível</span>
            <Scale className={`w-5 h-5 ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-500-600'}`} />
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold font-serif block">{formatCurrency(totalBalance)}</span>
            <span className="text-[10px] uppercase font-bold mt-1 block">
              {totalBalance >= 0 ? '✓ Caixa Positivo' : '⚠️ Déficit de Fundos'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Budget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm h-fit">
          <h3 className="font-serif font-bold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-[#D4AF37]" />
            {editingId ? 'Editar Categoria' : 'Integrar Lançamento de Caixa'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-600">Categoria de Gasto</label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] text-[#5A5A40] hover:underline font-bold uppercase cursor-pointer"
                >
                  {isCustomCategory ? 'Escolher da Lista' : 'Digitar Categoria'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  required
                  value={customCategoria}
                  onChange={(e) => setCustomCategoria(e.target.value)}
                  placeholder="Ex: Noite de Núpcias"
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              ) : (
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] bg-white"
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Valor Estimado Previsto (R$)</label>
              <div className="relative">
                <span className="text-sm text-stone-400 absolute left-3 top-2 font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorPrevisto}
                  onChange={(e) => setValorPrevisto(e.target.value)}
                  placeholder="5000"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Valor Gasto Realizado (R$)</label>
              <div className="relative">
                <span className="text-sm text-stone-400 absolute left-3 top-2 font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorGasto}
                  onChange={(e) => setValorGasto(e.target.value)}
                  placeholder="3500"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-stone-100 hover:bg-[#4a4a34] py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              {editingId ? 'Salvar Lançamento' : 'Lançar Orçamento'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-500 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Descartar Edição
              </button>
            )}
          </form>
        </div>

        {/* Budget list with progress indicator bars */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="font-serif font-bold text-stone-800 border-b border-stone-100 pb-3">Detalhamento por Atividades</h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {orcamentos.length > 0 ? (
              orcamentos.map(orc => {
                const percent = orc.valor_previsto > 0 ? Math.round((orc.valor_gasto / orc.valor_previsto) * 100) : 0;
                const isOver = orc.valor_gasto > orc.valor_previsto;
                const diff = Math.abs(orc.valor_previsto - orc.valor_gasto);

                return (
                  <div key={orc.id} className="p-4 border border-stone-150 rounded-xl hover:bg-stone-50/50 transition duration-150 bg-stone-50/20">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div>
                        <h4 className="font-semibold text-stone-800 text-sm">{orc.categoria}</h4>
                        <div className="flex gap-4 text-xs text-stone-500 mt-0.5">
                          <span>Previsto: <strong className="text-stone-700">{formatCurrency(orc.valor_previsto)}</strong></span>
                          <span>Gasto: <strong className="text-stone-700">{formatCurrency(orc.valor_gasto)}</strong></span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(orc)}
                          className="p-1 text-stone-400 hover:text-[#5A5A40] hover:bg-stone-100 rounded transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(orc.id)}
                          className="p-1 text-stone-400 hover:text-red-500 hover:bg-stone-100 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress slider bar & Warning text */}
                    <div className="space-y-1">
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition duration-300 ${isOver ? 'bg-rose-500' : 'bg-[#5A5A40]'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className={`font-semibold ${isOver ? 'text-rose-600' : 'text-stone-500'}`}>
                          {percent}% Consumido
                        </span>
                        
                        {isOver ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Estouro de {formatCurrency(diff)}!
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" />
                            Sobram {formatCurrency(diff)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-stone-50/50 border border-dashed border-stone-200 rounded-xl text-stone-400">
                <PiggyBank className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-sm font-semibold">Nenhum orçamento cadastrado</p>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Lance verbas estimadas e despesas líquidas por categorias para controlar os desvios de custos das alianças, vestido, cerimonial e festas extras.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
