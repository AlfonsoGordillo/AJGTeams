import React from 'react';
import { Participant, TranscriptItem } from '../types';
import { VideoTile } from './VideoTile';
import { Sparkles, Volume2, Globe, VolumeX } from 'lucide-react';
import { getLanguageByCode } from '../constants/languages';

interface VideoGridProps {
  participants: Participant[];
  activeSubtitle: TranscriptItem | null;
  showCaptions: boolean;
  onSpeakSubtitle?: (text: string, lang: string) => void;
  isDubbingActive?: boolean;
  muteOriginalAudio?: boolean;
  onSendUserSpeech?: (text: string) => void;
  onTriggerSarahGreeting?: () => void;
  onToggleMuteOriginalAudio?: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  activeSubtitle,
  showCaptions,
  onSpeakSubtitle,
  isDubbingActive,
  muteOriginalAudio = false,
  onSendUserSpeech,
  onTriggerSarahGreeting,
  onToggleMuteOriginalAudio,
}) => {
  const count = participants.length;

  // Grid layout class based on participant count
  let gridLayout = 'grid-cols-1';
  if (count === 2) {
    gridLayout = 'grid-cols-1 md:grid-cols-2';
  } else if (count >= 3 && count <= 4) {
    gridLayout = 'grid-cols-1 sm:grid-cols-2';
  } else if (count > 4) {
    gridLayout = 'grid-cols-2 md:grid-cols-3';
  }

  const targetLangObj = activeSubtitle ? getLanguageByCode(activeSubtitle.targetLang) : null;
  const sourceLangObj = activeSubtitle ? getLanguageByCode(activeSubtitle.sourceLang) : null;

  return (
    <div className="relative flex-1 w-full h-full p-3 sm:p-4 bg-[#202124] overflow-hidden flex flex-col justify-center items-center">
      {/* Video Tiles Grid */}
      <div className={`grid ${gridLayout} gap-3 sm:gap-4 w-full h-full max-w-7xl max-h-[85vh]`}>
        {participants.map((participant) => (
          <VideoTile
            key={participant.id}
            participant={participant}
            muteOriginalAudio={muteOriginalAudio}
            lastTranscript={activeSubtitle}
            onSendUserSpeech={onSendUserSpeech}
            onTriggerSarahGreeting={onTriggerSarahGreeting}
            onToggleMuteOriginalAudio={onToggleMuteOriginalAudio}
            onSpeakText={onSpeakSubtitle}
          />
        ))}
      </div>

      {/* Floating Live Subtitles (Google Meet Live Captions with Dual-Language Interpretation) */}
      {showCaptions && activeSubtitle && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] md:w-[70%] max-w-3xl z-30 transition-all duration-200">
          <div className="bg-black/85 backdrop-blur-md text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-gray-700/60 ring-1 ring-white/10">
            {/* Subtitle Header */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  {activeSubtitle.speakerName}
                </span>
                <span className="text-gray-400">
                  [{sourceLangObj?.flag} {sourceLangObj?.name}]
                </span>
                <span className="text-gray-500">➔</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  [{targetLangObj?.flag} {targetLangObj?.name}]
                </span>
              </div>

              <div className="flex items-center gap-2">
                {muteOriginalAudio && (
                  <span className="flex items-center gap-1 text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                    <VolumeX className="w-3 h-3 text-purple-400" />
                    Voz original silenciada
                  </span>
                )}

                {isDubbingActive && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Volume2 className="w-3 h-3 animate-bounce" />
                    Doblaje activo
                  </span>
                )}
                {onSpeakSubtitle && (
                  <button
                    onClick={() =>
                      onSpeakSubtitle(
                        activeSubtitle.translatedText,
                        activeSubtitle.targetLang
                      )
                    }
                    className="hover:text-blue-300 text-gray-400 p-1 rounded transition-colors"
                    title="Reproducir traducción por voz"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Translated Main Subtitle (Big, clear, high readability) */}
            <p className="text-base sm:text-lg md:text-xl font-medium text-emerald-300 leading-snug">
              {activeSubtitle.translatedText}
            </p>

            {/* Original Spoken Text (Smaller reference below) */}
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-400 italic">
              <Globe className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" />
              <span>Original: "{activeSubtitle.originalText}"</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
