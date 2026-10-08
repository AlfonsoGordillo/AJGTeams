import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Mic,
  Volume2,
  Check,
  RefreshCw,
  Play,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCameraId?: string;
  selectedMicId?: string;
  selectedSpeakerId?: string;
  onSelectCamera: (deviceId: string) => void;
  onSelectMic: (deviceId: string) => void;
  onSelectSpeaker: (deviceId: string) => void;
  activeStream?: MediaStream | null;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  selectedCameraId = '',
  selectedMicId = '',
  selectedSpeakerId = '',
  onSelectCamera,
  onSelectMic,
  onSelectSpeaker,
  activeStream,
}) => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [sinkIdSupported, setSinkIdSupported] = useState(false);

  // Testing states
  const [micLevel, setMicLevel] = useState(0); // 0 to 100
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
  const [speakerTestVolume, setSpeakerTestVolume] = useState(0.8);
  const [localCamStream, setLocalCamStream] = useState<MediaStream | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check sinkId support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = document.createElement('audio');
      setSinkIdSupported(typeof (audio as any).setSinkId === 'function');
    }
  }, []);

  // Enumerate devices
  const loadDevices = async () => {
    try {
      // First ensure permission prompt if not yet granted
      if (!cameras.length && !microphones.length) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          tempStream.getTracks().forEach((t) => t.stop());
        } catch (e) {
          // Permissions might already be decided or partial
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

      setCameras(videoDevices);
      setMicrophones(audioInputs);
      setSpeakers(audioOutputs);

      if (!selectedCameraId && videoDevices.length > 0) {
        onSelectCamera(videoDevices[0].deviceId);
      }
      if (!selectedMicId && audioInputs.length > 0) {
        onSelectMic(audioInputs[0].deviceId);
      }
      if (!selectedSpeakerId && audioOutputs.length > 0) {
        onSelectSpeaker(audioOutputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Error loading media devices:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  // Handle Camera Preview Stream
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let streamToClose: MediaStream | null = null;

    async function startCameraPreview() {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamToClose = stream;
        setLocalCamStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          previewVideoRef.current.play().catch(console.warn);
        }
      } catch (err) {
        console.warn('Camera preview failed:', err);
      }
    }

    startCameraPreview();

    return () => {
      isMounted = false;
      if (streamToClose) {
        streamToClose.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, selectedCameraId]);

  // Handle Microphone Testing (VU Meter)
  useEffect(() => {
    if (!isOpen) {
      setMicLevel(0);
      return;
    }

    let isMounted = true;

    async function startMicMeter() {
      try {
        const audioConstraints: boolean | MediaTrackConstraints = selectedMicId
          ? { deviceId: { exact: selectedMicId } }
          : true;

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false,
        });

        if (!isMounted) {
          micStream.getTracks().forEach((t) => t.stop());
          return;
        }

        micStreamRef.current = micStream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const source = ctx.createMediaStreamSource(micStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Scale average (0-255) to 0-100%
          const normalized = Math.min(100, Math.round((average / 100) * 100));
          setMicLevel(normalized);

          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      } catch (err) {
        console.warn('Mic meter setup error:', err);
      }
    }

    startMicMeter();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.warn);
      }
    };
  }, [isOpen, selectedMicId]);

  // Test Speaker Functionality
  const handleTestSpeaker = async () => {
    if (isTestingSpeaker) return;
    setIsTestingSpeaker(true);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // If setSinkId is supported and a speaker is selected
      if (selectedSpeakerId && (ctx as any).setSinkId) {
        try {
          await (ctx as any).setSinkId(selectedSpeakerId);
        } catch (e) {
          console.warn('setSinkId failed on AudioContext:', e);
        }
      }

      // Play a pleasing 3-tone harmonic chime (C5 - E5 - G5)
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Do - Mi - Sol - Do agudo

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.2);

        gain.gain.setValueAtTime(0, now + index * 0.2);
        gain.gain.linearRampToValueAtTime(0.3 * speakerTestVolume, now + index * 0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.2 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.2);
        osc.stop(now + index * 0.2 + 0.6);
      });

      // Also speak a brief confirmation utterance
      setTimeout(() => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('Prueba de audio completada. Tus parlantes están activos.');
          utterance.lang = 'es-ES';
          utterance.volume = speakerTestVolume;
          window.speechSynthesis.speak(utterance);
        }
      }, 900);

      setTimeout(() => {
        setIsTestingSpeaker(false);
      }, 2500);
    } catch (err) {
      console.warn('Error during speaker test:', err);
      setIsTestingSpeaker(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-gray-700 w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex items-center justify-between bg-[#282a2d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Configuración y Prueba de Dispositivos</h2>
              <p className="text-xs text-gray-400">Selecciona y prueba tu cámara, micrófono y parlantes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDevices}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              title="Buscar nuevos dispositivos conectados"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Detectar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* SECTION 1: CÁMARA */}
          <div className="bg-[#282a2d] border border-gray-700/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Cámara (Entrada de Video)
              </label>
              <span className="text-[11px] text-gray-400">
                {cameras.length} {cameras.length === 1 ? 'cámara disponible' : 'cámaras disponibles'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <select
                  value={selectedCameraId}
                  onChange={(e) => onSelectCamera(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {cameras.length === 0 ? (
                    <option value="">Cámara predeterminada del sistema</option>
                  ) : (
                    cameras.map((cam, idx) => (
                      <option key={cam.deviceId || idx} value={cam.deviceId}>
                        {cam.label || `Cámara ${idx + 1}`}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-gray-400">
                  Vista previa en directo de la cámara seleccionada:
                </p>
              </div>

              {/* Video Preview Tile */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 shadow-inner flex items-center justify-center">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-gray-300 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En vivo</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: MICRÓFONO CON VU-METRO */}
          <div className="bg-[#282a2d] border border-gray-700/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                Micrófono (Entrada de Audio)
              </label>
              <span className="text-[11px] text-gray-400">
                {microphones.length} {microphones.length === 1 ? 'micrófono disponible' : 'micrófonos disponibles'}
              </span>
            </div>

            <div className="space-y-3">
              <select
                value={selectedMicId}
                onChange={(e) => onSelectMic(e.target.value)}
                className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {microphones.length === 0 ? (
                  <option value="">Micrófono predeterminado del sistema</option>
                ) : (
                  microphones.map((mic, idx) => (
                    <option key={mic.deviceId || idx} value={mic.deviceId}>
                      {mic.label || `Micrófono ${idx + 1}`}
                    </option>
                  ))
                )}
              </select>

              {/* Visual VU Meter */}
              <div className="bg-[#1e1f22] p-3 rounded-lg border border-gray-700/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                    <Radio className={`w-3.5 h-3.5 ${micLevel > 5 ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
                    Nivel de entrada de tu voz:
                  </span>
                  <span className={`font-mono text-xs ${micLevel > 5 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>
                    {micLevel > 5 ? `${micLevel}% (Detectando voz)` : 'En silencio'}
                  </span>
                </div>

                {/* Progress bar meter with segmented bars */}
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden p-0.5 flex items-center gap-0.5 border border-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"
                    style={{ width: `${Math.max(3, micLevel)}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-400">
                  💡 <strong>Prueba ahora:</strong> Di «Hola 1, 2, 3» por tu micrófono. La barra verde debe reaccionar y moverse en tiempo real.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: PARLANTES / ALTAVOCES CON BOTÓN DE PRUEBA */}
          <div className="bg-[#282a2d] border border-gray-700/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                Parlantes / Altavoces (Salida de Audio)
              </label>
              <span className="text-[11px] text-gray-400">
                {sinkIdSupported ? 'Soporta selección de dispositivo' : 'Usa salida predeterminada'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <select
                  value={selectedSpeakerId}
                  onChange={(e) => onSelectSpeaker(e.target.value)}
                  disabled={!sinkIdSupported && speakers.length === 0}
                  className="flex-1 bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                >
                  {speakers.length === 0 ? (
                    <option value="">Altavoces predeterminados del sistema</option>
                  ) : (
                    speakers.map((spk, idx) => (
                      <option key={spk.deviceId || idx} value={spk.deviceId}>
                        {spk.label || `Altavoz / Auriculares ${idx + 1}`}
                      </option>
                    ))
                  )}
                </select>

                {/* Speaker Test Button */}
                <button
                  type="button"
                  onClick={handleTestSpeaker}
                  disabled={isTestingSpeaker}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isTestingSpeaker
                      ? 'bg-purple-700 text-white animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isTestingSpeaker ? 'animate-spin' : ''}`} />
                  <span>{isTestingSpeaker ? 'Reproduciendo sonido...' : 'Probar parlante'}</span>
                </button>
              </div>

              {/* Speaker test volume slider & feedback */}
              <div className="bg-[#1e1f22] p-3 rounded-lg border border-gray-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Volumen de prueba:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={speakerTestVolume}
                    onChange={(e) => setSpeakerTestVolume(parseFloat(e.target.value))}
                    className="w-24 accent-purple-500 cursor-pointer"
                  />
                  <span className="font-mono text-gray-400">{Math.round(speakerTestVolume * 100)}%</span>
                </div>

                <div className="text-[11px] text-gray-400">
                  {isTestingSpeaker ? (
                    <span className="text-purple-300 font-medium animate-pulse">
                      🔔 Emite un acorde armónico y voz de confirmación...
                    </span>
                  ) : (
                    <span>Haz clic en <strong>«Probar parlante»</strong> para confirmar que escuchas el sonido.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-gray-800 bg-[#282a2d] flex items-center justify-between">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Los cambios se aplican automáticamente a la sesión.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
          >
            Listo y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
