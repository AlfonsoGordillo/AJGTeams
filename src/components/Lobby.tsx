import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Globe,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  Sliders,
  Volume2,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { BackgroundModal } from './BackgroundModal';
import { DeviceModal } from './DeviceModal';

interface LobbyProps {
  initialRoomId: string;
  onJoinMeeting: (config: {
    roomId: string;
    userName: string;
    spokenLang: string;
    targetLang: string;
    isMuted: boolean;
    isCameraOff: boolean;
    stream: MediaStream | null;
    backgroundType?: 'none' | 'blur' | 'preset' | 'custom';
    backgroundUrl?: string;
  }) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ initialRoomId, onJoinMeeting }) => {
  const [roomId, setRoomId] = useState(
    initialRoomId ||
      `meet-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`
  );
  const [userName, setUserName] = useState('');
  const [spokenLang, setSpokenLang] = useState('es');
  const [targetLang, setTargetLang] = useState('en');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');

  // Background states
  const [background, setBackground] = useState<{
    type: 'none' | 'blur' | 'preset' | 'custom';
    url?: string;
  }>({ type: 'none' });
  const [customBackgrounds, setCustomBackgrounds] = useState<string[]>([]);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Request camera and microphone for preview with optional device IDs
  const acquireStream = async (camId?: string, micId?: string) => {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: camId ? { deviceId: { exact: camId }, width: 1280, height: 720 } : { width: 1280, height: 720 },
        audio: micId ? { deviceId: { exact: micId } } : true,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }
      return mediaStream;
    } catch (err) {
      console.warn('Microphone or camera not permitted or failed:', err);
      return null;
    }
  };

  useEffect(() => {
    // Generate default random name if empty
    const names = ['Carlos Méndez', 'Alejandro Ramos', 'María Silva', 'Javier Ortega', 'Elena Ruiz'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setUserName(randomName);

    acquireStream();
  }, []);

  const handleSelectCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    acquireStream(deviceId, selectedMicId);
  };

  const handleSelectMic = (deviceId: string) => {
    setSelectedMicId(deviceId);
    acquireStream(selectedCameraId, deviceId);
  };

  const handleSelectSpeaker = (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
  };

  const handleToggleMic = () => {
    setIsMuted(!isMuted);
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
  };

  const handleToggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = isCameraOff));
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    onJoinMeeting({
      roomId: roomId.trim() || 'meet-principal',
      userName: userName.trim(),
      spokenLang,
      targetLang,
      isMuted,
      isCameraOff,
      stream,
      backgroundType: background.type,
      backgroundUrl: background.url,
    });
  };

  const handleGenerateNewRoom = () => {
    const newRoom = `meet-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`;
    setRoomId(newRoom);
  };

  const hasCustomOrPresetBg = (background.type === 'preset' || background.type === 'custom') && background.url;

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md text-lg">
            M
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-100 flex items-center gap-2">
              MeetTranslate
              <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                Gemini 3.8
              </span>
            </h1>
            <p className="text-xs text-gray-400">Traducción simultánea en tiempo real estilo Google Meet</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" />
          <span>WebRTC P2P Seguro</span>
        </div>
      </header>

      {/* Main Lobby Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left: Video Preview Green Room */}
        <div className="w-full lg:w-3/5 flex flex-col items-center">
          <div className="relative w-full aspect-video bg-[#3c4043] rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex items-center justify-center">
            {/* Background layer in preview */}
            {hasCustomOrPresetBg && !isCameraOff && (
              <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${background.url})` }}
              />
            )}

            {!isCameraOff && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] relative z-1 ${
                  background.type === 'blur' ? 'backdrop-blur-md filter blur-[1px]' : ''
                }`}
              />
            ) : (
              <div className="relative z-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-3xl font-semibold text-white shadow-xl">
                  {userName ? userName.slice(0, 2).toUpperCase() : 'MT'}
                </div>
                <p className="mt-3 text-sm text-gray-300">Cámara desactivada</p>
              </div>
            )}

            {/* Bottom floating preview controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-10">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-3 rounded-full text-white transition-all ${
                  isMuted ? 'bg-[#ea4335]' : 'bg-[#3c4043] hover:bg-[#474a4d]'
                }`}
                title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleToggleCamera}
                className={`p-3 rounded-full text-white transition-all ${
                  isCameraOff ? 'bg-[#ea4335]' : 'bg-[#3c4043] hover:bg-[#474a4d]'
                }`}
                title={isCameraOff ? 'Activar cámara' : 'Apagar cámara'}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsBgModalOpen(true)}
                className={`p-3 rounded-full text-white transition-all ${
                  background.type !== 'none'
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-[#3c4043] hover:bg-[#474a4d]'
                }`}
                title="Efectos y Fondos visuales"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsDeviceModalOpen(true)}
                className="p-3 rounded-full text-white bg-[#3c4043] hover:bg-[#474a4d] transition-all"
                title="Configurar y probar Cámara, Micrófono y Parlantes"
              >
                <Sliders className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Device configuration & test shortcut */}
          <button
            type="button"
            onClick={() => setIsDeviceModalOpen(true)}
            className="w-full mt-3 py-3 px-4 bg-[#282a2d] hover:bg-[#323438] border border-gray-700/80 rounded-2xl flex items-center justify-between text-xs text-gray-200 transition-all shadow-md group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Probar Dispositivos (Cámara, Micrófono, Parlantes)
                </p>
                <p className="text-[11px] text-gray-400">
                  Verifica el nivel de tu voz y escucha un sonido de prueba
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Probar ➔
            </span>
          </button>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Comprueba tu audio, cámara y fondo visual antes de ingresar</span>
          </div>
        </div>

        {/* Right: Join Form & Language Configuration */}
        <div className="w-full lg:w-2/5 max-w-md bg-[#282a2d] p-6 sm:p-8 rounded-3xl border border-gray-700 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-100">¿Listo para unirte?</h2>
            <p className="text-xs text-gray-400 mt-1">
              Configura tus idiomas de traducción antes de conectar con tu interlocutor.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Tu nombre
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ej. Alfonso Gordillo"
                className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Room Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Código o enlace de la reunión
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNewRoom}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Nueva sala
                </button>
              </div>
              <input
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="meet-abc-def"
                className="w-full bg-[#1e1f22] text-sm text-white font-mono px-3.5 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Language Pair Selectors */}
            <div className="pt-2 border-t border-gray-700/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-blue-300 font-medium">
                <Globe className="w-3.5 h-3.5" />
                <span>Configuración de Traducción Doble Vía</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Hablo en:
                  </label>
                  <select
                    value={spokenLang}
                    onChange={(e) => setSpokenLang(e.target.value)}
                    className="w-full bg-[#1e1f22] text-xs text-white p-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Escucho / Leo en:
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-[#1e1f22] text-xs text-white p-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-4 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <span>Unirse ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Explanatory Note */}
          <div className="mt-4 p-3 bg-blue-950/30 rounded-xl border border-blue-600/20 text-[11px] text-gray-300 leading-relaxed">
            <span className="font-semibold text-blue-300">💡 Al entrar: </span>
            Recibirás un enlace de invitación generado para enviar por WhatsApp o correo a tu
            interlocutor en otra ciudad.
          </div>
        </div>
      </main>

      {/* Background Modal */}
      <BackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        currentBackground={background}
        onSelectBackground={(bg) => setBackground(bg)}
        customBackgrounds={customBackgrounds}
        onAddCustomBackground={(url) => setCustomBackgrounds((prev) => [url, ...prev])}
      />

      {/* Device Configuration & Testing Modal */}
      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        selectedCameraId={selectedCameraId}
        selectedMicId={selectedMicId}
        selectedSpeakerId={selectedSpeakerId}
        onSelectCamera={handleSelectCamera}
        onSelectMic={handleSelectMic}
        onSelectSpeaker={handleSelectSpeaker}
        activeStream={stream}
      />

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-800">
        Google Meet Translation Prototype • Potenciado con Gemini 3.8 Flash & WebRTC
      </footer>
    </div>
  );
};
