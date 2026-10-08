import React, { useState } from 'react';
import {
  X,
  FileText,
  Upload,
  Globe,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  RefreshCw,
  Eye,
  BookOpen,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../constants/languages';

interface DocumentTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastDocSync?: (docData: any) => void;
  defaultTargetLang: string;
}

const SAMPLE_DOCUMENTS = [
  {
    id: 'doc-nda',
    title: 'Acuerdo Bilateral de Confidencialidad y Colaboración Tecnológica',
    pages: [
      {
        pageNumber: 1,
        title: 'Sección 1: Propósito de la Colaboración',
        content: `Las Partes desean explorar una oportunidad estratégica de negocio relacionada con la integración de modelos de lenguaje multimodal y traducción simultánea de audio en tiempo real. 

Toda la información técnica, arquitectónica y algoritmos de sincronización de subtítulos compartidos en esta sesión tendrán carácter estrictamente confidencial. Las partes se comprometen a proteger los datos conforme al marco normativo internacional de protección de privacidad.`,
      },
      {
        pageNumber: 2,
        title: 'Sección 2: Arquitectura y Especificaciones de Red',
        content: `La infraestructura operará con transmisión P2P basada en WebRTC con servidores STUN/TURN dedicados y canal de señalización WebSocket seguro. 

El modelo de interpretación simultánea ejecutará inferencia mediante Gemini 3.8 Flash con un presupuesto de latencia inferior a 450 milisegundos por segmento hablado, asegurando cadencia natural en doble vía entre interlocutores remotos.`,
      },
      {
        pageNumber: 3,
        title: 'Sección 3: Entregables y Próximos Hitos',
        content: `1. Despliegue del prototipo funcional con capacidad de prueba interurbana e internacional.
2. Soporte para síntesis de voz sincronizada (TTS) en 10 idiomas globales.
3. Almacenamiento y exportación de actas ejecutivas generadas por IA.
4. Habilitación de caché offline para contingencias de conectividad.`,
      },
    ],
  },
  {
    id: 'doc-pitch',
    title: 'Propuesta Comercial: Expansión de Negocios Globales con IA',
    pages: [
      {
        pageNumber: 1,
        title: 'Visión General: Eliminando las Barreras Idiomáticas',
        content: `Nuestra plataforma transforma las reuniones virtuales convencionales en sesiones multilingües fluidas. Cada participante habla en su lengua nativa y escucha al interlocutor traducido al instante con su propia entonación.

Esto incrementa la tasa de cierre en negociaciones comerciales internacionales en un 38% y elimina la necesidad de contratar intérpretes humanos por hora.`,
      },
      {
        pageNumber: 2,
        title: 'Modelo de Implementación y Retorno de Inversión (ROI)',
        content: `Coste operativo reducido gracias a la optimización de tokens en streaming con Gemini.
Integración directa con calendarios corporativos y salas de Google Meet existentes.
Soporte para traducción de minutas y contratos PDF durante la misma llamada sin salir de la videollamada.`,
      },
    ],
  },
];

