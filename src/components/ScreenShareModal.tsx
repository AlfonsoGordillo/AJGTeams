import React, { useState } from 'react';
import { X, ScreenShare, Volume2, VolumeX, Monitor, ShieldAlert } from 'lucide-react';

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScreenShare: (withAudio: boolean) => void;
}

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({
  isOpen,
  onClose,
  onStartScreenShare,
}) => {
  const [withAudio, setWithAudio] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-gray-700 w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex items-center justify-between bg-[#282a2d]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Compartir Pantalla</h2>
              <p className="text-xs text-gray-400">Presenta tu pantalla completa, ventana o pestaña</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Audio selection options */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Audio de la presentación
            </label>

            <button
              type="button"
              onClick={() => setWithAudio(true)}
              className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                withAudio
                  ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-[#282a2d] border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <Volume2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-white block">Compartir CON Sonido</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ideal para videos de YouTube, clips o música. Se transmite el audio del sistema o de la pestaña.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setWithAudio(false)}
              className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                !withAudio
                  ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-[#282a2d] border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="p-2 rounded-lg bg-gray-700 text-gray-300 shrink-0 mt-0.5">
                <VolumeX className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-white block">Compartir SIN Sonido (Solo Video)</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Perfecto para diapositivas, documentos PDF o código. No interfiere con las traducciones por voz.
                </p>
              </div>
            </button>
          </div>

          <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-600/30 text-xs text-amber-200/90 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              En el diálogo del navegador, recuerda activar la casilla <strong>"Compartir audio de la pestaña/sistema"</strong> si elegiste compartir con sonido.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#282a2d] border-t border-gray-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onStartScreenShare(withAudio);
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
          >
            <ScreenShare className="w-4 h-4" />
            <span>Iniciar Presentación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
