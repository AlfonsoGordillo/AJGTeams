import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Key,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface ApiStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiStatusModal: React.FC<ApiStatusModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Key input
  const [customKey, setCustomKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Test translation state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    original: string;
    translated: string;
    durationMs: number;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini-status');
      const data = await res.json();
      setHasKey(data.hasKey);
      setKeyPreview(data.keyPreview);
      setStatusMessage(data.message || '');
    } catch (err: any) {
      setHasKey(false);
      setStatusMessage('No se pudo contactar el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setTestResult(null);
      setTestError(null);
      setSaveFeedback(null);
    }
  }, [isOpen]);

  const handleTestTranslation = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await fetch('/api/test-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hola, bienvenidos a la reunión de MeetTranslate con traducción simultánea.',
          sourceLang: 'Spanish',
          targetLang: 'English',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setTestError(data.error || 'Fallo en la prueba de traducción');
      } else {
        setTestResult({
          original: data.originalText,
          translated: data.translatedText,
          durationMs: data.durationMs,
        });
      }
    } catch (err: any) {
      setTestError(err.message || 'Error de conexión');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCustomKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKey.trim()) return;

    setIsSavingKey(true);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/set-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: customKey.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveFeedback('✅ Clave activada y lista para traducir.');
        setCustomKey('');
        await checkStatus();
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setSaveFeedback(`❌ Error: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (err: any) {
      setSaveFeedback(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-gray-700 w-full max-w-xl rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex items-center justify-between bg-[#282a2d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Estado del Servicio Gemini IA</h2>
              <p className="text-xs text-gray-400">Verifica la API Key y prueba la traducción simultánea</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              hasKey
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/30 border-red-500/40 text-red-200'
            }`}
          >
            {hasKey ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {hasKey ? 'Servicio Gemini 3.8 Activo' : 'API Key de Gemini no detectada'}
                </span>
                <button
                  onClick={checkStatus}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  title="Recomprobar estado"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Revisar</span>
                </button>
              </div>

              <p className="text-xs opacity-90">{statusMessage}</p>

              {keyPreview && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded text-xs font-mono text-emerald-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>Clave activa: {keyPreview}</span>
                </div>
              )}
            </div>
          </div>

          {/* Test Translation Button & Live Feedback */}
          <div className="bg-[#282a2d] border border-gray-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
                  Prueba de Traducción en Vivo
                </h3>
                <p className="text-[11px] text-gray-400">
                  Envía una frase a Gemini y comprueba la respuesta en tiempo real
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestTranslation}
                disabled={isTesting || !hasKey}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Traduciendo...' : 'Probar Traducción'}</span>
              </button>
            </div>

            {/* Test Translation Output */}
            {testResult && (
              <div className="mt-3 p-3 bg-black/40 border border-emerald-500/40 rounded-lg space-y-1.5 text-xs animate-in fade-in">
                <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                  <span>Traducción exitosa con Gemini 3.8 Flash</span>
                  <span className="font-mono bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    ⏱️ {testResult.durationMs} ms
                  </span>
                </div>
                <div className="text-gray-400">
                  <span className="font-medium text-gray-300">Original (Español):</span> "{testResult.original}"
                </div>
                <div className="text-emerald-300 font-medium">
                  <span className="font-medium text-gray-300">Traducido (English):</span> "{testResult.translated}"
                </div>
              </div>
            )}

            {testError && (
              <div className="mt-3 p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-xs text-red-300 space-y-1 animate-in fade-in">
                <div className="font-semibold flex items-center gap-1.5 text-red-200">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Error en la respuesta de la API:</span>
                </div>
                <p className="font-mono text-[11px] break-all">{testError}</p>
              </div>
            )}
          </div>

          {/* Quick Key Activation Form (Immediate activation) */}
          <div className="bg-[#282a2d] border border-gray-700/80 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Activar / Cambiar API Key en Vivo</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Si no la configuraste aún en Render o quieres usar otra clave, puedes pegarla aquí para activarla al instante:
            </p>

            <form onSubmit={handleSaveCustomKey} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSavingKey || !customKey.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {isSavingKey ? 'Activando...' : 'Activar Clave'}
                </button>
              </div>

              {saveFeedback && (
                <p className="text-xs font-medium text-emerald-400 animate-in fade-in">
                  {saveFeedback}
                </p>
              )}
            </form>

            <div className="pt-2 border-t border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
              <span>¿No tienes tu clave?</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Obtener en Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-gray-800 bg-[#282a2d] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-md"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
