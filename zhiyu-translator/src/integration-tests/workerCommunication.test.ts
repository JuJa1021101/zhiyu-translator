import { TranslationService } from '../services/TranslationService';
import { TranslationErrorType } from '../types/errors';

// Mock Worker and MessageChannel
class MockWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  // Helper to simulate worker response
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }
}

class MockMessagePort {
  onmessage: ((this: MessagePort, ev: MessageEvent) => any) | null = null;
  postMessage = vi.fn();
  start = vi.fn();
  close = vi.fn();

  // Helper to simulate port message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }
}

class MockMessageChannel {
  port1 = new MockMessagePort();
  port2 = new MockMessagePort();
}

// Setup mocks
vi.mock('../workers/translation.worker.ts', () => {
  return {
    default: 'mocked-worker-url'
  };
});

// Replace global Worker and MessageChannel with mocks
const originalWorker = global.Worker;
const originalMessageChannel = global.MessageChannel;

beforeAll(() => {
  global.Worker = MockWorker as any;
  global.MessageChannel = MockMessageChannel as any;
});

afterAll(() => {
  global.Worker = originalWorker;
  global.MessageChannel = originalMessageChannel;
});

describe('Worker Communication Integration Test', () => {
  let service: TranslationService;
  let mockWorker: MockWorker;
  let mockPort1: MockMessagePort;
  let mockPort2: MockMessagePort;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create service
    service = new TranslationService();

    // Get mock instances
    mockWorker = service['worker'] as unknown as MockWorker;
    mockPort1 = service['messageChannel'].port1 as unknown as MockMessagePort;
    mockPort2 = service['messageChannel'].port2 as unknown as MockMessagePort;

    // Initialize service
    await service.initialize();
  });

  afterEach(() => {
    service.destroy();
  });

  test('full translation cycle with worker communication', async () => {
    // Start a translation
    const translatePromise = service.translate('Hello world', 'en', 'zh');

    // Check that message was sent to worker
    expect(mockPort1.postMessage).toHaveBeenCalledWith({
      type: 'TRANSLATE',
      payload: {
        text: 'Hello world',
        sourceLanguage: 'en',
        targetLanguage: 'zh'
      }
    });

    // Simulate progress updates from worker
    mockPort1.simulateMessage({
      type: 'PROGRESS',
      payload: {
        progress: 25,
        message: 'Loading model...'
      }
    });

    mockPort1.simulateMessage({
      type: 'PROGRESS',
      payload: {
        progress: 50,
        message: 'Model loaded, starting translation...'
      }
    });

    mockPort1.simulateMessage({
      type: 'PROGRESS',
      payload: {
        progress: 75,
        message: 'Translating...'
      }
    });

    // Simulate translation result
    mockPort1.simulateMessage({
      type: 'TRANSLATION_RESULT',
      payload: {
        translatedText: '你好世界',
        processingTime: 1200
      }
    });

    // Check result
    const result = await translatePromise;
    expect(result).toBe('你好世界');
  });

  test('worker error handling and recovery', async () => {
    // Start a translation
    const translatePromise = service.translate('Hello world', 'en', 'zh');

    // Simulate error from worker
    mockPort1.simulateMessage({
      type: 'ERROR',
      payload: {
        type: TranslationErrorType.TRANSLATION_FAILED,
        message: 'Translation failed'
      }
    });

    // Check that promise rejects with error
    await expect(translatePromise).rejects.toThrow('Translation failed');

    // Start another translation to test recovery
    const secondTranslatePromise = service.translate('Hello again', 'en', 'zh');

    // Simulate successful translation
    mockPort1.simulateMessage({
      type: 'TRANSLATION_RESULT',
      payload: {
        translatedText: '你好再次',
        processingTime: 800
      }
    });

    // Check result
    const result = await secondTranslatePromise;
    expect(result).toBe('你好再次');
  });

  test('translation cancellation', async () => {
    // Start a translation
    const translatePromise = service.translate('Hello world', 'en', 'zh');

    // Cancel translation
    service.cancelTranslation();

    // Check that cancel message was sent
    expect(mockPort1.postMessage).toHaveBeenCalledWith({
      type: 'CANCEL_TRANSLATION'
    });

    // Simulate cancellation response
    mockPort1.simulateMessage({
      type: 'TRANSLATION_CANCELLED'
    });

    // Check that promise rejects with cancellation error
    await expect(translatePromise).rejects.toThrow('Translation cancelled');
  });

  test('worker restart after crash', async () => {
    // Simulate worker crash
    mockPort1.simulateMessage({
      type: 'ERROR',
      payload: {
        type: TranslationErrorType.WORKER_ERROR,
        message: 'Worker crash