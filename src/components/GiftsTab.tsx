import React, { useState } from 'react';
import { Presente, Casamento } from '../types';
import { db, generateUUID } from '../lib/supabase';
import { 
  Gift, Heart, Plus, Trash2, Edit2, Link, ShoppingBag, 
  Check, CheckCircle, Coins, Trash, RefreshCw, X
} from 'lucide-react';

interface GiftsTabProps {
  casamento: Casamento | null;
  presentes: Presente[];
  onGiftsChanged: () => void;
}

export default function GiftsTab({ casamento, presentes, onGiftsChanged }: GiftsTabProps) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states (Manage Registry mode)
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  // Reserve/Gift claim popup states
  const [reservingGift, setReservingGift] = useState<Presente | null>(null);
  const [reserverName, setReserverName] = useState('');
  const [reserverEmail, setReserverEmail] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setValor('');
    setLink('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casamento) {
      setError('Por favor, configure o casal antes.');
      return;
    }
    if (!nome.trim()) {
      setError('O nome do presente é obrigatório.');
      return;
    }

    const numericValue = parseFloat(valor) || 0;
    if (numericValue < 0) {
      setError('O valor sugerido não pode ser negativo.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // preserve reservation status when editing
        const oldG = presentes.find(p => p.id === editingId);
        await db.updatePresente({
          id: editingId,
          casamento_id: casamento.id,
          nome: nome.trim(),
          valor: numericValue,
          link: link.trim(),
          status: oldG?.status || 'disponivel',
          reservado_nome: oldG?.reservado_nome,
          reservado_email: oldG?.reservado_email
        });
      } else {
        await db.addPresente({
          id: generateUUID(),
          casamento_id: casamento.id,
          nome: nome.trim(),
          valor: numericValue,
          link: link.trim(),
          status: 'disponivel'
        });
      }
      resetForm();
      onGiftsChanged();
    } catch (err: any) {
      setError(err.message || 'Erro ao gravar presente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Presente) => {
    setEditingId(p.id);
    setNome(p.nome);
    setValor(p.valor.toString());
    setLink(p.link || '');
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este item da lista de presentes?')) return;
    setLoading(true);
    try {
      await db.deletePresente(id);
      onGiftsChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReserve = (gift: Presente) => {
    setReservingGift(gift);
    setReserverName('');
    setReserverEmail('');
  };

  const handleConfirmReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservingGift || !reserverName.trim()) return;

    setLoading(true);
    try {
      await db.updatePresente({
        ...reservingGift,
        reservado_nome: reserverName.trim(),
        reservado_email: reserverEmail.trim(),
        status: 'reservado'
      });
      setReservingGift(null);
      onGiftsChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReceived = async (gift: Presente) => {
    try {
      await db.updatePresente({
        ...gift,
        status: 'recebido'
      });
      onGiftsChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetGift = async (gift: Presente) => {
    try {
      await db.updatePresente({
        ...gift,
        status: 'disponivel',
        reservado_nome: '',
        reservado_email: ''
      });
      onGiftsChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Stats
  const totalValueGifts = presentes.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const reservedGiftsCount = presentes.filter(p => p.status === 'reservado').length;
  const receivedGiftsCount = presentes.filter(p => p.status === 'recebido').length;
  const receivedTotalValue = presentes.filter(p => p.status === 'recebido' || p.status === 'reservado').reduce((acc, curr) => acc + Number(curr.valor), 0);

  return (
    <div id="gifts-registry" className="space-y-6">
      
      {/* High-level status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total gifts */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold uppercase font-mono">Presentes Cadastrados</span>
            <Gift className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold font-serif text-stone-800 block">{presentes.length} itens</span>
            <span className="text-[10px] text-stone-400 mt-0.5 block">Soma de sugestões: {formatCurrency(totalValueGifts)}</span>
          </div>
        </div>

        {/* Claimed Gifts */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold uppercase font-mono">Status das Ofertas</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold font-serif text-stone-800 block">
              {receivedGiftsCount + reservedGiftsCount} Presenteados
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              {receivedGiftsCount} Recebidos / {reservedGiftsCount} Reservados
            </span>
          </div>
        </div>

        {/* Received Funds */}
        <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-semibold uppercase font-mono">Arrecadação de Caixas</span>
            <Coins className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold font-serif text-emerald-900 block">{formatCurrency(receivedTotalValue)}</span>
            <span className="text-[11px] text-emerald-700 block font-semibold mt-0.5">✓ Fundos arrecadados / garantidos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gift Form */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm h-fit">
          <h3 className="font-serif font-bold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-1.5 font-semibold">
            <Plus className="w-5 h-5 text-[#D4AF37]" />
            {editingId ? 'Editar Presente' : 'Novo Presente na Lista'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Nome do Item</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Jogo de Taças de Cristal ou Cota de Lua de Mel"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Valor do Item (R$)</label>
              <div className="relative">
                <span className="text-sm text-stone-400 absolute left-3 top-2 font-semibold">R$</span>
                <input
                  type="number"
                  step="1"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="350"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Link de Compra Real (Opcional)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://amazon.com.br/xxxxx"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-stone-100 hover:bg-[#4a4a34] py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              {editingId ? 'Confirmar Edição' : 'Cadastrar Presente'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-550 py-1 rounded text-xs font-semibold"
              >
                Cancelar
              </button>
            )}
          </form>
        </div>

        {/* Gifts collection Grid display */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-serif font-bold text-stone-800">Vitrine Virtual de Presentes</h3>
            <p className="text-xs text-stone-400">Clique em "Presentear / Reservar" para simular a compra de um item por um convidado:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {presentes.length > 0 ? (
              presentes.map(p => {
                const isClaimed = p.status === 'recebido';
                const isReserved = p.status === 'reservado';
                const isAvailable = p.status === 'disponivel';

                return (
                  <div key={p.id} className={`p-4 border rounded-xl flex flex-col justify-between gap-4 transition duration-150 ${isClaimed ? 'bg-emerald-50/20 border-emerald-100 opacity-80' : isReserved ? 'bg-amber-50/20 border-amber-100' : 'bg-stone-50/20 border-stone-200/60'}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        {/* Status tag */}
                        {isClaimed ? (
                          <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded-full bg-emerald-100 text-emerald-800">
                            GANHADO ✓
                          </span>
                        ) : isReserved ? (
                          <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded-full bg-amber-100 text-amber-800">
                            RESERVADO ⌛
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded-full bg-stone-100 text-stone-600">
                            Disponível
                          </span>
                        )}

                        <div className="flex gap-1.5 opacity-50 hover:opacity-100">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1 text-stone-400 hover:text-[#5A5A40] rounded hover:bg-stone-100 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-stone-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-stone-800 text-sm leading-snug line-clamp-2">
                        {p.nome}
                      </h4>

                      <div className="text-sm font-bold text-stone-800 font-serif">
                        {formatCurrency(p.valor)}
                      </div>

                      {(isReserved || isClaimed) && (
                        <div className="text-[11px] text-stone-500 border-t border-stone-100 pt-2.5 space-y-0.5">
                          <span>De: <strong>{p.reservado_nome}</strong></span>
                          {p.reservado_email && (
                            <span className="block text-stone-400">{p.reservado_email}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Operational action button row */}
                    <div className="flex items-center gap-1.5 border-t border-stone-100 pt-3 mt-2">
                      {isAvailable && (
                        <button
                          onClick={() => handleOpenReserve(p)}
                          className="flex-1 text-center bg-[#5A5A40] hover:bg-[#4a4a34] text-white py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Presentear / Reservar
                        </button>
                      )}

                      {isReserved && (
                        <>
                          <button
                            onClick={() => handleMarkAsReceived(p)}
                            className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Confirmar Entrega
                          </button>
                          <button
                            onClick={() => handleResetGift(p)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-500 p-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                            title="Liberar presente de volta à lista"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isClaimed && (
                        <button
                          onClick={() => handleResetGift(p)}
                          className="flex-1 text-center bg-stone-100 hover:bg-stone-200 text-stone-500 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Devolver à Vitrine
                        </button>
                      )}

                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#5A5A40] bg-stone-50 hover:bg-[#5A5A40]/10 border border-[#E8E2D9] rounded-lg hover:text-[#4a4a34]"
                          title="Abrir Link da Loja"
                        >
                          <Link className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-20 bg-stone-50/50 border border-dashed border-stone-200 rounded-xl text-stone-400">
                <Gift className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-sm font-semibold">Lista Vazia</p>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Cadastre cotas de lua de mel ou eletrodomésticos recomendados para receber presentes em dinheiro ou produtos reais.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Guest claim modal overlay */}
      {reservingGift && (
        <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-55 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-stone-150 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-50">
              <h4 className="font-serif font-bold text-stone-800 text-md flex items-center gap-1.5">
                <Gift className="w-4.5 h-4.5 text-[#D4AF37]" />
                Reservar Presente
              </h4>
              <button 
                onClick={() => setReservingGift(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Você está prestes a presentear com o item: <strong>{reservingGift.nome}</strong>, com valor sugerido de <strong>{formatCurrency(reservingGift.valor)}</strong>.
            </p>

            <form onSubmit={handleConfirmReserve} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">SEU NOME COMPLETO</label>
                <input
                  type="text"
                  required
                  value={reserverName}
                  onChange={(e) => setReserverName(e.target.value)}
                  placeholder="Seu nome..."
                  className="w-full text-sm border border-stone-300 rounded-lg px-3.5 py-1.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">E-MAIL DO CONVIDADO (OPCIONAL)</label>
                <input
                  type="email"
                  value={reserverEmail}
                  onChange={(e) => setReserverEmail(e.target.value)}
                  placeholder="ex: voce@email.com"
                  className="w-full text-sm border border-stone-300 rounded-lg px-3.5 py-1.5 focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] focus:outline-none outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  ✓ Confirmar Presente
                </button>
                <button
                  type="button"
                  onClick={() => setReservingGift(null)}
                  className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-500 font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
