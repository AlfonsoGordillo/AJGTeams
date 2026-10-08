import { getLanguageByCode } from '../constants/languages';

// Simple offline translation dictionary for key conversational phrases
const OFFLINE_DICTIONARY: Record<string, Record<string, string>> = {
  'es->en': {
    'hola': 'hello',
    'hola a todos': 'hello everyone',
    'buenos días': 'good morning',
    'buenas tardes': 'good afternoon',
    'cómo estás': 'how are you',
    'cómo están': 'how are you all',
    'me escuchan': 'can you hear me',
    'sí, te escucho perfectamente': 'yes, I hear you perfectly',
    'estoy de acuerdo': 'I agree',
    'no estoy de acuerdo': 'I do not agree',
    'podemos comenzar': 'we can start',
    'gracias': 'thank you',
    'muchas gracias': 'thank you very much',
    'de nada': "you're welcome",
    'hasta luego': 'see you later',
    'adiós': 'goodbye',
    'voy a compartir mi pantalla': 'I am going to share my screen',
    'revisemos el documento': "let's review the document",
  },
  'en->es': {
    'hello': 'hola',
    'hello everyone': 'hola a todos',
    'good morning': 'buenos días',
    'good afternoon': 'buenas tardes',
    'how are you': 'cómo estás',
    'can you hear me': 'me escuchas',
    'yes, i hear you perfectly': 'sí, te escucho perfectamente',
    'i agree': 'estoy de acuerdo',
    'thank you': 'gracias',
    'thank you very much': 'muchas gracias',
    'goodbye': 'adiós',
    'see you later': 'hasta luego',
  },
  'es->fr': {
    'hola': 'bonjour',
    'cómo estás': 'comment vas-tu',
    'gracias': 'merci',
    'adiós': 'au revoir',
    'buenos días': 'bonjour',
  },
  'es->pt': {
    'hola': 'olá',
    'cómo estás': 'como você está',
    'gracias': 'obrigado',
    'adiós': 'tchau',
    'buenos días': 'bom dia',
  },
};

export class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private targetLanguage = 'en';
  private spokenLanguage = 'es';
  private onResultCallback?: (result: { text: string; isFinal: boolean }) => void;
  private onErrorCallback?: (err: string) => void;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      let lastInterim = '';
      let silenceTimer: any = null;

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (finalText && this.onResultCallback) {
          if (silenceTimer) clearTimeout(silenceTimer);
          lastInterim = '';
          this.onResultCallback({ text: finalText.trim(), isFinal: true });
        } else if (interimText && this.onResultCallback) {
          lastInterim = interimText;
          this.onResultCallback({ text: interimText.trim(), isFinal: false });

          // Auto-finalize when user pauses for 750ms (prevents getting stuck in 'Hablando...')
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (lastInterim && lastInterim.trim().length > 0 && this.onResultCallback) {
              const textToSend = lastInterim.trim();
              lastInterim = '';
              this.onResultCallback({ text: textToSend, isFinal: true });
            }
          }, 750);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still marked as listening
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already active or error
          }
        }
      };
    } catch (e) {
      console.error('Failed to initialize SpeechRecognition:', e);
    }
  }

  public setSpokenLanguage(langCode: string) {
    this.spokenLanguage = langCode;
    const langObj = getLanguageByCode(langCode);
    if (this.recognition) {
      this.recognition.lang = langObj.speechCode;
      if (this.isListening) {
        this.stopListening();
        setTimeout(() => this.startListening(), 200);
      }
    }
  }

  public setTargetLanguage(langCode: string) {
    this.targetLanguage = langCode;
  }

  public startListening(
    onResult?: (result: { text: string; isFinal: boolean }) => void,
    onError?: (err: string) => void,
  ) {
    if (onResult) this.onResultCallback = onResult;
    if (onError) this.onErrorCallback = onError;

    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        if (onError) onError('Reconocimiento de voz no soportado por este navegador.');
        return;
      }
    }

    const langObj = getLanguageByCode(this.spokenLanguage);
    this.recognition.lang = langObj.speechCode;
    this.isListening = true;

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Recognition already started or error:', err);
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignored
      }
    }
  }

  public getIsListening() {
    return this.isListening;
  }

  // Live Simultaneous Translation via Gemini API or Offline Dictionary
  public async translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
    isOffline = false,
  ): Promise<string> {
    if (!text.trim()) return '';
    if (sourceLang.toLowerCase() === targetLang.toLowerCase()) return text;

    // Offline check
    if (isOffline || !navigator.onLine) {
      const key = `${sourceLang.toLowerCase()}->${targetLang.toLowerCase()}`;
      const dict = OFFLINE_DICTIONARY[key];
      const clean = text.toLowerCase().trim();
      if (dict && dict[clean]) {
        return dict[clean];
      }
      return `[Offline] ${text}`;
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });

      if (!res.ok) {
        console.warn(`Translation service returned status ${res.status}, using original text fallback.`);
        return text;
      }

      const data = await res.json();
      return data.translatedText || text;
    } catch (err) {
      console.warn('Network issue reaching translation endpoint, using fallback:', err);
      return text;
    }
  }

  // Simultaneous Voice Audio Playback (TTS)
  public async speakTranslatedText(
    text: string,
    targetLang: string,
    useGeminiTTS = false,
  ) {
    if (!text.trim()) return;

    if (useGeminiTTS) {
      try {
        const langObj = getLanguageByCode(targetLang);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: targetLang,
            voiceName: langObj.voiceName,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            await this.playBase64Audio(data.audioBase64);
            return;
          }
        }
      } catch (err) {
        console.warn('Gemini TTS failed, falling back to Web Speech Synthesis:', err);
      }
    }

    // High-speed browser SpeechSynthesis fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop prior sentence for simultaneous rhythm
      const utterance = new SpeechSynthesisUtterance(text);
      const langObj = getLanguageByCode(targetLang);
      utterance.lang = langObj.speechCode;
      utterance.rate = 1.05; // Slightly brisk for simultaneous translation cadence
      window.speechSynthesis.speak(utterance);
    }
  }

  private async playBase64Audio(base64: string) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (e) {
      console.error('Error playing base64 audio:', e);
    }
  }
}

export const speechService = new SpeechService();
