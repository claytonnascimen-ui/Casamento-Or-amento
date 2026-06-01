import React, { useState } from 'react';
import { Fornecedor, Casamento } from '../types';
import { db, generateUUID } from '../lib/supabase';
import { 
  Briefcase, Plus, Trash2, Edit2, Phone, DollarSign, ListFilter,
  Check, Percent, HelpCircle, HardDrive, ShoppingBag, Landmark
} from 'lucide-react';

interface SuppliersTabProps {
  casamento: Casamento | null;
  fornecedores: Fornecedor[];
  onSuppliersChanged: () => void;
}

const CATEGORIES = [
  'Salão & Buffet',
  'Fotografia & Vídeo',
  'Música & Banda',
  'Decoração & Flores',
  'Bolo & Doces Fins',
  'Vestuário & Trajes',
  'Assessoria & Cerimonial',
  'Lembrancinhas & Papelaria',
  'Outros'
];

export default function SuppliersTab({ casamento, fornecedores, onSuppliersChanged }: SuppliersTabProps) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIES[0]);
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setCategoria(CATEGORIES[0]);
    setTelefone('');
    setValor('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casamento) {
      setError('Por favor, configure o casamento dos noivos primeiro.');
      return;
    }
    if (!nome.trim()) {
      setError('O nome do fornecedor é obrigatório.');
      return;
    }

    const numericValue = parseFloat(valor) || 0;
    if (numericValue < 0) {
      setError('O valor do contrato não pode ser negativo.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await db.updateFornecedor({
          id: editingId,
          casamento_id: casamento.id,
          nome: nome.trim(),
          categoria,
          telefone: telefone.trim(),
          valor: numericValue
        });
      } else {
        await db.addFornecedor({
          id: generateUUID(),
          casamento_id: casamento.id,
          nome: nome.trim(),
          categoria,
          telefone: telefone.trim(),
          valor: numericValue
        });
      }
      resetForm();
      onSuppliersChanged();
    } catch (err: any) {
      setError(err.message || 'Erro ao gravar fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingId(fornecedor.id);
    setNome(fornecedor.nome);
    setCategoria(fornecedor.categoria);
    setTelefone(fornecedor.telefone || '');
    setValor(fornecedor.valor.toString());
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este fornecedor? Esta ação irá remover o contrato da auditoria.')) return;
    setLoading(true);
    try {
      await db.deleteFornecedor(id);
      onSuppliersChanged();
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

  // Calculations
  const totalCost = fornecedores.reduce((acc, curr) => acc + Number(curr.valor), 0);

  return (
    <div id="suppliers" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form panel */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm h-fit">
          <h3 className="font-serif font-bold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-[#D4AF37]" />
            {editingId ? 'Editar Contrato' : 'Novo Contrato Fornecedor'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Empresa / Contato</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maison Flor de Alecrim Decorações"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Telefone / E-mail</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Valor do Contrato (R$)</label>
              <div className="relative">
                <span className="text-sm text-stone-400 absolute left-3 top-2 font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="8500.00"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-50">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#5A5A40] text-white hover:bg-[#4a4a34] py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {editingId ? 'Confirmar Alterações' : 'Salvar Fornecedor'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-stone-100 hover:bg-stone-200 py-2 px-3 rounded-xl text-xs text-stone-500 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List of suppliers and contract balances */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-stone-50 pb-3">
            <div>
              <h3 className="font-serif font-bold text-stone-800">Contratos de Fornecedores</h3>
              <p className="text-xs text-stone-400">Total de compromissos firmados com terceiros</p>
            </div>
            <div className="text-right">
              <span className="block text-xs text-stone-400 uppercase font-mono font-semibold">Custo Hired Acumulado</span>
              <span className="text-lg font-bold font-serif text-[#5A5A40]">{formatCurrency(totalCost)}</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
            {fornecedores.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-mono uppercase text-stone-400 tracking-wider">
                    <th className="py-2.5">Nome / Contato</th>
                    <th className="py-2.5">Categoria</th>
                    <th className="py-2.5 text-right">Custo Contratado</th>
                    <th className="py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 text-sm">
                  {fornecedores.map(f => (
                    <tr key={f.id} className="hover:bg-stone-50/50 transition duration-150">
                      <td className="py-3">
                        <span className="block font-semibold text-stone-800">{f.nome}</span>
                        {f.telefone && (
                          <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {f.telefone}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="inline-block px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 rounded-full text-xs font-semibold">
                          {f.categoria}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-stone-800">
                        {formatCurrency(f.valor)}
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleEdit(f)}
                          className="p-1 text-stone-400 hover:text-[#5A5A40] rounded hover:bg-stone-100 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-stone-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20 bg-stone-50/50 border border-dashed border-stone-200 rounded-xl text-stone-400">
                <Briefcase className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-sm font-semibold">Nenhum fornecedor registrado</p>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Cadastre buffer, fotografia, banda e docinhos para auditar o progresso financeiro e as relações do grande dia.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
