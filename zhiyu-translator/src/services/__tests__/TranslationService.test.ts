import { TranslationService } from '../TranslationService';
import { TranslationErrorType } from '../../types/errors';

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
vi.mock('../../workers/translation.worker.ts', () => {
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

describe('TranslationService', () => {
  let service: TranslationService;
  let mockWorker: MockWorker;
  let mockPort1: MockMessagePort;
  let mockPort2: MockMessagePort;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create service
    service = new TranslationService();

    // Get mock instances
    mockWorker = service['worker'] as unknown as MockWorker;
    mockPort1 = service['messageChannel'].port1 as unknown as MockMessagePort;
    mockPort2 = service['messageChannel'].port2 as unknown as MockMessagePort;
  });

  afterEach(() => {
    service.destroy();
  });

  test('initializes worker and message channel', async () => {
    await service.initialize();

    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      { type: 'INIT', port: mockPort2 },
      [mockPort2]
    );
    expect(mockPort1.start).toHaveBeenCalled();
  });

  test('translate method sends message to worker', async () => {
    await service.initialize();

    const translatePromise = service.translate('Hello', 'en', 'fr');

    // Check that message was sent to worker
    expect(mockPort1.postMessage).toHaveBeenCalledWith({
      type: 'TRANSLATE',
      payload: {
        text: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      }
    });

    // Simulate worker response
    mockPort1.simulateMessage({
      type: 'TRANSLATION_RESULT',
      payload: {
        translatedText: 'Bonjour',
        processingTime: 100
      }
    });

    // Check result
    const result = await translatePromise;
    expect(result).toBe('Bonjour');
  });

  test('handles progress updates from worker', async () => {
    await service.initialize();

    // Register progress callback
    const progressCallback = vi.fn();
    service.onProgress(progressCallback);

    // Simulate progress update
    mockPort1.simulateMessage({
      type: 'PROGRESS',
      payload: {
        progress: 50,
        message: 'Translating...'
      }
    });

    expect(progressCallback).toHaveBeenCalledWith(50);
  });

  test('handles translation errors from worker', async () => {
    await service.initialize();

    const translatePromise = service.translate('Hello', 'en', 'fr');

    // Simulate error response
    mockPort1.simulateMessage({
      type: 'ERROR',
      payload: {
        type: TranslationErrorType.TRANSLATION_FAILED,
        message: 'Translation failed'
      }
    });

    // Check that promise rejects with error
    await expect(translatePromise).rejects.toThrow('Translation failed');
  });

  test('destroy method terminates worker and closes channel', () => {
    service.destroy();

    expect(mockWorker.terminate).toHaveBeenCalled();
    expect(mockPort1.close).toHaveBeenCalled();
  });

  test('handles worker initialization errors', async () => {
    // Simulate worker error during initialization
    const initPromise = service.initialize();

    mockWorker.simulateMessage({
      type: 'ERROR',
      payload: {
        type: TranslationErrorType.WORKER_INITIALIZATION_FAILED,
        message: 'Worker initialization failed'
      }
    });

    await expect(initPromise).rejects.toThrow('Worker initialization failed');
  });

  test('cancels pending translation when requested', async () => {
    await service.initialize();

    const translatePromise = service.translate('Hello', 'en', 'fr');

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
});