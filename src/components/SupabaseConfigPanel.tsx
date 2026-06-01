import React, { useState, useEffect } from 'react';
import { getSupabaseCredentials, SQL_SCHEMA, initializeSupabase } from '../lib/supabase';
import { Database, Copy, Check, Info, Server, HelpCircle, HardDrive } from 'lucide-react';

interface SupabaseConfigPanelProps {
  onConfigChanged: () => void;
  connectionType: 'Supabase' | 'LocalStorage';
}

export default function SupabaseConfigPanel({ onConfigChanged, connectionType }: SupabaseConfigPanelProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setUrl(localStorage.getItem('supabase_url') || '');
    setKey(localStorage.getItem('supabase_key') || '');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && key.trim()) {
      localStorage.setItem('supabase_url', url.trim());
      localStorage.setItem('supabase_key', key.trim());
    } else {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
    }
    initializeSupabase();
    onConfigChanged();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const clearConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    setUrl('');
    setKey('');
    initializeSupabase();
    onConfigChanged();
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="cfg-panel" className="bg-white rounded-2xl border border-stone-200/60 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-stone-100 pb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-stone-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#bfa37a]" />
            Conectividade do Banco de Dados
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Configure seu Supabase em nuvem ou utilize o banco de dados simulado em LocalStorage para testes imediatos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">Status atual:</span>
          {connectionType === 'Supabase' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              NUVEM SUPABASE
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-amber-600" />
              LOCAL STORAGE
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Supabase credentials form */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-600 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-stone-400" />
            Vincular Projeto Supabase
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Supabase URL (Ex: http://xxxx.supabase.co)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://suas-credenciais.supabase.co"
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#bfa37a]/30 focus:border-[#bfa37a] bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Supabase Anon Key / Public Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here..."
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#bfa37a]/30 focus:border-[#bfa37a] bg-stone-50/50 font-mono text-xs"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#2c2523] text-white hover:bg-[#3d3330] text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Conectar ao Supabase
              </button>
              {(url || key) && (
                <button
                  type="button"
                  onClick={clearConfig}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  Reiniciar Local
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Configurações gravadas! O adaptador de dados recarregou em formato {connectionType}.
              </div>
            )}
          </form>

          <div className="mt-5 p-4 bg-stone-50 border border-stone-200 rounded-xl">
            <h4 className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-[#bfa37a]" />
              Como configurar as tabelas rápidas:
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Para fazer o aplicativo funcionar na sua nuvem, crie um projeto gratuito no <strong>Supabase</strong>, vá até o <strong>SQL Editor</strong>, cole o script de herança estrutural ao lado e execute-o. Depois é só colar a URL e a Anon Key acima.
            </p>
          </div>
        </div>

        {/* PostgreSQL SQL Script generator */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1">
              Esquema de Tabelas SQL (PostgreSQL)
            </h3>
            <button
              onClick={handleCopySchema}
              className="text-stone-500 hover:text-[#bfa37a] hover:bg-stone-100 p-1.5 rounded-md flex items-center gap-1 text-xs transition duration-150 border border-stone-200/55 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copiado!
                </                >
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Estrutura SQL
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-stone-900 border border-stone-800 rounded-xl p-4 overflow-hidden relative group">
            <div className="absolute right-4 top-4 opacity-50 text-stone-500 text-[10px] font-mono pointer-events-none select-none">
              SQL EDITOR
            </div>
            <pre className="text-[11px] font-mono text-stone-300 overflow-y-auto h-[220px] leading-relaxed scrollbar-thin select-all">
              {SQL_SCHEMA}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
