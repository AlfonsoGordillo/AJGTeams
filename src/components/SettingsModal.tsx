import React from 'react';
import {
  X,
  Settings,
  Globe,
  Volume2,
  VolumeX,
  Wifi,
  Sparkles,
  Shield,
  HelpCircle,
  Headphones,
  Sliders,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spokenLang: string;
  targetLang: string;
  isDubbingActive: boolean;
  muteOriginalAudio: boolean;
  useGeminiTTS: boolean;
  selectedVoice: string;
  isOffline: boolean;
  onOpenDeviceModal?: () => void;
  onSpokenLangChange: (lang: string) => void;
  onTargetLangChange: (lang: string) => void;
  onDubbingToggle: (active: boolean) => void;
  onMuteOriginalAudioToggle: (active: boolean) => void;
  onUseGeminiTTSToggle: (useGemini: boolean) => void;
  onSelectedVoiceChange: (voice: string) => void;
  onOfflineToggle: (offline: boolean) => void;
}

const GEMINI_VOICES = [
  { name: 'Kore', desc: 'Voz femenina cálida y articulada' },
  { name: 'Puck', desc: 'Voz masculina conversacional y enérgica' },
  { name: 'Charon', desc: 'Voz masculina profunda y ejecutiva' },
  { name: 'Fenrir', desc: 'Voz masculina firme y formal' },
  { name: 'Zephyr', desc: 'Voz femenina suave y clara' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  spokenLang,
  targetLang,
  isDubbingActive,
  muteOriginalAudio,
  useGeminiTTS,
  selectedVoice,
  isOffline,
  onOpenDeviceModal,
  onSpokenLangChange,
  onTargetLangChange,
  onDubbingToggle,
  onMuteOriginalAudioToggle,
  onUseGeminiTTSToggle,
  onSelectedVoiceChange,
  onOfflineToggle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-gray-700 w-full max-w-lg rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex items-center justify-between bg-[#282a2d]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold">Configuración de MeetTranslate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] text-sm">
          {/* Section 0: Devices (Camera, Mic, Speakers) */}
          <div className="p-4 bg-[#282a2d] border border-gray-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-gray-200">Dispositivos y Pruebas de Audio / Video</span>
              </div>
              {onOpenDeviceModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeviceModal();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Probar dispositivos</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Selecciona tu cámara web, comprueba el nivel de entrada de tu micrófono con el medidor visual en tiempo real y prueba el sonido de tus parlantes o auriculares.
            </p>
          </div>

          {/* Section 1: Audio & Translation Isolation */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-purple-400" />
              Canales de Audio y Mezcla
            </h3>

            {/* Mute original audio toggle */}
            <div className="flex items-center justify-between p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-purple-400" />
                  Apagar la voz original (Solo oír la traducción)
                </span>
                <span className="text-[11px] text-gray-300 mt-0.5 block leading-relaxed">
                  Silencia el canal de audio del interlocutor para escuchar únicamente la traducción simultánea nítida y sin interferencia de eco.
                </span>
              </div>
              <input
                type="checkbox"
                checked={muteOriginalAudio}
                onChange={(e) => onMuteOriginalAudioToggle(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded bg-gray-700 border-gray-600 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Section 2: Languages */}
          <div className="space-y-4 pt-2 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              Configuración de Idiomas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Mi idioma al hablar (Micrófono)
                </label>
                <select
                  value={spokenLang}
                  onChange={(e) => onSpokenLangChange(e.target.value)}
                  className="w-full bg-[#2d2f34] text-xs text-white border border-gray-700 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  El idioma en el que hablarás durante la llamada.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Mi idioma al escuchar/leer (Subtítulos)
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => onTargetLangChange(e.target.value)}
                  className="w-full bg-[#2d2f34] text-xs text-white border border-gray-700 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  El idioma al que se traducirá lo que digan otros.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Voice Dubbing (TTS) */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Doblaje Simultáneo por Voz (TTS)
            </h3>

            <div className="flex items-center justify-between p-3 bg-[#282a2d] rounded-xl border border-gray-800">
              <div>
                <span className="text-xs font-medium text-gray-200 block">
                  Reproducir doblaje de audio traducido
                </span>
                <span className="text-[11px] text-gray-400">
                  Escucha la traducción hablada simultáneamente cuando tu interlocutor hable.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isDubbingActive}
                onChange={(e) => onDubbingToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded bg-gray-700 border-gray-600"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-300">
                Motor de Síntesis de Voz
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUseGeminiTTSToggle(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    useGeminiTTS
                      ? 'bg-blue-950/40 border-blue-500 text-white'
                      : 'bg-[#282a2d] border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs text-blue-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini 3.8 Flash Lite TTS</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Voz neuronal de alta naturalidad y entonación humana.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onUseGeminiTTSToggle(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !useGeminiTTS
                      ? 'bg-blue-950/40 border-blue-500 text-white'
                      : 'bg-[#282a2d] border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs text-gray-200">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Web Speech Synthesis</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Latencia instantánea local en el navegador.
                  </p>
                </button>
              </div>
            </div>

            {useGeminiTTS && (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Voz Neuronal de Gemini
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => onSelectedVoiceChange(e.target.value)}
                  className="w-full bg-[#2d2f34] text-xs text-white border border-gray-700 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} — {v.desc}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 4: Offline Mode */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-amber-400" />
              Modo Offline y Resiliencia
            </h3>

            <div className="flex items-center justify-between p-3 bg-[#282a2d] rounded-xl border border-gray-800">
              <div>
                <span className="text-xs font-medium text-gray-200 block">
                  Simular / Activar Modo Offline
                </span>
                <span className="text-[11px] text-gray-400">
                  Usa diccionario local y reconocimiento en el dispositivo ante caídas de red.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isOffline}
                onChange={(e) => onOfflineToggle(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#282a2d] border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
