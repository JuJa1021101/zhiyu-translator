# TranslationService

## 概述

`TranslationService` 是智语通翻译应用的核心服务类，负责管理与 Web Worker 的通信，处理翻译请求队列，以及提供生命周期管理功能。该服务使用单例模式确保在应用中只有一个翻译服务实例，并通过 Web Worker 和 MessageChannel 实现高效的多线程翻译处理。

## 特性

- **Web Worker 通信**：使用 MessageChannel 实现主线程与 Worker 线程的双向通信
- **请求队列管理**：支持多个翻译请求的优先级排序和并发控制
- **进度回调**：提供实时翻译进度更新
- **错误处理**：全面的错误处理和恢复机制
- **生命周期管理**：支持服务的初始化、重启和销毁
- **自动恢复**：检测 Worker 异常并自动重启
- **健康检查**：定期检查 Worker 状态确保服务可用性

## 使用方法

### 基本用法

```typescript
import { TranslationService } from '../services/TranslationService';

// 创建服务实例
const service = new TranslationService();

// 初始化服务
await service.initialize();

// 注册进度回调
service.onProgress((progress) => {
  console.log(`Progress: ${progress.progress}% - ${progress.message}`);
});

// 执行翻译
try {
  const translatedText = await service.translate(
    'Hello world',  // 源文本
    'en',           // 源语言
    'zh',           // 目标语言
    {               // 可选配置
      timeout: 30000
    }
  );
  
  console.log(`Translation: ${translatedText}`);
} catch (error) {
  console.error('Translation failed:', error);
}

// 清理资源
service.destroy();
```

### 高级配置

```typescript
// 创建具有自定义配置的服务实例
const service = new TranslationService({
  maxConcurrentTranslations: 2,  // 最大并发翻译数
  timeout: 60000,                // 默认超时时间（毫秒）
  cacheModels: true,             // 缓存模型
  useQuantized: true,            // 使用量化模型
  autoRecover: true,             // 自动恢复
  healthCheckInterval: 30000,    // 健康检查间隔（毫秒）
  retryOptions: {
    maxRetries: 3,               // 最大重试次数
    retryDelay: 1000,            // 初始重试延迟（毫秒）
    retryMultiplier: 1.5         // 重试延迟倍数
  }
});
```

### 队列管理

TranslationService 内部实现了请求队列管理，可以处理多个并发翻译请求：

```typescript
// 同时发起多个翻译请求
const translations = [
  service.translate('First text', 'en', 'fr'),
  service.translate('Second text', 'en', 'de'),
  service.translate('Third text', 'en', 'es')
];

// 等待所有翻译完成
const results = await Promise.all(translations);
```

### 生命周期管理

```typescript
// 初始化服务
await service.initialize({
  cacheModels: true,
  quantized: true,
  autoHealthCheck: true
});

// 检查服务状态
const status = service.getServiceStatus();
console.log('Service status:', status);

// 重置服务（取消所有请求并重启）
await service.resetService();

// 更新服务配置
service.updateConfig({
  maxConcurrentTranslations: 3,
  timeout: 45000
});

// 销毁服务并释放资源
service.destroy();
```

## API 参考

### 构造函数

```typescript
constructor(config?: Partial<TranslationServiceConfig>)
```

创建一个新的 TranslationService 实例。

**参数：**
- `config`：可选的服务配置对象

### 方法

#### initialize

```typescript
async initialize(options?: {
  cacheModels?: boolean;
  quantized?: boolean;
  autoHealthCheck?: boolean;
}): Promise<void>
```

初始化翻译服务。

**参数：**
- `options`：初始化选项

#### translate

```typescript
async translate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options?: TranslationOptions
): Promise<string>
```

翻译文本。

**参数：**
- `text`：要翻译的文本
- `sourceLanguage`：源语言代码
- `targetLanguage`：目标语言代码
- `options`：翻译选项

**返回：**
- 翻译后的文本

#### onProgress

```typescript
onProgress(callback: (progress: ProgressEvent) => void): void
```

注册进度回调函数。

**参数：**
- `callback`：进度更新回调函数

#### cancelTranslation

```typescript
async cancelTranslation(requestId: string): Promise<boolean>
```

取消指定的翻译请求。

**参数：**
- `requestId`：要取消的请求 ID

**返回：**
- 是否成功取消

#### resetService

```typescript
async resetService(): Promise<void>
```

重置服务，取消所有请求并重启 Worker。

#### checkWorkerHealth

```typescript
async checkWorkerHealth(): Promise<boolean>
```

检查 Worker 健康状态，如果不健康则重启。

**返回：**
- Worker 是否健康

#### setupAutoHealthCheck

```typescript
setupAutoHealthCheck(intervalMs: number = 30000): NodeJS.Timeout
```

设置自动健康检查。

**参数：**
- `intervalMs`：健康检查间隔（毫秒）

**返回：**
- 定时器 ID

#### getServiceStatus

```typescript
getServiceStatus(): {
  isInitialized: boolean;
  queueLength: number;
  activeRequests: number;
  isProcessingQueue: boolean;
}
```

获取服务当前状态。

**返回：**
- 服务状态对象

#### updateConfig

```typescript
updateConfig(config: Partial<TranslationServiceConfig>): void
```

更新服务配置。

**参数：**
- `config`：新的配置选项

#### destroy

```typescript
destroy(): void
```

销毁服务并释放资源。

## 错误处理

TranslationService 使用 `TranslationError` 类型表示翻译过程中可能发生的错误。常见错误类型包括：

- `MODEL_LOAD_FAILED`：模型加载失败
- `TRANSLATION_FAILED`：翻译失败
- `TRANSLATION_TIMEOUT`：翻译超时
- `WORKER_ERROR`：Worker 错误
- `WORKER_INITIALIZATION_FAILED`：Worker 初始化失败

错误处理示例：

```typescript
try {
  const result = await service.translate('Hello', 'en', 'fr');
} catch (error) {
  if (error.type === TranslationErrorType.TRANSLATION_TIMEOUT) {
    console.log('Translation timed out, please try again');
  } else if (error.type === TranslationErrorType.MODEL_LOAD_FAILED) {
    console.log('Failed to load translation model');
  } else {
    console.error('Translation error:', error.message);
  }
}
```

## 性能优化

TranslationService 实现了多项性能优化：

1. **请求队列**：通过队列管理避免过多并发请求导致的性能问题
2. **优先级排序**：支持请求优先级，确保重要请求优先处理
3. **并发控制**：限制最大并发请求数，避免资源过度消耗
4. **自动恢复**：检测并自动恢复异常状态，提高服务可靠性
5. **超时控制**：为每个请求设置超时，避免请求无限等待