import { Language, LanguagePair, SUPPORTED_LANGUAGES } from '../types/languages';

/**
 * Check if a language pair is supported
 * @param sourceLang Source language code
 * @param targetLang Target language code
 * @returns Boolean indicating if the language pair is supported
 */
export function isLanguagePairSupported(sourceLang: string, targetLang: string): boolean {
  // In a real implementation, this would check against available models
  // For now, we'll assume all combinations of supported languages are valid
  const sourceSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === sourceLang);
  const targetSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === targetLang);
  return sourceSupported && targetSupported && sourceLang !== targetLang;
}

/**
 * Get language information by code
 * @param code Language code
 * @returns Language object or undefined if not found
 */
export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get model ID for a language pair
 * @param sourceLang Source language code
 * @param targetLang Target language code
 * @returns Model ID string
 */
export function getModelIdForLanguagePair(sourceLang: string, targetLang: string): string {
  // This is a simplified implementation
  // In a real app, we might have a mapping of language pairs to specific models
  return `Helsinki-NLP/opus-mt-${sourceLang}-${targetLang}`;
}

/**
 * Format language name for display
 * @param language Language object
 * @param showNative Whether to show the native name
 * @returns Formatted language name
 */
export function formatLanguageName(language: Language, showNative: boolean = true): string {
  if (showNative && language.nativeName && language.name !== language.nativeName) {
    return `${language.name} (${language.nativeName})`;
  }
  return language.name;
}

/**
 * Get all supported language pairs
 * @returns Array of language pairs
 */
export function getSupportedLanguagePairs(): LanguagePair[] {
  const pairs: LanguagePair[] = [];

  // Generate all possible combinations
  SUPPORTED_LANGUAGES.forEach(source => {
    SUPPORTED_LANGUAGES.forEach(target => {
      if (source.code !== target.code) {
        pairs.push({
          source: source.code,
          target: target.code
        });
      }
    });
  });

  return pairs;
}

/**
 * Check if a language is right-to-left
 * @param languageCode Language code
 * @returns Boolean indicating if the language is RTL
 */
export function isRTL(languageCode: string): boolean {
  const language = getLanguageByCode(languageCode);
  return language?.direction === 'rtl';
}