import React, { useRef, useState } from 'react';
import { X, Sparkles, Upload, Check, Ban, Trash2, Loader2 } from 'lucide-react';
import { PRESET_BACKGROUNDS } from '../constants/backgrounds';

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
  onRemoveCustomBackground?: (url: string) => void;
}

export const BackgroundModal: React.FC<BackgroundModalProps> = ({
  isOpen,
  onClose,
  currentBackground,
  onSelectBackground,
  customBackgrounds,
  onAddCustomBackground,
  onRemoveCustomBackground,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage('Optimizando imagen...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      if (!rawUrl) {
        setIsProcessing(false);
        setStatusMessage(null);
        return;
      }

      // Optimize/compress image to standard 1280x720 JPEG for smooth canvas rendering
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 1280;
          const maxH = 720;
          let w = img.width;
          let h = img.height;

          // Calculate aspect ratio fit
          const ratio = Math.min(maxW / w, maxH / h, 1);
          canvas.width = Math.round(w * ratio);
          canvas.height = Math.round(h * ratio);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const optimizedUrl = canvas.toDataURL('image/jpeg', 0.85);
            onAddCustomBackground(optimizedUrl);
            onSelectBackground({ type: 'custom', url: optimizedUrl });
            setStatusMessage('¡Fondo aplicado con éxito!');
          } else {
            onAddCustomBackground(rawUrl);
            onSelectBackground({ type: 'custom', url: rawUrl });
          }
        } catch (err) {
          console.warn('Canvas optimization fallback to original data URL', err);
          onAddCustomBackground(rawUrl);
          onSelectBackground({ type: 'custom', url: rawUrl });
        } finally {
          setIsProcessing(false);
          setTimeout(() => setStatusMessage(null), 3000);
        }
      };

      img.onerror = () => {
        console.warn('Failed to load uploaded image element');
        onAddCustomBackground(rawUrl);
        onSelectBackground({ type: 'custom', url: rawUrl });
        setIsProcessing(false);
        setTimeout(() => setStatusMessage(null), 3000);
      };

      img.src = rawUrl;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setStatusMessage('Error al leer el archivo');
      setTimeout(() => setStatusMessage(null), 3000);
    };

    reader.readAsDataURL(file);

    // Reset file input value so user can choose the same or another file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <div className="p-3.5 bg-[#282a2d] rounded-xl border border-gray-700/70">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                Subir tu propio fondo local
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
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-medium shadow-sm cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Elegir imagen de tu equipo</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Formatos: JPG, PNG, WebP. Se optimiza y aplica en vivo tanto en tu vista como en la de los demás.
            </p>
            {statusMessage && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Custom uploaded list */}
          {customBackgrounds.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-400 block mb-2">
                Tus fondos subidos ({customBackgrounds.length})
              </span>
              <div className="grid grid-cols-3 gap-3">
                {customBackgrounds.map((bgUrl, idx) => {
                  const isSelected = currentBackground.type === 'custom' && currentBackground.url === bgUrl;
                  return (
                    <div key={idx} className="relative group aspect-video">
                      <button
                        onClick={() => onSelectBackground({ type: 'custom', url: bgUrl })}
                        className={`w-full h-full rounded-xl overflow-hidden border-2 transition-all block ${
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

                      {onRemoveCustomBackground && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCustomBackground(bgUrl);
                          }}
                          className="absolute bottom-2 right-2 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Eliminar este fondo subido"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center bg-[#2d2f34] transition-all cursor-pointer ${
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
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-700 to-slate-900 transition-all cursor-pointer ${
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
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50 scale-[1.02]'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={bg.url}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
