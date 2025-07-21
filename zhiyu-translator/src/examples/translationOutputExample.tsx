import React, { useState } from 'react';
import { TranslationOutput } from '../components';
import './translationOutputExample.css';

/**
 * Example component demonstrating the usage of TranslationOutput
 */
const TranslationOutputExample: React.FC = () => {
  const [outputText, setOutputText] = useState('这是一个翻译结果示例。\n这是第二行文本。\n\n这是带有空行的文本。');
  const [isLoading, setIsLoading] = useState(false);
  const [copyCount, setCopyCount] = useState(0);

  // Toggle loading state for demonstration
  const toggleLoading = () => {
    setIsLoading(!isLoading);
  };

  // Clear output text for demonstration
  const clearOutput = () => {
    setOutputText('');
  };

  // Set sample text for demonstration
  const setSampleText = () => {
    setOutputText('这是一个翻译结果示例。\n这是第二行文本。\n\n这是带有空行的文本。');
  };

  // Handle copy event
  const handleCopy = () => {
    setCopyCount(prev => prev + 1);
  };

  return (
    <div className="example-container">
      <h2>TranslationOutput 组件示例</h2>

      <div className="controls">
        <button onClick={toggleLoading}>
          {isLoading ? '停止加载' : '显示加载'}
        </button>
        <button onClick={clearOutput}>
          清空文本
        </button>
        <button onClick={setSampleText}>
          设置示例文本
        </button>
      </div>

      <div className="component-container">
        <TranslationOutput
          value={outputText}
          isLoading={isLoading}
          onCopy={handleCopy}
          label="翻译结果"
          showCopyButton={true}
          testId="translation-output-example"
        />
      </div>

      <div className="state-display">
        <h3>当前状态：</h3>
        <pre>{JSON.stringify({
          outputText,
          isLoading,
          copyCount,
          textLength: outputText.length
        }, null, 2)}</pre>
      </div>
    </div>
  );
};

export default TranslationOutputExample;