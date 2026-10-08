import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Subtitles,
  Hand,
  PhoneOff,
  Info,
  Users,
  MessageSquare,
  FileText,
  Settings,
  Volume2,
  VolumeX,
  Bot,
  Send,
  Sparkles,
  Monitor,
  Image as ImageIcon,
  Sliders,
} from 'lucide-react';
import { Participant } from '../types';
import { getLanguageByCode } from '../constants/languages';

interface BottomControlsProps {
  currentUser: Participant;
  participantCount: number;
  unreadCount?: number;
  showCaptions: boolean;
  isDubbingActive: boolean;
  isVirtualPartnerActive: boolean;
  isScreenSharing: boolean;
  muteOriginalAudio: boolean;
  activeDrawer: string | null;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleCaptions: () => void;
  onToggleHand: () => void;
  onToggleDubbing: () => void;
  onToggleMuteOriginalAudio: () => void; // Apagar la voz original, solo oir la traduccion
  onToggleVirtualPartner: () => void;
  onOpenScreenShareModal: () => void;
  onStopScreenShare: () => void;
  onOpenBackgroundModal: () => void;
  onToggleDrawer: (drawerName: string) => void;
  onOpenSettings: () => void;
  onOpenDeviceModal: () => void;
  onOpenDocumentStudio: () => void;
  onLeaveCall: () => void;
  onSendQuickSpeech: (text: string) => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  currentUser,
  participantCount,
  showCaptions,
  isDubbingActive,
  isVirtualPartnerActive,
  isScreenSharing,
  muteOriginalAudio,
  activeDrawer,
  onToggleMic,
  onToggleCamera,
  onToggleCaptions,
  onToggleHand,
  onToggleDubbing,
  onToggleMuteOriginalAudio,
  onToggleVirtualPartner,
  onOpenScreenShareModal,
  onStopScreenShare,
  onOpenBackgroundModal,
  onToggleDrawer,
  onOpenSettings,
  onOpenDeviceModal,
  onOpenDocumentStudio,
  onLeaveCall,
  onSendQuickSpeech,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [showQuickInput, setShowQuickInput] = useState(false);

