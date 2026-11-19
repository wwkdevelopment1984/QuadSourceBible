import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AnnotationsProvider } from './contexts/AnnotationsContext.tsx';
import './index.css';

// Register service worker for full offline capability & automatic updates
registerSW({
  immediate: true,
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AnnotationsProvider>
      <App />
    </AnnotationsProvider>
  </ErrorBoundary>
);
