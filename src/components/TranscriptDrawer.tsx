import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Download,
  Sparkles,
  Search,
  Volume2,
  Copy,
  Check,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { TranscriptItem } from '../types';
import { getLanguageByCode } from '../constants/languages';

interface TranscriptDrawerProps {
  transcripts: TranscriptItem[];
  roomId: string;
  onClose: () => void;
  onSpeakText: (text: string, lang: string) => void;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  transcripts,
  roomId,
  onClose,
  onSpeakText,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const filtered = transcripts.filter(
    (t) =>
      t.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.translatedText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.speakerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadTXT = () => {
    if (transcripts.length === 0) return;
    const content = [
      `============================================================`,
      `  TRANSCRIPTO DE REUNIÓN - MEETTRANSLATE`,
      `  Sala: ${roomId}`,
      `  Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      `  Total intervenciones: ${transcripts.length}`,
      `============================================================\n`,
      ...transcripts.map(
        (t) =>
          `[${t.timestamp}] ${t.speakerName} (${t.sourceLang.toUpperCase()} ➔ ${t.targetLang.toUpperCase()}):\n` +
          `  ORIGINAL:   "${t.originalText}"\n` +
          `  TRADUCCIÓN: "${t.translatedText}"\n`
      ),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MeetTranslate-Transcripto-${roomId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (transcripts.length === 0) return;
    const data = {
      meetingId: roomId,
      exportedAt: new Date().toISOString(),
      transcripts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MeetTranslate-Transcripto-${roomId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateSummary = async () => {
    if (transcripts.length === 0) return;
    setIsSummarizing(true);
    setExecutiveSummary(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcripts,
          meetingTitle: `Reunión MeetTranslate (${roomId})`,
        }),
      });

      if (!res.ok) throw new Error('Error al generar resumen');
      const data = await res.json();
      setExecutiveSummary(data.summary);
    } catch (err: any) {
      console.error('Error generando minuta:', err);
      setExecutiveSummary('Hubo un error al generar la minuta ejecutiva. Verifica la conexión con Gemini.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopySummary = () => {
    if (!executiveSummary) return;
    navigator.clipboard.writeText(executiveSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="w-80 sm:w-96 md:w-[420px] bg-[#202124] border-l border-gray-800 text-white flex flex-col h-full z-40 select-none shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-base font-medium">Transcripto en Vivo</h2>
            <span className="text-[11px] text-gray-400">
              {transcripts.length} intervenciones registradas
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Toolbar: AI Summarize & Downloads */}
      <div className="p-3 bg-[#282a2d] border-b border-gray-800 flex items-center justify-between gap-2">
        <button
          onClick={handleGenerateSummary}
          disabled={transcripts.length === 0 || isSummarizing}
          className="flex-1 py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          {isSummarizing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analizando con Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Minuta Ejecutiva AI</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleDownloadTXT}
            disabled={transcripts.length === 0}
            className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-gray-300 hover:text-white transition-colors"
            title="Descargar como archivo .TXT"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadJSON}
            disabled={transcripts.length === 0}
            className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-gray-300 hover:text-white transition-colors"
            title="Descargar como JSON estructurado"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 py-2 border-b border-gray-800 bg-[#202124]">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en el transcripto..."
            className="w-full bg-[#282a2d] text-xs text-gray-200 pl-9 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Summary View if generated */}
      {executiveSummary && (
        <div className="p-4 bg-blue-950/30 border-b border-blue-600/30 max-h-60 overflow-y-auto space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Minuta Generada con Gemini
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSummary ? 'Copiada' : 'Copiar'}</span>
              </button>
              <button
                onClick={() => setExecutiveSummary(null)}
                className="text-gray-400 hover:text-white text-[11px]"
              >
                Cerrar
              </button>
            </div>
          </div>
          <div className="prose prose-invert prose-xs text-gray-200 leading-relaxed whitespace-pre-line font-sans">
            {executiveSummary}
          </div>
        </div>
      )}

      {/* Transcripts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <MessageSquare className="w-10 h-10 mb-2 stroke-[1.5] text-gray-600" />
            <p className="text-sm font-medium text-gray-400">Sin transcripciones aún</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
              Empieza a hablar por el micrófono o envía una frase. Las intervenciones y sus traducciones
              quedarán registradas aquí automáticamente.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const srcLang = getLanguageByCode(item.sourceLang);
            const tgtLang = getLanguageByCode(item.targetLang);

            return (
              <div
                key={item.id}
                className="p-3 bg-[#282a2d] rounded-xl border border-gray-800/80 space-y-1.5 transition-all hover:border-gray-700"
              >
                {/* Speaker & Timestamp */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>{item.speakerName}</span>
                    <span className="text-[10px] text-gray-400">
                      [{srcLang.flag} ➔ {tgtLang.flag}]
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <span>{item.timestamp}</span>
                    <button
                      onClick={() => onSpeakText(item.translatedText, item.targetLang)}
                      className="p-1 text-gray-400 hover:text-emerald-400 rounded transition-colors"
                      title="Reproducir traducción por voz"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Translated text (highlighted) */}
                <p className="text-sm text-emerald-300 font-medium leading-relaxed">
                  {item.translatedText}
                </p>

                {/* Original text */}
                <p className="text-xs text-gray-400 italic">
                  "{item.originalText}"
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
