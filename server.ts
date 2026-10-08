import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google Gemini API with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to generate text with model fallback (handles temporary 503 high-demand spikes)
async function generateGeminiText(prompt: string, primaryModel = 'gemini-3.8-flash'): Promise<string> {
  const modelsToTry = [primaryModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} unavailable (${err?.status || err?.message || 'unknown error'}), attempting fallback model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All model fallbacks failed');
}

interface RoomParticipant {
  id: string;
  name: string;
  spokenLang: string;
  targetLang: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
}

interface PeerConnection {
  ws: WebSocket;
  participant: RoomParticipant;
}

// In-memory room store: roomId -> Map<peerId, PeerConnection>
const rooms = new Map<string, Map<string, PeerConnection>>();

// Store meeting transcripts: roomId -> array of messages
const roomTranscripts = new Map<string, Array<{
  id: string;
  speakerId: string;
  speakerName: string;
  originalText: string;
  sourceLang: string;
  translatedText: string;
  targetLang: string;
  timestamp: string;
}>>();

// WebSocket Server
const wss = new WebSocketServer({ server });

function broadcastToRoom(roomId: string, message: any, excludePeerId?: string | null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const [peerId, conn] of room.entries()) {
    if (excludePeerId && peerId === excludePeerId) continue;
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentPeerId: string | null = null;

  ws.on('message', async (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'join_room': {
          const { roomId, peerId, participant } = msg;
          currentRoomId = roomId;
          currentPeerId = peerId;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }
          const room = rooms.get(roomId)!;

          // Add to room
          room.set(peerId, { ws, participant });

          // Send current peers to joining user
          const existingPeers: RoomParticipant[] = [];
          for (const [id, conn] of room.entries()) {
            if (id !== peerId) {
              existingPeers.push(conn.participant);
            }
          }

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId,
            peerId,
            peers: existingPeers,
            transcripts: roomTranscripts.get(roomId) || [],
          }));

          // Notify other peers
          broadcastToRoom(roomId, {
            type: 'peer_joined',
            peer: participant,
          }, peerId);

          break;
        }

        case 'webrtc_signal': {
          // Relay WebRTC offer / answer / ice-candidate
          const { roomId, targetPeerId, signal } = msg;
          const room = rooms.get(roomId);
          if (room && targetPeerId) {
            const targetConn = room.get(targetPeerId);
            if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
              targetConn.ws.send(JSON.stringify({
                type: 'webrtc_signal',
                senderPeerId: currentPeerId,
                signal,
              }));
            }
          }
          break;
        }

        case 'speech_transcript': {
          const { roomId, transcript } = msg;
          if (!roomTranscripts.has(roomId)) {
            roomTranscripts.set(roomId, []);
          }
          const history = roomTranscripts.get(roomId)!;
          history.push(transcript);
          // Keep maximum 500 lines per room
          if (history.length > 500) history.shift();

          // Broadcast to everyone in room
          broadcastToRoom(roomId, {
            type: 'speech_transcript',
            transcript,
          });
          break;
        }

        case 'participant_update': {
          const { roomId, participant } = msg;
          const room = rooms.get(roomId);
          if (room && currentPeerId) {
            const conn = room.get(currentPeerId);
            if (conn) {
              conn.participant = { ...conn.participant, ...participant };
            }
            broadcastToRoom(roomId, {
              type: 'participant_update',
              peerId: currentPeerId,
              participant,
            }, currentPeerId);
          }
          break;
        }

        case 'chat_message': {
          const { roomId, chat } = msg;
          broadcastToRoom(roomId, {
            type: 'chat_message',
            chat,
          });
          break;
        }

        case 'pdf_sync': {
          const { roomId, pdfState } = msg;
          broadcastToRoom(roomId, {
            type: 'pdf_sync',
            senderPeerId: currentPeerId,
            pdfState,
          }, currentPeerId);
          break;
        }

        case 'virtual_partner_request': {
          // Interactive test partner when testing alone
          const { roomId, userText, userLang, partnerLang, partnerName } = msg;
          try {
            // Generate conversational reply in partnerLang
            const promptReply = `You are ${partnerName || 'Sarah from Chicago'}, an international business colleague in a live Google Meet call. 
The user just said (in ${userLang}): "${userText}". 
Reply naturally and concisely (1-2 sentences) in ${partnerLang} as a friendly participant in the video call.
Do not include any quotes, stage directions, or roleplay labels. Just your direct spoken response.`;

            let replyText = 'I hear you clearly! The live translation is working smoothly.';
            try {
              const res = await generateGeminiText(promptReply, 'gemini-3.8-flash');
              if (res) replyText = res.trim();
            } catch (err) {
              console.warn('Virtual partner reply generation failed, using canned response');
            }

            // Also translate reply to userLang
            const promptTranslation = `Translate the following conversational sentence into ${userLang}. Provide ONLY the translation:
"${replyText}"`;

            let translatedReply = replyText;
            try {
              const transRes = await generateGeminiText(promptTranslation, 'gemini-3.8-flash');
              if (transRes) translatedReply = transRes.trim();
            } catch (err) {
              console.warn('Virtual partner translation failed, using original reply');
            }

            const partnerTranscript = {
              id: `vp-${Date.now()}`,
              speakerId: 'virtual-partner',
              speakerName: partnerName || 'Sarah (Chicago, US)',
              originalText: replyText,
              sourceLang: partnerLang,
              translatedText: translatedReply,
              targetLang: userLang,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };

            if (!roomTranscripts.has(roomId)) {
              roomTranscripts.set(roomId, []);
            }
            roomTranscripts.get(roomId)!.push(partnerTranscript);

            broadcastToRoom(roomId, {
              type: 'virtual_partner_speech',
              transcript: partnerTranscript,
            });
          } catch (err) {
            console.error('Error generating virtual partner response:', err);
          }
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentPeerId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.delete(currentPeerId);
        broadcastToRoom(currentRoomId, {
          type: 'peer_left',
          peerId: currentPeerId,
        });
        if (room.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});

