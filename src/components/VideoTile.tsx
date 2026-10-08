import React from 'react';
import { MicOff, Pin, Hand, Bot, Monitor, Sparkles, VolumeX } from 'lucide-react';
import { Participant, TranscriptItem } from '../types';
import { getLanguageByCode } from '../constants/languages';
import { VirtualBackgroundVideo } from './VirtualBackgroundVideo';
import { SarahTile } from './SarahTile';

interface VideoTileProps {
  participant: Participant;
  isPinned?: boolean;
  onTogglePin?: () => void;
  muteOriginalAudio?: boolean;
  lastTranscript?: TranscriptItem | null;
  onSendUserSpeech?: (text: string) => void;
  onTriggerSarahGreeting?: () => void;
  onToggleMuteOriginalAudio?: () => void;
  onSpeakText?: (text: string, lang: string) => void;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  isPinned,
  onTogglePin,
  muteOriginalAudio = false,
  lastTranscript,
  onSendUserSpeech,
  onTriggerSarahGreeting,
  onToggleMuteOriginalAudio,
  onSpeakText,
}) => {
  // If this participant is the Virtual Partner Sarah, render the interactive SarahTile!
  if (participant.isVirtual) {
    return (
      <SarahTile
        participant={participant}
        lastTranscript={lastTranscript}
        onSendUserSpeech={onSendUserSpeech || (() => {})}
        onTriggerSarahGreeting={onTriggerSarahGreeting || (() => {})}
        muteOriginalAudio={muteOriginalAudio}
        onToggleMuteOriginalAudio={onToggleMuteOriginalAudio || (() => {})}
        onSpeakText={onSpeakText || (() => {})}
      />
    );
  }

  const spokenLang = getLanguageByCode(participant.spokenLang);
  const targetLang = getLanguageByCode(participant.targetLang);

  // Avatar initials
  const initials = participant.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isAudioMuted = participant.isLocal || muteOriginalAudio;

  return (
    <div
      className={`relative w-full h-full bg-[#3c4043] rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all ${
        participant.isSpeaking
          ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
          : 'border-transparent'
      }`}
    >
      {/* Dedicated Remote Audio element guaranteeing loud and clear voice playback */}
      {!participant.isLocal && participant.stream && (
        <audio
          autoPlay
          playsInline
          ref={(el) => {
            if (el) {
              const targetStream = participant.stream || null;
              if (el.srcObject !== targetStream) {
                el.srcObject = targetStream;
              }
              el.muted = muteOriginalAudio;
              el.play().catch((err) => console.warn('Remote audio play warning:', err));
            }
          }}
        />
      )}

      {/* Video Stream with Virtual Background Segmentation */}
      {!participant.isCameraOff && participant.stream ? (
        <VirtualBackgroundVideo
          stream={participant.stream}
          backgroundType={participant.backgroundType || 'none'}
          backgroundUrl={participant.backgroundUrl}
          isLocal={participant.isLocal}
          isScreenShare={participant.isScreenShare}
          isMuted={isAudioMuted}
        />
      ) : (
        /* Avatar Placeholder when camera is off */
        <div className="relative z-1 flex flex-col items-center justify-center select-none">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-semibold text-white shadow-xl transition-transform ${
              participant.isSpeaking
                ? 'scale-105 ring-4 ring-blue-400 bg-gradient-to-tr from-blue-700 to-indigo-600'
                : 'bg-gradient-to-tr from-slate-700 to-slate-800'
            }`}
          >
            {initials}
          </div>
          <p className="mt-3 text-sm font-medium text-gray-200">
            {participant.name} {participant.isLocal && '(Tú)'}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            <span>{spokenLang.flag} {spokenLang.name}</span>
            <span>➔</span>
            <span>{targetLang.flag} {targetLang.name}</span>
          </div>
        </div>
      )}

      {/* Top badges: Screen Share, Hand Raise, Virtual Background indicator, Pin */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
        {participant.isScreenShare && (
          <div className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
            <Monitor className="w-3.5 h-3.5" />
            <span>Pantalla Compartida</span>
          </div>
        )}
        {participant.backgroundType && participant.backgroundType !== 'none' && (
          <div className="bg-black/60 backdrop-blur-md text-blue-300 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 border border-blue-500/30 shadow">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Fondo Virtual Activo</span>
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        {!participant.isLocal && muteOriginalAudio && (
          <div
            className="bg-purple-950/80 border border-purple-500/40 text-purple-300 px-2 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 shadow-lg"
            title="Audio original apagado: Solo se reproduce la interpretación de voz"
          >
            <VolumeX className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Solo Traducción</span>
          </div>
        )}

        {participant.isHandRaised && (
          <div className="bg-amber-500 text-white p-1.5 rounded-full shadow-lg animate-bounce">
            <Hand className="w-4 h-4 fill-white" />
          </div>
        )}

        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-full transition-colors ${
              isPinned
                ? 'bg-blue-600 text-white'
                : 'bg-black/40 text-gray-300 hover:text-white hover:bg-black/60'
            }`}
            title={isPinned ? 'Desanclar' : 'Fijar en pantalla'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom overlay: Name pill, Mute state, Speaking sound wave */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 max-w-[85%] z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-medium">
          {/* Speaking Audio Wave Pulse */}
          {participant.isSpeaking ? (
            <div className="flex items-center gap-0.5 h-3.5">
              <span className="w-1 bg-emerald-400 rounded-full animate-sound-wave-1"></span>
              <span className="w-1 bg-emerald-400 rounded-full animate-sound-wave-2"></span>
              <span className="w-1 bg-emerald-400 rounded-full animate-sound-wave-3"></span>
            </div>
          ) : (
            participant.isMuted && (
              <span className="text-red-400">
                <MicOff className="w-3.5 h-3.5" />
              </span>
            )
          )}

          <span className="truncate">
            {participant.name} {participant.isLocal && '(Tú)'}
          </span>

          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-300 flex items-center gap-1">
            {spokenLang.flag} {spokenLang.code.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};
