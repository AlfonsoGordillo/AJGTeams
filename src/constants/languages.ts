import { LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
    speechCode: 'es-ES',
    voiceName: 'Puck',
  },
  {
    code: 'en',
    name: 'Inglés',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    speechCode: 'en-US',
    voiceName: 'Kore',
  },
  {
    code: 'fr',
    name: 'Francés',
    nativeName: 'Français',
    flag: '🇫🇷',
    speechCode: 'fr-FR',
    voiceName: 'Charon',
  },
  {
    code: 'pt',
    name: 'Portugués',
    nativeName: 'Português',
    flag: '🇧🇷',
    speechCode: 'pt-BR',
    voiceName: 'Fenrir',
  },
  {
    code: 'de',
    name: 'Alemán',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    speechCode: 'de-DE',
    voiceName: 'Zephyr',
  },
  {
    code: 'it',
    name: 'Italiano',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    speechCode: 'it-IT',
    voiceName: 'Kore',
  },
  {
    code: 'ja',
    name: 'Japonés',
    nativeName: '日本語',
    flag: '🇯🇵',
    speechCode: 'ja-JP',
    voiceName: 'Puck',
  },
  {
    code: 'zh',
    name: 'Chino Mandarín',
    nativeName: '中文 (简体)',
    flag: '🇨🇳',
    speechCode: 'zh-CN',
    voiceName: 'Zephyr',
  },
  {
    code: 'ar',
    name: 'Árabe',
    nativeName: 'العربية',
    flag: '🇸🇦',
    speechCode: 'ar-SA',
    voiceName: 'Charon',
  },
  {
    code: 'ru',
    name: 'Ruso',
    nativeName: 'Русский',
    flag: '🇷🇺',
    speechCode: 'ru-RU',
    voiceName: 'Fenrir',
  },
];

export const getLanguageByCode = (code: string): LanguageOption => {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code.toLowerCase() === code.toLowerCase()) ||
    SUPPORTED_LANGUAGES[0]
  );
};
