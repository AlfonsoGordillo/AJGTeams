import React, { useRef } from 'react';
import { X, Image as ImageIcon, Sparkles, Upload, Check, Ban } from 'lucide-react';
import { PRESET_BACKGROUNDS, VirtualBackground } from '../constants/backgrounds';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackground: {
    type: 'none' | 'blur' | 'preset' | 'custom';
    url?: string;
  };
  onSelectBackground: (bg: { type: 'none' | 'blur' | 'preset' | 'custom'; url?: string }) => void;
  customBackgrounds: string[];
  onAddCustomBackground: (url: string) => void;
}

export const BackgroundModal: React.FC<BackgroundModalProps> = ({
  isOpen,
  onClose,
  currentBackground,
  onSelectBackground,
  customBackgrounds,
  onAddCustomBackground,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          onAddCustomBackground(url);
          onSelectBackground({ type: 'custom', url });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-gray-700 w-full max-w-xl rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex items-center justify-between bg-[#282a2d]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Efectos y Fondos Visuales</h2>
              <p className="text-xs text-gray-400">Personaliza tu fondo como en Google Meet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Upload section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                Subir tu propio fondo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-medium shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Elegir imagen de tu equipo</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Formatos soportados: JPG, PNG, WebP. Tu fondo se guardará para esta llamada.
            </p>
          </div>

          {/* Custom uploaded list */}
          {customBackgrounds.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-400 block mb-2">Tus fondos subidos</span>
              <div className="grid grid-cols-3 gap-3">
                {customBackgrounds.map((bgUrl, idx) => {
                  const isSelected = currentBackground.type === 'custom' && currentBackground.url === bgUrl;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectBackground({ type: 'custom', url: bgUrl })}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50 scale-[1.02]'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <img src={bgUrl} alt={`Custom background ${idx + 1}`} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Presets and Effects */}
          <div>
            <span className="text-xs font-medium text-gray-400 block mb-2">Fondos predeterminados y efectos</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_BACKGROUNDS.map((bg) => {
                const isSelected =
                  currentBackground.type === bg.type &&
                  (bg.type !== 'preset' || currentBackground.url === bg.url);

                if (bg.type === 'none') {
                  return (
                    <button
                      key={bg.id}
                      onClick={() => onSelectBackground({ type: 'none' })}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center bg-[#2d2f34] transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-950/20'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <Ban className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-300 font-medium">{bg.name}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                }

                if (bg.type === 'blur') {
                  return (
                    <button
                      key={bg.id}
                      onClick={() => onSelectBackground({ type: 'blur' })}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-700 to-slate-900 transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/30 blur-sm flex items-center justify-center mb-1">
                        <Sparkles className="w-5 h-5 text-blue-300" />
                      </div>
                      <span className="text-xs text-gray-200 font-medium">{bg.name}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={bg.id}
                    onClick={() => onSelectBackground({ type: 'preset', url: bg.url })}
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50 scale-[1.02]'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <img src={bg.url} alt={bg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[11px] font-medium text-white truncate">{bg.name}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#282a2d] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>Se aplica en tiempo real en tu recuadro de video.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
