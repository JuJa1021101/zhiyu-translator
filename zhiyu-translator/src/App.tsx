import React, { useCallback, useEffect, lazy, Suspense, useState } from 'react';
import './App.css';
import { ErrorBoundary } from './components';
import { useTranslationContext } from './context';
import { useTranslationService, useErrorHandler } from './hooks';
import { AppState } from './types';
import { SUPPORTED_LANGUAGES } from './types/languages';
import { useKeyboardShortcuts, KeyboardShortcut } from './utils/keyboardUtils';

// Import components directly to avoid lazy loading issues
import ThemeSwitcher from './components/ThemeSwitcher';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';

// Lazy load components for better performance
const LanguageSelector = lazy(() => import('./components/LanguageSelector'));
const TranslationInput = lazy(() => import('./components/TranslationInput'));
const TranslationOutput = lazy(() => import('./components/TranslationOutput'));
const ErrorNotification = lazy(() => import('./components/ErrorNotification'));

/**
 * Main App component
 * 整合参数化语言选择器(LanguageSelector)与动态进度指示器(ProgressIndicator)等标准化 UI 控件
 * 通过 Props 驱动实现跨功能模块的组件复用，结合 Web Worker 和 MessageChannel 实现流畅的用户交互
 * Integrates all UI components and manages the translation workflow
 */
const App: React.FC = () => {
  const { state, dispatch } = useTranslationContext();
  const { translate, cancelTranslation, isServiceReady } = useTranslationService();
  const { error: globalError, clearError, reportError } = useErrorHandler(5000); // Auto-hide after 5 seconds
  const [isInitializing, setIsInitializing] = useState(true);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  const {
    sourceLanguage,
    targetLanguage,
    inputText,
    translatedText,
    isTranslating,
    error: contextError,
    settings
  } = state as AppState;

  // Handle theme change
  const handleThemeChange = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { theme }
    });
  }, [dispatch]);

  // Swap languages
  const handleSwapLanguages = useCallback(() => {
    dispatch({ type: 'SWAP_LANGUAGES' });
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

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        // Simulate initialization tasks
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mark initialization as complete
        setIsInitializing(false);
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

  // handleSwapLanguages 已在前面定义

  // Set input text
  const handleSetInputText = useCallback((text: string) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
  }, [dispatch]);

  // Handle translation - 无状态直接翻译
  const handleTranslate = useCallback(() => {
    // 直接翻译，不显示任何中间状态
    translate();
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

  // 实时自动翻译逻辑 - 完全仿有道词典体验，无中间状态
  useEffect(() => {
    // 如果不满足自动翻译条件，直接退出
    if (!settings.autoTranslate || !isServiceReady || !inputText.trim()) {
      // 如果输入为空，清空翻译结果
      if (settings.autoTranslate && !inputText.trim()) {
        dispatch({ type: 'SET_TRANSLATED_TEXT', payload: '' });
      }
      return;
    }

    // 使用极短的防抖时间，实现即时翻译体验
    const debounceTime = settings.debounceMs || 150; // 150ms防抖，更接近有道词典的即时响应
    const debouncedTranslateTimeout = setTimeout(() => {
      // 直接调用翻译，不设置任何中间状态
      translate();
    }, debounceTime);

    // 清理函数
    return () => {
      clearTimeout(debouncedTranslateTimeout);
    };
  }, [inputText, sourceLanguage, targetLanguage, settings.autoTranslate, settings.debounceMs, isServiceReady, translate, dispatch]);

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
                  disabled={false}
                  testId="source-language-selector"
                />

                <button
                  className="swap-languages-button"
                  onClick={handleSwapLanguages}
                  disabled={false}
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
                  disabled={false}
                  testId="target-language-selector"
                />
              </div>

              <div className="translation-panels">
                <div className="input-panel">
                  <TranslationInput
                    value={inputText}
                    onChange={handleSetInputText}
                    placeholder="输入要翻译的文本..."
                    disabled={false}
                    autoFocus
                    testId="translation-input"
                  />
                  <div className="character-count">
                    {inputText.length} 个字符
                  </div>
                </div>

                <div className="output-panel">
                  <TranslationOutput
                    value={translatedText}
                    isLoading={false}
                    showCopyButton={true}
                    testId="translation-output"
                  />
                  <div className="character-count">
                    {translatedText.length} 个字符
                  </div>
                </div>
              </div>

              <div className="translation-controls">
                <button
                  className="translate-button"
                  onClick={handleTranslate}
                  disabled={!inputText.trim() || !isServiceReady}
                  aria-label="翻译"
                >
                  翻译
                </button>
              </div>

              <div className="settings-panel">
                <label className="setting-option">
                  <input
                    type="checkbox"
                    checked={settings.autoTranslate}
                    onChange={handleToggleAutoTranslate}
                    disabled={false}
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

          {/* Performance monitor removed */}

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