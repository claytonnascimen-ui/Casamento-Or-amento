import React, { useState, useEffect } from 'react';
import { 
  Heart, Users, Briefcase, PiggyBank, Calendar, Gift, Bot, 
  Database, Sparkles, Settings, MapPin, Loader2, Save, Trash2, Edit 
} from 'lucide-react';
import { db, generateUUID } from './lib/supabase';
import { Usuario, Casamento, Convidado, Fornecedor, Orcamento, CronogramaItem, Presente } from './types';

// Importing Tab Components
import Dashboard from './components/Dashboard';
import GuestsTab from './components/GuestsTab';
import SuppliersTab from './components/SuppliersTab';
import BudgetTab from './components/BudgetTab';
import TimelineTab from './components/TimelineTab';
import GiftsTab from './components/GiftsTab';
import AiAssistant from './components/AiAssistant';
import SupabaseConfigPanel from './components/SupabaseConfigPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dbType, setDbType] = useState<'Supabase' | 'LocalStorage'>('LocalStorage');
  const [loading, setLoading] = useState(true);

  // Database states
  const [casamento, setCasamento] = useState<Casamento | null>(null);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([]);
  const [presentes, setPresentes] = useState<Presente[]>([]);

  // Couple Profile edit modal/panel state
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [nomeNoivo, setNomeNoivo] = useState('');
  const [nomeNoiva, setNomeNoiva] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [local, setLocal] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Initialize and load everything
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        // Step 1: Populates mock visual components in localStorage if database is untouched
        await db.populateMockDataIfEmpty();
        setDbType(db.getConnectionType());
        
        // Step 2: Fetch standard profiles
        await reloadData();
      } catch (err) {
        console.error("App init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, [dbType]);

  const reloadData = async () => {
    try {
      const activeCasamento = await db.getCasamento();
      setCasamento(activeCasamento);
      
      if (activeCasamento) {
        // Prefill couple profile fields
        setNomeNoivo(activeCasamento.nome_noivo);
        setNomeNoiva(activeCasamento.nome_noiva);
        setDataEvento(activeCasamento.data_evento);
        setLocal(activeCasamento.local);

        // Fetch dependent records
        const [gList, sList, bList, tList, giList] = await Promise.all([
          db.listConvidados(activeCasamento.id),
          db.listFornecedores(activeCasamento.id),
          db.listOrcamentos(activeCasamento.id),
          db.listCronogramas(activeCasamento.id),
          db.listPresentes(activeCasamento.id)
        ]);

        setConvidados(gList);
        setFornecedores(sList);
        setOrcamentos(bList);
        setCronograma(tList);
        setPresentes(giList);
      }
    } catch (e) {
      console.error("Erro ao recarregar dados do banco:", e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNoivo.trim() || !nomeNoiva.trim() || !dataEvento.trim() || !local.trim()) {
      setProfileError("Todos os campos do casal são obrigatórios.");
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    try {
      const payload: Casamento = {
        id: casamento?.id || generateUUID(),
        usuario_id: casamento?.usuario_id || '11111111-1111-4111-a111-111111111111',
        nome_noivo: nomeNoivo.trim(),
        nome_noiva: nomeNoiva.trim(),
        data_evento: dataEvento,
        local: local.trim()
      };

      await db.createOrUpdateCasamento(payload);
      await reloadData();
      setShowProfileEdit(false);
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao gravar informações do casal.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDatabaseConfigChange = () => {
    // Toggling connection reinitializes DB client
    setDbType(db.getConnectionType());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <Heart className="w-12 h-12 text-[#D4AF37] animate-pulse fill-[#D4AF37]/20" />
        <h2 className="mt-4 font-serif text-lg font-bold italic text-[#5A5A40]">Cerimonial Carregando...</h2>
        <p className="text-xs text-[#8C857B] mt-1 max-w-xs">Organizando planilhas e configurando conexões do banco de dados.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2926] flex flex-col antialiased">
      
      {/* Top Wedding Atelier Brand Header */}
      <header className="bg-white border-b border-[#E8E2D9] sticky top-0 z-40 backdrop-blur-md bg-white/95 shadow-xs py-3 md:py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20 text-[#5A5A40]">
              <Heart className="w-5 h-5 fill-current animate-pulse hover:scale-110 transition cursor-pointer" />
              <div className="absolute top-[-3px] right-[-3px] bg-[#D4AF37] p-0.5 rounded-full border border-white"></div>
            </div>
            <div>
              <span className="text-[10px] tracking-widest font-mono text-[#8C857B] uppercase font-bold">Atelier de Casamentos</span>
              <h1 className="text-lg md:text-xl font-serif text-[#5A5A40] italic font-bold flex items-center gap-1.5 leading-none mt-0.5">
                Midi Wedding Planner
              </h1>
            </div>
          </div>

          {/* Quick status & profile info */}
          <div className="flex items-center gap-4 text-xs font-semibold text-[#8C857B] flex-wrap">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#F5F2ED] border border-[#E8E2D9] rounded-full text-[11px] text-[#5A5A40]">
              {dbType === 'Supabase' ? (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  Banco: <strong className="text-emerald-700">Supabase Cloud</strong>
                </>
              ) : (
                <>
                  <Settings className="w-3.5 h-3.5 text-[#D4AF37] animate-spin-slow" />
                  Banco: <strong className="text-amber-800">LocalStorage Simulador</strong>
                </>
              )}
            </div>

            {casamento ? (
              <button
                click-target="couple-profile"
                onClick={() => setShowProfileEdit(true)}
                className="bg-[#2D2926] hover:bg-[#5A5A40] hover:text-white text-stone-100 font-bold px-4 py-1.5 rounded-full transition duration-150 flex items-center gap-1 w-full sm:w-auto justify-center cursor-pointer text-xs"
              >
                <Edit className="w-3.5 h-3.5 text-[#D4AF37]" />
                Noivos: {casamento.nome_noivo} e {casamento.nome_noiva}
              </button>
            ) : (
              <button
                onClick={() => setShowProfileEdit(true)}
                className="bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-bold px-6 py-2 rounded-full text-xs uppercase tracking-widest transition duration-150 cursor-pointer"
              >
                Cadastrar Noivos
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Responsive Navigation Tabs */}
      <nav className="bg-[#F5F2ED] border-b border-[#E8E2D9]/60 p-1">
        <div className="max-w-7xl mx-auto overflow-x-auto flex gap-1.5 scrollbar-none px-4 lg:px-8 py-2">
          
          <button
            click-target="dashboard-button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'dashboard' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#5A5A40]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            Dashboard
          </button>

          <button
            click-target="guests-button"
            onClick={() => setActiveTab('convidados')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'convidados' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#5A5A40]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            Convidados RSVP
          </button>

          <button
            click-target="budget-button"
            onClick={() => setActiveTab('orcamento')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'orcamento' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#5A5A40]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <PiggyBank className="w-4 h-4 text-[#D4AF37]" />
            Orçamento
          </button>

          <button
            click-target="suppliers-button"
            onClick={() => setActiveTab('fornecedores')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'fornecedores' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#5A5A40]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <Briefcase className="w-4 h-4 text-purple-400" />
            Fornecedores
          </button>

          <button
            click-target="timeline-button"
            onClick={() => setActiveTab('cronograma')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'cronograma' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#5A5A40]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            Cronograma
          </button>

          <button
            click-target="gifts-button"
            onClick={() => setActiveTab('presentes')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'presentes' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#5A5A40]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <Gift className="w-4 h-4 text-indigo-400" />
            Lista Presentes
          </button>

          <button
            click-target="assistant-button"
            onClick={() => setActiveTab('ia')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'ia' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#5A5A40]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <Bot className="w-4 h-4 text-[#5A5A40]" />
            IA Consultor
          </button>

          <button
            click-target="supabase-button"
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer shrink-0 ${activeTab === 'supabase' ? 'bg-white border border-[#E8E2D9] shadow-sm text-[#2D2926]' : 'text-[#8C857B] hover:text-[#5A5A40] hover:bg-white/40'}`}
          >
            <Database className="w-4 h-4 text-slate-400" />
            Supabase SQL
          </button>

        </div>
      </nav>

      {/* App Workspace Body content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {/* Warning if no Wedding profile exists */}
        {!casamento && activeTab !== 'supabase' && (
          <div className="bg-[#F5F2ED] border border-[#E8E2D9] text-[#2D2926] p-6 rounded-3xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-3">
              <Sparkles className="w-6 h-6 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold font-serif italic text-lg text-[#5A5A40]">Nenhum Perfil de Casamento Ativo</h4>
                <p className="text-xs text-[#8C857B] mt-1">Configure o perfil dos noivos, data e local do evento para que as planilhas e o painel de métricas funcionem perfeitamente em layout bento.</p>
              </div>
            </div>
            <button
              onClick={() => setShowProfileEdit(true)}
              className="bg-[#5A5A40] text-white hover:bg-[#4a4a34] py-2 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Configurar Casal Agora
            </button>
          </div>
        )}

        {/* Tab selector views */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            casamento={casamento} 
            convidados={convidados} 
            fornecedores={fornecedores} 
            orcamentos={orcamentos} 
            cronograma={cronograma}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'convidados' && (
          <GuestsTab 
            casamento={casamento} 
            convidados={convidados} 
            onGuestsChanged={reloadData}
          />
        )}

        {activeTab === 'fornecedores' && (
          <SuppliersTab 
            casamento={casamento} 
            fornecedores={fornecedores} 
            onSuppliersChanged={reloadData}
          />
        )}

        {activeTab === 'orcamento' && (
          <BudgetTab 
            casamento={casamento} 
            orcamentos={orcamentos} 
            onBudgetChanged={reloadData}
          />
        )}

        {activeTab === 'cronograma' && (
          <TimelineTab 
            casamento={casamento} 
            cronograma={cronograma} 
            onTimelineChanged={reloadData}
          />
        )}

        {activeTab === 'presentes' && (
          <GiftsTab 
            casamento={casamento} 
            presentes={presentes} 
            onGiftsChanged={reloadData}
          />
        )}

        {activeTab === 'ia' && (
          <AiAssistant />
        )}

        {activeTab === 'supabase' && (
          <SupabaseConfigPanel 
            onConfigChanged={handleDatabaseConfigChange} 
            connectionType={dbType}
          />
        )}

      </main>

      {/* Wedding Couple customization Modal sheet */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-55 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-serif font-bold text-stone-800 text-lg flex items-center gap-1.5">
                <Heart className="w-5 h-5 text-[#bfa37a] fill-current" />
                Perfil dos Noivos (Casamento)
              </h3>
              <button 
                onClick={() => setShowProfileEdit(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <Database className="hidden" /> {/* unused */}
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
                  {profileError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">NAME DO NOIVO</label>
                  <input
                    type="text"
                    required
                    value={nomeNoivo}
                    onChange={(e) => setNomeNoivo(e.target.value)}
                    placeholder="Gabriel"
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bfa37a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">NAME DA NOIVA</label>
                  <input
                    type="text"
                    required
                    value={nomeNoiva}
                    onChange={(e) => setNomeNoiva(e.target.value)}
                    placeholder="Mariana"
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bfa37a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">DATA DO CASAMENTO</label>
                <input
                  type="date"
                  required
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bfa37a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">LOCAL DA CERIMÔNIA & FESTA</label>
                <input
                  type="text"
                  required
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Mansão Bougainville, São Paulo - SP"
                  className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#bfa37a]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 bg-[#2c2523] text-stone-100 hover:bg-[#3d3330] py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Gravando informações...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Gravar Perfil
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-500 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="mt-12 py-6 border-t border-stone-200/40 text-center text-xs text-stone-400 bg-white/50 space-y-1">
        <p className="font-medium text-stone-500">Midi Wedding Planner © 2026. Todos os direitos reservados.</p>
        <p className="text-[10px] text-stone-400">Desenvolvido sob arquitetura full-stack integrada de alto desempenho para Supabase & PostgreSQL.</p>
      </footer>

    </div>
  );
}
