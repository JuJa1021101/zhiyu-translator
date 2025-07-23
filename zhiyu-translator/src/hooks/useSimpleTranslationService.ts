import { useCallback, useState } from 'react';
import { useTranslationContext } from '../context/TranslationContext';

/**
 * 简化版翻译服务 Hook
 * 提供基本的翻译功能，不依赖复杂的翻译服务
 */
export default function useSimpleTranslationService() {
  const { state, dispatch } = useTranslationContext();
  const [isTranslating, setIsTranslating] = useState(false);

  // 简单的离线词典
  const simpleDictionary: Record<string, Record<string, string>> = {
    'en-zh': {
      'hello': '你好',
      'world': '世界',
      'hello world': '你好世界',
      'good morning': '早上好',
      'good afternoon': '下午好',
      'good evening': '晚上好',
      'thank you': '谢谢',
      'welcome': '欢迎',
      'yes': '是',
      'no': '否'
    },
    'zh-en': {
      '你好': 'hello',
      '世界': 'world',
      '你好世界': 'hello world',
      '早上好': 'good morning',
      '下午好': 'good afternoon',
      '晚上好': 'good evening',
      '谢谢': 'thank you',
      '欢迎': 'welcome',
      '是': 'yes',
      '否': 'no'
    }
  };

  /**
   * 简单翻译函数
   */
  const translate = useCallback(async () => {
    if (!state.inputText.trim()) {
      dispatch({ type: 'SET_TRANSLATED_TEXT', payload: '' });
      return;
    }

    setIsTranslating(true);
    dispatch({ type: 'START_TRANSLATION' });

    try {
      // 模拟翻译延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      const sourceText = state.inputText.toLowerCase().trim();
      const langPair = `${state.sourceLanguage}-${state.targetLanguage}`;

      let translatedText = '';

      // 检查是否有直接匹配
      if (simpleDictionary[langPair] && simpleDictionary[langPair][sourceText]) {
        translatedText = simpleDictionary[langPair][sourceText];
      } else {
        // 简单的回退翻译逻辑
        translatedText = `[${state.targetLanguage}] ${state.inputText}`;
      }

      dispatch({ type: 'FINISH_TRANSLATION', payload: translatedText });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '翻译失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('简易翻译错误:', err);
    } finally {
      setIsTranslating(false);
    }
  }, [state.inputText, state.sourceLanguage, state.targetLanguage, dispatch]);

  /**
   * 取消翻译
   */
  const cancelTranslation = useCallback(() => {
    setIsTranslating(false);
    dispatch({ type: 'CANCEL_TRANSLATION' });
  }, [dispatch]);

  return {
    translate,
    cancelTranslation,
    isServiceReady: true // 简易翻译服务总是就绪
  };
}