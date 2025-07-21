import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock for Web Worker
class MockWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}

// Mock for MessageChannel
class MockMessageChannel {
  port1: MessagePort = {
    onmessage: null,
    onmessageerror: null,
    close: vi.fn(),
    postMessage: vi.fn(),
    start: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => false
  } as unknown as MessagePort;

  port2: MessagePort = {
    onmessage: null,
    onmessageerror: null,
    close: vi.fn(),
    postMessage: vi.fn(),
    start: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => false
  } as unknown as MessagePort;
}

// Mock for Clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve())
  }
});

// Add to global
global.Worker = MockWorker as any;
global.MessageChannel = MockMessageChannel as any;

// Mock console.error to avoid test output noise
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Error:'))
  ) {
    return; // Suppress React warnings and errors
  }
  originalConsoleError(...args);
};