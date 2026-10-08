import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Globe, Shield, Send, ExternalLink } from 'lucide-react';
import { generateSimpleQRCodeSVG } from '../utils/qrCode';
import { getPublicMeetingUrl } from '../utils/url';

interface InviteDrawerProps {
  roomId: string;
  onClose: () => void;
}

export const InviteDrawer: React.FC<InviteDrawerProps> = ({ roomId, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const inviteUrl = getPublicMeetingUrl(roomId);
  const qrUrl = generateSimpleQRCodeSVG(inviteUrl, 200);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Únete a mi videollamada con traducción simultánea en tiempo real de Google Meet:\n${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="w-80 sm:w-96 bg-[#202124] border-l border-gray-800 text-white flex flex-col h-full z-40 select-none shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-medium">Invitar Interlocutor</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {/* Intro Info */}
        <div className="bg-blue-950/40 border border-blue-600/30 rounded-xl p-3.5 text-xs text-blue-200 space-y-1.5">
          <p className="font-semibold text-blue-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Prueba internacional en cualquier navegador
          </p>
          <p className="text-gray-300 leading-relaxed">
            Envía este enlace a una persona en otra ciudad. Al abrirlo, ambos se conectarán en video
            y audio P2P con traducción simultánea en doble vía.
          </p>
        </div>

        {/* Meeting Link Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Enlace de la reunión</label>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30"
              title="Abrir directamente en una segunda pestaña de tu navegador"
            >
              <span>Abrir 2ª pestaña</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-[#282a2d] border border-gray-700 rounded-lg px-3 py-2 text-xs text-blue-300 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Abre este enlace en una segunda pestaña para conectar dos participantes en vivo con video y traducción simultánea.
          </p>
        </div>

        {/* Meeting Code */}
        <div className="p-3 bg-[#282a2d] rounded-xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block">Código de reunión</span>
            <span className="font-mono font-medium text-gray-200 text-sm">{roomId}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Copiar código
          </button>
        </div>

        {/* QR Code Section */}
        <div className="p-4 bg-[#282a2d] rounded-xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-gray-400" />
              Código QR para móvil
            </span>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {showQR ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showQR && (
            <div className="flex flex-col items-center pt-2">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <img
                  src={qrUrl}
                  alt="QR Code para unirse"
                  className="w-40 h-40 object-contain rounded"
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400 text-center">
                Escanea con la cámara del celular para entrar de inmediato a la llamada.
              </p>
            </div>
          )}
        </div>

        {/* Quick Share via WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full py-2.5 px-4 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Compartir por WhatsApp</span>
        </button>

        {/* How it works instructions */}
        <div className="space-y-2 pt-2 border-t border-gray-800 text-xs text-gray-400">
          <p className="font-medium text-gray-300">¿Cómo funciona la doble vía?</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>Tú hablas en español desde tu micrófono.</li>
            <li>La otra persona ve y escucha la traducción en su idioma (ej. inglés).</li>
            <li>Cuando ella responda en su idioma, tú la escucharás en español.</li>
            <li>Los subtítulos en pantalla y el transcripto quedan registrados.</li>
          </ul>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-2">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Conexión cifrada de punto a punto (WebRTC)</span>
        </div>
      </div>
    </div>
  );
};
