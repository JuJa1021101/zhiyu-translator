// Translation worker using Transformers.js
import {
  WorkerRequest,
  WorkerResponse,
  WorkerMessageType,
  WorkerResponseType,
  TranslateWorkerRequest,
  InitWorkerRequest,
  CancelWorkerRequest
} from '../types/worker';
import { TranslationErrorType, TranslationException } from '../types/errors';
import { ModelManager } from '../services/ModelManager';

// Import logger from utils
// Note: In a real Web Worker, we'd need to create a custom logger since imports might not work the same way
// For this implementation, we'll create a simple logger that mimics our Logger class

// Logger for worker operations
class WorkerLogger {
  private static prefix = 'Worker';

  static log(message: string, data?: any): void {
    if (data) {
      console.log(`[${WorkerLogger.prefix}] ${message}`, data);
    } else {
      console.log(`[${WorkerLogger.prefix}] ${message}`);
    }
  }

  static error(message: string, error?: any): void {
    if (error) {
      console.error(`[${WorkerLogger.prefix} Error] ${message}`, error);
    } else {
      console.error(`[${WorkerLogger.prefix} Error] ${message}`);
    }
  }

  static warn(message: string, data?: any): void {
    if (data) {
      console.warn(`[${WorkerLogger.prefix} Warning] ${message}`, data);
    } else {
      console.warn(`[${WorkerLogger.prefix} Warning] ${message}`);
    }
  }

  static info(message: string, data?: any): void {
    if (data) {
      console.info(`[${WorkerLogger.prefix} Info] ${message}`, data);
    } else {
      console.info(`[${WorkerLogger.prefix} Info] ${message}`);
    }
  }

  static debug(message: string, data?: any): void {
    if (data) {
      console.debug(`[${WorkerLogger.prefix} Debug] ${message}`, data);
    } else {
      console.debug(`[${WorkerLogger.prefix} Debug] ${message}`);
    }
  }
}

// Using the imported ModelManager class instead of the inline implementation

/**
 * Split text into smaller chunks for more efficient translation
 * and to provide better progress updates
 * 
 * @param text Text to split into chunks
 * @param chunkSize Approximate size of each chunk in characters
 * @returns Array of text chunks
 */
function splitTextIntoChunks(text: string, chunkSize: number = 500): string[] {
  // If text is smaller than chunk size, return as single chunk
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    // Try to find a natural break point (sentence end or paragraph)
    let endPosition = Math.min(currentPosition + chunkSize, text.length);

    // If we're not at the end of the text, try to find a sentence break
    if (endPosition < text.length) {
      // Look for sentence endings (.!?) followed by space or newline
      const sentenceEndMatch = text.substring(endPosition - 30, endPosition + 30)
        .match(/[.!?]\s+/);

      if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
        // Adjust the end position to the sentence end
        endPosition = endPosition - 30 + sentenceEndMatch.index + 1;
      } else {
        // If no sentence break found, look for space
        const lastSpace = text.lastIndexOf(' ', endPosition);
        if (lastSpace > currentPosition) {
          endPosition = lastSpace;
        }
      }
    }

    // Add the chunk to our array
    chunks.push(text.substring(currentPosition, endPosition).trim());

    // Move to next chunk
    currentPosition = endPosition;
  }

  return chunks;
}

// Communication ports for MessageChannel
let mainPort: MessagePort | null = null;

