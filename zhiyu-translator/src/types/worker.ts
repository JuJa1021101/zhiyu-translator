// Worker message types for communication between main thread and web worker

/**
 * Types of messages that can be sent to the worker
 */
export enum WorkerMessageType {
  TRANSLATE = 'translate',
  CANCEL = 'cancel',
  INIT = 'init'
}

/**
 * Types of responses from the worker
 */
export enum WorkerResponseType {
  RESULT = 'result',
  ERROR = 'error',
  PROGRESS = 'progress',
  READY = 'ready'
}

/**
 * Base interface for worker requests
 */
export interface WorkerRequestBase {
  id: string;
  type: WorkerMessageType;
}

/**
 * Base interface for worker responses
 */
export interface WorkerResponseBase {
  id: string;
  type: WorkerResponseType;
  payload: any;
}

/**
 * Translation request to the worker
 */
export interface TranslateWorkerRequest extends WorkerRequestBase {
  type: WorkerMessageType.TRANSLATE;
  payload: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    options?: {
      maxLength?: number;
      temperature?: number;
      beamSize?: number;
    };
  };
}

/**
 * Initialization request to the worker
 */
export interface InitWorkerRequest extends WorkerRequestBase {
  type: WorkerMessageType.INIT;
  payload: {
    modelConfig?: {
      cacheModels?: boolean;
      quantized?: boolean;
    };
  };
}

/**
 * Cancel request to the worker
 */
export interface CancelWorkerRequest extends WorkerRequestBase {
  type: WorkerMessageType.CANCEL;
  payload: {
    requestId: string;
  };
}

/**
 * Union type of all worker requests
 */
export type WorkerRequest =
  | TranslateWorkerRequest
  | InitWorkerRequest
  | CancelWorkerRequest;

/**
 * Result response from the worker
 */
export interface ResultWorkerResponse extends WorkerResponseBase {
  type: WorkerResponseType.RESULT;
  payload: {
    translatedText: string;
    processingTime: number;
    confidence?: number;
  };
}

/**
 * Error response from the worker
 */
export interface ErrorWorkerResponse extends WorkerResponseBase {
  type: WorkerResponseType.ERROR;
  payload: {
    type: string;
    message: string;
    details?: any;
  };
}

/**
 * Progress response from the worker
 */
export interface ProgressWorkerResponse extends WorkerResponseBase {
  type: WorkerResponseType.PROGRESS;
  payload: {
    type: 'model-loading' | 'translating';
    progress: number;
    message: string;
  };
}

/**
 * Ready response from the worker
 */
export interface ReadyWorkerResponse extends WorkerResponseBase {
  type: WorkerResponseType.READY;
  payload: {
    status: 'ready';
    supportedLanguages?: string[];
  };
}

/**
 * Union type of all worker responses
 */
export type WorkerResponse =
  | ResultWorkerResponse
  | ErrorWorkerResponse
  | ProgressWorkerResponse
  | ReadyWorkerResponse;