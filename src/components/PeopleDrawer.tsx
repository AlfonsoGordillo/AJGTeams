import React from 'react';
import { X, Users, Mic, MicOff, Video, VideoOff, Globe, Bot } from 'lucide-react';
import { Participant } from '../types';
import { getLanguageByCode } from '../constants/languages';

interface PeopleDrawerProps {
  participants: Participant[];
  currentUser: Participant;
  onClose: () => void;
}

export const PeopleDrawer: React.FC<PeopleDrawerProps> = ({
  participants,
  onClose,
}) => {
  return (
    <div className="w-80 sm:w-96 bg-[#202124] border-l border-gray-800 text-white flex flex-col h-full z-40 select-none shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-medium">Personas ({participants.length})</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.map((p) => {
          const spoken = getLanguageByCode(p.spokenLang);
          const target = getLanguageByCode(p.targetLang);

          return (
            <div
              key={p.id}
              className="p-3 bg-[#282a2d] rounded-xl border border-gray-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    p.isSpeaking
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  {p.isVirtual ? <Bot className="w-5 h-5 text-indigo-300" /> : p.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-100">
                      {p.name}
                    </span>
                    {p.isLocal && (
                      <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-medium">
                        Tú
                      </span>
                    )}
                    {p.isVirtual && (
                      <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded font-medium">
                        Simulador AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Globe className="w-3 h-3 text-gray-500" />
                    <span>Habla: {spoken.flag} {spoken.name}</span>
                    <span>➔</span>
                    <span>Escucha: {target.flag} {target.name}</span>
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-2 text-gray-400">
                {p.isMuted ? (
                  <MicOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Mic className="w-4 h-4 text-emerald-400" />
                )}
                {p.isCameraOff ? (
                  <VideoOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Video className="w-4 h-4 text-gray-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