// REST API Endpoints

// 1. Live Translation Endpoint with Gemini 3.8 Flash & Automatic Fallback
app.post('/api/translate', async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and targetLang are required' });
  }

  // If source and target are the same language code, return original
  if (sourceLang && sourceLang.toLowerCase() === targetLang.toLowerCase()) {
    return res.json({ translatedText: text });
  }

  const prompt = `You are a real-time conversational interpreter in a live video call.
Translate the following speech from ${sourceLang || 'auto-detected language'} into ${targetLang}.
Maintain natural spoken conversational flow, colloquial accuracy, correct tone, and expressiveness.
Return ONLY the direct translation text. Do not add quotes, explanation, or tags.

Speech to translate:
"${text}"`;

  try {
    const translatedText = await generateGeminiText(prompt, 'gemini-3.8-flash');
    res.json({ translatedText: translatedText.trim() || text });
  } catch (err: any) {
    console.warn('Translation models busy or failed, using graceful fallback:', err?.message || err);
    // Return original text gracefully with 200 OK so frontend is uninterrupted
    res.json({ translatedText: text, isFallback: true });
  }
});

// 2. Text-to-Speech Endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Voice options: Puck, Charon, Kore, Fenrir, Zephyr
    const selectedVoice = voiceName || 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 400), // optimal segment size for live interpretation
              speechMetadata: {
                style: 'Clear, natural, professional interpreter speech',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      return res.json({ audioBase64: null, warning: 'No audio generated by model' });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType,
    });
  } catch (err: any) {
    console.warn('TTS generation error, defaulting to client Web Speech Synthesis:', err?.message || err);
    res.json({ audioBase64: null, warning: 'TTS fallback to browser' });
  }
});

// 3. Summarize Meeting Transcripts (Minuta Ejecutiva de la Reunión)
app.post('/api/summarize', async (req, res) => {
  try {
    const { transcripts, meetingTitle } = req.body;
    if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
      return res.status(400).json({ error: 'No transcript lines provided' });
    }

    const formattedConversation = transcripts
      .map((t: any) => `[${t.timestamp}] ${t.speakerName} (${t.sourceLang}): "${t.originalText}" -> [Traducción ${t.targetLang}]: "${t.translatedText}"`)
      .join('\n');

    const prompt = `Actúa como asistente ejecutivo y redactor de minutas corporativas en Google Meet.
Analiza la siguiente transcripción completa de una videollamada multilingüe con traducción simultánea (${meetingTitle || 'Reunión MeetTranslate'}):

${formattedConversation}

Genera un informe ejecutivo estructurado en español con el siguiente formato Markdown:
# 📋 Minuta Ejecutiva de la Reunión
## 🎯 Resumen General
(2-3 párrafos con los puntos medulares tratados)

## 🗣️ Dinámica de Idiomas y Traducción
(Idiomas involucrados, eficacia de la comunicación bidireccional y fluidez observada)

## 📌 Acuerdos y Decisiones Clave
(Lista de decisiones consensuadas)

## 🚀 Plan de Acción y Tareas (Action Items)
(Tabla con: Tarea | Responsable sugerido | Estado/Prioridad)

## 💡 Observaciones y Próximos Pasos
(Recomendaciones para el seguimiento)`;

    const summary = await generateGeminiText(prompt, 'gemini-3.8-flash');
    res.json({ summary });
  } catch (err: any) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message || 'Summarization failed' });
  }
});

// 4. Document / PDF Real-Time Translation Endpoint
app.post('/api/translate-doc', async (req, res) => {
  try {
    const { content, targetLang } = req.body;
    if (!content || !targetLang) {
      return res.status(400).json({ error: 'Content and targetLang are required' });
    }

    const prompt = `Translate the following document section into ${targetLang}. 
Keep bullet points, headings, numbering, and structure intact.
Provide a clean, professional, publication-ready translation:

${content}`;

    const translatedContent = await generateGeminiText(prompt, 'gemini-3.8-flash');
    res.json({ translatedContent });
  } catch (err: any) {
    console.error('Document translation error:', err);
    res.status(500).json({ error: err.message || 'Document translation failed' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
  const distDir = path.resolve('dist');
  const indexHtml = path.resolve('dist', 'index.html');
  const hasBuiltDist = fs.existsSync(indexHtml);

  if (isProduction && hasBuiltDist) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(indexHtml);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(port, () => {
    console.log(`MeetTranslate server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
