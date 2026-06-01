import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Bot, Reply, RotateCcw } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PRESET_PROMPTS = [
  { label: 'Etiqueta RSVP', text: 'Me sugira 3 mensagens educadas e eficientes em português para enviar aos convidados via WhatsApp cobrando a confirmação de presença (RSVP).' },
  { label: 'Divisão de Orçamento', text: 'Como costuma ser dividida a porcentagem de orçamento de casamento? Qual a porcentagem média gasta em Buffet, Decoração, Foto/Vídeo e Vestido?' },
  { label: 'Sugestões de Cardápio', text: 'Sugira 3 ideias criativas de finger foods ou pratos inovadores para uma recepção de casamento que ocorre às 17h00 no horário de verão.' },
  { label: 'Brincadeiras Cortar Gravata', text: 'Ideias elegantes e modernas para a brincadeira de arrecadação do sapato da noiva ou gravata do noivo sem constranger os convidados.' }
];

export default function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Que alegria conversar com você. 🌸 Eu sou o seu **Assistente IA de Planejamento de Casamento**.\n\nEstou aqui para ajudar com qualquer dúvida sobre o grande dia: desde a formulação de mensagens elegantes de cobrança RSVP, sugestão de divisões de orçamento, até ideias lúdicas e cronograma de cerimônia.\n\nComo posso ser útil na jornada de hoje?'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages,
          message: textToSend
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com o servidor de inteligência.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.text || 'Lamentavelmente, não obtive uma resposta estruturada.'
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Ocorreu um problema ao conversar com a Inteligência Artificial. Por favor, verifique se o servidor Express está rodando adequadamente ou tente enviar a mensagem novamente.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
    }
  };

  const handleRestartChat = () => {
    if (window.confirm('Deseja reiniciar a conversa com a IA?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Olá! Que alegria conversar com você. 🌸 Eu sou o seu **Assistente IA de Planejamento de Casamento**. Como posso ser útil na jornada de hoje?'
        }
      ]);
    }
  };

  return (
    <div id="ai-assistant" className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm max-w-4xl mx-auto flex flex-col h-[580px]">
      
      {/* Bot Chat Header */}
      <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#5A5A40]/15 text-[#5A5A40] rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-stone-800">Wedding Planner Inteligente (IA)</h3>
            <p className="text-[10px] text-stone-400 font-mono">POWERED BY GEMINI 3.5 FLASH</p>
          </div>
        </div>

        <button
          onClick={handleRestartChat}
          className="p-2 hover:bg-stone-50 border border-stone-150 rounded-lg text-stone-500 hover:text-stone-700 transition cursor-pointer"
          title="Reiniciar conversa"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Message History Scroller */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin scroll-smooth p-2.5 bg-stone-50/40 rounded-xl border border-stone-100">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              
              {!isUser && (
                <div className="p-1.5 bg-[#5A5A40] text-white rounded-lg mt-1 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-xs border ${
                isUser 
                  ? 'bg-[#5A5A40] text-stone-100 border-[#5A5A40] rounded-tr-none' 
                  : 'bg-white text-stone-800 border-stone-200/60 rounded-tl-none whitespace-pre-wrap'
              }`}>
                {m.content}
              </div>

            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="p-1.5 bg-[#5A5A40] text-white rounded-lg mt-1 shrink-0">
              <Bot className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-stone-200/60 rounded-tl-none max-w-[85%] shadow-xs">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-stone-300 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-stone-300 animate-bounce delay-200"></span>
                <span className="text-xs text-stone-400 ml-1">IA está formulando ideias elegantes...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Preset prompt pills */}
      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono mb-2 font-bold">Ideias de assuntos para começar:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p, index) => (
              <button
                key={index}
                onClick={() => sendMessage(p.text)}
                className="text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-[#5A5A40]/15 hover:border-[#5A5A40]/30 text-xs px-3 py-1.5 rounded-lg border border-stone-200/40 font-medium transition cursor-pointer"
              >
                {p.label} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Message box row */}
      <div className="flex gap-2">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Pergunte ao assessor sobre controle de custos, rsvp, decorações..."
          rows={1}
          className="flex-1 text-sm bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:bg-white resize-none max-h-[100px] scrollbar-thin"
        />
        <button
          onClick={() => sendMessage(userInput)}
          disabled={!userInput.trim() || loading}
          className="bg-[#5A5A40] hover:bg-[#4a4a34] text-stone-100 p-3 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
