import React, { useState } from 'react';
import { CronogramaItem, Casamento } from '../types';
import { db, generateUUID } from '../lib/supabase';
import { 
  Calendar, Clock, Plus, Trash2, Edit2, CheckCircle2, Circle, 
  ChevronRight, Sparkles, AlertCircle, HelpCircle
} from 'lucide-react';

interface TimelineTabProps {
  casamento: Casamento | null;
  cronograma: CronogramaItem[];
  onTimelineChanged: () => void;
}

export default function TimelineTab({ casamento, cronograma, onTimelineChanged }: TimelineTabProps) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [titulo, setTitulo] = useState('');
  const [hora, setHora] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<'pendente' | 'concluido'>('pendente');
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setTitulo('');
    setHora('');
    setDescricao('');
    setStatus('pendente');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casamento) {
      setError('Por favor, configure o casal antes de planejar horários.');
      return;
    }
    if (!titulo.trim()) {
      setError('O título do horário é obrigatório.');
      return;
    }
    if (!hora.trim()) {
      setError('O horário de agendamento (ex: 18:30) é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await db.updateCronograma({
          id: editingId,
          casamento_id: casamento.id,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          data_hora: hora.trim(),
          status
        });
      } else {
        await db.addCronograma({
          id: generateUUID(),
          casamento_id: casamento.id,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          data_hora: hora.trim(),
          status
        });
      }
      resetForm();
      onTimelineChanged();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar cronograma.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: CronogramaItem) => {
    setEditingId(item.id);
    setTitulo(item.titulo);
    setHora(item.data_hora);
    setDescricao(item.descricao || '');
    setStatus(item.status);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este horário oficial do casamento?')) return;
    setLoading(true);
    try {
      await db.deleteCronograma(id);
      onTimelineChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item: CronogramaItem) => {
    try {
      await db.updateCronograma({
        ...item,
        status: item.status === 'concluido' ? 'pendente' : 'concluido'
      });
      onTimelineChanged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="timeline" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm h-fit">
          <h3 className="font-serif font-bold text-stone-800 border-b border-stone-100 pb-3 flex items-center gap-1.5 font-semibold">
            <Plus className="w-5 h-5 text-[#D4AF37]" />
            {editingId ? 'Editar Programação' : 'Agendar Novo Evento'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Título principal</label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Brinde dos Noivos & Fotos Bolo"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Horário</label>
                <input
                  type="text"
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  placeholder="Ex: 19:15"
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] bg-white"
                >
                  <option value="pendente">Pendente</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#444] text-xs font-medium mb-1">Observações / Sub-detalhes</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Chamar padrinhos e irmãos do Gabriel & Mariana ao palco central"
                rows={3}
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-stone-100 hover:bg-[#4a4a34] py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              {editingId ? 'Salvar Alinhamento' : 'Inserir no Cronograma'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-500 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar Edição
              </button>
            )}
          </form>
        </div>

        {/* Chronological List of Events */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-serif font-bold text-stone-800">Itinerário Oficial do Dia</h3>
            <p className="text-xs text-stone-400">Pressione a bolinha de status para marcar um evento como concluído ao longo do casamento</p>
          </div>

          <div className="relative border-l-2 border-stone-100 pl-6 ml-4 space-y-6 max-h-[500px] overflow-y-auto pt-2">
            {cronograma.length > 0 ? (
              cronograma.map(item => {
                const isCompleted = item.status === 'concluido';
                return (
                  <div key={item.id} className="relative group">
                    {/* Circle icon on the timeline bar */}
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className="absolute left-[-35px] top-1 p-0 rounded-full bg-white transition hover:scale-110 cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300 hover:text-[#5A5A40]" />
                      )}
                    </button>

                    <div className={`p-4 rounded-xl border border-stone-150 transition duration-150 bg-stone-50/20 hover:bg-stone-50/70 border-l-4 ${isCompleted ? 'border-l-emerald-500 opacity-70' : 'border-l-[#5A5A40]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-stone-100 border border-stone-200 font-mono text-stone-600 px-2 py-0.5 rounded font-bold">
                              {item.data_hora}
                            </span>
                            <span className={`text-[#817474] text-xs font-semibold uppercase ${isCompleted ? 'text-emerald-700' : 'text-stone-400'}`}>
                              {isCompleted ? '• Feito' : '• Programado'}
                            </span>
                          </div>
                          
                          <h4 className={`text-sm font-semibold text-stone-800 ${isCompleted ? 'line-through text-stone-400' : ''}`}>
                            {item.titulo}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-stone-400 hover:text-[#5A5A40] hover:bg-stone-100 rounded cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-stone-400 hover:text-red-500 hover:bg-stone-100 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.descricao && (
                        <p className={`text-xs text-stone-550 mt-2 leading-relaxed ${isCompleted ? 'text-stone-400' : ''}`}>
                          {item.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-stone-50/50 border border-dashed border-stone-200 rounded-xl text-stone-400 mr-4">
                <Calendar className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-sm font-semibold">Itinerário Vazio</p>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Insira hora e título (ex: Recepção de Padrinhos, Valsa de Abertura, Jantar e Parabéns) para montar o roteiro dinâmico do grande dia de casamento.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
