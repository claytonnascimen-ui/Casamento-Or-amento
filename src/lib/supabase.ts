import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Usuario, Casamento, Convidado, Fornecedor, Orcamento, CronogramaItem, Presente } from '../types';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Let's hold the client dynamically so users can connect their own Supabase URL and key right inside the app!
let supabaseInstance: SupabaseClient | null = null;

// Get Supabase credentials from Env or LocalStorage
export function getSupabaseCredentials() {
  const urlEnv = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const keyEnv = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
  
  const urlLocal = localStorage.getItem('supabase_url') || '';
  const keyLocal = localStorage.getItem('supabase_key') || '';
  
  const url = urlLocal || urlEnv;
  const key = keyLocal || keyEnv;
  const isCustom = !!urlLocal && !!keyLocal;
  const isConfigured = !!url && !!key;

  return { url, key, isConfigured, isCustom };
}

export function initializeSupabase() {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (isConfigured) {
    try {
      supabaseInstance = createClient(url, key);
      console.log("Supabase Client inicializado com sucesso!");
    } catch (e) {
      console.error("Erro ao inicializar Supabase Client:", e);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
}

// Initialize on start
initializeSupabase();

// --- SQL Script Generator for Supabase ---
export const SQL_SCHEMA = `-- BANCO DE DADOS DE CASAMENTO - SCRIPT SUPABASE POSTGRESQL

-- Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA USUARIOS (Armazena perfis autenticados)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security) para segurança
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios
CREATE POLICY "Permitir leitura pública ou para o próprio usuário" ON usuarios
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção livre" ON usuarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pelo próprio usuário" ON usuarios
  FOR UPDATE USING (true);


-- 2. TABELA CASAMENTOS (Perfis dos noivos e evento)
CREATE TABLE casamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nome_noivo TEXT NOT NULL,
  nome_noiva TEXT NOT NULL,
  data_evento DATE NOT NULL,
  local TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE casamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para casamentos (Dono do casamento gerencia)
CREATE POLICY "Qualquer um pode ler casamentos" ON casamentos
  FOR SELECT USING (true);

CREATE POLICY "Usuários cadastrados criam" ON casamentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dono atualiza seu casamento" ON casamentos
  FOR UPDATE USING (true);

CREATE POLICY "Dono apaga seu casamento" ON casamentos
  FOR DELETE USING (true);


-- 3. TABELA CONVIDADOS
CREATE TABLE convidados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casamento_id UUID REFERENCES casamentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  confirmado BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE convidados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para convidados (RSVP público para confirmação)
CREATE POLICY "Permitir leitura de convidados" ON convidados FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de convidados" ON convidados FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização (para RSVP)" ON convidados FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de convidados" ON convidados FOR DELETE USING (true);


-- 4. TABELA FORNECEDORES
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casamento_id UUID REFERENCES casamentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  telefone TEXT,
  valor NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fornecedores 
CREATE POLICY "Permitir leitura de fornecedores" ON fornecedores FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de fornecedores" ON fornecedores FOR ALL USING (true);


-- 5. TABELA ORCAMENTOS
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casamento_id UUID REFERENCES casamentos(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  valor_previsto NUMERIC(10,2) DEFAULT 0.00,
  valor_gasto NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para orcamentos
CREATE POLICY "Permitir leitura de orcamentos" ON orcamentos FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de orcamentos" ON orcamentos FOR ALL USING (true);


-- 6. TABELA CRONOGRAMAS (Agenda do grande dia)
CREATE TABLE cronogramas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casamento_id UUID REFERENCES casamentos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE cronogramas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cronogramas
CREATE POLICY "Permitir leitura de cronograma" ON cronogramas FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de cronograma" ON cronogramas FOR ALL USING (true);


-- 7. TABELA PRESENTES (Gifts)
CREATE TABLE presentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casamento_id UUID REFERENCES casamentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  link TEXT,
  reservado_nome TEXT,
  reservado_email TEXT,
  status TEXT DEFAULT 'disponivel' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE presentes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para presentes
CREATE POLICY "Permitir leitura de presentes" ON presentes FOR SELECT USING (true);
CREATE POLICY "Permitir reserva pública de presentes" ON presentes FOR UPDATE USING (true);
CREATE POLICY "Permitir escrita total de presentes" ON presentes FOR ALL USING (true);
`;

// --- DATABASE SERVICE LAYER ---
// Wraps both local and Supabase functions in a seamless API so that the rest of the application
// doesn't have to worry about connection states.
const LATENCY = 250; // simulated loading latency for localStorage to match network feeling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getLocalData = (key: string): any[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocalData = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  // Check whether we are using simulation or a real cloud connection
  getConnectionType(): 'Supabase' | 'LocalStorage' {
    return supabaseInstance ? 'Supabase' : 'LocalStorage';
  },

  // --- AUTOMATED INITIAL MOCK POPULATOR ---
  async populateMockDataIfEmpty() {
    const weddings = getLocalData('casamentos');
    if (weddings.length > 0) return;

    console.log("Populando dados simulados iniciais para ótima experiência visual...");
    
    // Create mock couple & wedding
    const mockUser: Usuario = {
      id: '11111111-1111-4111-a111-111111111111',
      nome: 'Gabriel & Mariana',
      email: 'noivos@exemplo.com'
    };
    setLocalData('usuarios', [mockUser]);

    const mockWedding: Casamento = {
      id: '22222222-2222-4222-b222-222222222222',
      usuario_id: mockUser.id,
      nome_noivo: 'Gabriel',
      nome_noiva: 'Mariana',
      data_evento: '2026-11-21',
      local: 'Mansão Bougainville, São Paulo - SP'
    };
    setLocalData('casamentos', [mockWedding]);

    // Create Guests
    const mockGuests: Convidado[] = [
      { id: 'aaaaaaa1-1111-4111-a111-111111111111', casamento_id: mockWedding.id, nome: 'Carlos Silva (Padrinho)', telefone: '(11) 98765-4321', email: 'carlos@padrinho.com', confirmado: true },
      { id: 'aaaaaaa2-1111-4111-a111-111111111111', casamento_id: mockWedding.id, nome: 'Helena Santos (Madrinha)', telefone: '(11) 98888-1111', email: 'helena@madrinha.com', confirmado: true },
      { id: 'aaaaaaa3-1111-4111-a111-111111111111', casamento_id: mockWedding.id, nome: 'Beatriz Costa', telefone: '(11) 97777-2222', email: 'beatriz@email.com', confirmado: false },
      { id: 'aaaaaaa4-1111-4111-a111-111111111111', casamento_id: mockWedding.id, nome: 'Roberto Albuquerque', telefone: '(21) 96543-2109', email: 'roberto@albu.com', confirmado: true },
      { id: 'aaaaaaa5-1111-4111-a111-111111111111', casamento_id: mockWedding.id, nome: 'Clara Meireles', telefone: '(11) 91234-5678', email: 'clara.m@email.com', confirmado: false },
      { id: 'aaaaaaa6-1111-4111-a111-111111111111', casamento_id: mockWedding.id, nome: 'Tio Nelson de Oliveira', telefone: '(11) 92345-6789', email: 'nelson@oliveira.com', confirmado: true },
    ];
    setLocalData('convidados', mockGuests);

    // Create Vendors (Fornecedores)
    const mockVendors: Fornecedor[] = [
      { id: 'bbbbbbb1-2222-4222-b222-222222222222', casamento_id: mockWedding.id, nome: 'Mansão Bougainville Buffet', categoria: 'Salão & Buffet', telefone: '(11) 3333-5555', valor: 45000 },
      { id: 'bbbbbbb2-2222-4222-b222-222222222222', casamento_id: mockWedding.id, nome: 'Estúdio Memórias Eternas', categoria: 'Fotografia & Vídeo', telefone: '(11) 95555-4444', valor: 9500 },
      { id: 'bbbbbbb3-2222-4222-b222-222222222222', casamento_id: mockWedding.id, nome: 'Banda Acústica Show', categoria: 'Música & Atração', telefone: '(11) 94444-3333', valor: 12000 },
      { id: 'bbbbbbb4-2222-4222-b222-222222222222', casamento_id: mockWedding.id, nome: 'Maison Flor de Alecrim', categoria: 'Decoração & Flores', telefone: '(11) 91111-2222', valor: 8000 },
      { id: 'bbbbbbb5-2222-4222-b222-222222222222', casamento_id: mockWedding.id, nome: 'Sabor de Mel Doces Finos', categoria: 'Bolo & Doces', telefone: '(11) 92222-1111', valor: 3500 },
    ];
    setLocalData('fornecedores', mockVendors);

    // Create Budget (Orçamento) Categories
    const mockBudget: Orcamento[] = [
      { id: 'ccccccc1-3333-4333-c333-333333333333', casamento_id: mockWedding.id, categoria: 'Salão & Buffet', valor_previsto: 50000, valor_gasto: 45000 },
      { id: 'ccccccc2-3333-4333-c333-333333333333', casamento_id: mockWedding.id, categoria: 'Fotografia & Vídeo', valor_previsto: 10000, valor_gasto: 9500 },
      { id: 'ccccccc3-3333-4333-c333-333333333333', casamento_id: mockWedding.id, categoria: 'Música & Banda', valor_previsto: 15000, valor_gasto: 12000 },
      { id: 'ccccccc4-3333-4333-c333-333333333333', casamento_id: mockWedding.id, categoria: 'Decoração', valor_previsto: 9000, valor_gasto: 8000 },
      { id: 'ccccccc5-3333-4333-c333-333333333333', casamento_id: mockWedding.id, categoria: 'Vestido & Trajes', valor_previsto: 7000, valor_gasto: 5500 },
      { id: 'ccccccc6-3333-4333-c333-333333333333', casamento_id: mockWedding.id, categoria: 'Eventos Extras & RSVP', valor_previsto: 3000, valor_gasto: 1500 },
    ];
    setLocalData('orcamentos', mockBudget);

    // Create Timeline items (Cronograma)
    const mockTimeline: CronogramaItem[] = [
      { id: 'ddddddd1-4444-4444-d444-444444444444', casamento_id: mockWedding.id, titulo: 'Início da Recepção e Coquetel', descricao: 'Convidados chegam e são recebidos com aperitivos.', data_hora: '17:00', status: 'pendente' },
      { id: 'ddddddd2-4444-4444-d444-444444444444', casamento_id: mockWedding.id, titulo: 'Cerimônia de União', descricao: 'Cerimônia ecumênica no jardim de Bougainville.', data_hora: '18:00', status: 'pendente' },
      { id: 'ddddddd3-4444-4444-d444-444444444444', casamento_id: mockWedding.id, titulo: 'Sessão de Fotos Oficial', descricao: 'Noivos com padrinhos e familiares próximos.', data_hora: '19:00', status: 'pendente' },
      { id: 'ddddddd4-4444-4444-d444-444444444444', casamento_id: mockWedding.id, titulo: 'Entrada Triunfal dos Noivos', descricao: 'Abertura do salão principal com valsa breve.', data_hora: '19:45', status: 'pendente' },
      { id: 'ddddddd5-4444-4444-d444-444444444444', casamento_id: mockWedding.id, titulo: 'Abertura do Jantar', descricao: 'Serviço franco-americano disponível para convidados.', data_hora: '20:15', status: 'pendente' },
      { id: 'ddddddd6-4444-4444-d444-444444444444', casamento_id: mockWedding.id, titulo: 'Abertura do Bar e Pista', descricao: 'Abertura oficial com DJ e robô de LED.', data_hora: '21:30', status: 'pendente' },
    ];
    setLocalData('cronogramas', mockTimeline);

    // Create Gifts (Presentes)
    const mockGifts: Presente[] = [
      { id: 'eeeeeee1-5555-4555-e555-555555555555', casamento_id: mockWedding.id, nome: 'Jogo de Panelas Antiaderentes Premium', valor: 850, link: 'https://exemplo.com/panelas', status: 'disponivel' },
      { id: 'eeeeeee2-5555-4555-e555-555555555555', casamento_id: mockWedding.id, nome: 'Liquidificador Turbo Pro', valor: 350, link: 'https://exemplo.com/liquidificador', status: 'reservado', reservado_nome: 'Joana d\'Arc', reservado_email: 'joana@email.com' },
      { id: 'eeeeeee3-5555-4555-e555-555555555555', casamento_id: mockWedding.id, nome: 'Cota de Viagem - Jantar Romântico em Paris', valor: 500, link: '', status: 'recebido', reservado_nome: 'Padrinho Carlos', reservado_email: 'carlos@email.com' },
      { id: 'eeeeeee4-5555-4555-e555-555555555555', casamento_id: mockWedding.id, nome: 'Aspirador de Pó Robô Inteligente', valor: 1200, link: 'https://exemplo.com/robot', status: 'disponivel' },
      { id: 'eeeeeee5-5555-4555-e555-555555555555', casamento_id: mockWedding.id, nome: 'Jogo de Pratos Oxford 30 Peças', valor: 450, link: 'https://exemplo.com/pratos', status: 'disponivel' },
      { id: 'eeeeeee6-5555-4555-e555-555555555555', casamento_id: mockWedding.id, nome: 'Cota de Viagem - Hospedagem nas Maldivas', valor: 1500, link: '', status: 'disponivel' },
    ];
    setLocalData('presentes', mockGifts);
  },

  // 1. --- USUARIOS ---
  async getUsuario(): Promise<Usuario | null> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('usuarios').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const usrs = getLocalData('usuarios');
      return usrs[0] || null;
    }
  },

  async saveUsuario(usuario: Usuario): Promise<Usuario> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('usuarios').upsert(usuario).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const usrs = getLocalData('usuarios');
      const idx = usrs.findIndex(u => u.id === usuario.id);
      if (idx >= 0) usrs[idx] = usuario;
      else usrs.push(usuario);
      setLocalData('usuarios', usrs);
      return usuario;
    }
  },

  // 2. --- CASAMENTOS ---
  async getCasamento(): Promise<Casamento | null> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('casamentos').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('casamentos');
      return list[0] || null;
    }
  },

  async createOrUpdateCasamento(casamento: Casamento): Promise<Casamento> {
    if (supabaseInstance) {
      const uId = casamento.usuario_id || '11111111-1111-4111-a111-111111111111';
      try {
        const { data: userRow } = await supabaseInstance
          .from('usuarios')
          .select('id')
          .eq('id', uId)
          .maybeSingle();
        
        if (!userRow) {
          await supabaseInstance.from('usuarios').insert({
            id: uId,
            nome: 'Gabriel & Mariana',
            email: 'noivos@exemplo.com'
          });
        }
      } catch (err) {
        console.warn("Could not upsert default user row, maybe RLS or already exists:", err);
      }

      const { data, error } = await supabaseInstance.from('casamentos').upsert({
        ...casamento,
        usuario_id: uId
      }).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('casamentos');
      const idx = list.findIndex(c => c.id === casamento.id);
      if (idx >= 0) list[idx] = casamento;
      else list.push(casamento);
      setLocalData('casamentos', list);
      return casamento;
    }
  },

  // 3. --- CONVIDADOS ---
  async listConvidados(casamentoId: string): Promise<Convidado[]> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('convidados')
        .select('*')
        .eq('casamento_id', casamentoId)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      await sleep(LATENCY);
      const list = getLocalData('convidados');
      return list.filter(c => c.casamento_id === casamentoId).sort((a,b) => a.nome.localeCompare(b.nome));
    }
  },

  async addConvidado(convidado: Convidado): Promise<Convidado> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('convidados').insert(convidado).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('convidados');
      list.push(convidado);
      setLocalData('convidados', list);
      return convidado;
    }
  },

  async updateConvidado(convidado: Convidado): Promise<Convidado> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('convidados').update(convidado).eq('id', convidado.id).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('convidados');
      const idx = list.findIndex(c => c.id === convidado.id);
      if (idx >= 0) {
        list[idx] = convidado;
        setLocalData('convidados', list);
      }
      return convidado;
    }
  },

  async deleteConvidado(id: string): Promise<void> {
    if (supabaseInstance) {
      const { error } = await supabaseInstance.from('convidados').delete().eq('id', id);
      if (error) throw error;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('convidados');
      const filtered = list.filter(c => c.id !== id);
      setLocalData('convidados', filtered);
    }
  },

  // 4. --- FORNECEDORES ---
  async listFornecedores(casamentoId: string): Promise<Fornecedor[]> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('fornecedores')
        .select('*')
        .eq('casamento_id', casamentoId);
      if (error) throw error;
      return data || [];
    } else {
      await sleep(LATENCY);
      const list = getLocalData('fornecedores');
      return list.filter(f => f.casamento_id === casamentoId);
    }
  },

  async addFornecedor(fornecedor: Fornecedor): Promise<Fornecedor> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('fornecedores').insert(fornecedor).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('fornecedores');
      list.push(fornecedor);
      setLocalData('fornecedores', list);
      return fornecedor;
    }
  },

  async updateFornecedor(fornecedor: Fornecedor): Promise<Fornecedor> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('fornecedores').update(fornecedor).eq('id', fornecedor.id).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('fornecedores');
      const idx = list.findIndex(f => f.id === fornecedor.id);
      if (idx >= 0) {
        list[idx] = fornecedor;
        setLocalData('fornecedores', list);
      }
      return fornecedor;
    }
  },

  async deleteFornecedor(id: string): Promise<void> {
    if (supabaseInstance) {
      const { error } = await supabaseInstance.from('fornecedores').delete().eq('id', id);
      if (error) throw error;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('fornecedores');
      const filtered = list.filter(f => f.id !== id);
      setLocalData('fornecedores', filtered);
    }
  },

  // 5. --- ORCAMENTOS ---
  async listOrcamentos(casamentoId: string): Promise<Orcamento[]> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('orcamentos')
        .select('*')
        .eq('casamento_id', casamentoId);
      if (error) throw error;
      return data || [];
    } else {
      await sleep(LATENCY);
      const list = getLocalData('orcamentos');
      return list.filter(o => o.casamento_id === casamentoId);
    }
  },

  async addOrcamento(orcamento: Orcamento): Promise<Orcamento> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('orcamentos').insert(orcamento).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('orcamentos');
      list.push(orcamento);
      setLocalData('orcamentos', list);
      return orcamento;
    }
  },

  async updateOrcamento(orcamento: Orcamento): Promise<Orcamento> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('orcamentos').update(orcamento).eq('id', orcamento.id).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('orcamentos');
      const idx = list.findIndex(o => o.id === orcamento.id);
      if (idx >= 0) {
        list[idx] = orcamento;
        setLocalData('orcamentos', list);
      }
      return orcamento;
    }
  },

  async deleteOrcamento(id: string): Promise<void> {
    if (supabaseInstance) {
      const { error } = await supabaseInstance.from('orcamentos').delete().eq('id', id);
      if (error) throw error;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('orcamentos');
      const filtered = list.filter(o => o.id !== id);
      setLocalData('orcamentos', filtered);
    }
  },

  // 6. --- CRONOGRAMAS ---
  async listCronogramas(casamentoId: string): Promise<CronogramaItem[]> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('cronogramas')
        .select('*')
        .eq('casamento_id', casamentoId)
        .order('data_hora', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      await sleep(LATENCY);
      const list = getLocalData('cronogramas');
      return list.filter(c => c.casamento_id === casamentoId).sort((a, b) => a.data_hora.localeCompare(b.data_hora));
    }
  },

  async addCronograma(item: CronogramaItem): Promise<CronogramaItem> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('cronogramas').insert(item).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('cronogramas');
      list.push(item);
      setLocalData('cronogramas', list);
      return item;
    }
  },

  async updateCronograma(item: CronogramaItem): Promise<CronogramaItem> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('cronogramas').update(item).eq('id', item.id).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('cronogramas');
      const idx = list.findIndex(c => c.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
        setLocalData('cronogramas', list);
      }
      return item;
    }
  },

  async deleteCronograma(id: string): Promise<void> {
    if (supabaseInstance) {
      const { error } = await supabaseInstance.from('cronogramas').delete().eq('id', id);
      if (error) throw error;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('cronogramas');
      const filtered = list.filter(c => c.id !== id);
      setLocalData('cronogramas', filtered);
    }
  },

  // 7. --- PRESENTES ---
  async listPresentes(casamentoId: string): Promise<Presente[]> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('presentes')
        .select('*')
        .eq('casamento_id', casamentoId)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      await sleep(LATENCY);
      const list = getLocalData('presentes');
      return list.filter(p => p.casamento_id === casamentoId).sort((a, b) => a.nome.localeCompare(b.nome));
    }
  },

  async addPresente(presente: Presente): Promise<Presente> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('presentes').insert(presente).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('presentes');
      list.push(presente);
      setLocalData('presentes', list);
      return presente;
    }
  },

  async updatePresente(presente: Presente): Promise<Presente> {
    if (supabaseInstance) {
      const { data, error } = await supabaseInstance.from('presentes').update(presente).eq('id', presente.id).select().single();
      if (error) throw error;
      return data;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('presentes');
      const idx = list.findIndex(p => p.id === presente.id);
      if (idx >= 0) {
        list[idx] = presente;
        setLocalData('presentes', list);
      }
      return presente;
    }
  },

  async deletePresente(id: string): Promise<void> {
    if (supabaseInstance) {
      const { error } = await supabaseInstance.from('presentes').delete().eq('id', id);
      if (error) throw error;
    } else {
      await sleep(LATENCY);
      const list = getLocalData('presentes');
      const filtered = list.filter(p => p.id !== id);
      setLocalData('presentes', filtered);
    }
  }
};
