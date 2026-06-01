import React from 'react';
import { Convidado, Fornecedor, Orcamento, CronogramaItem, Casamento } from '../types';
import { 
  Users, Heart, Landmark, PiggyBank, Calendar, MapPin, 
  ChevronRight, TrendingUp, DollarSign, Briefcase, Clock, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

interface DashboardProps {
  casamento: Casamento | null;
  convidados: Convidado[];
  fornecedores: Fornecedor[];
  orcamentos: Orcamento[];
  cronograma: CronogramaItem[];
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ 
  casamento, 
  convidados, 
  fornecedores, 
  orcamentos, 
  cronograma,
  setActiveTab
}: DashboardProps) {

  // 1. Calculate Guest Metrics
  const totalGuests = convidados.length;
  const confirmedGuests = convidados.filter(c => c.confirmado).length;
  const pendingGuests = totalGuests - confirmedGuests;
  const rsvpPercentage = totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0;

  // 2. Calculate Budget Metrics
  const totalPlannedBudget = orcamentos.reduce((acc, curr) => acc + Number(curr.valor_previsto), 0);
  const totalSpentBudget = orcamentos.reduce((acc, curr) => acc + Number(curr.valor_gasto), 0);
  const totalSupplierCosts = fornecedores.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const budgetBalance = totalPlannedBudget - totalSpentBudget;
  const budgetSpentPercent = totalPlannedBudget > 0 ? Math.round((totalSpentBudget / totalPlannedBudget) * 100) : 0;

  // 3. Countdown calculation
  const getDaysCountdown = () => {
    if (!casamento?.data_evento) return null;
    const eventDate = new Date(casamento.data_evento);
    const today = new Date();
    // Zero out times
    eventDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysCountdown();

  // 4. Data for PieChart (Guests)
  const guestChartData = [
    { name: 'Confirmados', value: confirmedGuests, color: '#5A5A40' },  // brand-olive
    { name: 'Pendente', value: pendingGuests, color: '#D4AF37' },      // brand-gold
  ].filter(item => item.value > 0);

  // Fallback if no guests yet
  const defaultGuestChartData = [
    { name: 'Nenhum convidado', value: 1, color: '#E8E2D9' }
  ];

  // 5. Data for BarChart (Budget planned vs spent per category)
  // Merge categories or map them directly from budgets
  const budgetChartData = orcamentos.map(o => ({
    name: o.categoria,
    Previsto: Number(o.valor_previsto),
    Gasto: Number(o.valor_gasto)
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner */}
      {casamento && (
        <div className="relative rounded-3xl overflow-hidden bg-[#2D2926] text-white p-6 md:p-8 shadow-sm border border-[#E8E2D9]/30">
          {/* Subtle floral background pattern simulator */}
          <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(135deg, #D4AF37, #5A5A40)' }}></div>
          <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
            <Sparkles className="w-40 h-40 text-[#D4AF37]" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1 bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#FDFBF7] rounded-full px-3 py-1 text-[10px] font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              CONTAGEM REGRESSIVA PARA O GRANDE DIA
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-serif text-white font-bold italic">
                  {casamento.nome_noivo} & {casamento.nome_noiva}
                </h1>
                <p className="text-stone-300 text-sm mt-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  {new Date(casamento.data_evento).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
                  })}
                  <span className="text-stone-500">•</span>
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  {casamento.local || "Local não informado"}
                </p>
              </div>

              {daysLeft !== null && (
                <div className="flex gap-4 items-center bg-white/5 border border-white/10 rounded-2xl p-4 self-start lg:self-auto backdrop-blur-sm">
                  <div className="text-center">
                    <span className="block text-4xl font-serif font-semibold text-[#D4AF37]">
                      {daysLeft > 0 ? daysLeft : daysLeft === 0 ? "É HOJE" : Math.abs(daysLeft)}
                    </span>
                    <span className="text-[10px] tracking-widest text-[#FDFBF7]/80 font-mono uppercase">
                      {daysLeft > 0 ? "Dias Restantes" : daysLeft === 0 ? "Feliz Casamento!" : "Dias Atrás"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Orçamento Planejado */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider">Orçamento Planejado</span>
            <div className="p-2.5 bg-[#F5F2ED] rounded-xl text-[#5A5A40] border border-[#E8E2D9]/40">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="block text-2xl font-bold font-serif text-[#2D2926]">{formatCurrency(totalPlannedBudget)}</span>
            <div className="flex items-center gap-1 text-[11px] text-[#8C857B] mt-1">
              <span>Alocado por categorias</span>
            </div>
          </div>
        </div>

        {/* Card 2: Valor Executado */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider">Orçamento Realizado</span>
            <div className="p-2.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="block text-2xl font-bold font-serif text-[#2D2926]">{formatCurrency(totalSpentBudget)}</span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C857B] mt-1.5">
              {/* Progress bar */}
              <div className="w-20 bg-[#F5F2ED] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-[#5A5A40]"
                  style={{ width: `${Math.min(budgetSpentPercent, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-[#5A5A40]">{budgetSpentPercent}% utilizado</span>
            </div>
          </div>
        </div>

        {/* Card 3: Lista de Convidados */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider">Lista de Convidados</span>
            <div className="p-2.5 bg-[#F5F2ED] text-[#5A5A40] rounded-xl border border-[#E8E2D9]/40">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="block text-2xl font-bold font-serif text-[#2D2926]">{totalGuests} pessoas</span>
            <div className="flex items-center justify-between text-[11px] text-[#8C857B] mt-1 w-full">
              <span>{confirmedGuests} confirmados</span>
              <span className="font-bold text-[#5A5A40]">{rsvpPercentage}% RSVP</span>
            </div>
          </div>
        </div>

        {/* Card 4: Fornecedores */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider">Fornecedores Habilitados</span>
            <div className="p-2.5 bg-[#D4AF37]/10 text-[#5A5A40] rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="block text-2xl font-bold font-serif text-[#2D2926]">{fornecedores.length} contratos</span>
            <div className="flex items-center justify-between text-[11px] text-[#8C857B] mt-1 w-full">
              <span>Custos totais:</span>
              <span className="font-bold text-[#5A5A40]">{formatCurrency(totalSupplierCosts)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Budget Stack Bar Chart */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-[#F5F2ED] pb-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2926]">Orçamento por Categorias</h3>
              <p className="text-xs text-[#8C857B]">Comparativo entre planejado e gasto realizado</p>
            </div>
            <button 
              onClick={() => setActiveTab('orcamento')}
              className="text-xs text-[#5A5A40] hover:text-[#4a4a34] font-bold flex items-center gap-1 cursor-pointer"
            >
              Ver Detalhes <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>

          <div className="h-[280px]">
            {budgetChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F2ED" />
                  <XAxis dataKey="name" tick={{ fill: '#8C857B', fontSize: 10, fontWeight: 500 }} />
                  <YAxis tick={{ fill: '#8C857B', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '16px', backgroundColor: '#FDFBF7', borderColor: '#E8E2D9', fontFamily: 'sans-serif', color: '#2D2926' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Previsto" fill="#E8E2D9" name="Planejado" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gasto" fill="#5A5A40" name="Realizado" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-sm gap-2 bg-[#F5F2ED]/50 rounded-2xl border border-dashed border-[#E8E2D9]">
                <Landmark className="w-8 h-8 text-[#8C857B]" />
                <span className="text-xs font-semibold text-[#8C857B]">Nenhuma categoria cadastrada no orçamento</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: RSVP Pie Chart */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#F5F2ED] pb-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2926]">Presença RSVP</h3>
              <p className="text-xs text-[#8C857B]">Status atual de convidados</p>
            </div>
            <button 
              click-target="to-guests"
              onClick={() => setActiveTab('convidados')}
              className="text-xs text-[#5A5A40] hover:text-[#4a4a34] font-bold flex items-center gap-1 cursor-pointer"
            >
              Ver Convidados <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>

          <div className="h-[200px] relative">
            {totalGuests > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={guestChartData.length > 0 ? guestChartData : defaultGuestChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(guestChartData.length > 0 ? guestChartData : defaultGuestChartData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-sm gap-2 bg-[#F5F2ED]/50 rounded-2xl border border-dashed border-[#E8E2D9]">
                <Users className="w-8 h-8 text-[#8C857B]" />
                <span className="text-xs font-semibold text-[#8C857B]">Nenhum convidado adicionado</span>
              </div>
            )}
            
            {totalGuests > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-2xl font-serif font-bold text-[#5A5A40]">{rsvpPercentage}%</span>
                <span className="text-[9px] text-[#8C857B] font-mono tracking-wider uppercase font-semibold">Confirmados</span>
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4 text-xs font-semibold">
            <div className="flex justify-between items-center bg-[#FDFBF7] px-3 py-1.5 rounded-xl border border-[#E8E2D9]">
              <span className="flex items-center gap-2 font-semibold text-[#2D2926]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]"></span> Confirmados
              </span>
              <span className="font-bold text-[#5A5A40]">{confirmedGuests}</span>
            </div>
            <div className="flex justify-between items-center bg-[#FDFBF7] px-3 py-1.5 rounded-xl border border-[#E8E2D9]">
              <span className="flex items-center gap-2 font-semibold text-[#2D2926]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></span> Pendentes
              </span>
              <span className="font-bold text-[#D4AF37]">{pendingGuests}</span>
            </div>
            <div className="flex justify-between items-center bg-[#5A5A40]/5 px-3 py-1.5 rounded-xl border border-[#5A5A40]/10">
              <span className="flex items-center gap-2 font-semibold text-[#5A5A40]">
                Total Geral
              </span>
              <span className="font-bold text-[#5A5A40]">{totalGuests}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Timeline Quick view & IA Tip row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Next Timeline Milestone Tracker */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#F5F2ED] pb-3">
            <h3 className="font-serif font-bold text-[#2D2926] text-md flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[#5A5A40]" />
              Cronograma do Evento
            </h3>
            <button 
              onClick={() => setActiveTab('cronograma')}
              className="text-xs text-[#5A5A40] hover:text-[#4a4a34] font-bold flex items-center gap-1 cursor-pointer"
            >
              Gerenciar Itinerário <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {cronograma.length > 0 ? (
              cronograma.slice(0, 4).map((item, index) => (
                <div key={item.id} className="flex gap-4 items-start relative group">
                  {index < cronograma.slice(0, 4).length - 1 && (
                    <div className="absolute left-[19px] top-7 bottom-[-15px] w-0.5 bg-[#E8E2D9]"></div>
                  )}
                  <div className="text-xs font-mono font-bold px-2 py-1 bg-[#F5F2ED] border border-[#E8E2D9] rounded-lg text-[#5A5A40] min-w-[50px] text-center">
                    {item.data_hora}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2D2926]">{item.titulo}</h4>
                    {item.descricao && (
                      <p className="text-xs text-[#8C857B] mt-0.5">{item.descricao}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[#8C857B] text-xs">
                Nenhum evento agendado no cronograma.
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Quick advice Card */}
        <div className="bg-gradient-to-br from-[#F5F2ED] to-[#FDFBF7] rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full px-3 py-1 text-[10px] font-bold tracking-wider">
              <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
              IA CONSELHO EXCLUSIVO
            </div>
            <h3 className="text-md font-serif font-bold text-[#2D2926] leading-snug">
              Procurando organizar sua lista de fornecedores?
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed">
              Dica do Atelier: Defina o teto do seu orçamento e divida-o estrategicamente. Um bom planejamento reserva em média de 40% a 50% do capital para o Buffet e o Espaço, 15% para decoração/cenografia, 10% para assessoria e o restante distribuído entre som, luz, vestuário e registros!
            </p>
          </div>

          <button 
            onClick={() => setActiveTab('ia')}
            className="mt-5 w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white text-xs font-bold py-3 px-4 rounded-full transition duration-150 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            Conversar com Assistente Inteligente
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          </button>
        </div>

      </div>
    </div>
  );
}
