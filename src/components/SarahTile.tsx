import React, { useState } from 'react';
import {
  Bot,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  MessageCircle,
  HelpCircle,
  Mic,
  RotateCcw,
} from 'lucide-react';
import { Participant, TranscriptItem } from '../types';

interface SarahTileProps {
  participant: Participant;
  lastTranscript?: TranscriptItem | null;
  onSendUserSpeech: (text: string) => void;
  onTriggerSarahGreeting: () => void;
  muteOriginalAudio: boolean;
  onToggleMuteOriginalAudio: () => void;
  onSpeakText: (text: string, lang: string) => void;
}

const QUICK_TEST_PROMPTS = [
  'Hola Sarah, ¿me escuchas bien?',
  '¿Cómo está el clima hoy en Chicago?',
  'Revisemos los puntos clave del contrato',
  'Preséntate y cuéntame sobre tu empresa',
];

export const SarahTile: React.FC<SarahTileProps> = ({
  participant,
  lastTranscript,
  onSendUserSpeech,
  onTriggerSarahGreeting,
  muteOriginalAudio,
  onToggleMuteOriginalAudio,
  onSpeakText,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendUserSpeech(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="relative w-full h-full bg-[#202124] rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-2xl flex flex-col justify-between p-4 sm:p-5 select-none">
      {/* Background Subtle Gradient & Grid Accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-[#282a2d] to-[#1e1f22] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-100">{participant.name}</span>
              <span className="bg-indigo-900/70 border border-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full font-medium">
                Interlocutor AI
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>En vivo • Habla en 🇺🇸 Inglés (US)</span>
            </div>
          </div>
        </div>

        {/* Audio Toggle Shortcut */}
        <button
          type="button"
          onClick={onToggleMuteOriginalAudio}
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
            muteOriginalAudio
              ? 'bg-purple-900/70 border-purple-500 text-purple-200 shadow-sm'
              : 'bg-gray-800/80 hover:bg-gray-700 border-gray-700 text-gray-300'
          }`}
          title={muteOriginalAudio ? 'Solo escuchas la traducción al español' : 'Escuchas la voz en inglés de Sarah'}
        >
          {muteOriginalAudio ? <VolumeX className="w-3.5 h-3.5 text-purple-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="hidden sm:inline">{muteOriginalAudio ? 'Solo Traducción' : 'Voz Inglés + Traducción'}</span>
        </button>
      </div>

      {/* Center: Sarah's Avatar & Active State */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <div className="relative">
          {/* Speaking Pulse Ring */}
          <div
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-2xl flex items-center justify-center ${
              participant.isSpeaking
                ? 'border-emerald-400 ring-8 ring-emerald-500/30 scale-105 shadow-[0_0_30px_rgba(52,211,153,0.4)]'
                : 'border-indigo-500/50 ring-4 ring-indigo-500/10'
            }`}
          >
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
              alt="Sarah from Chicago"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Talking Indicator */}
          {participant.isSpeaking && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              <span>Sarah hablando...</span>
            </div>
          )}
        </div>

        <h3 className="mt-3 text-sm font-semibold text-gray-200">Sarah Taylor</h3>
        <p className="text-xs text-gray-400">Directora de Operaciones Internacionales • Chicago, IL</p>

        {/* Action button to trigger immediate voice greeting */}
        <button
          type="button"
          onClick={onTriggerSarahGreeting}
          className="mt-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>¡Pedir a Sarah que salude por voz!</span>
        </button>
      </div>

      {/* Bottom Section: Quick test suggestions & Direct message to Sarah */}
      <div className="relative z-10 space-y-2.5 pt-2 border-t border-gray-800/80">
        <div>
          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1 mb-1.5">
            <MessageCircle className="w-3 h-3 text-blue-400" />
            Prueba rápida con 1 clic (Tú hablas en español ➔ Sarah responde en inglés):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEST_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendUserSpeech(prompt)}
                className="px-2.5 py-1 bg-gray-800/90 hover:bg-blue-900/40 hover:border-blue-500/50 border border-gray-700/60 rounded-lg text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Direct Text Input for Sarah */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dile algo a Sarah en español..."
            className="flex-1 bg-[#18191c] text-xs text-gray-100 px-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
