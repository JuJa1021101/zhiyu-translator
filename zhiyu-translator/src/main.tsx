import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes.css'
import App from './App'
import { TranslationProvider } from './context/TranslationContext'
import { ErrorBoundary } from './components'



// Root error handler for uncaught errors
const handleRootError = (error: any) => {
  console.error('Root level error:', error);
  // You could also report to an error tracking service here
};

// Initialize the application
const initializeApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary
        onError={handleRootError}
        fallback={(error, resetError) => (
          <div className="root-error-container">
            <h1>应用程序无法加载</h1>
            <p>抱歉，应用程序遇到了严重问题，无法正常启动。</p>
            <p className="error-message">{error.message}</p>
            <button onClick={resetError}>重新加载应用</button>
            <button onClick={() => window.location.reload()}>刷新页面</button>
          </div>
        )}
      >
        <TranslationProvider>
          <App />
        </TranslationProvider>
      </ErrorBoundary>
    </StrictMode>
  );

  console.info('App initialized successfully');
};

// Start the application
initializeApp();