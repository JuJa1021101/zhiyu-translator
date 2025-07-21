import React, { useCallback, useEffect, lazy, Suspense, useState } from 'react';
import './App.css';
import { ErrorBoundary } from './components';
import { useTranslationContext } from './context/TranslationContext';
import { useTranslationService, useErrorHandler } from './hooks';
import { SUPPORTED_LANGUAGES } from './utils';
import { measurePerformance } from './utils/performanceUtils';
import { useKeyboardShortcuts, KeyboardShortcut } from './utils/keyboardUtils';

// Import components directly to avoid lazy loading issues
import PerformanceMonitor from './components/PerformanceMonitor';
import ThemeSwitcher from './components/ThemeSwitcher';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';

// Lazy load components for better performance
const LanguageSelector = lazy(() => import('./components/LanguageSelector'));
const ProgressIndicator = lazy(() => import('./components/ProgressIndicator'));
const TranslationInput = lazy(() => import('./components/TranslationInput'));
const TranslationOutput = lazy(() => import('./components/TranslationOutput'));
const ErrorNotification = lazy(() => import('./components/ErrorNotification'));

/**
 * Main App component
 * Integrates all UI components and manages the translation workflow
 */
const App: React.FC = () => {
  const { state, dispatch } = useTranslationContext();
  const { translate, cancelTranslation, updateServiceConfig, isServiceReady } = useTranslationService();
  const { error: globalError, clearError, reportError } = useErrorHandler(5000); // Auto-hide after 5 seconds
  const [isInitializing, setIsInitializing] = useState(true);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  const {
    sourceLanguage,
    targetLanguage,
    inputText,
    translatedText,
    isTranslating,
    progress,
    error: contextError,
    settings
  } = state;

  // Handle theme change
  const handleThemeChange = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { theme }
    });
  }, [dispatch]);

  // Define keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      key: 'ctrl+enter',
      action: () => {
        if (!isTranslating && inputText.trim() && isServiceReady) {
          handleTranslate();
        }
      },
      description: '翻译文本',
      enabled: !isTranslating && !!inputText.trim() && isServiceReady
    },
    {
      key: 'ctrl+shift+s',
      action: handleSwapLanguages,
      description: '交换语言',
      enabled: !isTranslating
    },
    {
      key: 'escape',
      action: () => {
        if (isTranslating) {
          handleCancelTranslation();
        }
      },
      description: '取消翻译',
      enabled: isTranslating
    },
    {
      key: 'ctrl+shift+c',
      action: () => {
        if (translatedText) {
          navigator.clipboard.writeText(translatedText)
            .then(() => console.log('Translated text copied to clipboard'))
            .catch(err => console.error('Failed to copy text:', err));
        }
      },
      description: '复制翻译结果',
      enabled: !!translatedText
    },
    {
      key: 'ctrl+shift+x',
      action: () => {
        if (!isTranslating && inputText) {
          handleSetInputText('');
        }
      },
      description: '清空输入',
      enabled: !isTranslating && !!inputText
    }
  ];

  // Register keyboard shortcuts
  useKeyboardShortcuts(keyboardShortcuts);

  // Initialize app and measure performance
  useEffect(() => {
    const initApp = async () => {
      try {
        const perfMark = measurePerformance('app-initialization');

        // Simulate initialization tasks
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mark initialization as complete
        setIsInitializing(false);

        perfMark.end();
        console.info(`App initialized in ${perfMark.duration}ms`);
      } catch (error) {
        console.error('App initialization error:', error);
        reportError(new Error('Failed to initialize application'));
      }
    };

    initApp();
  }, [reportError]);

  // Set source language
  const handleSetSourceLanguage = useCallback((language: string) => {
    dispatch({ type: 'SET_SOURCE_LANGUAGE', payload: language });
  }, [dispatch]);

  // Set target language
  const handleSetTargetLanguage = useCallback((language: string) => {
    dispatch({ type: 'SET_TARGET_LANGUAGE', payload: language });
  }, [dispatch]);

  // Swap languages
  const handleSwapLanguages = useCallback(() => {
    dispatch({ type: 'SWAP_LANGUAGES' });
  }, [dispatch]);

  // Set input text
  const handleSetInputText = useCallback((text: string) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
  }, [dispatch]);

  // Handle translation
  const handleTranslate = useCallback(() => {
    const perfMark = measurePerformance('translation-request');
    translate()
      .then(() => perfMark.end())
      .catch(() => perfMark.end());
  }, [translate]);

  // Handle translation cancellation
  const handleCancelTranslation = useCallback(() => {
    cancelTranslation();
  }, [cancelTranslation]);

  // Clear context error
  const handleClearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  // Handle retry action
  const handleRetry = useCallback(() => {
    // Clear errors first
    dispatch({ type: 'CLEAR_ERROR' });
    clearError();

    // Retry translation if there was text to translate
    if (inputText.trim()) {
      translate();
    }
  }, [dispatch, clearError, inputText, translate]);

  // Toggle auto-translate setting
  const handleToggleAutoTranslate = useCallback(() => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { autoTranslate: !settings.autoTranslate }
    });
  }, [dispatch, settings.autoTranslate]);

  // Report context errors to global error handler
  useEffect(() => {
    if (contextError) {
      reportError(new Error(contextError));
    }
  }, [contextError, reportError]);

  // Auto-translate when service is ready if there's input text
  useEffect(() => {
    if (isServiceReady && inputText.trim() && settings.autoTranslate) {
      translate();
    }
  }, [isServiceReady, inputText, settings.autoTranslate, translate]);

  // Loading state
  if (isInitializing) {
    return (
      <div className="app-container loading-state">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在初始化智语通翻译应用...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => reportError(error)}
      fallback={(error, resetError) => (
        <div className="app-container error-state">
          <div className="error-recovery-container">
            <h2>应用程序出错了</h2>
            <p>抱歉，应用程序遇到了问题。请尝试重新加载页面。</p>
            <p className="error-details">{error.message}</p>
            <button
              className="error-recovery-button"
              onClick={resetError}
            >
              重试
            </button>
          </div>
        </div>
      )}
    >
      <Suspense fallback={
        <div className="app-container loading-state">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>正在加载组件...</p>
          </div>
        </div>
      }>
        <div className="app-container">
          <header className="app-header">
            <h1>智语通 - Zhiyu Translator</h1>
            <p>基于 Transformers.js 的浏览器端翻译应用</p>
          </header>

          <main className="app-main">
            <div className="translation-container">
              <div className="language-controls">
                <LanguageSelector
                  value={sourceLanguage}
                  onChange={handleSetSourceLanguage}
                  languages={SUPPORTED_LANGUAGES}
                  label="源语言"
                  disabled={isTranslating}
                  testId="source-language-selector"
                />

                <button
                  className="swap-languages-button"
                  onClick={handleSwapLanguages}
                  disabled={isTranslating}
                  aria-label="交换语言"
                  title="交换语言"
                >
                  ⇄
                </button>

                <LanguageSelector
                  value={targetLanguage}
                  onChange={handleSetTargetLanguage}
                  languages={SUPPORTED_LANGUAGES}
                  label="目标语言"
                  disabled={isTranslating}
                  testId="target-language-selector"
                />
              </div>

              <div className="translation-panels">
                <div className="input-panel">
                  <TranslationInput
                    value={inputText}
                    onChange={handleSetInputText}
                    placeholder="输入要翻译的文本..."
                    disabled={isTranslating}
                    autoFocus
                    testId="translation-input"
                  />
                </div>

                <div className="output-panel">
                  <TranslationOutput
                    value={translatedText}
                    isLoading={isTranslating}
                    showCopyButton={true}
                    testId="translation-output"
                  />
                </div>
              </div>

              <div className="translation-controls">
                {isTranslating ? (
                  <>
                    <ProgressIndicator
                      progress={progress}
                      message="翻译中..."
                      isVisible={isTranslating}
                      variant="linear"
                      testId="translation-progress"
                    />
                    <button
                      className="cancel-button"
                      onClick={handleCancelTranslation}
                      aria-label="取消翻译"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    className="translate-button"
                    onClick={handleTranslate}
                    disabled={!inputText.trim() || !isServiceReady}
                    aria-label="翻译"
                  >
                    翻译
                  </button>
                )}
              </div>

              <div className="settings-panel">
                <label className="setting-option">
                  <input
                    type="checkbox"
                    checked={settings.autoTranslate}
                    onChange={handleToggleAutoTranslate}
                    disabled={isTranslating}
                  />
                  <span>自动翻译</span>
                </label>

                <div className="settings-divider"></div>

                <ThemeSwitcher
                  theme={settings.theme || 'system'}
                  onThemeChange={handleThemeChange}
                />
              </div>
            </div>
          </main>

          <footer className="app-footer">
            <p>智语通 - 使用 React, TypeScript 和 Transformers.js 构建</p>
            <p>
              <a href="https://github.com/huggingface/transformers.js" target="_blank" rel="noopener noreferrer">
                Powered by Transformers.js
              </a>
            </p>
          </footer>

          {/* Global error notification */}
          {globalError && (
            <ErrorNotification
              error={globalError}
              onDismiss={clearError}
              onRetry={handleRetry}
              autoHideDuration={5000}
            />
          )}

          {/* Context error notification - for backward compatibility */}
          {contextError && !globalError && (
            <div className="error-container">
              <div className="error-message">
                {contextError}
              </div>
              <button
                className="error-dismiss"
                onClick={handleClearError}
                aria-label="关闭错误提示"
              >
                ×
              </button>
            </div>
          )}

          {/* Performance monitor (only visible in development mode) */}
          <PerformanceMonitor visible={process.env.NODE_ENV === 'development'} />

          {/* Keyboard shortcuts help dialog */}
          <KeyboardShortcutsHelp
            isOpen={isShortcutsHelpOpen}
            onClose={() => setIsShortcutsHelpOpen(false)}
            shortcuts={keyboardShortcuts}
          />

          {/* Keyboard shortcuts help button */}
          <button
            className="keyboard-help-button"
            onClick={() => setIsShortcutsHelpOpen(true)}
            title="查看键盘快捷键"
            aria-label="查看键盘快捷键"
          >
            ⌨️
          </button>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;