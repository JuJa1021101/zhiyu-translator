import React, { useState } from 'react';
import { TranslationInput } from '../components';
import './translationInputExample.css';

/**
 * Example component demonstrating the usage of TranslationInput
 */
const TranslationInputExample: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  // Toggle error state for demonstration
  const toggleError = () => {
    setHasError(!hasError);
  };

  // Toggle disabled state for demonstration
  const toggleDisabled = () => {
    setIsDisabled(!isDisabled);
  };

  return (
    <div className="example-container">
      <h2>TranslationInput 组件示例</h2>

      <div className="controls">
        <button onClick={toggleError}>
          {hasError ? '清除错误' : '显示错误'}
        </button>
        <button onClick={toggleDisabled}>
          {isDisabled ? '启用输入' : '禁用输入'}
        </button>
      </div>

      <div className="component-container">
        <TranslationInput
          value={inputText}
          onChange={setInputText}
          label="输入文本"
          placeholder="请输入要翻译的文本..."
          maxLength={500}
          disabled={isDisabled}
          error={hasError ? '输入文本有误，请检查后重试' : undefined}
          autoFocus={true}
          testId="translation-input-example"
        />
      </div>

      <div className="state-display">
        <h3>当前状态：</h3>
        <pre>{JSON.stringify({ inputText, hasError, isDisabled }, null, 2)}</pre>
      </div>
    </div>
  );
};

export default TranslationInputExample;