  const spokenLangObj = getLanguageByCode(currentUser.spokenLang);
  const targetLangObj = getLanguageByCode(currentUser.targetLang);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onSendQuickSpeech(quickInput.trim());
      setQuickInput('');
      setShowQuickInput(false);
    }
  };

  return (
    <div className="relative h-20 bg-[#202124] px-4 sm:px-6 flex items-center justify-between border-t border-gray-800 z-30 select-none">
      {/* Left: Language Pair info, Quick Speech, Solo traducción toggle */}
      <div className="hidden lg:flex items-center gap-2.5">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 bg-[#303134] hover:bg-[#3c4043] text-gray-200 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-700 transition-colors"
          title="Cambiar idiomas de traducción"
        >
          <span className="flex items-center gap-1">
            <span>{spokenLangObj.flag}</span>
            <span className="font-semibold">{spokenLangObj.code.toUpperCase()}</span>
          </span>
          <span className="text-gray-400">➔</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span>{targetLangObj.flag}</span>
            <span className="font-semibold">{targetLangObj.code.toUpperCase()}</span>
          </span>
        </button>

        {/* Mute original voice shortcut button */}
        <button
          onClick={onToggleMuteOriginalAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            muteOriginalAudio
              ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-sm'
              : 'bg-[#303134] hover:bg-[#3c4043] border-gray-700 text-gray-300'
          }`}
          title={
            muteOriginalAudio
              ? 'Voz original apagada: Solo escuchas la traducción'
              : 'Haz clic para silenciar la voz original y solo escuchar la traducción limpia'
          }
        >
          {muteOriginalAudio ? (
            <VolumeX className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span>{muteOriginalAudio ? 'Solo Traducción Activo' : 'Apagar voz original'}</span>
        </button>

        <button
          onClick={() => setShowQuickInput(!showQuickInput)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
            showQuickInput
              ? 'bg-blue-600 text-white'
              : 'bg-[#303134] hover:bg-[#3c4043] text-gray-300'
          }`}
          title="Escribir frase para traducir y hablar en vivo"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Frase rápida</span>
        </button>
      </div>

      {/* Center: Main Google Meet Call Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 mx-auto">
        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          className={`p-3 sm:p-3.5 rounded-full text-white transition-all shadow-md ${
            currentUser.isMuted
              ? 'bg-[#ea4335] hover:bg-[#d93025]'
              : 'bg-[#3c4043] hover:bg-[#474a4d]'
          }`}
          title={currentUser.isMuted ? 'Activar micrófono' : 'Desactivar micrófono'}
        >
          {currentUser.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera toggle */}
        <button
          onClick={onToggleCamera}
          className={`p-3 sm:p-3.5 rounded-full text-white transition-all shadow-md ${
            currentUser.isCameraOff
              ? 'bg-[#ea4335] hover:bg-[#d93025]'
              : 'bg-[#3c4043] hover:bg-[#474a4d]'
          }`}
          title={currentUser.isCameraOff ? 'Activar cámara' : 'Desactivar cámara'}
        >
          {currentUser.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Background Visual Effects */}
        <button
          onClick={onOpenBackgroundModal}
          className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
            currentUser.backgroundType && currentUser.backgroundType !== 'none'
              ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
              : 'bg-[#3c4043] text-gray-300 hover:bg-[#474a4d]'
          }`}
          title="Cambiar fondo visual o desenfocar"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Share Screen */}
        <button
          onClick={isScreenSharing ? onStopScreenShare : onOpenScreenShareModal}
          className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
            isScreenSharing
              ? 'bg-blue-600 text-white hover:bg-blue-500 ring-2 ring-blue-400/50 animate-pulse'
              : 'bg-[#3c4043] text-gray-300 hover:bg-[#474a4d]'
          }`}
          title={isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla (con o sin sonido)'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Captions CC toggle */}
        <button
          onClick={onToggleCaptions}
          className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
            showCaptions
              ? 'bg-blue-600 text-white hover:bg-blue-500 ring-2 ring-blue-400/50'
              : 'bg-[#3c4043] text-gray-300 hover:bg-[#474a4d]'
          }`}
          title={showCaptions ? 'Ocultar subtítulos' : 'Mostrar subtítulos en vivo'}
        >
          <Subtitles className="w-5 h-5" />
        </button>

        {/* Dubbing Voice Synthesis toggle */}
        <button
          onClick={onToggleDubbing}
          className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
            isDubbingActive
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 ring-2 ring-emerald-400/50'
              : 'bg-[#3c4043] text-gray-400 hover:bg-[#474a4d]'
          }`}
          title={isDubbingActive ? 'Doblaje por voz activo' : 'Activar doblaje por voz de traducción'}
        >
          {isDubbingActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Raise hand toggle */}
        <button
          onClick={onToggleHand}
          className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
            currentUser.isHandRaised
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-[#3c4043] text-gray-300 hover:bg-[#474a4d]'
          }`}
          title={currentUser.isHandRaised ? 'Bajar la mano' : 'Levantar la mano'}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Solo Test Partner Mode (Sarah from US) */}
        <button
          onClick={onToggleVirtualPartner}
          className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all shadow-md ${
            isVirtualPartnerActive
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 ring-2 ring-indigo-400/50'
              : 'bg-[#3c4043] text-gray-300 hover:bg-[#474a4d]'
          }`}
          title="Simula un interlocutor internacional en inglés para probar la traducción simultánea tú solo"
        >
          <Bot className="w-4 h-4 text-indigo-300" />
          <span className="hidden xl:inline">
            {isVirtualPartnerActive ? 'Sarah (EN) Activa' : 'Probar con Sarah'}
          </span>
        </button>

        {/* End Call button */}
        <button
          onClick={onLeaveCall}
          className="p-3 sm:px-5 py-3 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white flex items-center gap-2 font-medium text-sm shadow-md transition-all ml-1"
          title="Salir de la llamada"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>

      {/* Right: Drawer Triggers (Info, People, Chat/Transcript, PDF Doc, Settings) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Info & Invite Link Drawer */}
        <button
          onClick={() => onToggleDrawer('invite')}
          className={`p-2.5 rounded-full transition-colors ${
            activeDrawer === 'invite'
              ? 'bg-blue-600/30 text-blue-400'
              : 'text-gray-300 hover:bg-[#3c4043]'
          }`}
          title="Detalles y enlace de invitación"
        >
          <Info className="w-5 h-5" />
        </button>

        {/* People List Drawer */}
        <button
          onClick={() => onToggleDrawer('people')}
          className={`p-2.5 rounded-full relative transition-colors ${
            activeDrawer === 'people'
              ? 'bg-blue-600/30 text-blue-400'
              : 'text-gray-300 hover:bg-[#3c4043]'
          }`}
          title="Participantes en la llamada"
        >
          <Users className="w-5 h-5" />
          {participantCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {participantCount}
            </span>
          )}
        </button>

        {/* Chat & Transcript Drawer */}
        <button
          onClick={() => onToggleDrawer('transcript')}
          className={`p-2.5 rounded-full transition-colors ${
            activeDrawer === 'transcript'
              ? 'bg-blue-600/30 text-blue-400'
              : 'text-gray-300 hover:bg-[#3c4043]'
          }`}
          title="Transcripto y mensajes"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* PDF / Document Translation Studio */}
        <button
          onClick={onOpenDocumentStudio}
          className="p-2.5 rounded-full text-emerald-400 hover:bg-[#3c4043] transition-colors"
          title="Traducción de Documentos y PDF en tiempo real"
        >
          <FileText className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-full text-gray-300 hover:bg-[#3c4043] transition-colors"
          title="Configuración de idiomas y audio"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Device Settings & Testing (Camera, Mic, Speakers) */}
        <button
          onClick={onOpenDeviceModal}
          className="p-2.5 rounded-full text-gray-300 hover:bg-[#3c4043] hover:text-emerald-400 transition-colors"
          title="Configurar y probar Dispositivos (Cámara, Micrófono y Parlantes)"
        >
          <Sliders className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      {/* Floating Quick Speech Input Bar (if open) */}
      {showQuickInput && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[90%] sm:w-[500px] bg-[#2d2f34] p-2 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-2 z-40">
          <form onSubmit={handleQuickSubmit} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Habla o escribe aquí en español para traducir en vivo..."
              className="flex-1 bg-[#1e1f22] text-sm text-white px-3.5 py-2 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
