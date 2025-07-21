import React, { useState } from 'react';
import { LanguageSelector } from '../components';
import { SUPPORTED_LANGUAGES } from '../types/languages';
import './languageSelectorExample.css';

/**
 * Example component demonstrating the usage of LanguageSelector
 */
const LanguageSelectorExample: React.FC = () => {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [error, setError] = useState<string | undefined>(undefined);

  // Handle source language change
  const handleSourceLanguageChange = (code: string) => {
    if (code === targetLanguage) {
      setError('Source and target languages cannot be the same');
      return;
    }
    setSourceLanguage(code);
    setError(undefined);
  };

  // Handle target language change
  const handleTargetLanguageChange = (code: string) => {
    if (code === sourceLanguage) {
      setError('Source and target languages cannot be the same');
      return;
    }
    setTargetLanguage(code);
    setError(undefined);
  };

  return (
    <div className="language-selector-example">
      <h2>Language Selector Example</h2>

      <div className="language-controls">
        {/* Source Language Selector */}
        <LanguageSelector
          value={sourceLanguage}
          onChange={handleSourceLanguageChange}
          languages={SUPPORTED_LANGUAGES}
          label="源语言"
          placeholder="选择源语言..."
          error={error}
          testId="source-language-selector"
        />

        {/* Swap button */}
        <button
          className="swap-button"
          onClick={() => {
            const temp = sourceLanguage;
            setSourceLanguage(targetLanguage);
            setTargetLanguage(temp);
          }}
        >
          ⇄
        </button>

        {/* Target Language Selector */}
        <LanguageSelector
          value={targetLanguage}
          onChange={handleTargetLanguageChange}
          languages={SUPPORTED_LANGUAGES}
          label="目标语言"
          placeholder="选择目标语言..."
          error={error}
          displayOptions={{
            showNativeName: true,
            showEnglishName: true,
            groupByRegion: false,
            showOnlySupported: false
          }}
          testId="target-language-selector"
        />
      </div>

      <div className="selected-languages">
        <p>
          Selected source language: <strong>{sourceLanguage}</strong>
        </p>
        <p>
          Selected target language: <strong>{targetLanguage}</strong>
        </p>
      </div>
    </div>
  );
};

export default LanguageSelectorExample;