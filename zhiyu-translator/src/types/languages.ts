/**
 * Interface for language definition
 */
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
  family?: string;
}

/**
 * Interface for language pair
 */
export interface LanguagePair {
  source: string;
  target: string;
}

/**
 * Interface for model configuration
 */
export interface ModelConfig {
  languagePair: LanguagePair;
  modelId: string;
  quantized?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Interface for language support information
 */
export interface LanguageSupportInfo {
  language: Language;
  supportedAs: {
    source: boolean;
    target: boolean;
  };
  availableModels?: ModelConfig[];
}

/**
 * Common language codes
 */
export enum CommonLanguageCode {
  ENGLISH = 'en',
  CHINESE = 'zh',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  RUSSIAN = 'ru',
  ARABIC = 'ar',
  HINDI = 'hi'
}

/**
 * Language group by region
 */
export enum LanguageRegion {
  EUROPE = 'europe',
  ASIA = 'asia',
  AFRICA = 'africa',
  NORTH_AMERICA = 'northAmerica',
  SOUTH_AMERICA = 'southAmerica',
  OCEANIA = 'oceania'
}

/**
 * Interface for language with region information
 */
export interface LanguageWithRegion extends Language {
  region: LanguageRegion;
}

/**
 * Interface for language display options
 */
export interface LanguageDisplayOptions {
  showNativeName: boolean;
  showEnglishName: boolean;
  groupByRegion: boolean;
  showOnlySupported: boolean;
}

// Sample language data structure (to be populated from actual data)
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
];