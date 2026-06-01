import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialized Gemini client to prevent app crash if API key is missing
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// System instructions for the IA wedding planner
const SYSTEM_INSTRUCTION = `Você é um Assistente de Casamento Inteligente ("IA Wedding Planner") especialista em casamentos brasileiros. 
Seu papel de forma elegante, acolhedora e experiente é ajudar noivos a planejar cada detalhe do casamento.
Você é prático, cordial, otimista e domina todos os aspectos: controle de orçamento, etiqueta, cronograma do grande dia, lista de presentes, ideias criativas de decoração e como lidar com fornecedores.

Ao responder:
1. Responda em Português do Brasil com tom simpático, sofisticado e afetuoso.
2. Dê dicas úteis, concisas e acionáveis.
3. Se o usuário estiver perguntando sobre orçamentos, sugira formas econômicas ou prioridades.
4. Use formatação Markdown (negrito, listas, títulos) para legibilidade.
Mantenha suas respostas calorosas e comemorativas! O casamento é um momento alegre!`;

// API Endpoint for wedding planner assistant chat
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { history, message } = req.body;

    // Check if Gemini API key exists
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        role: "model",
        text: "Olá! Eu sou o seu Assistente IA de Casamento. 🌸 No momento, a chave da API do Gemini (GEMINI_API_KEY) não está configurada neste ambiente nas configurações do AI Studio. No entanto, estou aqui para celebrar o amor! Por favor, configure a chave para que eu possa gerar orientações e planos personalizados usando inteligência artificial."
      });
    }

    const ai = getGemini();

    // Map client chat history into Gemini contents format
    // Format: [{ role: "user" | "model", parts: [{ text: string }] }]
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content || msg.text || "" }]
        });
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Call Gemini API menggunakan model gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "Desculpe, não consegui formular uma resposta.";
    
    return res.json({
      role: "model",
      text: replyText
    });
  } catch (error: any) {
    console.error("Erro no chat do Gemini:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao processar sua pergunta.",
      details: error.message
    });
  }
});

// Setup Vite Dev server middleware or Production asset serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando servidor em modo desenvolvimento com Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando servidor em modo produção...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando com sucesso em http://0.0.0.0:${PORT}`);
  });
}

setupServer();
