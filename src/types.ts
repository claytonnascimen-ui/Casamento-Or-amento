/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface Casamento {
  id: string;
  usuario_id: string;
  nome_noivo: string;
  nome_noiva: string;
  data_evento: string; // ISO date string (YYYY-MM-DD)
  local: string;
}

export interface Convidado {
  id: string;
  casamento_id: string;
  nome: string;
  telefone: string;
  email: string;
  confirmado: boolean; // RSVP status
}

export interface Fornecedor {
  id: string;
  casamento_id: string;
  nome: string;
  categoria: string;
  telefone: string;
  valor: number;
}

export interface Orcamento {
  id: string;
  casamento_id: string;
  categoria: string;
  valor_previsto: number;
  valor_gasto: number;
}

// Additional useful tables for complete functionality
export interface CronogramaItem {
  id: string;
  casamento_id: string;
  titulo: string;
  descricao: string;
  data_hora: string; // ISO time or text representation
  status: 'pendente' | 'concluido';
}

export interface Presente {
  id: string;
  casamento_id: string;
  nome: string;
  valor: number; // For cash dynamic gifts or physical guides
  link?: string;
  reservado_nome?: string;
  reservado_email?: string;
  status: 'disponivel' | 'reservado' | 'recebido';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isActive: boolean;
}
