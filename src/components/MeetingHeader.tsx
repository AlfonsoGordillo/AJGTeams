import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Users, Copy, Check, Wifi, Globe2, AlertTriangle } from 'lucide-react';
import { Participant } from '../types';
import { getLanguageByCode } from '../constants/languages';
import { getPublicMeetingUrl } from '../utils/url';

interface MeetingHeaderProps {
  roomId: string;
  participants: Participant[];
  currentUser: Participant;
  isOffline: boolean;
  hasGeminiKey?: boolean | null;
  onOpenInvite: () => void;
  onOpenParticipants: () => void;
  onOpenApiStatus?: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  roomId,
  participants,
  currentUser,
  isOffline,
  hasGeminiKey = true,
  onOpenInvite,
  onOpenParticipants,
  onOpenApiStatus,
}) => {
  const [time, setTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    const url = getPublicMeetingUrl(roomId);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const spokenLangObj = getLanguageByCode(currentUser.spokenLang);
  const targetLangObj = getLanguageByCode(currentUser.targetLang);

  return (
    <header className="h-14 px-4 bg-[#202124] text-white flex items-center justify-between border-b border-gray-800 select-none z-20">
      {/* Left: Meeting title and code */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            M
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-200">MeetTranslate</span>
              <span className="text-xs text-gray-400 font-mono tracking-wider">
                {roomId}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                title="Copiar enlace de reunión"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>En vivo</span>
              <span>•</span>
              <span>{time}</span>
            </div>
          </div>
        </div>

        {/* Translation Status Badge with API Key Health */}
        <button
          type="button"
          onClick={onOpenApiStatus}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            hasGeminiKey
              ? 'bg-blue-950/60 border-blue-500/30 text-blue-300 hover:bg-blue-900/60'
              : 'bg-red-950/60 border-red-500/40 text-red-300 hover:bg-red-900/60 animate-pulse'
          }`}
          title="Haz clic para comprobar la API Key de Gemini y probar traducciones"
        >
          {hasGeminiKey ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Gemini 3.8: Activo</span>
              <span className="bg-blue-900/80 px-1.5 py-0.5 rounded text-[10px] text-blue-200 uppercase font-mono">
                {spokenLangObj.flag} {spokenLangObj.code} ➔ {targetLangObj.flag} {targetLangObj.code}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="font-semibold text-red-200">Sin API Key (Clic para activar)</span>
            </>
          )}
        </button>

        {/* Offline Badge if active */}
        {isOffline && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300 text-xs">
            <Wifi className="w-3 h-3 text-amber-400" />
            <span>Modo Offline</span>
          </div>
        )}
      </div>

      {/* Right: Security, People count, Share button */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800/60 px-2.5 py-1 rounded-full border border-gray-700/50"
          title="Conexión P2P WebRTC con cifrado TLS/DTLS"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cifrado WebRTC</span>
        </div>

        <button
          onClick={onOpenParticipants}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 transition-colors"
        >
          <Users className="w-4 h-4 text-gray-300" />
          <span>{participants.length}</span>
        </button>

        <button
          onClick={onOpenInvite}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Invitar interlocutor</span>
          <span className="sm:hidden">Invitar</span>
        </button>
      </div>
    </header>
  );
};