// Handle translate requests
async function handleTranslateRequest(request: TranslateWorkerRequest): Promise<void> {
  const { id, payload } = request;
  const { text, sourceLanguage, targetLanguage, options } = payload;

  try {
    WorkerLogger.info(`Starting translation request ${id}`, {
      sourceLanguage,
      targetLanguage,
      textLength: text.length
    });

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new TranslationException({
        type: TranslationErrorType.INVALID_INPUT,
        message: 'Translation text cannot be empty',
        recoverable: true
      });
    }

    // Check if language pair is supported
    // In a real implementation, we would use the languageUtils.isLanguagePairSupported function
    // But for simplicity in the worker context, we'll do a basic check
    if (sourceLanguage === targetLanguage) {
      throw new TranslationException({
        type: TranslationErrorType.UNSUPPORTED_LANGUAGE_PAIR,
        message: 'Source and target languages cannot be the same',
        recoverable: true
      });
    }

    const modelManager = ModelManager.getInstance();
    const modelId = `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`;

    // Create progress callback to forward progress updates to the main thread
    const progressCallback = (progress: number, message: string) => {
      sendResponse({
        id,
        type: WorkerResponseType.PROGRESS,
        payload: {
          type: 'model-loading',
          progress,
          message
        }
      });
    };

    // Create abort controller for this request
    const abortController = new AbortController();

    // Get the translation pipeline with progress tracking
    WorkerLogger.info(`Loading translation model: ${modelId}`);
    const translator = await modelManager.getPipeline(
      'translation',
      modelId,
      id,
      {
        progressCallback,
        signal: abortController.signal
      }
    );

    // Send progress update for translation start
    sendResponse({
      id,
      type: WorkerResponseType.PROGRESS,
      payload: {
        type: 'translating',
        progress: 0,
        message: 'Starting translation...'
      }
    });

    // For long text, split into chunks and translate with progress updates
    const chunks = splitTextIntoChunks(text, 500); // Split into chunks of ~500 chars
    let translatedText = '';
    const totalChunks = chunks.length;

    const startTime = performance.now();

    for (let i = 0; i < chunks.length; i++) {
      // Send progress update for each chunk
      const chunkProgress = Math.floor((i / totalChunks) * 100);
      sendResponse({
        id,
        type: WorkerResponseType.PROGRESS,
        payload: {
          type: 'translating',
          progress: chunkProgress,
          message: `Translating part ${i + 1} of ${totalChunks}...`
        }
      });

      // Translate the chunk
      const chunkResult = await translator(chunks[i], options);
      translatedText += chunkResult[0].translation_text + ' ';

      // Small delay to allow for UI updates and prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Clean up the translated text (remove extra spaces, etc.)
    translatedText = translatedText.trim();

    // Send progress update for translation completion
    sendResponse({
      id,
      type: WorkerResponseType.PROGRESS,
      payload: {
        type: 'translating',
        progress: 100,
        message: 'Translation complete'
      }
    });

    // Calculate average confidence (in a real implementation, we would aggregate from all chunks)
    // For now, we'll just use a placeholder value
    const confidence = 0.95;

    // Send the result with serialized data
    sendResponse({
      id,
      type: WorkerResponseType.RESULT,
      payload: {
        translatedText,
        processingTime,
        confidence
      }
    });

    WorkerLogger.info(`Translation request ${id} completed in ${processingTime.toFixed(2)}ms`, {
      sourceLanguage,
      targetLanguage,
      inputLength: text.length,
      outputLength: translatedText.length,
      chunks: totalChunks
    });

  } catch (error) {
    // Handle aborted requests
    if (error.name === 'AbortError') {
      sendResponse({
        id,
        type: WorkerResponseType.ERROR,
        payload: {
          type: TranslationErrorType.TRANSLATION_FAILED,
          message: 'Translation was cancelled',
          details: { aborted: true }
        }
      });
      return;
    }

    // Handle TranslationException
    if (error instanceof TranslationException) {
      sendResponse({
        id,
        type: WorkerResponseType.ERROR,
        payload: {
          type: error.type,
          message: error.message,
          details: error.details
        }
      });
      return;
    }

    WorkerLogger.error(`Translation error for request ${id}:`, error);

    sendResponse({
      id,
      type: WorkerResponseType.ERROR,
      payload: {
        type: TranslationErrorType.TRANSLATION_FAILED,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    });
  }
}

// Handle initialization requests
function handleInitRequest(request: InitWorkerRequest): void {
  const { id, payload } = request;

  try {
    WorkerLogger.info('Initializing worker', payload);

    // Update model configuration if provided
    if (payload.modelConfig) {
      ModelManager.getInstance().setConfig(payload.modelConfig);
    }

    // Send ready response
    sendResponse({
      id,
      type: WorkerResponseType.READY,
      payload: {
        status: 'ready',
        supportedLanguages: ['en', 'fr', 'de', 'es', 'zh', 'ja', 'ko', 'ru'] // Example supported languages
      }
    });

    WorkerLogger.info('Worker initialized successfully');
  } catch (error) {
    WorkerLogger.error('Worker initialization failed:', error);

    sendResponse({
      id,
      type: WorkerResponseType.ERROR,
      payload: {
        type: TranslationErrorType.WORKER_INITIALIZATION_FAILED,
        message: error instanceof Error ? error.message : 'Worker initialization failed',
        details: error
      }
    });
  }
}

// Handle cancel requests
function handleCancelRequest(request: CancelWorkerRequest): void {
  const { id, payload } = request;
  const { requestId } = payload;

  try {
    const cancelled = ModelManager.getInstance().cancelRequest(requestId);

    sendResponse({
      id,
      type: WorkerResponseType.RESULT,
      payload: {
        cancelled,
        requestId
      }
    });

    WorkerLogger.info(`Cancel request for ${requestId}: ${cancelled ? 'successful' : 'not found'}`);
  } catch (error) {
    WorkerLogger.error(`Error cancelling request ${requestId}:`, error);

    sendResponse({
      id,
      type: WorkerResponseType.ERROR,
      payload: {
        type: TranslationErrorType.WORKER_ERROR,
        message: error instanceof Error ? error.message : 'Failed to cancel request',
        details: error
      }
    });
  }
}

// Send response through the appropriate channel
function sendResponse(response: WorkerResponse): void {
  if (mainPort) {
    mainPort.postMessage(response);
  } else {
    self.postMessage(response);
  }
}

// Set up MessageChannel when requested
self.onmessage = (event: MessageEvent) => {
  // Check if this is a MessageChannel port setup message
  if (event.data.type === 'connect' && event.ports && event.ports.length > 0) {
    mainPort = event.ports[0];
    WorkerLogger.info('MessageChannel connection established');

    // Set up message handler on the port
    mainPort.onmessage = handleMessage;

    // Acknowledge the connection
    mainPort.postMessage({
      type: WorkerResponseType.READY,
      payload: { status: 'connected' }
    });

    return;
  }

  // If not a port setup message, handle it directly
  handleMessage(event);
};

// Process incoming messages
async function handleMessage(event: MessageEvent): Promise<void> {
  const request = event.data as WorkerRequest;

  if (!request || !request.type) {
    WorkerLogger.error('Invalid message received', event.data);
    return;
  }

  try {
    switch (request.type) {
      case WorkerMessageType.TRANSLATE:
        await handleTranslateRequest(request as TranslateWorkerRequest);
        break;

      case WorkerMessageType.INIT:
        handleInitRequest(request as InitWorkerRequest);
        break;

      case WorkerMessageType.CANCEL:
        handleCancelRequest(request as CancelWorkerRequest);
        break;

      default:
        WorkerLogger.warn(`Unknown message type: ${request.type}`, request);

        // Send error for unknown message type
        sendResponse({
          id: request.id,
          type: WorkerResponseType.ERROR,
          payload: {
            type: TranslationErrorType.WORKER_ERROR,
            message: `Unknown message type: ${request.type}`,
            details: { request }
          }
        });
    }
  } catch (error) {
    WorkerLogger.error('Error handling message:', error);

    // Send general error response
    sendResponse({
      id: request.id,
      type: WorkerResponseType.ERROR,
      payload: {
        type: TranslationErrorType.WORKER_ERROR,
        message: error instanceof Error ? error.message : 'Error processing request',
        details: error
      }
    });
  }
}

// Initialize the worker
WorkerLogger.info('Translation worker initialized');

// Export empty object to make TypeScript happy with the module format
export { };