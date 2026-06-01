import React, { useState } from 'react';
import { Convidado, Casamento } from '../types';
import { db, generateUUID } from '../lib/supabase';
import { 
  Users, UserPlus, Trash2, Edit2, CheckCircle2, XCircle, Search, 
  ExternalLink, Check, RefreshCw, X, MessageSquare, Phone, Mail, Sparkles 
} from 'lucide-react';

interface GuestsTabProps {
  casamento: Casamento | null;
  convidados: Convidado[];
  onGuestsChanged: () => void;
}

export default function GuestsTab({ casamento, convidados, onGuestsChanged }: GuestsTabProps) {
  const [filter, setFilter] = useState<'todos' | 'confirmados' | 'pendentes'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  // RSVP Simulator state
  const [showRsvpSimulator, setShowRsvpSimulator] = useState(false);
  const [rsvpLookupName, setRsvpLookupName] = useState('');
  const [rsvpSearchResult, setRsvpSearchResult] = useState<Convidado[]>([]);
  const [rsvpHasSearched, setRsvpHasSearched] = useState(false);
  
  // Quick RSVP new guest state in simulator
  const [rsvpNewName, setRsvpNewName] = useState('');
  const [rsvpNewPhone, setRsvpNewPhone] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setEmail('');
    setConfirmed(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casamento) {
      setError('Por favor, cadastre os noivos primeiro.');
      return;
    }
    if (!name.trim()) {
      setError('O nome do convidado é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Edit mode
        await db.updateConvidado({
          id: editingId,
          casamento_id: casamento.id,
          nome: name.trim(),
          telefone: phone.trim(),
          email: email.trim(),
          confirmado: confirmed
        });
      } else {
        // Add mode
        await db.addConvidado({
          id: generateUUID(),
          casamento_id: casamento.id,
          nome: name.trim(),
          telefone: phone.trim(),
          email: email.trim(),
          confirmado: confirmed
        });
      }
      resetForm();
      onGuestsChanged();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar convidado.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (convidado: Convidado) => {
    setEditingId(convidado.id);
    setName(convidado.nome);
    setPhone(convidado.telefone || '');
    setEmail(convidado.email || '');
    setConfirmed(convidado.confirmado);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este convidado?')) return;
    setLoading(true);
    try {
      await db.deleteConvidado(id);
      onGuestsChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleConfirmStatus = async (convidado: Convidado) => {
    try {
      await db.updateConvidado({
        ...convidado,
        confirmado: !convidado.confirmado
      });
      onGuestsChanged();
    } catch (err) {
      console.error(err);
    }
  };

  // RSVP Simulator Actions
  const handleRsvpSearch = () => {
    if (!rsvpLookupName.trim()) return;
    const term = rsvpLookupName.toLowerCase();
    const matches = convidados.filter(c => c.nome.toLowerCase().includes(term));
    setRsvpSearchResult(matches);
    setRsvpHasSearched(true);
  };

  const handleRsvpConfirm = async (convidado: Convidado, status: boolean) => {
    setLoading(true);
    try {
      await db.updateConvidado({
        ...convidado,
        confirmado: status
      });
      // Update local search result state
      setRsvpSearchResult(prev => 
        prev.map(c => c.id === convidado.id ? { ...c, confirmado: status } : c)
      );
      onGuestsChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvpSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casamento || !rsvpNewName.trim()) return;

    setLoading(true);
    try {
      const newGuest: Convidado = {
        id: generateUUID(),
        casamento_id: casamento.id,
        nome: rsvpNewName.trim(),
        telefone: rsvpNewPhone.trim(),
        email: '',
        confirmado: true
      };
      await db.addConvidado(newGuest);
      setRsvpNewName('');
      setRsvpNewPhone('');
      // Show newly added confirmation as searched result item
      setRsvpSearchResult([newGuest]);
      setRsvpHasSearched(true);
      onGuestsChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search computation
  const filteredGuests = convidados.filter(conv => {
    const matchesSearch = conv.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (conv.email && conv.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (conv.telefone && conv.telefone.includes(searchTerm));
    
    if (filter === 'confirmados') return matchesSearch && conv.confirmado;
    if (filter === 'pendentes') return matchesSearch && !conv.confirmado;
    return matchesSearch;
  });

  return (
    <div id="guests" className="space-y-6">
      
      {/* Banner RSVP Simulator Header Toggle */}
      <div className="bg-gradient-to-r from-[#8c7355] to-[#ae906a] rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-1.5 leading-snug">
            <Sparkles className="w-5 h-5 text-[#f1ebd9]" />
            Simulador de RSVP Público para Convidados
          </h2>
          <p className="text-stone-200 text-xs mt-1 leading-relaxed">
            Seus convidados poderiam confirmar presença individualmente por este mecanismo externo. Teste a experiência simulada!
          </p>
        </div>
        <button
          onClick={() => {
            setShowRsvpSimulator(!showRsvpSimulator);
            setRsvpHasSearched(false);
            setRsvpLookupName('');
          }}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-[#fcfbfa] font-semibold text-xs py-2 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          {showRsvpSimulator ? 'Fechar RSVP Simulator' : 'Abrir RSVP Simulator'}
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* RSVP PUBLIC WEB PAGE SIMULATOR VIEW (MODAL LIKE BLOCK OR ACCORDION) */}
      {showRsvpSimulator && (
        <div className="bg-stone-50 border-2 border-dashed border-[#bfa37a] rounded-2xl p-6 shadow-inner animate-fade-in space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-serif text-stone-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Simulador: Página RSVP Oficial de Casamento
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Páge Pública Ativa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Find invitation */}
            <div className="bg-white rounded-xl p-5 border border-stone-200">
              <h4 className="text-sm font-bold text-stone-700 leading-tight mb-2">Já está na Lista de Convidados?</h4>
              <p className="text-xs text-stone-500 mb-4">Insira seu nome abaixo para buscar seu convite individual.</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rsvpLookupName}
                  onChange={(e) => setRsvpLookupName(e.target.value)}
                  placeholder="Seu nome (ex: Carlos)..."
                  className="flex-1 text-sm border border-stone-300 rounded-lg px-3.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#bfa37a]"
                />
                <button
                  type="button"
                  onClick={handleRsvpSearch}
                  className="bg-[#2c2523] hover:bg-[#3d3330] text-stone-100 text-xs font-semibold px-4 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Pesquisar
                </button>
              </div>

              {rsvpHasSearched && (
                <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                  <h5 className="text-xs font-semibold text-stone-500">Resultados da lista:</h5>
                  {rsvpSearchResult.length > 0 ? (
                    rsvpSearchResult.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm">
                        <div>
                          <span className="font-semibold text-stone-700">{c.nome}</span>
                          <span className="block text-[10px] text-stone-400">
                            Status atual: {c.confirmado ? 'Confirmado' : 'Pendente'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRsvpConfirm(c, true)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${c.confirmado ? 'bg-emerald-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'} cursor-pointer`}
                          >
                            Confirmar Presença
                          </button>
                          <button
                            onClick={() => handleRsvpConfirm(c, false)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${!c.confirmado ? 'bg-rose-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'} cursor-pointer`}
                          >
                            Declinar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-rose-600">Nenhum convidado encontrado com esse nome na lista oficial.</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick self registration RSVP */}
            <form onSubmit={handleRsvpSubmitNew} className="bg-white rounded-xl p-5 border border-stone-200 space-y-3">
              <h4 className="text-sm font-bold text-stone-700 leading-tight">Não encontrou seu nome? Confirme direto!</h4>
              <p className="text-xs text-stone-500">Seja livre para registrar sua presença informando seus dados rápidos:</p>
              
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">NOME COMPLETO</label>
                <input
                  type="text"
                  required
                  value={rsvpNewName}
                  onChange={(e) => setRsvpNewName(e.target.value)}
                  placeholder="Nome do convidado extra..."
                  className="w-full text-sm border border-stone-300 rounded-lg px-3.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">TELEFONE (OPCIONAL)</label>
                <input
                  type="text"
                  value={rsvpNewPhone}
                  onChange={(e) => setRsvpNewPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full text-sm border border-stone-300 rounded-lg px-3.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Confirmar Presença com RSVP Rápido
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guest Management Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Guest Add Form */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm h-fit">
          <h3 className="font-serif font-bold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-1.5">
            <UserPlus className="w-5 h-5 text-[#5A5A40]" />
            {editingId ? 'Editar Convidado' : 'Adicionar Convidado'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tio João de Oliveira"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: joao@email.com"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-stone-50">
              <input
                type="checkbox"
                id="conf-check"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-[#5A5A40] focus:ring-[#5A5A40]"
              />
              <label htmlFor="conf-check" className="text-xs font-medium text-stone-700 cursor-pointer select-none">
                Confirmado (Presença Garantida RSVP)
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#5A5A40] hover:bg-[#4a4a34] text-[#FDFBF7] py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {editingId ? 'Salvar Edições' : 'Cadastrar na Lista'}
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

        {/* Guests Tabular List */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-50 pb-3">
            <div>
              <h3 className="font-serif font-bold text-stone-800">Membros da Lista</h3>
              <p className="text-xs text-stone-400">Gerencie presenças no evento ({filteredGuests.length} exibidos)</p>
            </div>

            {/* Quick search & filter panel */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Filter pills */}
              <div className="flex bg-stone-100 p-1 rounded-lg text-[11px] font-semibold border border-stone-200/40">
                <button
                  onClick={() => setFilter('todos')}
                  className={`px-3 py-1 rounded-md cursor-pointer transition ${filter === 'todos' ? 'bg-white shadow-xs text-[#5A5A40]' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('confirmados')}
                  className={`px-3 py-1 rounded-md cursor-pointer transition ${filter === 'confirmados' ? 'bg-white shadow-xs text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Confirmados
                </button>
                <button
                  onClick={() => setFilter('pendentes')}
                  className={`px-3 py-1 rounded-md cursor-pointer transition ${filter === 'pendentes' ? 'bg-white shadow-xs text-amber-600' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Pendentes
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar visitante por nome, e-mail ou prefixo telefônico..."
              className="text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
            />
          </div>

          <div className="overflow-x-auto max-h-[480px] scrollbar-thin">
            {filteredGuests.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-mono uppercase text-stone-400 tracking-wider">
                    <th className="py-2.5">Nome</th>
                    <th className="py-2.5 hidden sm:table-cell">Contato</th>
                    <th className="py-2.5 text-center">Status Confirmação</th>
                    <th className="py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 text-sm">
                  {filteredGuests.map(conv => (
                    <tr key={conv.id} className="group hover:bg-stone-50/50 transition">
                      <td className="py-2.5 pr-2">
                        <span className="block font-medium text-stone-800">{conv.nome}</span>
                      </td>
                      <td className="py-2.5 text-stone-500 text-xs hidden sm:table-cell max-w-[150px] truncate">
                        {conv.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {conv.telefone}
                          </span>
                        )}
                        {conv.email && (
                          <span className="flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {conv.email}
                          </span>
                        )}
                        {!conv.telefone && !conv.email && <span className="text-stone-300">Sem contato</span>}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => toggleConfirmStatus(conv)}
                          className={`inline-flex items-center gap-1 py-1 px-2.5 border rounded-full text-xs font-semibold cursor-pointer transition ${conv.confirmado ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}
                        >
                          {conv.confirmado ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Confirmado
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-500" />
                              Pendente
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleEdit(conv)}
                          className="p-1 text-stone-400 hover:text-[#5A5A40] rounded hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(conv.id)}
                          className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-stone-400">
                <Users className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-sm">Nenhum convidado corresponde aos filtros.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
