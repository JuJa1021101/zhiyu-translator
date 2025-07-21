# ModelManager 类使用文档

## 概述

`ModelManager` 是一个单例类，用于管理 Transformers.js 模型管道。它实现了以下核心功能：

1. **单例模式**：确保整个应用中只有一个模型管理器实例
2. **懒加载**：模型只在需要时才加载
3. **缓存机制**：已加载的模型会被缓存，避免重复加载
4. **进度跟踪**：提供模型加载进度的实时反馈
5. **请求取消**：支持取消正在进行的模型加载请求

## 基本用法

### 获取实例

```typescript
import { ModelManager } from '../services/ModelManager';

// 获取单例实例
const modelManager = ModelManager.getInstance();

// 或者使用导出的便捷函数
import { getModelManager } from '../services/ModelManager';
const modelManager = getModelManager();
```

### 加载模型

```typescript
// 定义进度回调函数
const progressCallback = (progress: number, message: string) => {
  console.log(`加载进度: ${progress}% - ${message}`);
};

// 加载模型
const pipeline = await modelManager.getPipeline(
  'translation',                // 任务类型
  'Helsinki-NLP/opus-mt-en-zh', // 模型名称
  'request-123',                // 请求ID（用于取消）
  { progressCallback }          // 选项
);

// 使用模型
const result = await pipeline('Hello, world!');
console.log(result[0].translation_text);
```

### 配置模型管理器

```typescript
// 获取当前配置
const config = modelManager.getConfig();
console.log(config);

// 更新配置
modelManager.setConfig({
  cacheModels: true,   // 是否缓存模型
  quantized: true,     // 是否使用量化模型
  maxCacheSize: 3      // 最大缓存模型数量
});
```

### 管理模型缓存

```typescript
// 检查模型是否已缓存
const isCached = modelManager.isModelCached('translation', 'Helsinki-NLP/opus-mt-en-zh');

// 获取缓存大小
const cacheSize = modelManager.getCacheSize();

// 获取所有缓存的模型
const cachedModels = modelManager.getCachedModels();

// 从缓存中移除特定模型
modelManager.removeFromCache('translation', 'Helsinki-NLP/opus-mt-en-zh');

// 清空整个缓存
modelManager.clearCache();
```

### 取消请求

```typescript
// 开始加载模型
const requestId = 'request-123';
const pipelinePromise = modelManager.getPipeline('translation', 'model-name', requestId);

// 在另一个地方取消请求
modelManager.cancelRequest(requestId);
```

## API 参考

### ModelManager 类

#### 静态方法

- `getInstance(): ModelManager` - 获取单例实例

#### 实例方法

- `setConfig(config: Partial<ModelConfig>): void` - 更新配置
- `getConfig(): ModelConfig` - 获取当前配置
- `getPipeline(task: string, model: string, requestId: string, options?: ModelLoadingOptions): Promise<any>` - 获取模型管道
- `cancelRequest(requestId: string): boolean` - 取消请求
- `getLoadingProgress(task: string, model: string): number` - 获取加载进度
- `isModelLoading(task: string, model: string): boolean` - 检查模型是否正在加载
- `isModelCached(task: string, model: string): boolean` - 检查模型是否已缓存
- `clearCache(): void` - 清空缓存
- `removeFromCache(task: string, model: string): boolean` - 从缓存中移除模型
- `getCacheSize(): number` - 获取缓存大小
- `getCachedModels(): string[]` - 获取所有缓存的模型

### 类型定义

```typescript
interface ModelConfig {
  cacheModels: boolean;  // 是否缓存模型
  quantized: boolean;    // 是否使用量化模型
  maxCacheSize?: number; // 最大缓存模型数量
}

type ProgressCallback = (progress: number, message: string) => void;

interface ModelLoadingOptions {
  progressCallback?: ProgressCallback; // 进度回调函数
  signal?: AbortSignal;                // 取消信号
}
```

## 最佳实践

1. **早期初始化**：在应用启动时初始化 ModelManager，以便在需要时立即使用
2. **进度反馈**：始终提供进度回调，以便向用户显示加载状态
3. **错误处理**：使用 try/catch 处理模型加载错误
4. **缓存管理**：根据应用内存限制配置适当的缓存大小
5. **请求标识**：使用唯一的请求 ID，以便在需要时取消请求

## 示例

### 在 Web Worker 中使用

```typescript
import { ModelManager } from '../services/ModelManager';

// 处理翻译请求
async function handleTranslateRequest(request) {
  const { id, text, sourceLanguage, targetLanguage } = request;
  
  const modelManager = ModelManager.getInstance();
  
  // 创建进度回调
  const progressCallback = (progress, message) => {
    self.postMessage({
      type: 'progress',
      payload: { progress, message }
    });
  };
  
  try {
    // 获取翻译管道
    const translator = await modelManager.getPipeline(
      'translation',
      `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`,
      id,
      { progressCallback }
    );
    
    // 执行翻译
    const result = await translator(text);
    
    // 返回结果
    self.postMessage({
      type: 'result',
      payload: result[0].translation_text
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: error.message
    });
  }
}
```

### 在 React 组件中使用

```typescript
import React, { useState, useEffect } from 'react';
import { getModelManager } from '../services/ModelManager';

function TranslationComponent() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  async function handleTranslate() {
    setIsLoading(true);
    setProgress(0);
    
    const modelManager = getModelManager();
    const requestId = `translate-${Date.now()}`;
    
    try {
      // 获取翻译管道
      const translator = await modelManager.getPipeline(
        'translation',
        'Helsinki-NLP/opus-mt-en-zh',
        requestId,
        {
          progressCallback: (progress) => setProgress(progress)
        }
      );
      
      // 执行翻译
      const result = await translator(text);
      setResult(result[0].translation_text);
    } catch (error) {
      console.error('Translation error:', error);
      alert(`翻译错误: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleTranslate} disabled={isLoading}>翻译</button>
      {isLoading && <progress value={progress} max="100" />}
      <div>{result}</div>
    </div>
  );
}
```