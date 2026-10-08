export interface Participant {
  id: string;
  name: string;
  spokenLang: string; // The language this participant speaks (e.g., 'es')
  targetLang: string; // The language this participant wants to hear/read (e.g., 'en')
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  isLocal?: boolean;
  isVirtual?: boolean;
  stream?: MediaStream | null;
  backgroundType?: 'none' | 'blur' | 'preset' | 'custom';
  backgroundUrl?: string;
  isScreenShare?: boolean;
}

export interface TranscriptItem {
  id: string;
  speakerId: string;
  speakerName: string;
  originalText: string;
  sourceLang: string;
  translatedText: string;
  targetLang: string;
  timestamp: string;
  isOffline?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  translatedText?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string; // e.g. 'es-ES', 'en-US'
  voiceName: string; // Gemini TTS voice
}

export interface DocumentSlide {
  id: string;
  pageNumber: number;
  title: string;
  originalText: string;
  translatedText: string;
  targetLang: string;
}

export interface MeetingSummary {
  markdown: string;
  generatedAt: string;
}