export const DocumentTranslationModal: React.FC<DocumentTranslationModalProps> = ({
  isOpen,
  onClose,
  onBroadcastDocSync,
  defaultTargetLang,
}) => {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [targetLang, setTargetLang] = useState(defaultTargetLang || 'en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPresented, setIsPresented] = useState(false);

  if (!isOpen) return null;

  const currentDoc = SAMPLE_DOCUMENTS[selectedDocIndex];
  const pageData = currentDoc.pages[currentPage - 1];
  const translationKey = `${currentDoc.id}-p${currentPage}-${targetLang}`;
  const translatedText = translations[translationKey];

  const handleTranslatePage = async () => {
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `${pageData.title}\n\n${pageData.content}`,
          targetLang: getLanguageByCode(targetLang).name,
        }),
      });

      if (!res.ok) throw new Error('Error traduciendo documento');
      const data = await res.json();
      setTranslations((prev) => ({
        ...prev,
        [translationKey]: data.translatedContent,
      }));
    } catch (err) {
      console.error('Error en traducción de documento:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTogglePresent = () => {
    const nextState = !isPresented;
    setIsPresented(nextState);
    if (onBroadcastDocSync) {
      onBroadcastDocSync({
        isPresented: nextState,
        docTitle: currentDoc.title,
        pageNumber: currentPage,
        totalPages: currentDoc.pages.length,
        originalContent: pageData.content,
        translatedContent: translatedText || '',
        targetLang,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          // Add custom document
          SAMPLE_DOCUMENTS.push({
            id: `custom-${Date.now()}`,
            title: file.name,
            pages: [
              {
                pageNumber: 1,
                title: file.name,
                content: text.slice(0, 3000), // First page
              },
            ],
          });
          setSelectedDocIndex(SAMPLE_DOCUMENTS.length - 1);
          setCurrentPage(1);
        }
      };
      reader.readAsText(file);
    }
  };

  const targetLangObj = getLanguageByCode(targetLang);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-gray-700 w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Modal Top Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex items-center justify-between bg-[#282a2d]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                Traducción de Documentos y PDF en Tiempo Real
                <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  Gemini 3.8
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Visualiza, traduce en vivo y comparte documentos sincronizados con tu interlocutor en la llamada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePresent}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                isPresented
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isPresented ? 'Presentando en llamada (Sincronizado)' : 'Presentar en llamada'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Document Selector & Language Target */}
        <div className="px-6 py-2.5 bg-[#25272a] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Document Picker Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-gray-400 flex items-center gap-1 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              Documento:
            </span>
            {SAMPLE_DOCUMENTS.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDocIndex(idx);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg truncate max-w-[200px] transition-colors ${
                  selectedDocIndex === idx
                    ? 'bg-gray-700 text-white font-medium border border-gray-600'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {doc.title}
              </button>
            ))}

            {/* Upload PDF/TXT */}
            <label className="cursor-pointer px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 flex items-center gap-1 transition-colors">
              <Upload className="w-3 h-3" />
              <span>Subir PDF/Texto</span>
              <input
                type="file"
                accept=".txt,.pdf,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Target Language Picker */}
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-gray-400">Traducir a:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-[#2e3034] text-xs text-white border border-gray-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>

            <button
              onClick={handleTranslatePage}
              disabled={isTranslating}
              className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-1 shadow-sm transition-all"
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Traduciendo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Traducir Página</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area: Side-by-Side Bilingual View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 overflow-hidden bg-[#1e1f22]">
          {/* Left: Original Document */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-3 px-5 bg-[#25272a] border-b border-gray-800 flex items-center justify-between text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1.5 text-gray-200">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                Documento Original (Español)
              </span>
              <span className="bg-gray-800 px-2 py-0.5 rounded text-[11px]">
                Página {currentPage} de {currentDoc.pages.length}
              </span>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <h3 className="text-base font-semibold text-gray-100 border-b border-gray-800 pb-2">
                {pageData.title}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line font-serif">
                {pageData.content}
              </p>
            </div>
          </div>

          {/* Right: Live Translation with Gemini */}
          <div className="flex flex-col h-full overflow-hidden bg-[#1b1c1e]">
            <div className="p-3 px-5 bg-[#25272a] border-b border-gray-800 flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Traducción Simultánea ({targetLangObj.flag} {targetLangObj.name})
              </span>
              {translatedText && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Actualizada
                </span>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {translatedText ? (
                <div className="text-sm text-emerald-200 leading-relaxed whitespace-pre-line font-serif">
                  {translatedText}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <Sparkles className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-sm font-medium text-gray-400">
                    Traducción pendiente para esta página
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Haz clic en "Traducir Página" para generar la versión instantánea en {targetLangObj.name}.
                  </p>
                  <button
                    onClick={handleTranslatePage}
                    disabled={isTranslating}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Traducir ahora con Gemini
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom: Page Navigation */}
        <div className="p-3 px-6 bg-[#25272a] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-lg text-white transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-gray-200">
              {currentPage} / {currentDoc.pages.length}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(currentDoc.pages.length, p + 1))}
              disabled={currentPage === currentDoc.pages.length}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-lg text-white transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500">
              Soporta documentos PDF, presentaciones y contratos en llamadas bilingües
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cerrar visor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
